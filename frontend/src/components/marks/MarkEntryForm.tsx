import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface Student {
  usn: string;
  firstName: string;
  lastName: string;
}

interface ComponentDetails {
  id: number;
  name: string;
  componentType: string;
  maxMarks: number;
}

interface IAConfig {
  questionNumber: number;
  subpart?: string | null;
  part?: string | null;
  maxMarks: number;
}

/* // AssignmentConfig is unused
interface AssignmentConfig {
  id?: number;
  name: string;
  maxMarks: number;
  weightage?: number | null;
}
*/

interface MarkData {
  usn: string;
  marksObtained: number;
}

interface MarkEntryFormProps {
  componentId: number;
  subjectId: number;
  onMarksSaved?: () => void;
}

const MarkEntryForm: React.FC<MarkEntryFormProps> = ({
  componentId,
  subjectId,
  onMarksSaved
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [componentDetails, setComponentDetails] = useState<ComponentDetails | null>(null);
  const [currentTab, setCurrentTab] = useState<number>(0);
  
  // For IA components (CIE I, CIE II)
  const [iaConfigs, setIaConfigs] = useState<IAConfig[]>([]);
  
  // For marks data
  const [marksData, setMarksData] = useState<{ [key: string]: number }>({});
  const [iaMarksData, setIaMarksData] = useState<{ [key: string]: { [key: string]: number } }>({});
  const [fileUpload, setFileUpload] = useState<File | null>(null);

  // Fetch component details and students on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [componentRes, studentsRes, marksRes] = await Promise.all([
          // Get component details
          axios.get(`/api/marks/exam-components/${componentId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          
          // Get students for this subject
          axios.get(`/api/subjects/${subjectId}/students`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          
          // Get existing marks if any
          axios.get(`/api/marks/components/${componentId}/marks`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        if (componentRes.data.success) {
          setComponentDetails(componentRes.data.data);
          
          // If it's a CIE component, fetch IA configs
          if (componentRes.data.data.componentType.includes('CIE')) {
            const iaConfigRes = await axios.get(`/api/ia-config/components/${componentId}/config`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (iaConfigRes.data.success) {
              setIaConfigs(iaConfigRes.data.data);
            }
          }
        }
        
        if (studentsRes.data.success) {
          setStudents(studentsRes.data.data);
        }
        
        if (marksRes.data.success) {
          // Prepare marks data structure
          const marks: { [key: string]: number } = {};
          marksRes.data.data.forEach((mark: MarkData) => {
            marks[mark.usn] = mark.marksObtained;
          });
          setMarksData(marks);
        }
      } catch (err) {
        console.error('Error fetching mark entry data:', err);
        setError('Failed to load mark entry data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [componentId, subjectId, token]);

  // Handle mark change
  const handleMarkChange = (usn: string, value: string) => {
    const numValue = parseFloat(value);
    
    // Validate if it's a number and within range
    if (isNaN(numValue) || numValue < 0 || (componentDetails && numValue > componentDetails.maxMarks)) {
      // Invalid input, don't update
      return;
    }
    
    setMarksData(prev => ({
      ...prev,
      [usn]: numValue
    }));
  };

  // Handle IA mark change
  const handleIAMarkChange = (usn: string, questionNumber: number, subpart: string | null | undefined, value: string) => {
    const numValue = parseFloat(value);
    
    // Find the config for this question/subpart to get maxMarks
    const config = iaConfigs.find(
      cfg => cfg.questionNumber === questionNumber && cfg.subpart === subpart
    );
    
    // Validate if it's a number and within range
    if (isNaN(numValue) || numValue < 0 || (config && numValue > config.maxMarks)) {
      // Invalid input, don't update
      return;
    }
    
    const key = `${questionNumber}${subpart || ''}`;
    
    setIaMarksData(prev => ({
      ...prev,
      [usn]: {
        ...prev[usn],
        [key]: numValue
      }
    }));
  };

  // Save marks
  const handleSaveMarks = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare marks data for submission
      const marks = Object.entries(marksData).map(([usn, marksObtained]) => ({
        usn,
        componentId,
        marksObtained
      }));
      
      // Submit marks
      const response = await axios.post('/api/marks/upload', {
        componentId: componentId,
        marks: marks,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess('Marks saved successfully!');
        if (onMarksSaved) onMarksSaved();
      } else {
        setError(response.data.message || 'Failed to save marks');
      }
    } catch (err: any) {
      console.error('Error saving marks:', err);
      setError(err.response?.data?.message || 'Failed to save marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileUpload(event.target.files[0]);
    }
  };

  // Upload marks from Excel
  const handleUploadMarks = async () => {
    if (!fileUpload) {
      setError('Please select a file to upload');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData();
    formData.append('file', fileUpload);
    formData.append('componentId', componentId.toString());
    
    try {
      const response = await axios.post(
        '/api/marks/upload', 
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('Marks uploaded successfully!');
        setFileUpload(null);
        if (onMarksSaved) onMarksSaved();
        
        // Refresh marks data
        const marksRes = await axios.get(`/api/marks/components/${componentId}/marks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (marksRes.data.success) {
          const marks: { [key: string]: number } = {};
          marksRes.data.data.forEach((mark: MarkData) => {
            marks[mark.usn] = mark.marksObtained;
          });
          setMarksData(marks);
        }
      } else {
        setError(response.data.message || 'Failed to upload marks');
      }
    } catch (err: any) {
      console.error('Error uploading marks:', err);
      setError(err.response?.data?.message || 'Failed to upload marks. Please check your file format.');
    } finally {
      setSaving(false);
    }
  };

  // Download marks template
  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`/api/marks/components/${componentId}/template`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marks_template_${componentId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading template:', err);
      setError('Failed to download template. Please try again.');
    }
  };

  // Calculate total for IA marks
  const calculateIATotal = (usn: string) => {
    if (!iaMarksData[usn]) return 0;
    
    return Object.values(iaMarksData[usn]).reduce((sum, mark) => sum + mark, 0);
  };

  // Tab change handler
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!componentDetails) {
    return (
      <Alert severity="error">
        Component details not found. Please try again or contact support.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Mark Entry: {componentDetails.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Max Marks: {componentDetails.maxMarks}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Manual Entry" />
          <Tab label="Upload Excel" />
        </Tabs>
      </Box>
      
      {/* Manual Entry Tab */}
      {currentTab === 0 && (
        <>
          {/* Regular Components */}
          {!componentDetails.componentType.includes('CIE') && (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>USN</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Marks (/{componentDetails.maxMarks})</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.usn}>
                      <TableCell>{student.usn}</TableCell>
                      <TableCell>{student.firstName} {student.lastName}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={marksData[student.usn] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMarkChange(student.usn, e.target.value)}
                          inputProps={{ 
                            min: 0, 
                            max: componentDetails.maxMarks,
                            step: 0.5
                          }}
                          error={
                            marksData[student.usn] !== undefined && 
                            (marksData[student.usn] < 0 || marksData[student.usn] > componentDetails.maxMarks)
                          }
                          helperText={
                            marksData[student.usn] !== undefined && 
                            (marksData[student.usn] < 0 || marksData[student.usn] > componentDetails.maxMarks)
                              ? `Must be between 0 and ${componentDetails.maxMarks}`
                              : ''
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          
          {/* IA Components with Question Structure */}
          {componentDetails.componentType.includes('CIE') && iaConfigs.length > 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>USN</TableCell>
                    <TableCell>Name</TableCell>
                    {iaConfigs.map((config) => (
                      <TableCell key={`${config.questionNumber}-${config.subpart}`}>
                        {config.part && `Part ${config.part}: `}
                        {config.questionNumber}
                        {config.subpart && config.subpart}
                        <Typography variant="caption" display="block">
                          (/{config.maxMarks})
                        </Typography>
                      </TableCell>
                    ))}
                    <TableCell>Total (/{componentDetails.maxMarks})</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.usn}>
                      <TableCell>{student.usn}</TableCell>
                      <TableCell>{student.firstName} {student.lastName}</TableCell>
                      {iaConfigs.map((config) => {
                        const key = `${config.questionNumber}${config.subpart || ''}`;
                        return (
                          <TableCell key={`${student.usn}-${key}`}>
                            <TextField
                              type="number"
                              size="small"
                              value={iaMarksData[student.usn]?.[key] || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleIAMarkChange(
                                student.usn, 
                                config.questionNumber, 
                                config.subpart, 
                                e.target.value
                              )}
                              inputProps={{ 
                                min: 0, 
                                max: config.maxMarks,
                                step: 0.5
                              }}
                              error={
                                iaMarksData[student.usn]?.[key] !== undefined && 
                                (iaMarksData[student.usn][key] < 0 || iaMarksData[student.usn][key] > config.maxMarks)
                              }
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Typography fontWeight="bold">
                          {calculateIATotal(student.usn)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveMarks}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Marks'}
            </Button>
          </Box>
        </>
      )}
      
      {/* Upload Excel Tab */}
      {currentTab === 1 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Download Template
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
            >
              Download Excel Template
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Upload Marks
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload the filled Excel template with student marks. Ensure all USNs are correct.
            </Typography>
            
            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="raised-button-file">
              <Button
                component="span"
                variant="outlined"
                sx={{ mr: 2 }}
              >
                Choose File
              </Button>
            </label>
            {fileUpload && (
              <Typography variant="body2" component="span">
                {fileUpload.name}
              </Typography>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={handleUploadMarks}
                disabled={!fileUpload || saving}
              >
                {saving ? <CircularProgress size={24} /> : 'Upload Marks'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default MarkEntryForm; 
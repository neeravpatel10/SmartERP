import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useInternalMarks, Blueprint as BlueprintType, GridData } from '../../hooks/useInternalMarks';
import { useLocation, useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import api from '../../utils/api';
import BlueprintModal from './components/BlueprintModal';
import MarksGrid from './components/MarksGrid';

interface Subject {
  id: number;
  code: string;
  name: string;
  semester?: number;
  departmentId?: number;
}

type AlertSeverity = 'success' | 'info' | 'warning' | 'error';

interface Notification {
  open: boolean;
  message: string;
  type: AlertSeverity;
}

// Define a local Blueprint interface that matches BlueprintModal component's expectations
interface Blueprint extends BlueprintType {}

const InternalMarksPage: React.FC = () => {
  // State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedCIE, setSelectedCIE] = useState<number | ''>('');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingSubjects, setIsFetchingSubjects] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    type: 'info'
  });
  
  // State for Excel upload functionality
  const [excelUploadOpen, setExcelUploadOpen] = useState<boolean>(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelUploading, setExcelUploading] = useState<boolean>(false);
  const [excelUploadError, setExcelUploadError] = useState<string | null>(null);
  const [fileUpload, setFileUpload] = useState<File | null>(null);

  // Custom hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    loading,
    error,
    createBlueprint,
    getBlueprint,
    updateBlueprint,
    getGridData,
    saveSingleMark,
    downloadTemplate,
    uploadMarks
  } = useInternalMarks();

  // Parse query parameters from URL and load data directly if subject is provided
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const subjectIdParam = queryParams.get('subjectId');
    const cieNoParam = queryParams.get('cieNo');
    
    // Only update if the parameter exists and differs from current state
    if (subjectIdParam) {
      const subjectId = Number(subjectIdParam);
      setSelectedSubject(subjectId);
    }
    
    // Only set CIE after subjects are loaded to avoid MUI Select error
    // This way we ensure there are options available when the value is set
    if (cieNoParam && [1, 2, 3].includes(Number(cieNoParam))) {
      setSelectedCIE(Number(cieNoParam));
    }
    // Don't set a default value for CIE initially - we'll do this after subjects load
  }, [location.search]);

  // Load faculty mapped subjects - following best practices from system memory
  // Fetch subject list once on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsFetchingSubjects(true);
        
        // Get token from localStorage like in Marks component
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
        
        // Use axios directly with explicit headers instead of the api utility
        // This matches the approach in Marks.tsx which works
        const response = await axios.get(`${apiUrl}/faculty-subject-mapping`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          // Extract subjects from the mappings
          let subjectsList = [];
          const mappings = response.data.data || [];
          
          if (Array.isArray(mappings)) {
            // Extract subjects from mappings
            subjectsList = mappings.map((mapping: any) => mapping.subject);
          }
          
          // Ensure we have unique subjects only by ID
          const uniqueSubjects = Array.from(
            new Map(subjectsList.map((item: any) => [item.id, item])).values()
          ) as Subject[];
          
          setSubjects(uniqueSubjects);
          
          // Now that subjects are loaded, if we don't have a CIE already
          // set from URL, we can safely set a default
          if (selectedCIE === '') {
            setSelectedCIE(1);
          }
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        showNotification('Failed to load subjects', 'error');
      } finally {
        setIsFetchingSubjects(false);
      }
    };
    
    fetchSubjects();
  }, []); // Only run once on component mount

  // Load blueprint and grid data when subject and CIE are selected
  useEffect(() => {
    // Skip if either subject or CIE is not selected
    if (!selectedSubject || !selectedCIE) return;
    
    // Create a controller for each new data loading operation
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        // Convert to numbers to ensure consistent type handling
        const subjectId = Number(selectedSubject);
        const cieNo = Number(selectedCIE);
        
        // Update URL to reflect current selection (without causing navigation)
        const newParams = new URLSearchParams(location.search);
        newParams.set('subjectId', subjectId.toString());
        newParams.set('cieNo', cieNo.toString());
        navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
        
        // Load blueprint with the abort controller signal
        const blueprint = await getBlueprint(subjectId, cieNo);
        
        // Only update state if not aborted
        if (!controller.signal.aborted) {
          setBlueprint(blueprint);
          
          // If there's no blueprint and we're a faculty member or department admin,
          // show a message suggesting to create one
          if (!blueprint && (user?.loginType === 2 || user?.loginType === 3)) {
            showNotification('No blueprint found for this subject and CIE. Create one to continue.', 'info');
          }
        }
        
        // Load grid data with the abort controller signal
        const gridData = await getGridData(subjectId, cieNo);
        
        // Only update state if not aborted
        if (!controller.signal.aborted) {
          setGridData(gridData);
        }
      } catch (error: any) {
        // Only show errors if not aborted
        if (error.name !== 'AbortError' && !controller.signal.aborted) {
          console.error('Error loading data:', error);
          showNotification('Failed to load blueprint or grid data', 'error');
        }
      }
    };
    
    loadData();
    
    // Clean up function to cancel any pending requests when dependencies change or component unmounts
    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedCIE]);

  // Handlers
  const handleSubjectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSelectedSubject(Number(value));
    
    // Update URL without navigating away
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('subjectId', String(value));
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  const handleCIEChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newCIE = event.target.value as number;
    setSelectedCIE(newCIE);
    
    // Update URL with new parameters
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('cieNo', newCIE.toString());
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveBlueprint = async (data: Blueprint) => {
    if (!selectedSubject) {
      showNotification('Please select a subject first', 'error');
      return;
    }
    
    if (!selectedCIE) {
      showNotification('Please select a CIE number first', 'error');
      return;
    }
    
    setIsModalOpen(false);
    showNotification('Saving blueprint...', 'info');
    
    try {
      const numericSubjectId = parseInt(String(selectedSubject));
      const numericCieNo = Number(selectedCIE);
      
      let result;
      
      // Check if blueprint already exists (has an ID)
      if (data.id) {
        // Update existing blueprint
        result = await updateBlueprint(data.id, {
          ...data,
          subjectId: numericSubjectId,
          cieNo: numericCieNo
        });
      } else {
        // Create new blueprint
        result = await createBlueprint({
          ...data,
          subjectId: numericSubjectId,
          cieNo: numericCieNo
        });
      }
      
      if (result) {
        setBlueprint(result);
        showNotification('Blueprint saved successfully', 'success');
        
        // Refresh grid data with guaranteed valid parameters
        const gd = await getGridData(numericSubjectId, numericCieNo);
        setGridData(gd);
      }
    } catch (error: any) {
      // Enhanced error handling
      console.error('Blueprint save error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save blueprint';
      showNotification(errorMessage, 'error');
    }
  };

  const handleCellChange = async (subqId: number, studentUsn: string, marks: number): Promise<boolean> => {
    try {
      // Validate input parameters
      if (isNaN(subqId) || !studentUsn || studentUsn.trim() === '') {
        showNotification('Invalid parameters for saving mark', 'error');
        return false;
      }
      
      const result = await saveSingleMark({ 
        subqId, 
        studentUsn, 
        marks
      });
      
      if (result) {
        showNotification('Mark saved successfully', 'success');
        
        // Update local grid data to reflect the change
        if (gridData) {
          const updatedRows = gridData.rows.map(row => {
            if (row.studentId === studentUsn) {
              const updatedMarks = row.marks.map(mark => {
                if (mark.subqId === subqId) {
                  return { ...mark, marks };
                }
                return mark;
              });
              return { ...row, marks: updatedMarks };
            }
            return row;
          });
          
          setGridData({ ...gridData, rows: updatedRows });
        }
        return true;
      } else {
        throw new Error('Failed to save mark');
      }
    } catch (error: any) {
      console.error('Error saving mark:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save mark';
      showNotification(errorMessage, 'error');
      return false;
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedSubject || !selectedCIE) {
      showNotification('Please select a subject and CIE number first', 'warning');
      return;
    }
    
    try {
      const numericSubjectId = parseInt(String(selectedSubject));
      // Using the downloadTemplate function from useInternalMarks
      await downloadTemplate(numericSubjectId, Number(selectedCIE));
      showNotification('Template downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading template:', error);
      showNotification('Failed to download template', 'error');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files && event.target.files.length > 0) {
      setFileUpload(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!fileUpload || !selectedSubject || !selectedCIE) {
      showNotification('Please select a file, subject, and CIE number first', 'warning');
      return;
    }

    try {
      const numericSubjectId = parseInt(String(selectedSubject));
      const numericCieNo = Number(selectedCIE);
      const success = await uploadMarks(fileUpload, numericSubjectId, numericCieNo);
      
      if (success) {
        showNotification('Marks uploaded successfully', 'success');
        setFileUpload(null);
        
        // Refresh grid data
        const gd = await getGridData(numericSubjectId, numericCieNo);
        setGridData(gd);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification('Failed to upload marks', 'error');
    }
  };

  const showNotification = (message: string, type: AlertSeverity): void => {
    setNotification({
      open: true,
      message,
      type
    });
  };

  const handleCloseNotification = (): void => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Handle Excel file selection
  const handleExcelFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setExcelUploadError(null);
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setExcelUploadError('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      setExcelFile(file);
    }
  };

  // Handle Excel upload
  const handleUploadExcel = async () => {
    if (!excelFile || !selectedSubject || !selectedCIE) {
      setExcelUploadError('Missing required information');
      return;
    }
    
    try {
      setExcelUploading(true);
      setExcelUploadError(null);
      
      // Create form data for the file upload
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('subjectId', selectedSubject.toString());
      formData.append('cieNo', selectedCIE.toString());
      
      // Use your API hook to upload the file
      const response = await api.post('/marks/internal/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        showNotification('Marks uploaded successfully', 'success');
        setExcelUploadOpen(false);
        setExcelFile(null);
        
        // Refresh the grid data
        const numericSubjectId = parseInt(String(selectedSubject));
        const gd = await getGridData(numericSubjectId, selectedCIE);
        setGridData(gd);
      } else {
        setExcelUploadError(response.data.message || 'Failed to upload marks');
      }
    } catch (error: any) {
      console.error('Error uploading Excel file:', error);
      setExcelUploadError(error.response?.data?.message || 'An error occurred during upload');
    } finally {
      setExcelUploading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Internal Marks Management
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/marks')}
        >
          Back to Marks Dashboard
        </Button>
      </Box>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        {(loading || isFetchingSubjects) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress />
          </Box>
        )}
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="subject-select-label">Subject</InputLabel>
              <Select
                labelId="subject-select-label"
                value={selectedSubject || ""}
                onChange={handleSubjectChange as any}
                label="Subject"
                disabled={loading || isFetchingSubjects}
                MenuProps={{ 
                  PaperProps: { 
                    style: { maxHeight: 300 } 
                  } 
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select a subject</em>
                </MenuItem>
                {subjects.map(subject => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="cie-select-label">CIE Number</InputLabel>
              <Select
                labelId="cie-select-label"
                value={selectedCIE || ''}
                label="CIE Number"
                onChange={handleCIEChange as any}
                disabled={!selectedSubject || loading || isFetchingSubjects}
              >
                <MenuItem value="" disabled><em>Select CIE</em></MenuItem>
                <MenuItem value={1}>CIE 1</MenuItem>
                <MenuItem value={2}>CIE 2</MenuItem>
                <MenuItem value={3}>CIE 3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenModal}
                disabled={!selectedSubject || !selectedCIE || loading || isFetchingSubjects}
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                {blueprint ? 'Edit Blueprint' : 'Create Blueprint'}
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={() => setExcelUploadOpen(true)}
                disabled={!selectedSubject || !selectedCIE || !blueprint || loading || isFetchingSubjects}
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Upload Excel
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                disabled={!selectedSubject || !selectedCIE || !blueprint || loading || isFetchingSubjects}
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Template
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {gridData && (
        <>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                >
                  Download Template
                </Button>
              </Grid>
              
              <Grid item>
                <input
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                  >
                    Select File
                  </Button>
                </label>
              </Grid>
              
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpload}
                  disabled={!fileUpload}
                >
                  Upload Marks
                </Button>
              </Grid>
              
              {fileUpload && (
                <Grid item>
                  <Typography variant="body2">
                    Selected: {fileUpload.name}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
          
          <Paper elevation={3} sx={{ p: 2, overflow: 'auto' }}>
            <MarksGrid
              data={gridData}
              onCellChange={handleCellChange}
            />
          </Paper>
        </>
      )}
      
      {/* Blueprint Modal */}
      <BlueprintModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveBlueprint}
        initialData={blueprint}
      />
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.type}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Excel Upload Dialog */}
      <Dialog
        open={!!excelUploadOpen}
        onClose={() => setExcelUploadOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Marks from Excel</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload Excel file with student marks. The file must match the template format.
            </Typography>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelFileChange}
              style={{ display: 'none' }}
              id="excel-file-input"
            />
            <label htmlFor="excel-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mt: 1 }}
              >
                Select Excel File
              </Button>
            </label>
            {excelFile && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info">
                  Selected file: {excelFile.name}
                </Alert>
              </Box>
            )}
            {excelUploadError && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="error">
                  {excelUploadError}
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExcelUploadOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUploadExcel}
            color="primary"
            variant="contained"
            disabled={!excelFile || excelUploading}
          >
            {excelUploading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Upload'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InternalMarksPage;

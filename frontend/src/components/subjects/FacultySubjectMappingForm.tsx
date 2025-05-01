import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface FacultySubjectMappingFormProps {
  departmentId?: number;
  onMappingCreated?: () => void;
}

interface FormData {
  facultyId: string;
  subjectId: string;
  section: string;
  semester: string;
  batchId: string;
  academicYear: string;
  componentScope: string;
  isPrimary: boolean;
  active: boolean;
}

interface Subject {
  id: number;
  code: string;
  name: string;
  semester: number;
}

interface Faculty {
  id: number;
  firstName: string;
  lastName: string;
}

interface Batch {
  id: number;
  name: string;
}

const initialFormData: FormData = {
  facultyId: '',
  subjectId: '',
  section: '',
  semester: '',
  batchId: '',
  academicYear: '',
  componentScope: 'theory',
  isPrimary: true,
  active: true
};

const FacultySubjectMappingForm: React.FC<FacultySubjectMappingFormProps> = ({ 
  departmentId,
  onMappingCreated 
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const academicYearOptions = [
    `${currentYear-1}-${currentYear}`,
    `${currentYear}-${currentYear+1}`,
    `${currentYear+1}-${currentYear+2}`
  ];

  // Wrap fetchData in useCallback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [facultiesRes, subjectsRes, batchesRes] = await Promise.all([
        // Fetch faculties
        axios.get('/api/faculty', {
          headers: { Authorization: `Bearer ${token}` },
          params: departmentId ? { departmentId } : {}
        }),
        // Fetch subjects
        axios.get('/api/subjects', {
          headers: { Authorization: `Bearer ${token}` },
          params: departmentId ? { departmentId } : {}
        }),
        // Fetch batches
        axios.get('/api/batches', {
          headers: { Authorization: `Bearer ${token}` },
          params: departmentId ? { departmentId } : {}
        })
      ]);

      if (facultiesRes.data.success) {
        setFaculties(facultiesRes.data.data);
      }
      
      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.data);
      }
      
      if (batchesRes.data.success) {
        setBatches(batchesRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
      setError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  }, [token, departmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle form input changes
  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // If there was an error or success message, clear it
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  // Handle subject selection to auto-populate semester
  const handleSubjectSelect = (subjectId: string) => {
    const selectedSubject = subjects.find((subject: any) => subject.id.toString() === subjectId);
    
    if (selectedSubject) {
      setFormData(prev => ({
        ...prev,
        subjectId,
        semester: selectedSubject.semester.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        subjectId,
        semester: ''
      }));
    }
  };

  // Submit form to create mapping
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Validate form
      if (!formData.facultyId || !formData.subjectId || !formData.semester || 
          !formData.batchId || !formData.academicYear) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Convert to expected types
      const payload = {
        facultyId: parseInt(formData.facultyId),
        subjectId: parseInt(formData.subjectId),
        semester: parseInt(formData.semester),
        section: formData.section,
        batchId: parseInt(formData.batchId),
        academicYear: formData.academicYear,
        componentScope: formData.componentScope,
        isPrimary: formData.isPrimary,
        active: formData.active
      };
      
      // Submit mapping
      const response = await axios.post('/api/subjects/faculty-mapping', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess('Faculty-subject mapping created successfully');
        setFormData(initialFormData);
        if (onMappingCreated) onMappingCreated();
      }
    } catch (error: any) {
      console.error('Error creating mapping:', error);
      setError(error.response?.data?.message || 'Failed to create mapping');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Create Faculty-Subject Mapping
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Error/Success Messages */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
            {success && (
              <Grid item xs={12}>
                <Alert severity="success">{success}</Alert>
              </Grid>
            )}
            
            {/* Faculty Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Faculty</InputLabel>
                <Select
                  value={formData.facultyId}
                  label="Faculty *"
                  onChange={(e: SelectChangeEvent) => handleChange('facultyId', e.target.value as string)}
                >
                  <MenuItem value="">Select Faculty</MenuItem>
                  {faculties.map((faculty: Faculty) => (
                    <MenuItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.firstName} {faculty.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Subject Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subjectId}
                  label="Subject *"
                  onChange={(e: SelectChangeEvent) => handleSubjectSelect(e.target.value as string)}
                >
                  <MenuItem value="">Select Subject</MenuItem>
                  {subjects.map((subject: Subject) => (
                    <MenuItem key={subject.id} value={subject.id.toString()}>
                      {subject.code} - {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Semester */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={formData.semester}
                  label="Semester *"
                  onChange={(e: SelectChangeEvent) => handleChange('semester', e.target.value as string)}
                  disabled={!!formData.subjectId} // Disable if subject selected
                >
                  <MenuItem value="">Select Semester</MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <MenuItem key={sem} value={sem.toString()}>
                      {sem}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Section */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Section"
                value={formData.section}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('section', e.target.value)}
                helperText="Leave blank for all sections"
              />
            </Grid>
            
            {/* Batch */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Batch</InputLabel>
                <Select
                  value={formData.batchId}
                  label="Batch *"
                  onChange={(e: SelectChangeEvent) => handleChange('batchId', e.target.value as string)}
                >
                  <MenuItem value="">Select Batch</MenuItem>
                  {batches.map((batch: Batch) => (
                    <MenuItem key={batch.id} value={batch.id.toString()}>
                      {batch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Academic Year */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={formData.academicYear}
                  label="Academic Year *"
                  onChange={(e: SelectChangeEvent) => handleChange('academicYear', e.target.value as string)}
                >
                  <MenuItem value="">Select Academic Year</MenuItem>
                  {academicYearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Component Scope */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Component Scope</InputLabel>
                <Select
                  value={formData.componentScope}
                  label="Component Scope *"
                  onChange={(e: SelectChangeEvent) => handleChange('componentScope', e.target.value as string)}
                >
                  <MenuItem value="theory">Theory</MenuItem>
                  <MenuItem value="lab">Lab</MenuItem>
                  <MenuItem value="both">Both (Theory & Lab)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Additional Options */}
            <Grid item xs={12}>
              <Box sx={{ mt: 2, display: 'flex', gap: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isPrimary}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('isPrimary', e.target.checked)}
                    />
                  }
                  label="Primary Faculty"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.active}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('active', e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Box>
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                fullWidth
                sx={{ mt: 2 }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Create Mapping'}
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
    </Paper>
  );
};

export default FacultySubjectMappingForm; 
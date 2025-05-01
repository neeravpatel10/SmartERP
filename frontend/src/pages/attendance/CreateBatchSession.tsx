import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert, 
  CircularProgress, 
  Divider,
  Box,
  Chip
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MainLayout from '../../components/layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';

interface Subject {
  id: number;
  name: string;
  code: string;
}

// User interface is already defined in AuthContext

interface BatchSession {
  subjectId: number;
  facultyId?: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  sessionSlot: number;
  sessionType: 'theory' | 'lab';
  duration?: number;
  academicYear: string;
  semester: number;
  section?: string;
  batchId?: number;
}

const CreateBatchSession: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [formData, setFormData] = useState<BatchSession>({
    subjectId: 0,
    dateRange: {
      startDate: '',
      endDate: ''
    },
    sessionSlot: 1,
    sessionType: 'theory',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    semester: 1
  });

  // Fetch subjects mapped to the faculty
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        let endpoint = '/api/subjects';
        
        // If user is faculty, filter by faculty ID
        if (user && user.loginType === 2 && (user as any).faculty) {
          endpoint = `/api/faculty/${(user as any).faculty.id}/subjects`;
        }
        
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setSubjects(response.data.data);
        } else {
          setError('Failed to load subjects. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('An error occurred while loading subjects.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubjects();
  }, [user, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (name?.includes('.')) {
      // Handle nested objects (like dateRange.startDate)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof BatchSession] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSessionTypeChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const sessionType = e.target.value as 'theory' | 'lab';
    
    // Auto-set duration based on session type
    let duration = formData.duration;
    if (sessionType === 'lab' && (!duration || duration === 1)) {
      duration = 3; // Default for lab is 3 periods
    } else if (sessionType === 'theory') {
      duration = 1; // Default for theory is 1 period
    }
    
    setFormData(prev => ({
      ...prev,
      sessionType,
      duration
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Add faculty ID if user is faculty
      const requestData = { ...formData };
      if (user && user.loginType === 2 && (user as any).faculty) {
        requestData.facultyId = (user as any).faculty.id;
      }
      
      const response = await axios.post(
        '/api/attendance/sessions/batch',
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setSuccess(`${response.data.data.sessions.length} attendance sessions created successfully! (${response.data.data.skippedDates} dates skipped due to existing sessions)`);
        // Reset form data except academicYear and semester
        setFormData(prev => ({
          subjectId: 0,
          dateRange: {
            startDate: '',
            endDate: ''
          },
          sessionSlot: 1,
          sessionType: 'theory',
          academicYear: prev.academicYear,
          semester: prev.semester
        }));
      } else {
        setError(response.data.message || 'Failed to create attendance sessions.');
      }
    } catch (error: any) {
      console.error('Error creating batch attendance sessions:', error);
      setError(error.response?.data?.message || 'An error occurred while creating attendance sessions.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate number of days in the selected date range
  const calculateDaysInRange = () => {
    const { startDate, endDate } = formData.dateRange;
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Return 0 if dates are invalid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    // Return 0 if start date is after end date
    if (start > end) return 0;
    
    // Calculate difference in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays + 1; // Include both start and end date
  };

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Create Batch Attendance Sessions
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Create multiple attendance sessions at once by selecting a date range.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleInputChange}
                    label="Subject"
                    required
                    disabled={loading || submitting}
                  >
                    <MenuItem value={0} disabled>Select a subject</MenuItem>
                    {subjects.map(subject => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Session Type</InputLabel>
                  <Select
                    name="sessionType"
                    value={formData.sessionType}
                    onChange={handleSessionTypeChange}
                    label="Session Type"
                    required
                    disabled={submitting}
                  >
                    <MenuItem value="theory">Theory</MenuItem>
                    <MenuItem value="lab">Lab</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Academic Year"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  placeholder="e.g. 2023-2024"
                  required
                  disabled={submitting}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    label="Semester"
                    required
                    disabled={submitting}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <MenuItem key={sem} value={sem}>
                        Semester {sem}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Section"
                  name="section"
                  value={formData.section || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. A"
                  disabled={submitting}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Session Slot"
                  name="sessionSlot"
                  type="number"
                  value={formData.sessionSlot}
                  onChange={handleInputChange}
                  inputProps={{ min: 1 }}
                  required
                  disabled={submitting}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Period Count"
                  name="duration"
                  type="number"
                  value={formData.duration || (formData.sessionType === 'lab' ? 3 : 1)}
                  onChange={handleInputChange}
                  inputProps={{ min: 1, max: 5 }}
                  required
                  disabled={submitting}
                  helperText={`Default is ${formData.sessionType === 'lab' ? '3 periods for lab' : '1 period for theory'}`}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip icon={<CalendarMonthIcon />} label="Date Range" />
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="dateRange.startDate"
                  type="date"
                  value={formData.dateRange.startDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={submitting}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="dateRange.endDate"
                  type="date"
                  value={formData.dateRange.endDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={submitting}
                />
              </Grid>
              
              {formData.dateRange.startDate && formData.dateRange.endDate && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    bgcolor: 'background.paper', 
                    p: 2, 
                    borderRadius: 1, 
                    border: '1px solid',
                    borderColor: 'divider',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      This will create sessions for
                    </Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {calculateDaysInRange()} day{calculateDaysInRange() !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Grid>
              )}
              
              <Grid item xs={12} sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={submitting || loading}
                  sx={{
                    backgroundColor: '#b50900',
                    '&:hover': {
                      backgroundColor: '#940800',
                    },
                  }}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Create Batch Sessions'}
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate('/attendance')}
                  disabled={submitting}
                  fullWidth
                >
                  Back to Attendance
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default CreateBatchSession; 
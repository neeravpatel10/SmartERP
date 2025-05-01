import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  Button, 
  Alert,
  CircularProgress,
  Grid,
  Box
} from '@mui/material';
import api from '../../utils/api';
import { SubjectFormData } from '../../types/SubjectFormData';

const SubjectDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isCreateMode = !id || location.pathname === '/subjects/create';
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState<SubjectFormData>({
    code: '',
    name: '',
    semester: 1,
    credits: 3,
    isLab: false,
    departmentId: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      // Skip fetching if we're in create mode
      if (isCreateMode) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/api/subjects/${id}`);
        
        if (response.data.success) {
          setSubject(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch subject details');
        }
      } catch (error: any) {
        console.error('Error fetching subject details:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch subject details';
        setError(errorMessage);
        
        // If subject not found, redirect back to subjects list
        if (error.response?.status === 404) {
          setTimeout(() => {
            navigate('/subjects');
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectDetails();
  }, [id, navigate, isCreateMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!subject.code || !subject.name || !subject.semester || !subject.credits) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = isCreateMode
        ? await api.post('/api/subjects', subject)
        : await api.put(`/api/subjects/${id}`, subject);
      
      if (response.data.success) {
        navigate('/subjects');
      } else {
        setError(response.data.message || 'Failed to save subject');
      }
    } catch (error: any) {
      console.error('Error saving subject:', error);
      setError(error.response?.data?.message || 'Failed to save subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSubject(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value) || 0 : 
              value
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading subject details...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          {isCreateMode ? 'Create New Subject' : 'Edit Subject'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Subject Code"
                name="code"
                value={subject.code}
                onChange={handleChange}
                disabled={submitting}
                error={!subject.code}
                helperText={!subject.code && 'Subject code is required'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Subject Name"
                name="name"
                value={subject.name}
                onChange={handleChange}
                disabled={submitting}
                error={!subject.name}
                helperText={!subject.name && 'Subject name is required'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Semester"
                name="semester"
                value={subject.semester}
                onChange={handleChange}
                disabled={submitting}
                inputProps={{ min: 1, max: 8 }}
                error={!subject.semester}
                helperText={!subject.semester && 'Semester is required'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Credits"
                name="credits"
                value={subject.credits}
                onChange={handleChange}
                disabled={submitting}
                inputProps={{ min: 1, max: 4 }}
                error={!subject.credits}
                helperText={!subject.credits && 'Credits are required'}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={subject.isLab}
                    onChange={handleChange}
                    name="isLab"
                    disabled={submitting}
                  />
                }
                label="Is Laboratory Subject"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/subjects')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : null}
                >
                  {submitting ? 'Saving...' : (isCreateMode ? 'Create' : 'Update')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default SubjectDetail; 
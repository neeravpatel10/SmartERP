import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';

interface FacultyFormProps {
  mode: 'create' | 'edit';
}

interface FacultyData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
}

interface Department {
  id: string;
  name: string;
}

const FacultyForm: React.FC<FacultyFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [facultyData, setFacultyData] = useState<FacultyData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designation: ''
  });

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/api/departments');
        if (response.data.success) {
          setDepartments(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError('Failed to load departments');
      }
    };
    fetchDepartments();
  }, []);

  // Fetch faculty data if in edit mode
  useEffect(() => {
    const fetchFacultyData = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          const response = await api.get(`/api/faculty/${id}`);
          if (response.data.success) {
            setFacultyData(response.data.data);
          } else {
            setError('Failed to fetch faculty data');
          }
        } catch (err) {
          console.error('Error fetching faculty:', err);
          setError('Error fetching faculty data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFacultyData();
  }, [mode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'edit' ? `/api/faculty/${id}` : '/api/faculty';
      const method = mode === 'edit' ? 'put' : 'post';
      
      const response = await api({
        method,
        url: endpoint,
        data: facultyData
      });

      if (response.data.success) {
        navigate('/faculty');
      } else {
        setError(response.data.message || 'Failed to save faculty');
      }
    } catch (err: any) {
      console.error('Error saving faculty:', err);
      setError(err.response?.data?.message || 'Error saving faculty data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFacultyData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  if (loading && mode === 'edit') {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {mode === 'create' ? 'Add New Faculty' : 'Edit Faculty'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="firstName"
                label="First Name"
                value={facultyData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="lastName"
                label="Last Name"
                value={facultyData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="email"
                type="email"
                label="Email"
                value={facultyData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="phone"
                label="Phone"
                value={facultyData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  name="departmentId"
                  value={facultyData.departmentId}
                  onChange={handleChange}
                  label="Department"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="designation"
                label="Designation"
                value={facultyData.designation}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/faculty')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : mode === 'create' ? 'Create Faculty' : 'Update Faculty'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default FacultyForm; 
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

interface StudentFormProps {
  mode: 'create' | 'edit';
}

interface StudentData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  rollNumber: string;
  semester: number;
  status: 'active' | 'inactive' | 'graduated';
}

interface Department {
  id: string;
  name: string;
}

const StudentForm: React.FC<StudentFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [studentData, setStudentData] = useState<StudentData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    rollNumber: '',
    semester: 1,
    status: 'active'
  });

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments');
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

  // Fetch student data if in edit mode
  useEffect(() => {
    const fetchStudentData = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          const response = await api.get(`/students/${id}`);
          if (response.data.success) {
            setStudentData(response.data.data);
          } else {
            setError('Failed to fetch student data');
          }
        } catch (err) {
          console.error('Error fetching student:', err);
          setError('Error fetching student data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStudentData();
  }, [mode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'edit' ? `/students/${id}` : '/students';
      const method = mode === 'edit' ? 'put' : 'post';
      
      const response = await api({
        method,
        url: endpoint,
        data: studentData
      });

      if (response.data.success) {
        navigate('/students');
      } else {
        setError(response.data.message || 'Failed to save student');
      }
    } catch (err: any) {
      console.error('Error saving student:', err);
      setError(err.response?.data?.message || 'Error saving student data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setStudentData(prev => ({
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
          {mode === 'create' ? 'Add New Student' : 'Edit Student'}
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
                value={studentData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="lastName"
                label="Last Name"
                value={studentData.lastName}
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
                value={studentData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="phone"
                label="Phone"
                value={studentData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="rollNumber"
                label="Roll Number"
                value={studentData.rollNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="semester"
                label="Semester"
                type="number"
                InputProps={{ inputProps: { min: 1, max: 8 } }}
                value={studentData.semester}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  name="departmentId"
                  value={studentData.departmentId}
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
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={studentData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="graduated">Graduated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/students')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : mode === 'create' ? 'Create Student' : 'Update Student'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default StudentForm; 
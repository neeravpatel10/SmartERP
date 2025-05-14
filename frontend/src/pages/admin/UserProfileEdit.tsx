import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { updateUserProfile, resetSuccess, resetError } from '../../store/slices/usersSlice';
import { RootState, AppDispatch } from '../../store';
import axios from 'axios';

interface Department {
  id: number;
  name: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  departmentId?: number;
  lastLogin?: string;
}

const UserProfileEdit: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    departmentId: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    email: '',
    role: '',
    departmentId: ''
  });
  
  const [user, setUser] = useState<UserData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState('');
  
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success } = useSelector((state: RootState) => state.users);
  
  // Define fetchUserData and fetchDepartments with useCallback
  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    
    setLoadingData(true);
    setFetchError('');
    
    try {
      const response = await axios.get(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const userData = response.data;
      setUser(userData);
      
      // Initialize form data
      setFormData({
        email: userData.email || '',
        role: userData.role.toString() || '',
        departmentId: userData.departmentId ? userData.departmentId.toString() : ''
      });
      
    } catch (error: any) {
      setFetchError(error.response?.data?.message || 'Failed to fetch user data');
    } finally {
      setLoadingData(false);
    }
  }, [userId, setUser, setFormData, setLoadingData, setFetchError]);
  
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get('/api/departments', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments', error);
    }
  }, [setDepartments]);
  
  useEffect(() => {
    dispatch(resetError());
    dispatch(resetSuccess());
    
    if (userId) {
      fetchUserData();
      fetchDepartments();
    }
    
    return () => {
      dispatch(resetSuccess());
    };
  }, [dispatch, userId, fetchUserData, fetchDepartments]);
  
  useEffect(() => {
    // Redirect back after successful update
    if (success) {
      const timer = setTimeout(() => {
        navigate('/admin/users');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Clear field error when typing
      if (formErrors[name as keyof typeof formErrors]) {
        setFormErrors({
          ...formErrors,
          [name]: ''
        });
      }
    }
  };
  
  const validateForm = (): boolean => {
    let isValid = true;
    const errors = {
      email: '',
      role: '',
      departmentId: ''
    };
    
    // Validate email
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }
    
    // Validate role
    if (!formData.role) {
      errors.role = 'Role is required';
      isValid = false;
    }
    
    // Validate department if role is department admin
    if (formData.role === '3' && !formData.departmentId) {
      errors.departmentId = 'Department is required for Department Admin';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !validateForm()) {
      return;
    }
    
    const userData = {
      userId: parseInt(userId),
      email: formData.email,
      role: formData.role,
      ...(formData.departmentId && { departmentId: parseInt(formData.departmentId) })
    };
    
    await dispatch(updateUserProfile(userData));
  };
  
  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (fetchError) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            {fetchError}
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/admin/users')}
            sx={{ mt: 2 }}
          >
            Back to Users
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning">
            User not found
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/admin/users')}
            sx={{ mt: 2 }}
          >
            Back to Users
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit User: {user.username}
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              User profile successfully updated! Redirecting...
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  value={user.username}
                  disabled
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!formErrors.role}>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={formData.role}
                    label="Role"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="1">Super Admin</MenuItem>
                    <MenuItem value="2">Faculty</MenuItem>
                    <MenuItem value="3">Department Admin</MenuItem>
                    <MenuItem value="4">Student</MenuItem>
                  </Select>
                  {formErrors.role && (
                    <Typography variant="caption" color="error">
                      {formErrors.role}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl 
                  fullWidth 
                  margin="normal" 
                  disabled={formData.role !== '3' || loading}
                  error={!!formErrors.departmentId}
                >
                  <InputLabel id="department-label">Department</InputLabel>
                  <Select
                    labelId="department-label"
                    id="departmentId"
                    name="departmentId"
                    value={formData.departmentId}
                    label="Department"
                    onChange={handleChange}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.departmentId && (
                    <Typography variant="caption" color="error">
                      {formErrors.departmentId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/admin/users')}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Update User'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default UserProfileEdit; 
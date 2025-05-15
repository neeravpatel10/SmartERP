import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
// API interceptor handles authentication automatically
import api from '../../utils/api';
import axios from 'axios';
import Autocomplete from '@mui/material/Autocomplete';
// No longer using the debounce helper - implementing inline with setTimeout

interface Department {
  id: number;
  code: string;
  name: string;
  hodName?: string;
  hodId?:string;
  createdAt: string;
  head:Head; 
}

interface Faculty {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
}

interface DepartmentFormData {
  name: string;
  code: string;
  headId: string | '';
}

interface Head{
  id:string;
  name: string;
  email:string;
}
const initialFormData: DepartmentFormData = {
  name: '',
  code: '',
  headId: '',
};

const Departments: React.FC = () => {
  const navigate = useNavigate();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Start with false to allow initial fetch
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [formData, setFormData] = useState<DepartmentFormData>(initialFormData);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [departmentFaculty, setDepartmentFaculty] = useState<Faculty[]>([]);
  const [facultyLoading, setFacultyLoading] = useState(false);

  // Wrap fetchDepartments in useCallback
  const fetchDepartments = useCallback(async () => {
    // No loading check needed here
    setLoading(true);
    setError(null);
  
    try {
      // Use axios directly with the full URL to bypass any routing issues
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/departments', {
        params: { search: searchTerm },
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (response && response.data && response.data.success) {
        setDepartments(response.data.data.departments);
      } else {
        throw new Error('Failed to load departments: ' + 
          (response?.data?.message || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load departments');
      // Clear cache in case there's a stale entry
      api.clearCache('/departments');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]); // Remove loading from dependencies

  // Create stable reference to the debounce function
  const debouncedFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Single effect to handle all search functionality
  useEffect(() => {
    // Function to perform the search
    const performSearch = () => {
      // Don't check loading here, let fetchDepartments handle it
      fetchDepartments();
    };
    
    // For initial load or when search term is empty, search immediately
    if (searchTerm === '') {
      performSearch();
      return;
    }
    
    // For search term changes, use debounce
    // Clear any pending timeout
    if (debouncedFetchRef.current) {
      clearTimeout(debouncedFetchRef.current);
    }
    
    // Set new timeout
    debouncedFetchRef.current = setTimeout(() => {
      performSearch();
    }, 500);
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (debouncedFetchRef.current) {
        clearTimeout(debouncedFetchRef.current);
      }
    };
  }, [searchTerm, fetchDepartments, loading]);

  // Fetch faculty for a department
  const fetchDepartmentFaculty = useCallback(async (departmentId: number) => {
    setFacultyLoading(true);
    try {
      // Use direct axios call with full URL like we did for departments
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/faculty', {
        params: { departmentId },
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setDepartmentFaculty(response.data.data.faculty);
      } else {
        throw new Error('Failed to load faculty');
      }
    } catch (err: any) {
      console.error('Error fetching faculty:', err);
      setDepartmentFaculty([]);
    } finally {
      setFacultyLoading(false);
    }
  }, []);

  // When editing or adding, fetch faculty for the department
  useEffect(() => {
    if (dialogOpen) {
      // If editing, use the department being edited
      const deptId = isEditing && currentDepartmentId
        ? currentDepartmentId
        : null;
      if (deptId) {
        fetchDepartmentFaculty(deptId);
      } else {
        setDepartmentFaculty([]);
      }
    }
  }, [dialogOpen, isEditing, currentDepartmentId, fetchDepartmentFaculty]);

  const handleFormChange = (field: keyof DepartmentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddDepartment = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setFormData({
      name: department.name,
      code: department.code,
      headId: department.head?.id || '',
    });
    setIsEditing(true);
    setCurrentDepartmentId(department.id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (department: Department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.delete(`/departments/${departmentToDelete.id}`);
      
      if (response.data.success) {
        setSuccess('Department deleted successfully');
        fetchDepartments();
      }
    } catch (err: any) {
      console.error('Error deleting department:', err);
      setError(err.response?.data?.message || 'Failed to delete department');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.name || !formData.code) {
      setError('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      if (isEditing && currentDepartmentId) {
        // Update existing department
        const response = await api.put(
          `/departments/${currentDepartmentId}`,
          {
            name: formData.name,
            code: formData.code,
            hodId: formData.headId || undefined
          }
        );
        
        if (response.data.success) {
          setSuccess('Department updated successfully');
          fetchDepartments();
        }
      } else {
        // Create new department
        const response = await api.post(
          '/departments',
          {
            name: formData.name,
            code: formData.code,
            hodId: formData.headId || undefined
          }
        );
        
        if (response.data.success) {
          setSuccess('Department created successfully');
          fetchDepartments();
        }
      }
      
      // Close dialog
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Error submitting department:', err);
      setError(err.response?.data?.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewBatches = (departmentId: number) => {
    navigate(`/departments/${departmentId}/batches`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Departments
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddDepartment}
        >
          Add Department
        </Button>
      </Box>

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

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Search Departments"
          variant="outlined"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchTerm(e.target.value);
          }}
          placeholder="Search by department name or code..."
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: '500px', overflow: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>HOD</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No departments found. Add some departments to get started.
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>{department.code}</TableCell>
                    <TableCell>{department.name}</TableCell>
                    <TableCell>
                      {department.head ? (
                        `${department.head.name || ''} `.trim()
                      ) : (
                        <Chip label="Not Assigned" size="small" color="warning" />
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(department.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Batches">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewBatches(department.id)}
                          sx={{ mr: 1 }}
                        >
                          Batches
                        </Button>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditDepartment(department)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(department)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Department Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Department' : 'Create New Department'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Department Name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('name', e.target.value)}
                  disabled={submitting}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Department Code"
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('code', e.target.value)}
                  disabled={submitting}
                  helperText="E.g., CSE, ECE, MECH (uppercase letters only)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                  options={departmentFaculty}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                  loading={facultyLoading}
                  value={departmentFaculty.find(f => String(f.id) === formData.headId) || null}
                  onChange={(_e, newValue) => handleFormChange('headId', newValue ? newValue.id : '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Head of Department"
                      placeholder="Search faculty by name or email"
                      fullWidth
                      disabled={facultyLoading || submitting}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : (isEditing ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the department <strong>{departmentToDelete?.name}</strong>?
            This action cannot be undone and may affect related data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteDepartment} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Departments; 
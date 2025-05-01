import React, { useState, useEffect, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

interface Department {
  id: number;
  code: string;
  name: string;
  hodName?: string;
  createdAt: string;
  head?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Faculty {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface DepartmentFormData {
  name: string;
  code: string;
  headId: number | '';
}

const initialFormData: DepartmentFormData = {
  name: '',
  code: '',
  headId: '',
};

const Departments: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

  // Wrap fetchDepartments in useCallback
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/departments', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchTerm }
      });
      
      if (response.data.success) {
        setDepartments(response.data.data.departments);
      }
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError(err.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, token]);

  // Wrap fetchFaculty in useCallback
  const fetchFaculty = useCallback(async () => {
    try {
      const response = await api.get('/api/faculty', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFaculty(response.data.data.faculty);
      }
    } catch (err) {
      console.error('Error fetching faculty:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
    fetchFaculty();
  }, [fetchDepartments, fetchFaculty]);

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
            headId: formData.headId || undefined
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
            headId: formData.headId || undefined
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
            fetchDepartments();
          }}
          placeholder="Search by department name or code..."
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
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
                        `${department.head.firstName} ${department.head.lastName}`
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
                <FormControl fullWidth>
                  <InputLabel>Head of Department</InputLabel>
                  <Select
                    value={formData.headId}
                    label="Head of Department"
                    onChange={(e: { target: { value: unknown } }) => handleFormChange('headId', e.target.value as string)}
                    disabled={submitting}
                  >
                    <MenuItem value="">None</MenuItem>
                    {faculty.map((f) => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.firstName} {f.lastName} ({f.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
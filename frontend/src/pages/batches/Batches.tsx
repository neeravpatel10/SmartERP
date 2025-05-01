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
  FormControlLabel,
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface Department {
  id: number;
  code: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  academicYear: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
  currentSemester: number;
  autoRollover: boolean;
  archived: boolean;
  createdAt: string;
  _count?: {
    students: number;
  };
}

interface BatchFormData {
  name: string;
  academicYear: string;
  departmentId: number | '';
  currentSemester: number;
  autoRollover: boolean;
  archived: boolean;
}

const initialFormData: BatchFormData = {
  name: '',
  academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  departmentId: '',
  currentSemester: 1,
  autoRollover: false,
  archived: false,
};

const AllBatches: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  
  const [formData, setFormData] = useState<BatchFormData>(initialFormData);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [rolloverDialogOpen, setRolloverDialogOpen] = useState<boolean>(false);
  const [batchToRollover, setBatchToRollover] = useState<Batch | null>(null);

  // Wrap fetchDepartments in useCallback
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get('/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDepartments(response.data.data.departments);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  }, [token]);

  // Wrap fetchBatches in useCallback
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/batches', {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          departmentId: selectedDepartment || undefined,
          search: searchTerm,
          showArchived: showArchived ? 'true' : 'false'
        }
      });
      
      if (response.data.success) {
        setBatches(response.data.data.batches);
      }
    } catch (err: any) {
      console.error('Error fetching batches:', err);
      setError(err.response?.data?.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, [token, selectedDepartment, searchTerm, showArchived]);

  useEffect(() => {
    fetchDepartments();
    fetchBatches();
  }, [fetchDepartments, fetchBatches]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    fetchBatches();
  };

  const handleFormChange = (field: keyof BatchFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddBatch = () => {
    setFormData({
      ...initialFormData,
      departmentId: selectedDepartment || '',
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setFormData({
      name: batch.name,
      academicYear: batch.academicYear,
      departmentId: batch.department.id,
      currentSemester: batch.currentSemester,
      autoRollover: batch.autoRollover,
      archived: batch.archived,
    });
    setIsEditing(true);
    setCurrentBatchId(batch.id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (batch: Batch) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.delete(`/batches/${batchToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess('Batch deleted successfully');
        fetchBatches();
      }
    } catch (err: any) {
      console.error('Error deleting batch:', err);
      setError(err.response?.data?.message || 'Failed to delete batch');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setBatchToDelete(null);
    }
  };

  const handleRolloverClick = (batch: Batch) => {
    setBatchToRollover(batch);
    setRolloverDialogOpen(true);
  };

  const handleRollover = async () => {
    if (!batchToRollover) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`/batches/${batchToRollover.id}/rollover`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess(`Semester rollover successful. Batch is now in semester ${batchToRollover.currentSemester + 1}`);
        fetchBatches();
      }
    } catch (err: any) {
      console.error('Error rolling over batch:', err);
      setError(err.response?.data?.message || 'Failed to rollover batch to next semester');
    } finally {
      setLoading(false);
      setRolloverDialogOpen(false);
      setBatchToRollover(null);
    }
  };

  const handleToggleArchive = async (batch: Batch) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(
        `/batches/${batch.id}/archive`, 
        { archived: !batch.archived },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        setSuccess(`Batch ${batch.archived ? 'unarchived' : 'archived'} successfully`);
        fetchBatches();
      }
    } catch (err: any) {
      console.error('Error archiving/unarchiving batch:', err);
      setError(err.response?.data?.message || 'Failed to update archive status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.name || !formData.academicYear || !formData.departmentId || formData.currentSemester === null) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate academicYear format
    if (!/^\d{4}-\d{4}$/.test(formData.academicYear)) {
      setError('Academic year must be in format YYYY-YYYY');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    const payload = {
      name: formData.name,
      academicYear: formData.academicYear,
      departmentId: formData.departmentId,
      currentSemester: formData.currentSemester,
      autoRollover: formData.autoRollover,
      archived: formData.archived,
    };
    
    try {
      if (isEditing && currentBatchId) {
        // Update existing batch
        const response = await axios.put(
          `/batches/${currentBatchId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setSuccess('Batch updated successfully');
          fetchBatches();
        }
      } else {
        // Create new batch
        const response = await axios.post(
          '/batches',
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setSuccess('Batch created successfully');
          fetchBatches();
        }
      }
      
      // Close dialog
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Error submitting batch:', err);
      setError(err.response?.data?.message || 'Failed to save batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDepartmentBatches = (departmentId: number) => {
    navigate(`/departments/${departmentId}/batches`);
  };

  const clearFilters = () => {
    setSelectedDepartment('');
    setSearchTerm('');
    setShowArchived(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Batch Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage academic batch years across departments and track semester progress
        </Typography>

        {/* Success message */}
        {success && (
          <Alert severity="success" sx={{ mt: 2, mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {/* Filter controls */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment === '' ? '' : selectedDepartment.toString()}
                label="Department"
                onChange={(e: React.ChangeEvent<{ value: unknown }>) => setSelectedDepartment(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id.toString()}>
                    {dept.code} - {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Search Batches"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter batch name or academic year"
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showArchived}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowArchived(e.target.checked)}
                />
              }
              label="Show Archived"
            />
          </Grid>
          
          <Grid item xs={6} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddBatch}
              startIcon={<AddIcon />}
            >
              Add Batch
            </Button>
          </Grid>
          
          {/* Clear filters button */}
          <Grid item xs={12}>
            <Button onClick={clearFilters} variant="outlined" size="small">
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {/* Batches table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="center">Academic Year</TableCell>
                <TableCell align="center">Current Semester</TableCell>
                <TableCell align="center">Students</TableCell>
                <TableCell align="center">Auto Rollover</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No batches found. Try adjusting your filters or create a new batch.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => (
                  <TableRow 
                    key={batch.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                      bgcolor: batch.archived ? 'rgba(0, 0, 0, 0.04)' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {batch.name}
                      </Typography>
                      {batch.archived && (
                        <Chip 
                          label="Archived" 
                          size="small" 
                          color="default" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${batch.department.code}`}
                        size="small"
                        color="primary"
                        onClick={() => handleViewDepartmentBatches(batch.department.id)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell align="center">{batch.academicYear}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`Semester ${batch.currentSemester}`} 
                        size="small" 
                        color="secondary" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      {batch._count?.students || 0}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={batch.autoRollover ? "Enabled" : "Disabled"} 
                        size="small" 
                        color={batch.autoRollover ? "success" : "default"} 
                      />
                    </TableCell>
                    <TableCell>
                      {!batch.archived && (
                        <Tooltip title="Semester Rollover">
                          <IconButton
                            color="primary"
                            onClick={() => handleRolloverClick(batch)}
                          >
                            <UpgradeIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditBatch(batch)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={batch.archived ? "Unarchive" : "Archive"}>
                        <IconButton
                          color={batch.archived ? "success" : "warning"}
                          onClick={() => handleToggleArchive(batch)}
                        >
                          {batch.archived ? <UnarchiveIcon /> : <ArchiveIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(batch)}
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
      </Paper>
      
      {/* Batch Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Batch' : 'Create New Batch'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={String(formData.departmentId)}
                    label="Department *"
                    onChange={(e: { target: { value: string } }) => handleFormChange('departmentId', e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={submitting}
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id.toString()}>
                        {dept.code} - {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Academic Year"
                  value={formData.academicYear}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('academicYear', e.target.value)}
                  disabled={submitting}
                  helperText="E.g., 2023-2024"
                  inputProps={{ pattern: "^\\d{4}-\\d{4}$" }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Batch Name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('name', e.target.value)}
                  disabled={submitting}
                  helperText="E.g., 2023 Batch CSE-A"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Current Semester"
                  type="number"
                  value={formData.currentSemester}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleFormChange('currentSemester', parseInt(e.target.value) || 1)}
                  disabled={submitting}
                  InputProps={{ inputProps: { min: 1, max: 8 } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.autoRollover}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleFormChange('autoRollover', e.target.checked)}
                      disabled={submitting}
                    />
                  }
                  label="Enable Auto Rollover"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.archived}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleFormChange('archived', e.target.checked)}
                      disabled={submitting}
                    />
                  }
                  label="Archived"
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
            Are you sure you want to delete the batch <strong>{batchToDelete?.name}</strong>?
            This action cannot be undone and will affect all students and subject mappings associated with this batch.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteBatch} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rollover Confirmation Dialog */}
      <Dialog open={rolloverDialogOpen} onClose={() => setRolloverDialogOpen(false)}>
        <DialogTitle>Confirm Semester Rollover</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to promote batch <strong>{batchToRollover?.name}</strong> to the next semester?
          </Typography>
          <Box sx={{ mt: 2, bgcolor: 'rgba(0, 0, 0, 0.04)', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Current semester: {batchToRollover?.currentSemester}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              New semester: {batchToRollover ? batchToRollover.currentSemester + 1 : ''}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action will update all students in this batch to the next semester.
            Subject mappings and academic tracking may also be updated.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRolloverDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRollover} color="primary" variant="contained">
            Confirm Rollover
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AllBatches; 
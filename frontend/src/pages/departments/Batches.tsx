import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FormControlLabel,
  Switch,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface Batch {
  id: number;
  name: string;
  year: number;
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
  year: number;
  currentSemester: number;
  autoRollover: boolean;
  archived: boolean;
}

const initialFormData: BatchFormData = {
  name: '',
  year: new Date().getFullYear(),
  currentSemester: 1,
  autoRollover: false,
  archived: false,
};

const Batches: React.FC = () => {
  const navigate = useNavigate();
  const { departmentId } = useParams<{ departmentId: string }>();
  const { token } = useAuth();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [department, setDepartment] = useState<{ id: number; name: string; code: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<BatchFormData>(initialFormData);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentBatchId, setCurrentBatchId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [rolloverDialogOpen, setRolloverDialogOpen] = useState<boolean>(false);
  const [batchToRollover, setBatchToRollover] = useState<Batch | null>(null);

  // Wrap fetchDepartment in useCallback
  const fetchDepartment = useCallback(async () => {
    try {
      const response = await axios.get(`/api/departments/${departmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDepartment(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching department:', err);
      setError('Failed to load department information');
    }
  }, [departmentId, token]);

  // Wrap fetchBatches in useCallback
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/batches', {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          departmentId,
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
  }, [departmentId, token, searchTerm, showArchived]);

  useEffect(() => {
    if (departmentId) {
      fetchDepartment();
      fetchBatches();
    }
  }, [departmentId, fetchDepartment, fetchBatches]);

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
    setFormData(initialFormData);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setFormData({
      name: batch.name,
      year: batch.year,
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
      const response = await axios.delete(`/api/batches/${batchToDelete.id}`, {
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
      const response = await axios.put(`/api/batches/${batchToRollover.id}/rollover`, {}, {
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
      const response = await axios.put(`/api/batches/${batch.id}/archive`, 
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
    if (!formData.name || !formData.year) {
      setError('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      if (isEditing && currentBatchId) {
        // Update existing batch
        const response = await axios.put(
          `/api/batches/${currentBatchId}`,
          {
            name: formData.name,
            year: formData.year,
            currentSemester: formData.currentSemester,
            autoRollover: formData.autoRollover,
            archived: formData.archived,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setSuccess('Batch updated successfully');
          fetchBatches();
        }
      } else {
        // Create new batch
        const response = await axios.post(
          '/api/batches',
          {
            name: formData.name,
            year: formData.year,
            departmentId: Number(departmentId),
            currentSemester: formData.currentSemester,
            autoRollover: formData.autoRollover,
            archived: formData.archived,
          },
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

  const handleBackToDepartments = () => {
    navigate('/departments');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink
            color="inherit"
            sx={{ cursor: 'pointer' }}
            onClick={handleBackToDepartments}
          >
            Departments
          </MuiLink>
          <Typography color="text.primary">Batches</Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" gutterBottom>
          {department ? `Batches - ${department.name} (${department.code})` : 'Batches'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage batch years and track semester progress
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="Search Batches"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showArchived}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowArchived(e.target.checked)}
                />
              }
              label="Show Archived"
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddBatch}
          >
            Add Batch
          </Button>
        </Box>
        
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
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Current Semester</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Auto Rollover</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={30} sx={{ my: 3 }} />
                  </TableCell>
                </TableRow>
              ) : batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No batches found. Add some batches to get started.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => (
                  <TableRow key={batch.id} sx={{ opacity: batch.archived ? 0.7 : 1 }}>
                    <TableCell>{batch.name}</TableCell>
                    <TableCell>{batch.year}</TableCell>
                    <TableCell>{batch.currentSemester}</TableCell>
                    <TableCell>{batch._count?.students || 0}</TableCell>
                    <TableCell>
                      <Chip 
                        label={batch.autoRollover ? "Enabled" : "Disabled"} 
                        color={batch.autoRollover ? "success" : "default"} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {batch.archived ? (
                        <Chip label="Archived" color="warning" size="small" />
                      ) : (
                        <Chip label="Active" color="success" size="small" />
                      )}
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
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Year"
                  type="number"
                  value={formData.year}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleFormChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                  disabled={submitting}
                  InputProps={{ inputProps: { min: 2000, max: 2100 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
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

export default Batches; 
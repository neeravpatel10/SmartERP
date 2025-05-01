import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Tooltip,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface FacultySubjectMapping {
  id: number;
  faculty: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
      id: number;
      name: string;
      code: string;
    };
  };
  subject: {
    id: number;
    name: string;
    code: string;
    semester: number;
    credits: number;
    isLab: boolean;
    category?: {
      id: number;
      name: string;
      code: string;
    };
  };
  section: string;
  semester: number;
  batch: {
    id: number;
    name: string;
    startYear: number;
    endYear: number;
  };
  academicYear: string;
  componentScope: string;
  isPrimary: boolean;
  active: boolean;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
}

interface FacultySubjectMappingTableProps {
  departmentId?: number;
  onMappingChange?: () => void;
  initialFilters?: {
    facultyId?: string;
    subjectId?: string;
    semester?: string;
    section?: string;
    academicYear?: string;
    componentScope?: string;
    active?: string;
    status?: string;
  };
}

const FacultySubjectMappingTable: React.FC<FacultySubjectMappingTableProps> = ({ 
  departmentId,
  onMappingChange,
  initialFilters = {}
}) => {
  const { token, user } = useAuth();
  const [mappings, setMappings] = useState<FacultySubjectMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    facultyId: initialFilters.facultyId || '',
    subjectId: initialFilters.subjectId || '',
    semester: initialFilters.semester || '',
    section: initialFilters.section || '',
    academicYear: initialFilters.academicYear || '',
    componentScope: initialFilters.componentScope || '',
    active: initialFilters.active || 'true',
    status: initialFilters.status || ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentMapping, setCurrentMapping] = useState<FacultySubjectMapping | null>(null);
  const [editData, setEditData] = useState({
    componentScope: '',
    isPrimary: false,
    active: true
  });
  
  // Add new states for approval dialog
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingApproval, setProcessingApproval] = useState(false);

  // Use initialFilters in useEffect
  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({
        ...prev,
        ...initialFilters
      }));
    }
  }, [initialFilters]);

  // Wrap fetchMappings in useCallback
  const fetchMappings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params
      const queryParams = new URLSearchParams();
      
      if (filters.facultyId) queryParams.append('facultyId', filters.facultyId);
      if (filters.subjectId) queryParams.append('subjectId', filters.subjectId);
      if (filters.semester) queryParams.append('semester', filters.semester);
      if (filters.section) queryParams.append('section', filters.section);
      if (filters.academicYear) queryParams.append('academicYear', filters.academicYear);
      if (filters.componentScope) queryParams.append('componentScope', filters.componentScope);
      if (filters.active) queryParams.append('active', filters.active);
      if (filters.status) queryParams.append('status', filters.status);
      if (departmentId) queryParams.append('departmentId', departmentId.toString());
      
      const response = await axios.get(`/api/subjects/faculty-mapping?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMappings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching faculty-subject mappings:', error);
    } finally {
      setLoading(false);
    }
  }, [token, departmentId, filters.facultyId, filters.subjectId, filters.semester, filters.section, filters.academicYear, filters.componentScope, filters.active, filters.status]);

  // Wrap fetchReferenceData in useCallback
  const fetchReferenceData = useCallback(async () => {
    try {
      // Fetch faculties
      const facultiesResponse = await axios.get('/api/faculty', {
        headers: { Authorization: `Bearer ${token}` },
        params: departmentId ? { departmentId } : {}
      });
      
      if (facultiesResponse.data.success) {
        setFaculties(facultiesResponse.data.data);
      }
      
      // Fetch subjects
      const subjectsResponse = await axios.get('/api/subjects', {
        headers: { Authorization: `Bearer ${token}` },
        params: departmentId ? { departmentId } : {}
      });
      
      if (subjectsResponse.data.success) {
        setSubjects(subjectsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  }, [token, departmentId]);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);
  
  // Load reference data on mount
  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  // Handle filter change
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Edit mapping
  const openEditDialog = (mapping: FacultySubjectMapping) => {
    setCurrentMapping(mapping);
    setEditData({
      componentScope: mapping.componentScope,
      isPrimary: mapping.isPrimary,
      active: mapping.active
    });
    setEditDialogOpen(true);
  };

  // Update mapping
  const updateMapping = async () => {
    if (!currentMapping) return;
    
    try {
      const response = await axios.put(`/api/subjects/faculty-mapping/${currentMapping.id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        fetchMappings();
        if (onMappingChange) onMappingChange();
      }
    } catch (error) {
      console.error('Error updating faculty-subject mapping:', error);
    } finally {
      setEditDialogOpen(false);
    }
  };

  // Deactivate mapping
  const deactivateMapping = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this mapping?')) return;
    
    try {
      const response = await axios.delete(`/api/subjects/faculty-mapping/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        fetchMappings();
        if (onMappingChange) onMappingChange();
      }
    } catch (error) {
      console.error('Error deactivating faculty-subject mapping:', error);
    }
  };

  // Add new function for handling approval actions
  const handleApproveReject = async (mappingId: number, action: 'approve' | 'reject') => {
    setCurrentMapping(mappings.find(m => m.id === mappingId) || null);
    setApprovalAction(action);
    setRejectionReason('');
    setApprovalDialogOpen(true);
  };

  const submitApprovalAction = async () => {
    if (!currentMapping) return;
    
    try {
      setProcessingApproval(true);
      
      const payload = {
        status: approvalAction,
        rejectionReason: approvalAction === 'reject' ? rejectionReason : undefined
      };
      
      const response = await axios.put(
        `/api/subjects/faculty-mapping/${currentMapping.id}/approval`, 
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        fetchMappings(); // Refresh the list
        if (onMappingChange) onMappingChange();
      }
      
      setApprovalDialogOpen(false);
    } catch (error) {
      console.error('Error processing approval action:', error);
    } finally {
      setProcessingApproval(false);
    }
  };

  // Determine if user can approve mappings (Super Admin or Dept Admin)
  const canApprove = user?.loginType === 1 || user?.loginType === 3;

  // Modify the filter section to include status filter
  const renderFilters = () => (
    <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
      {/* Existing filters */}
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Faculty</InputLabel>
          <Select
            value={filters.facultyId}
            label="Faculty"
            onChange={(e: React.ChangeEvent<{ value: unknown }>) => handleFilterChange('facultyId', e.target.value as string)}
          >
            <MenuItem value="">All Faculties</MenuItem>
            {faculties.map((faculty: any) => (
              <MenuItem key={faculty.id} value={faculty.id.toString()}>
                {faculty.firstName} {faculty.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Subject</InputLabel>
          <Select
            value={filters.subjectId}
            label="Subject"
            onChange={(e: React.ChangeEvent<{ value: unknown }>) => handleFilterChange('subjectId', e.target.value as string)}
          >
            <MenuItem value="">All Subjects</MenuItem>
            {subjects.map((subject: any) => (
              <MenuItem key={subject.id} value={subject.id.toString()}>
                {subject.code} - {subject.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Semester</InputLabel>
          <Select
            value={filters.semester}
            label="Semester"
            onChange={(e: React.ChangeEvent<{ value: unknown }>) => handleFilterChange('semester', e.target.value as string)}
          >
            <MenuItem value="">All Semesters</MenuItem>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <MenuItem key={sem} value={sem.toString()}>{sem}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          size="small"
          label="Section"
          value={filters.section}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('section', e.target.value)}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Component Scope</InputLabel>
          <Select
            value={filters.componentScope}
            label="Component Scope"
            onChange={(e: React.ChangeEvent<{ value: unknown }>) => handleFilterChange('componentScope', e.target.value as string)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="theory">Theory</MenuItem>
            <MenuItem value="lab">Lab</MenuItem>
            <MenuItem value="both">Both</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e: React.ChangeEvent<{ value: unknown }>) => handleFilterChange('status', e.target.value as string)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Active</InputLabel>
          <Select
            value={filters.active}
            label="Active"
            onChange={(e: React.ChangeEvent<{ value: unknown }>) => handleFilterChange('active', e.target.value as string)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <Button variant="contained" onClick={fetchMappings}>Apply Filters</Button>
        <Button 
          variant="outlined" 
          onClick={() => {
            setFilters({
              facultyId: '',
              subjectId: '',
              semester: '',
              section: '',
              academicYear: '',
              componentScope: '',
              active: 'true',
              status: ''
            });
          }}
          sx={{ ml: 1 }}
        >
          Clear Filters
        </Button>
      </Grid>
    </Grid>
  );

  return (
    <div>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>
      
      {showFilters && renderFilters()}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Faculty</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>Component</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Loading...</TableCell>
              </TableRow>
            ) : mappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No mappings found</TableCell>
              </TableRow>
            ) : (
              mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    {mapping.faculty.firstName} {mapping.faculty.lastName}
                  </TableCell>
                  <TableCell>
                    {mapping.subject.code} - {mapping.subject.name}
                  </TableCell>
                  <TableCell>{mapping.semester}</TableCell>
                  <TableCell>{mapping.section || 'All'}</TableCell>
                  <TableCell>{mapping.batch.name}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={mapping.componentScope.charAt(0).toUpperCase() + mapping.componentScope.slice(1)}
                      color={mapping.componentScope === 'theory' ? 'primary' : mapping.componentScope === 'lab' ? 'secondary' : 'default'}
                    />
                    {mapping.isPrimary && (
                      <Chip 
                        size="small" 
                        label="Primary" 
                        color="success" 
                        sx={{ ml: 0.5 }} 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={mapping.status.charAt(0).toUpperCase() + mapping.status.slice(1)}
                      color={
                        mapping.status === 'approved' ? 'success' : 
                        mapping.status === 'rejected' ? 'error' : 
                        'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(mapping)}
                      disabled={!mapping.active}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    {canApprove && mapping.status === 'pending' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApproveReject(mapping.id, 'approve')}
                          >
                            <CheckCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleApproveReject(mapping.id, 'reject')}
                          >
                            <CancelOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deactivateMapping(mapping.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Faculty-Subject Mapping</DialogTitle>
        <DialogContent>
          {currentMapping && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1">
                Faculty: {currentMapping.faculty.firstName} {currentMapping.faculty.lastName}
              </Typography>
              <Typography variant="subtitle1">
                Subject: {currentMapping.subject.code} - {currentMapping.subject.name}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Semester: {currentMapping.semester}, Section: {currentMapping.section || 'All'}
              </Typography>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Component Scope</InputLabel>
                <Select
                  value={editData.componentScope}
                  label="Component Scope"
                  onChange={(e: React.ChangeEvent<{ value: unknown }>) => setEditData({...editData, componentScope: e.target.value as string})}
                >
                  <MenuItem value="theory">Theory</MenuItem>
                  <MenuItem value="lab">Lab</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel 
                control={
                  <Switch 
                    checked={editData.isPrimary} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({...editData, isPrimary: e.target.checked})}
                  />
                } 
                label="Primary Faculty"
                sx={{ mt: 2, display: 'block' }}
              />
              
              <FormControlLabel 
                control={
                  <Switch 
                    checked={editData.active} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData({...editData, active: e.target.checked})}
                  />
                } 
                label="Active"
                sx={{ mt: 1, display: 'block' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={updateMapping} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)}>
        <DialogTitle>
          {approvalAction === 'approve' ? 'Approve' : 'Reject'} Faculty-Subject Mapping
        </DialogTitle>
        <DialogContent>
          {currentMapping && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Faculty:</strong> {currentMapping.faculty.firstName} {currentMapping.faculty.lastName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Subject:</strong> {currentMapping.subject.code} - {currentMapping.subject.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Semester:</strong> {currentMapping.semester}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Section:</strong> {currentMapping.section || 'All'}
              </Typography>
              
              {approvalAction === 'reject' && (
                <TextField
                  fullWidth
                  label="Rejection Reason"
                  value={rejectionReason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                  required
                  multiline
                  rows={3}
                  margin="normal"
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color={approvalAction === 'approve' ? 'success' : 'error'}
            onClick={submitApprovalAction}
            disabled={approvalAction === 'reject' && !rejectionReason}
          >
            {processingApproval ? <CircularProgress size={24} /> : (approvalAction === 'approve' ? 'Approve' : 'Reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FacultySubjectMappingTable; 
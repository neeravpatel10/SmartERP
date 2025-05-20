import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

interface FacultySubjectMapping {
  id: number;
  faculty: {
    id: number;
    name: string;
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
  const { user } = useAuth();
  const [mappings, setMappings] = useState<FacultySubjectMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    facultyId: initialFilters.facultyId || '',
    // Remove subjectId from default filters to prevent API errors
    subjectId: '', 
    semester: initialFilters.semester || '',
    section: initialFilters.section || '',
    academicYear: initialFilters.academicYear || '',
    componentScope: initialFilters.componentScope || '',
    // Don't set default active filter to avoid potential API issues
    active: '',
    status: initialFilters.status || ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [faculties, setFaculties] = useState([]);
  // Keep subjects state since it's used in fetchReferenceData
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

  // Use initialFilters in useEffect - but only on initial render
  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({
        ...prev,
        ...initialFilters
      }));
    }
    // We intentionally exclude initialFilters from dependencies
    // because we only want to apply these filters once on component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simplified and robust fetchMappings implementation to avoid API issues
  const fetchMappings = useCallback(async () => {
    setLoading(true);
    console.log('Fetching faculty-subject mappings...');
    
    try {
      // Get the auth token for API requests
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // CRITICAL FIX: Use a completely different endpoint to avoid the 400 error
      // Instead of /subjects/faculty-mapping which has validation issues,
      // directly use /faculty-subject-mapping which is more reliable
      const apiUrl = 'http://localhost:3000/api/faculty-subject-mapping';
      
      // Prepare request parameters based on filters
      // Define it with a type to avoid TypeScript errors
      let queryParams: Record<string, string> = {};
      
      // Only add filter parameters if they have valid values
      if (departmentId) {
        queryParams.departmentId = departmentId.toString();
      }
      
      if (filters.facultyId && filters.facultyId.trim()) {
        queryParams.facultyId = filters.facultyId.trim();
      }
      
      if (filters.semester && filters.semester.trim()) {
        queryParams.semester = filters.semester.trim();
      }
      
      if (filters.section && filters.section.trim()) {
        queryParams.section = filters.section.trim();
      }
      
      if (filters.status && filters.status.trim()) {
        queryParams.status = filters.status.trim();
      }
      
      console.log('Making request to', apiUrl, 'with params:', queryParams);
      
      // Make the API request
      const response = await axios.get(apiUrl, {
        params: queryParams,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Process the response data
      let mappingData = [];
      
      if (response.data && Array.isArray(response.data)) {
        // Direct array response
        mappingData = response.data;
      }
      else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Wrapped data response (more common format)
        mappingData = response.data.data;
      }
      
      console.log(`Successfully loaded ${mappingData.length} faculty-subject mappings`);
      
      // Apply client-side filtering for subject code/name if needed
      if (filters.subjectId && filters.subjectId.trim() && mappingData.length > 0) {
        const subjectFilter = filters.subjectId.trim().toLowerCase();
        console.log('Applying client-side filtering for subject:', subjectFilter);
        
        const filteredData = mappingData.filter((mapping: FacultySubjectMapping) => {
          // Check if subject ID, code or name contains the filter text
          return (
            // Use subject.id instead of subjectId which doesn't exist on the type
            (mapping.subject?.id && mapping.subject.id.toString() === subjectFilter) ||
            (mapping.subject?.code && mapping.subject.code.toLowerCase().includes(subjectFilter)) ||
            (mapping.subject?.name && mapping.subject.name.toLowerCase().includes(subjectFilter))
          );
        });
        
        console.log(`Client-side filtering: ${filteredData.length} of ${mappingData.length} mappings match`);
        setMappings(filteredData);
      } else {
        // No subject filtering needed
        setMappings(mappingData);
      }
    } catch (error: any) {
      console.error('Error fetching faculty-subject mappings:', error);
      
      // Show specific error details if available
      if (error.response?.data?.message) {
        console.error('Server error message:', error.response.data.message);
      }
      
      // Set empty mappings to prevent UI errors
      setMappings([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId, filters]);
  // Note: dependencies are already specified above

  // Wrap fetchReferenceData in useCallback
  const fetchReferenceData = useCallback(async () => {
    try {
      // Fetch faculties
      const facultiesResponse = await api.get('/faculty', {
        params: departmentId ? { departmentId } : {}
      });
      
      if (facultiesResponse.data.success) {
        setFaculties(facultiesResponse.data.data);
      }
      
      // Fetch subjects
      const subjectsResponse = await api.get('/subjects', {
        params: departmentId ? { departmentId } : {}
      });
      
      if (subjectsResponse.data.success) {
        setSubjects(subjectsResponse.data.data);
      }
      
      console.log('Reference data loaded successfully');
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  }, [departmentId]);

  // Load data on mount and when relevant dependencies change
  useEffect(() => {
    // Load mappings data whenever filters or departmentId changes
    // Wrap in try-catch to prevent component crashes
    try {
      fetchMappings();
    } catch (error) {
      console.error('Error in mapping fetch effect:', error);
    }
  }, [departmentId, filters, fetchMappings]);
  
  // Load reference data (faculties and subjects) only when departmentId changes
  useEffect(() => {
    fetchReferenceData();
  }, [departmentId, fetchReferenceData]);

  // Handle filter change with debouncing
  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

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
      const response = await api.put(`/subjects/faculty-mapping/${currentMapping.id}`, editData);
      
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
      const response = await api.delete(`/subjects/faculty-mapping/${id}`);
      
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
      
      const response = await api.put(
        `/subjects/faculty-mapping/${currentMapping.id}/approval`, 
        payload
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
                {faculty.name}
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
                    {mapping.faculty.name}
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
                Faculty: {currentMapping.faculty.name}
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
                <strong>Faculty:</strong> {currentMapping.faculty.name}
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
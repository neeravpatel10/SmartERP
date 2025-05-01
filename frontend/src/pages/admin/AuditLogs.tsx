import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  IconButton,
  Alert,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import MainLayout from '../../components/layout/MainLayout';
import CircularProgress from '@mui/material/CircularProgress';
import JsonViewer from '../../components/common/JsonViewer';

// Define UserRole type based on usage in getRoleName
type UserRole = number;

// Color type for chips
type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  ipAddress: string;
  userAgent: string;
  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  user: {
    username: string;
    email: string;
    role: UserRole;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FilterState {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  startDate: Date | null;
  endDate: Date | null;
}

const AuditLogs: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    userId: '',
    action: '',
    entityType: '',
    entityId: '',
    startDate: null,
    endDate: null
  });
  
  // Dialog state for JSON details
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Available entity types and actions for filtering
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  // Fetch audit logs from the backend
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      // Add filters to query params
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.entityType) queryParams.append('entityType', filters.entityType);
      if (filters.entityId) queryParams.append('entityId', filters.entityId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      
      const response: AxiosResponse<ApiResponse<AuditLog[]>> = await axios.get(`/api/audit-logs?${queryParams}`);
      
      if (response.data.success) {
        setLogs(response.data.data);
        setPagination(response.data.pagination || pagination);
        
        // Extract unique entity types and actions for filter dropdowns
        const types = [...new Set(response.data.data.map(log => log.entityType))];
        const actionTypes = [...new Set(response.data.data.map(log => log.action))];
        
        setEntityTypes(types);
        setActions(actionTypes);
      } else {
        setError(response.data.message || 'Failed to load audit logs');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
        const errorData = axiosError.response.data as Record<string, unknown>;
        setError(
          (errorData.message as string) || 
          'An error occurred while fetching audit logs'
        );
      } else {
        setError('An error occurred while fetching audit logs');
      }
      enqueueSnackbar('Failed to load audit logs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }));
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      page: 1,
      limit: parseInt(event.target.value, 10)
    }));
  };

  // Handle filter changes
  const handleFilterChange = <T extends keyof FilterState>(field: T, value: FilterState[T]) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle select changes
  const handleSelectChange = (field: keyof FilterState) => (event: any) => {
    handleFilterChange(field, event.target.value as FilterState[typeof field]);
  };

  // Apply filters
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      userId: '',
      action: '',
      entityType: '',
      entityId: '',
      startDate: null,
      endDate: null
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  // Export logs to Excel
  const exportLogs = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.entityType) queryParams.append('entityType', filters.entityType);
      if (filters.entityId) queryParams.append('entityId', filters.entityId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      
      // Make request to export endpoint
      window.location.href = `/api/audit-logs/export?${queryParams}`;
    } catch (err) {
      enqueueSnackbar('Failed to export audit logs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // View log details
  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  // Get role name from role number
  const getRoleName = (role: UserRole): string => {
    switch (role) {
      case 1: return 'Super Admin';
      case 2: return 'Faculty';
      case 3: return 'Department Admin';
      case -1: return 'Student';
      default: return 'Unknown';
    }
  };

  // Get action color
  const getActionColor = (action: string): ChipColor => {
    switch (action.toLowerCase()) {
      case 'create': return 'success';
      case 'update': return 'info';
      case 'delete': return 'error';
      default: return 'default';
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Audit Logs
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="entity-type-label">Entity Type</InputLabel>
                  <Select
                    labelId="entity-type-label"
                    value={filters.entityType}
                    label="Entity Type"
                    onChange={handleSelectChange('entityType')}
                  >
                    <MenuItem value="">All</MenuItem>
                    {entityTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="action-label">Action</InputLabel>
                  <Select
                    labelId="action-label"
                    value={filters.action}
                    label="Action"
                    onChange={handleSelectChange('action')}
                  >
                    <MenuItem value="">All</MenuItem>
                    {actions.map((action) => (
                      <MenuItem key={action} value={action}>
                        {action}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Entity ID"
                  value={filters.entityId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('entityId', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="User ID"
                  value={filters.userId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('userId', e.target.value)}
                />
              </Grid>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(date: Date | null) => handleFilterChange('startDate', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(date: Date | null) => handleFilterChange('endDate', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
              </LocalizationProvider>
              
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<SearchIcon />}
                  onClick={applyFilters}
                  disabled={loading}
                >
                  Filter
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={resetFilters}
                  disabled={loading}
                >
                  Reset
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="success"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportLogs}
                  disabled={loading}
                >
                  Export
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Logs Table */}
          <Paper>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Entity Type</TableCell>
                    <TableCell>Entity ID</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>
                          {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`${log.user.email} (${getRoleName(log.user.role)})`}>
                            <span>{log.user.username}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.action} 
                            color={getActionColor(log.action)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell>{log.entityId}</TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => viewDetails(log)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={pagination.total}
              rowsPerPage={pagination.limit}
              page={pagination.page - 1}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
        
        {/* JSON Viewer Dialog for log details */}
        {selectedLog && (
          <JsonViewer
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            title={`Audit Log #${selectedLog.id}`}
            data={{
              old: selectedLog.oldValue,
              new: selectedLog.newValue,
              metadata: {
                timestamp: format(new Date(selectedLog.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                user: selectedLog.user.username,
                email: selectedLog.user.email,
                role: getRoleName(selectedLog.user.role),
                action: selectedLog.action,
                entityType: selectedLog.entityType,
                entityId: selectedLog.entityId,
                ipAddress: selectedLog.ipAddress,
                userAgent: selectedLog.userAgent
              }
            }}
          />
        )}
      </Container>
    </MainLayout>
  );
};

export default AuditLogs; 
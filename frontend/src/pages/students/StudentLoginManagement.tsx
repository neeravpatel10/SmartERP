import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  IconButton,
  Box,
  CircularProgress,
  Snackbar,
  TablePagination
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import MainLayout from '../../components/layouts/MainLayout';
import { api } from '../../services/api';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Batch {
  id: string;
  name: string;
  academicYear: string;
}

interface Student {
  id: number;
  usn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  departmentId: number;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  batchId: string;
  batch?: {
    id: string;
    name: string;
    academicYear: string;
  };
  semester: number;
  section?: string;
  admissionYear: number;
}

interface LoginCreationResult {
  usn: string;
  userId: string;
  username: string;
  defaultPassword: string;
}

interface FailedLoginCreation {
  usn: string;
  reason: string;
}

interface LoginCreationResults {
  success: LoginCreationResult[];
  failed: FailedLoginCreation[];
}

const StudentLoginManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [creationResults, setCreationResults] = useState<LoginCreationResults | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load departments and batches when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [deptResponse, batchResponse] = await Promise.all([
          api.get('/departments'),
          api.get('/batches')
        ]);
        
        setDepartments(deptResponse.data.data || []);
        setBatches(batchResponse.data.data || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setErrorMessage('Failed to load departments and batches');
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch students without logins
  const fetchStudents = async () => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      let url = '/students/management/without-logins';
      let params = new URLSearchParams();
      
      if (departmentFilter) {
        params.append('departmentId', departmentFilter);
      }
      
      if (batchFilter) {
        params.append('batchId', batchFilter);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      setStudents(response.data.data.students || []);
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error fetching students without logins:', error);
      setErrorMessage('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handle filter changes
  const handleDepartmentChange = (event: SelectChangeEvent) => {
    setDepartmentFilter(event.target.value);
  };

  const handleBatchChange = (event: SelectChangeEvent) => {
    setBatchFilter(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      fetchStudents();
    }
  };

  const clearFilters = () => {
    setDepartmentFilter('');
    setBatchFilter('');
    setSearchQuery('');
  };

  // Selection handling
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedStudents(students.map(student => student.usn));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (usn: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(usn)) {
        return prev.filter(id => id !== usn);
      } else {
        return [...prev, usn];
      }
    });
  };

  // Create logins for selected students
  const handleCreateLogins = async () => {
    if (selectedStudents.length === 0) {
      setErrorMessage('Please select at least one student');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/students/create-multiple-logins', {
        studentIds: selectedStudents
      });
      
      setCreationResults(response.data.data);
      setResultDialogOpen(true);
      
      // Refresh the list after creating logins
      fetchStudents();
    } catch (error) {
      console.error('Error creating logins:', error);
      setErrorMessage('Failed to create student logins');
    } finally {
      setLoading(false);
    }
  };

  // Create login for a single student
  const handleCreateSingleLogin = async (usn: string) => {
    setLoading(true);
    
    try {
      await api.post(`/students/${usn}/create-login`);
      setSuccessMessage(`Login created for ${usn} - Initial password is the USN. Student will be prompted to change it on first login.`);
      
      // Refresh the list after creating login
      fetchStudents();
    } catch (error) {
      console.error('Error creating login:', error);
      setErrorMessage(`Failed to create login for ${usn}`);
    } finally {
      setLoading(false);
    }
  };

  // Copy password to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copied to clipboard');
  };

  // Pagination handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const displayedStudents = students.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Student Login Management
          </Typography>
          
          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id="department-filter-label">Department</InputLabel>
                <Select
                  labelId="department-filter-label"
                  value={departmentFilter}
                  label="Department"
                  onChange={handleDepartmentChange}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id="batch-filter-label">Batch</InputLabel>
                <Select
                  labelId="batch-filter-label"
                  value={batchFilter}
                  label="Batch"
                  onChange={handleBatchChange}
                >
                  <MenuItem value="">All Batches</MenuItem>
                  {batches.map((batch) => (
                    <MenuItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.academicYear})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Search by USN, Name, or Email"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => fetchStudents()}>
                      <SearchIcon />
                    </IconButton>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                onClick={fetchStudents}
                startIcon={<RefreshIcon />}
              >
                Refresh
              </Button>
              
              <Button
                variant="outlined"
                onClick={clearFilters}
                startIcon={<ClearIcon />}
              >
                Clear
              </Button>
            </Grid>
          </Grid>

          {/* Selected count and actions */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>
              {selectedStudents.length > 0 ? (
                <Chip 
                  label={`${selectedStudents.length} students selected`}
                  color="primary"
                />
              ) : (
                'No students selected'
              )}
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              disabled={selectedStudents.length === 0 || loading}
              onClick={handleCreateLogins}
              startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
            >
              Create Logins for Selected Students
            </Button>
          </Box>

          {/* Error message */}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {/* Student table */}
          <TableContainer component={Paper} sx={{ maxHeight: '500px', overflowY: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={students.length > 0 && selectedStudents.length === students.length}
                      indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>USN</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No students found without logins
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedStudents.map((student) => (
                    <TableRow key={student.usn}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedStudents.includes(student.usn)}
                          onChange={() => handleSelectStudent(student.usn)}
                        />
                      </TableCell>
                      <TableCell>{student.usn}</TableCell>
                      <TableCell>
                        {student.firstName} {student.middleName || ''} {student.lastName}
                      </TableCell>
                      <TableCell>{student.email || 'N/A'}</TableCell>
                      <TableCell>{student.department?.name || 'N/A'}</TableCell>
                      <TableCell>{student.batch?.name || 'N/A'}</TableCell>
                      <TableCell>{student.semester}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCreateSingleLogin(student.usn)}
                          startIcon={<PersonAddIcon />}
                        >
                          Create Login
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={students.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Container>

      {/* Results Dialog */}
      <Dialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Login Creation Results</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Successfully created {creationResults?.success.length || 0} logins.
            Failed to create {creationResults?.failed.length || 0} logins.
          </DialogContentText>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> The student's USN is used as the initial password. Students will be required to change their password upon first login.
            </Typography>
          </Alert>

          {creationResults?.success.length ? (
            <>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Successful Logins
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>USN</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Default Password</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {creationResults.success.map((result) => (
                      <TableRow key={result.usn}>
                        <TableCell>{result.usn}</TableCell>
                        <TableCell>{result.username}</TableCell>
                        <TableCell>{result.defaultPassword}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(result.defaultPassword)}
                            title="Copy password"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : null}

          {creationResults?.failed.length ? (
            <>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Failed Logins
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>USN</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {creationResults.failed.map((result) => (
                      <TableRow key={result.usn}>
                        <TableCell>{result.usn}</TableCell>
                        <TableCell>{result.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Success message snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
        action={
          <IconButton size="small" color="inherit" onClick={() => setSuccessMessage(null)}>
            <ClearIcon fontSize="small" />
          </IconButton>
        }
      />
    </MainLayout>
  );
};

export default StudentLoginManagement; 
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchStudents,
  deleteStudent,
  resetSuccess,
  selectStudents,
  selectStudentsTotalItems,
  downloadTemplate,
  bulkUploadStudents
} from '../../store/slices/studentsSlice';
import { AppDispatch, RootState } from '../../store';
import { 
  Box, 
  Button, 
  Container, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid, 
  IconButton, 
  Paper, 
  Stack, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TablePagination, 
  TableRow, 
  TextField, 
  Typography,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  CloudDownload as DownloadIcon
} from '@mui/icons-material';
import BreadcrumbsComponent from '../../components/BreadcrumbsComponent';

interface Student {
  usn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  semester: number;
  section: string;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  batch?: {
    id: string;
    name: string;
    academicYear: string;
  };
  departmentId: number;
  batchId: string;
}

const StudentsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const students = useSelector(selectStudents) as Student[];
  const totalItems = useSelector(selectStudentsTotalItems);
  const loading = useSelector((state: RootState) => state.students.loading);
  const error = useSelector((state: RootState) => state.students.error);
  const success = useSelector((state: RootState) => state.students.success);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchStudents({ page, limit: rowsPerPage, search: searchQuery }));
  }, [dispatch, page, rowsPerPage, searchQuery]);

  useEffect(() => {
    if (success) {
      if (uploadSuccess) {
        setAlertMessage(`Successfully uploaded ${uploadCount} students`);
      } else {
        setAlertMessage('Operation completed successfully');
      }
      
      setTimeout(() => {
        setAlertMessage(null);
        setUploadSuccess(false);
        setUploadCount(0);
        dispatch(resetSuccess());
      }, 3000);
    }
  }, [success, dispatch, uploadSuccess, uploadCount]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    dispatch(fetchStudents({ page: 0, limit: rowsPerPage, search: searchQuery }));
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddStudent = () => {
    navigate('/students/add');
  };

  const handleEditStudent = (usn: string) => {
    navigate(`/students/edit/${usn}`);
  };

  const handleDeleteConfirmation = (usn: string) => {
    setStudentToDelete(usn);
    setOpenDeleteDialog(true);
  };

  const handleDeleteStudent = () => {
    if (studentToDelete) {
      dispatch(deleteStudent(studentToDelete));
      setOpenDeleteDialog(false);
      setStudentToDelete(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setStudentToDelete(null);
  };

  const handleBulkUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      dispatch(bulkUploadStudents(formData))
        .unwrap()
        .then((result) => {
          setUploadSuccess(true);
          
          if (result && typeof result === 'object') {
            const count = result.count || 
                         (result.data && result.data.count) || 
                         (typeof result.students === 'number' ? result.students : 0) ||
                         0;
            setUploadCount(count);
          }
          
          dispatch(fetchStudents({ page, limit: rowsPerPage, search: searchQuery }));
          
          setAlertMessage(`Successfully uploaded ${uploadCount} students`);
          setTimeout(() => setAlertMessage(null), 5000);
        })
        .catch((error) => {
          console.error('Error uploading students:', error);
          setAlertMessage(error.message || 'Failed to upload students');
        })
        .finally(() => {
          setIsUploading(false);
        });
      
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    dispatch(downloadTemplate());
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <BreadcrumbsComponent
        currentPage="Students"
        links={[{ name: 'Dashboard', path: '/dashboard' }]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary">
                Students List
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                >
                  Template
                </Button>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={handleBulkUpload}
                  disabled={isUploading}
                >
                  {isUploading ? <CircularProgress size={24} color="inherit" /> : 'Bulk Upload'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddStudent}
                >
                  Add Student
                </Button>
              </Stack>
            </Box>

            {alertMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {alertMessage}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={11}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search by USN, Name, Email or Phone"
                    variant="outlined"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  />
                </Grid>
                <Grid item xs={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ height: '40px' }}
                  >
                    <SearchIcon />
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>USN</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>Semester</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow
                        key={student.usn}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/students/${student.usn}`)}
                      >
                        <TableCell>{student.usn}</TableCell>
                        <TableCell>
                          {`${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim()}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone || 'N/A'}</TableCell>
                        <TableCell>{student.department?.name || student.departmentId}</TableCell>
                        <TableCell>{student.batch?.name || student.batchId}</TableCell>
                        <TableCell>{student.semester}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { 
                              e.stopPropagation(); 
                              handleEditStudent(student.usn); 
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { 
                              e.stopPropagation(); 
                              handleDeleteConfirmation(student.usn); 
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalItems || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Student</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this student? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteStudent} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={!!alertMessage}
        autoHideDuration={6000}
        onClose={() => setAlertMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlertMessage(null)} 
          severity={alertMessage && alertMessage.includes('Success') ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
      />
    </Container>
  );
};

export default StudentsList; 
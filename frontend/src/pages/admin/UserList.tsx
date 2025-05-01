import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle
} from '@mui/material';
import { Link } from 'react-router-dom';
import { resetError } from '../../store/slices/usersSlice';
import { RootState, AppDispatch } from '../../store';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import { getUsers, deleteUser, resetSuccess } from '../../store/admin/usersSlice';

const UserList: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  const { users, loading, error, success } = useSelector((state: RootState) => state.adminUsers);
  
  useEffect(() => {
    dispatch(resetError());
    dispatch(getUsers({ page: 1, limit: rowsPerPage }));
    
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [dispatch, rowsPerPage]);
  
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        dispatch(resetSuccess());
      }, 3000);
    }
  }, [success, dispatch]);
  
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    
    const timeout = setTimeout(() => {
      setPage(0);
      dispatch(getUsers({ page: 1, limit: rowsPerPage, search: query }));
    }, 500);
    
    setSearchTimeout(timeout);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };
  
  const handleDeleteUser = () => {
    if (userToDelete) {
      dispatch(deleteUser(userToDelete));
      handleCloseDeleteDialog();
    }
  };
  
  const getRoleName = (role: number): string => {
    switch (role) {
      case 1:
        return 'Super Admin';
      case 2:
        return 'Faculty';
      case 3:
        return 'Department Admin';
      case -1:
        return 'Student';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
          
          <Button
            component={Link}
            to="/admin/users/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add User
          </Button>
        </Box>
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            User successfully deleted
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              label="Search Users"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users && users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleName(user.role)}</TableCell>
                          <TableCell>
                            {user.lastLogin
                              ? format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm')
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            {user.locked ? (
                              <Chip
                                label="Locked"
                                color="error"
                                size="small"
                              />
                            ) : (
                              <Chip
                                label="Active"
                                color="success"
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              component={Link}
                              to={`/admin/users/${user.id}/edit`}
                              size="small"
                              color="primary"
                              title="Edit User"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            
                            {user.locked && (
                              <IconButton
                                component={Link}
                                to="/admin/unlock-account"
                                size="small"
                                color="warning"
                                title="Unlock Account"
                              >
                                <LockIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={users ? users.length : 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </Box>
      
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserList; 
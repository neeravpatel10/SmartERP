import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Box,
  Button,
  Container,
  IconButton,
  Paper,
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
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface Faculty {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department?: {
    id: number;
    name: string;
  };
  designation: string;
}

interface FacultyListResponse {
  success: boolean;
  data: {
    faculty: Faculty[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

const FacultyList: React.FC = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await api.get<FacultyListResponse>('/api/faculty', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchQuery
        }
      });

      if (response.data.success) {
        setFaculty(response.data.data.faculty);
        setTotalItems(response.data.data.pagination.total);
      } else {
        setError(response.data.message || 'Failed to fetch faculty data');
      }
    } catch (err) {
      console.error('Error fetching faculty:', err);
      setError('Failed to load faculty data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [page, rowsPerPage, searchQuery]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleAddFaculty = () => {
    navigate('/faculty/add');
  };

  const handleEditFaculty = (id: number) => {
    navigate(`/faculty/edit/${id}`);
  };

  const handleDeleteFaculty = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        const response = await api.delete(`/api/faculty/${id}`);
        if (response.data.success) {
          fetchFaculty(); // Refresh the list
        } else {
          setError(response.data.message || 'Failed to delete faculty');
        }
      } catch (err) {
        console.error('Error deleting faculty:', err);
        setError('Failed to delete faculty');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Faculty Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddFaculty}
        >
          Add Faculty
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            label="Search Faculty"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearch}
            sx={{ mb: 2 }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : faculty.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No faculty members found
                  </TableCell>
                </TableRow>
              ) : (
                faculty.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.department?.name || 'N/A'}</TableCell>
                    <TableCell>{member.designation}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditFaculty(member.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteFaculty(member.id)}
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
          count={totalItems}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default FacultyList; 
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  Grid,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchStudentById, resetError, clearCurrentStudent } from '../../store/slices/studentsSlice';
import { RootState, AppDispatch } from '../../store';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Department {
  id: number;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  departmentId: number;
}

const StudentDetail: React.FC = () => {
  const { usn } = useParams<{ usn: string }>();
  const navigate = useNavigate();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { currentStudent, loading, error } = useSelector((state: RootState) => state.students);
  
  useEffect(() => {
    if (usn) {
      dispatch(resetError());
      dispatch(fetchStudentById(usn));
    }
    
    return () => {
      dispatch(clearCurrentStudent());
    };
  }, [dispatch, usn]);
  
  useEffect(() => {
    if (currentStudent) {
      // Fetch additional details (department and batch)
      fetchAdditionalDetails();
    }
  }, [currentStudent]);
  
  const fetchAdditionalDetails = async () => {
    if (!currentStudent) return;
    
    setLoadingDetails(true);
    try {
      // Fetch department
      if (currentStudent.departmentId) {
        const deptResponse = await axios.get(`/api/departments/${currentStudent.departmentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setDepartment(deptResponse.data);
      }
      
      // Fetch batch
      if (currentStudent.batchId) {
        const batchResponse = await axios.get(`/api/batches/${currentStudent.batchId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setBatch(batchResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch additional details', error);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/students')}
            sx={{ mt: 2 }}
          >
            Back to Students
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!currentStudent) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning">
            Student not found
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/students')}
            sx={{ mt: 2 }}
          >
            Back to Students
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            component={Link}
            to="/students"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2 }}
          >
            Back to Students
          </Button>
          
          <Button
            component={Link}
            to={`/students/${currentStudent.usn}/edit`}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Edit Student
          </Button>
        </Box>
        
        <Typography variant="h4" component="h1" gutterBottom>
          {currentStudent.name}
        </Typography>
        
        <Chip
          label={`Semester ${currentStudent.semester}`}
          color="primary"
          sx={{ mb: 3 }}
        />
        
        <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ width: 120 }}>
                      USN:
                    </Typography>
                    <Typography variant="body2">
                      {currentStudent.usn}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ width: 100 }}>
                      Email:
                    </Typography>
                    <Typography variant="body2">
                      {currentStudent.email}
                    </Typography>
                  </Box>
                  
                  {currentStudent.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ width: 100 }}>
                        Phone:
                      </Typography>
                      <Typography variant="body2">
                        {currentStudent.phone}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Academic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <SchoolIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ width: 100 }}>
                      Department:
                    </Typography>
                    <Typography variant="body2">
                      {department ? department.name : loadingDetails ? 'Loading...' : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <ClassIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ width: 100 }}>
                      Batch:
                    </Typography>
                    <Typography variant="body2">
                      {batch ? batch.name : loadingDetails ? 'Loading...' : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ width: 120 }}>
                      Semester:
                    </Typography>
                    <Typography variant="body2">
                      {currentStudent.semester}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item>
                <Button
                  component={Link}
                  to={`/attendance/student/${currentStudent.usn}`}
                  variant="outlined"
                >
                  View Attendance
                </Button>
              </Grid>
              
              <Grid item>
                <Button
                  component={Link}
                  to={`/results/student/${currentStudent.usn}`}
                  variant="outlined"
                >
                  View Results
                </Button>
              </Grid>
              
              <Grid item>
                <Button
                  component={Link}
                  to={`/profile/${currentStudent.usn}`}
                  variant="outlined"
                >
                  View Profile
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default StudentDetail; 
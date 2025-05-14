import React, { useEffect, useState, useCallback } from 'react';
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
  CardContent,
  IconButton
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

interface EntranceExam {
  kcetRank?: string;
  comedkRank?: string;
  jeeRank?: string;
}

interface Department {
  id: number;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  departmentId: number;
}

interface Student {
  usn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  semester: number;
  section: string;
  departmentId: number;
  batchId: string;
  addresses?: Array<{
    type: string;
    houseName?: string;
    village?: string;
    district?: string;
    state?: string;
    pincode?: string;
  }>;
  guardians?: Array<{
    type: string;
    name?: string;
    contact?: string;
    aadhar?: string;
    panCard?: string;
    occupation?: string;
  }>;
  sslcDetails?: {
    school?: string;
    boardUniversity?: string;
    regNo?: string;
    year?: string;
    maxMarks?: string;
    obtainedMarks?: string;
    percentage?: string;
  };
  pucDetails?: {
    school?: string;
    boardUniversity?: string;
    regNo?: string;
    year?: string;
    maxMarks?: string;
    obtainedMarks?: string;
    percentage?: string;
    physicsObtained?: string;
    physicsMax?: string;
    chemObtained?: string;
    chemMax?: string;
    mathsObtained?: string;
    mathsMax?: string;
    englishObtained?: string;
    englishMax?: string;
    electiveObtained?: string;
    electiveMax?: string;
  };
  entranceExams?: EntranceExam;
}

const StudentDetail: React.FC = () => {
  const { usn } = useParams<{ usn: string }>();
  const navigate = useNavigate();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { currentStudent, loading, error } = useSelector((state: RootState) => state.students);
  
  let entranceExams: EntranceExam = { kcetRank: '', comedkRank: '', jeeRank: '' };
  if (currentStudent && Array.isArray((currentStudent as any).entranceExams) && (currentStudent as any).entranceExams.length > 0) {
    entranceExams = (currentStudent as any).entranceExams[0];
  } else if (currentStudent && (currentStudent as any).entranceExams && typeof (currentStudent as any).entranceExams === 'object') {
    entranceExams = (currentStudent as any).entranceExams;
  }
  
  const fetchAdditionalDetails = useCallback(async () => {
    if (!currentStudent) return;
    
    setLoadingDetails(true);
    try {
      // Fetch department
      if (currentStudent.departmentId) {
        const deptResponse = await axios.get(`/departments/${currentStudent.departmentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setDepartment(deptResponse.data);
      }
      
      // Fetch batch
      if (currentStudent.batchId) {
        const batchResponse = await axios.get(`/batches/${currentStudent.batchId}`, {
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
  }, [currentStudent]);
  
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
      fetchAdditionalDetails();
    }
  }, [currentStudent, fetchAdditionalDetails]);
  
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
  
  const student = currentStudent as Student;
  
  // Filter valid guardians (no 'NULL' or empty names, deduplicate by type)
  const validGuardians = (student.guardians || []).filter(
    (g, idx, arr) =>
      g.name && g.name.toLowerCase() !== 'null' &&
      arr.findIndex(x => x.type === g.type) === idx
  );

  // Filter valid addresses (no 'NULL' or empty houseName, deduplicate by type)
  const validAddresses = (student.addresses || []).filter(
    (a, idx, arr) =>
      a.houseName && a.houseName.toLowerCase() !== 'null' &&
      arr.findIndex(x => x.type === a.type) === idx
  );
  
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <IconButton
          onClick={() => navigate('/students')}
          sx={{ mb: 2 }}
          color="primary"
          aria-label="Back to Students List"
        >
          <ArrowBackIcon />
        </IconButton>
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
            to={`/students/${student.usn}/edit`}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Edit Student
          </Button>
        </Box>
        
        <Typography variant="h4" component="h1" gutterBottom>
          {`${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim()}
        </Typography>
        
        <Chip
          label={`Semester ${student.semester}`}
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
                      {student.usn}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ width: 100 }}>
                      Email:
                    </Typography>
                    <Typography variant="body2">
                      {student.email}
                    </Typography>
                  </Box>
                  
                  {student.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ width: 100 }}>
                        Phone:
                      </Typography>
                      <Typography variant="body2">
                        {student.phone}
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
                      {student.semester}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Addresses Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Addresses</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {validAddresses.map((addr, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {addr.type.charAt(0).toUpperCase() + addr.type.slice(1)} Address
                    </Typography>
                    <Typography variant="body2">House Name: {addr.houseName || 'N/A'}</Typography>
                    <Typography variant="body2">Village/City: {addr.village || 'N/A'}</Typography>
                    <Typography variant="body2">District: {addr.district || 'N/A'}</Typography>
                    <Typography variant="body2">State: {addr.state || 'N/A'}</Typography>
                    <Typography variant="body2">Pincode: {addr.pincode || 'N/A'}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Guardians/Parents Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Family Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {validGuardians.map((g, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {g.type.charAt(0).toUpperCase() + g.type.slice(1)}'s Details
                    </Typography>
                    <Typography variant="body2">Name: {g.name || 'N/A'}</Typography>
                    <Typography variant="body2">Contact: {g.contact || 'N/A'}</Typography>
                    <Typography variant="body2">Aadhar: {g.aadhar || 'N/A'}</Typography>
                    <Typography variant="body2">PAN Card: {g.panCard || 'N/A'}</Typography>
                    <Typography variant="body2">Occupation: {g.occupation || 'N/A'}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Previous Education Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Previous Education</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {student.sslcDetails && (
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>SSLC Details</Typography>
                    <Typography variant="body2">School: {student.sslcDetails.school || 'N/A'}</Typography>
                    <Typography variant="body2">Board/University: {student.sslcDetails.boardUniversity || 'N/A'}</Typography>
                    <Typography variant="body2">Reg No: {student.sslcDetails.regNo || 'N/A'}</Typography>
                    <Typography variant="body2">Year: {student.sslcDetails.year || 'N/A'}</Typography>
                    <Typography variant="body2">Max Marks: {student.sslcDetails.maxMarks || 'N/A'}</Typography>
                    <Typography variant="body2">Obtained Marks: {student.sslcDetails.obtainedMarks || 'N/A'}</Typography>
                    <Typography variant="body2">Percentage: {student.sslcDetails.percentage || 'N/A'}</Typography>
                  </Paper>
                </Grid>
              )}
              {student.pucDetails && (
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>PUC Details</Typography>
                    <Typography variant="body2">School: {student.pucDetails.school || 'N/A'}</Typography>
                    <Typography variant="body2">Board/University: {student.pucDetails.boardUniversity || 'N/A'}</Typography>
                    <Typography variant="body2">Reg No: {student.pucDetails.regNo || 'N/A'}</Typography>
                    <Typography variant="body2">Year: {student.pucDetails.year || 'N/A'}</Typography>
                    <Typography variant="body2">Max Marks: {student.pucDetails.maxMarks || 'N/A'}</Typography>
                    <Typography variant="body2">Obtained Marks: {student.pucDetails.obtainedMarks || 'N/A'}</Typography>
                    <Typography variant="body2">Percentage: {student.pucDetails.percentage || 'N/A'}</Typography>
                    <Typography variant="body2">Physics: {student.pucDetails.physicsObtained || 'N/A'} / {student.pucDetails.physicsMax || 'N/A'}</Typography>
                    <Typography variant="body2">Chemistry: {student.pucDetails.chemObtained || 'N/A'} / {student.pucDetails.chemMax || 'N/A'}</Typography>
                    <Typography variant="body2">Maths: {student.pucDetails.mathsObtained || 'N/A'} / {student.pucDetails.mathsMax || 'N/A'}</Typography>
                    <Typography variant="body2">English: {student.pucDetails.englishObtained || 'N/A'} / {student.pucDetails.englishMax || 'N/A'}</Typography>
                    <Typography variant="body2">Elective: {student.pucDetails.electiveObtained || 'N/A'} / {student.pucDetails.electiveMax || 'N/A'}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Entrance Exam Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Entrance Exam Details</Typography>
            <Divider sx={{ mb: 2 }} />
            {(entranceExams && (entranceExams.kcetRank || entranceExams.comedkRank || entranceExams.jeeRank)) && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2">KCET Rank: {entranceExams.kcetRank || 'N/A'}</Typography>
                <Typography variant="body2">COMEDK Rank: {entranceExams.comedkRank || 'N/A'}</Typography>
                <Typography variant="body2">JEE Rank: {entranceExams.jeeRank || 'N/A'}</Typography>
              </Paper>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default StudentDetail; 
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
  CircularProgress
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
        try {
          // Ensure departmentId is properly formatted
          const departmentId = Number(currentStudent.departmentId);
          if (!isNaN(departmentId)) {
            // Use explicit axios instance with full URL and no additional headers
            // This avoids potential issues with interceptors
            const response = await axios({
              method: 'GET',
              baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
              url: `/departments/${departmentId}`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (response?.data?.data) {
              setDepartment(response.data.data);
            }
          }
        } catch (deptError) {
          console.error('Failed to fetch department details:', deptError);
        }
      }
      
      // Fetch batch
      if (currentStudent.batchId) {
        try {
          // Ensure batchId is properly formatted
          const batchIdString = String(currentStudent.batchId).trim();
          if (batchIdString) {
            // Use explicit axios instance with full URL and no additional headers
            const response = await axios({
              method: 'GET',
              baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
              url: `/batches/${batchIdString}`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (response?.data?.data) {
              setBatch(response.data.data);
            }
          }
        } catch (batchError) {
          console.error('Failed to fetch batch details:', batchError);
          // Continue execution even if batch fetch fails
        }
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
      <Box sx={{ mt: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            component={Link}
            to="/students"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            color="primary"
            size="small"
          >
            BACK TO STUDENTS
          </Button>
          
          <Button
            component={Link}
            to={`/students/${student.usn}/edit`}
            variant="contained"
            startIcon={<EditIcon />}
            color="primary"
            size="small"
          >
            EDIT STUDENT
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="500">
            {`${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim()}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`USN: ${student.usn}`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`Semester ${student.semester}`}
              color="primary"
              size="small"
            />
            {student.section && (
              <Chip
                label={`Section ${student.section}`}
                color="secondary"
                size="small"
              />
            )}
          </Box>
        </Box>
        
        <Paper elevation={3} sx={{ p: 0, mt: 2, overflow: 'hidden', borderRadius: 2 }}>
          <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" fontWeight="500" color="primary">
              Student Information
            </Typography>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="500" color="primary.dark" gutterBottom>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Box sx={{ minWidth: 35, display: 'flex', justifyContent: 'center' }}>
                      <SchoolIcon fontSize="small" color="primary" />
                    </Box>
                    <Typography variant="subtitle2" sx={{ width: 80, color: 'text.secondary' }}>
                      USN:
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {student.usn}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Box sx={{ minWidth: 35, display: 'flex', justifyContent: 'center' }}>
                      <EmailIcon fontSize="small" color="primary" />
                    </Box>
                    <Typography variant="subtitle2" sx={{ width: 80, color: 'text.secondary' }}>
                      Email:
                    </Typography>
                    <Typography variant="body2">
                      {student.email}
                    </Typography>
                  </Box>
                  
                  {student.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                      <Box sx={{ minWidth: 35, display: 'flex', justifyContent: 'center' }}>
                        <PhoneIcon fontSize="small" color="primary" />
                      </Box>
                      <Typography variant="subtitle2" sx={{ width: 80, color: 'text.secondary' }}>
                        Phone:
                      </Typography>
                      <Typography variant="body2">
                        {student.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="500" color="primary.dark" gutterBottom>
                    Academic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Box sx={{ minWidth: 35, display: 'flex', justifyContent: 'center' }}>
                      <SchoolIcon fontSize="small" color="primary" />
                    </Box>
                    <Typography variant="subtitle2" sx={{ width: 100, color: 'text.secondary' }}>
                      Department:
                    </Typography>
                    <Typography variant="body2" fontWeight={department ? '500' : '400'}>
                      {department ? department.name : loadingDetails ? 'Loading...' : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Box sx={{ minWidth: 35, display: 'flex', justifyContent: 'center' }}>
                      <ClassIcon fontSize="small" color="primary" />
                    </Box>
                    <Typography variant="subtitle2" sx={{ width: 100, color: 'text.secondary' }}>
                      Batch:
                    </Typography>
                    <Typography variant="body2">
                      {batch ? batch.name : loadingDetails ? 'Loading...' : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Box sx={{ minWidth: 35, display: 'flex', justifyContent: 'center' }}>
                      <i className="fas fa-graduation-cap" style={{ fontSize: '16px', color: '#1976d2' }}></i>
                    </Box>
                    <Typography variant="subtitle2" sx={{ width: 100, color: 'text.secondary' }}>
                      Semester:
                    </Typography>
                    <Typography variant="body2">
                      {student.semester}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          
          {/* Addresses Section */}
          <Box sx={{ mt: 4, mx: 3 }}>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: '4px 4px 0 0', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="500" color="primary.dark">Addresses</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '0 0 4px 4px' }}>
              <Grid container spacing={3}>
                {validAddresses.length > 0 ? validAddresses.map((addr, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'white' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="500" gutterBottom>
                        {addr.type.charAt(0).toUpperCase() + addr.type.slice(1)} Address
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 1 }}>
                        <Typography variant="body2" color="text.secondary">House Name:</Typography>
                        <Typography variant="body2">{addr.houseName || 'N/A'}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Village/City:</Typography>
                        <Typography variant="body2">{addr.village || 'N/A'}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">District:</Typography>
                        <Typography variant="body2">{addr.district || 'N/A'}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">State:</Typography>
                        <Typography variant="body2">{addr.state || 'N/A'}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Pincode:</Typography>
                        <Typography variant="body2">{addr.pincode || 'N/A'}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                )) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No address information available
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Box>

          {/* Guardians/Parents Section */}
          <Box sx={{ mt: 4, mx: 3 }}>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: '4px 4px 0 0', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="500" color="primary.dark">Family Details</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '0 0 4px 4px' }}>
              <Grid container spacing={3}>
                {validGuardians.length > 0 ? validGuardians.map((g, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'white' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="500" gutterBottom>
                        {g.type.charAt(0).toUpperCase() + g.type.slice(1)}'s Details
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 1 }}>
                        <Typography variant="body2" color="text.secondary">Name:</Typography>
                        <Typography variant="body2">{g.name || 'N/A'}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Contact:</Typography>
                        <Typography variant="body2">{g.contact || 'N/A'}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Aadhar:</Typography>
                        <Typography variant="body2">{g.aadhar || 'N/A'}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">PAN Card:</Typography>
                        <Typography variant="body2">{g.panCard || 'N/A'}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Occupation:</Typography>
                        <Typography variant="body2">{g.occupation || 'N/A'}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                )) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No family details available
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Box>

          {/* Previous Education Section */}
          <Box sx={{ mt: 4, mx: 3 }}>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: '4px 4px 0 0', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="500" color="primary.dark">Previous Education</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '0 0 4px 4px' }}>
              <Grid container spacing={3}>
                {(student.sslcDetails || student.pucDetails) ? (
                  <>
                    {student.sslcDetails && (
                      <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'white' }}>
                          <Typography variant="subtitle2" color="primary" fontWeight="500" gutterBottom>
                            SSLC Details
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 1 }}>
                            <Typography variant="body2" color="text.secondary">School:</Typography>
                            <Typography variant="body2">{student.sslcDetails.school || 'N/A'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary">Board/University:</Typography>
                            <Typography variant="body2">{student.sslcDetails.boardUniversity || 'N/A'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary">Reg No:</Typography>
                            <Typography variant="body2">{student.sslcDetails.regNo || 'N/A'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary">Year:</Typography>
                            <Typography variant="body2">{student.sslcDetails.year || 'N/A'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary">Max Marks:</Typography>
                            <Typography variant="body2">{student.sslcDetails.maxMarks || 'N/A'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary">Obtained Marks:</Typography>
                            <Typography variant="body2">{student.sslcDetails.obtainedMarks || 'N/A'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary">Percentage:</Typography>
                            <Typography variant="body2" fontWeight="500">{student.sslcDetails.percentage || 'N/A'}</Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    )}
                    {student.pucDetails && (
                      <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'white' }}>
                          <Typography variant="subtitle2" color="primary" fontWeight="500" gutterBottom>
                            PUC Details
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 1 }}>
                            <Typography variant="body2" color="text.secondary">School:</Typography>
                            <Typography variant="body2">{student.pucDetails.school || 'N/A'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary">Board/University:</Typography>
                            <Typography variant="body2">{student.pucDetails.boardUniversity || 'N/A'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary">Reg No:</Typography>
                            <Typography variant="body2">{student.pucDetails.regNo || 'N/A'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary">Year:</Typography>
                            <Typography variant="body2">{student.pucDetails.year || 'N/A'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary">Percentage:</Typography>
                            <Typography variant="body2" fontWeight="500">{student.pucDetails.percentage || 'N/A'}</Typography>
                          </Box>
                          
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
                            <Typography variant="subtitle2" color="primary" fontSize="0.875rem" gutterBottom>
                              Subject Marks
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr', rowGap: 1 }}>
                              <Typography variant="body2" color="text.secondary">Physics:</Typography>
                              <Typography variant="body2">{student.pucDetails.physicsObtained || 'N/A'} / {student.pucDetails.physicsMax || 'N/A'}</Typography>
                              
                              <Typography variant="body2" color="text.secondary">Chemistry:</Typography>
                              <Typography variant="body2">{student.pucDetails.chemObtained || 'N/A'} / {student.pucDetails.chemMax || 'N/A'}</Typography>
                              
                              <Typography variant="body2" color="text.secondary">Maths:</Typography>
                              <Typography variant="body2">{student.pucDetails.mathsObtained || 'N/A'} / {student.pucDetails.mathsMax || 'N/A'}</Typography>
                              
                              <Typography variant="body2" color="text.secondary">English:</Typography>
                              <Typography variant="body2">{student.pucDetails.englishObtained || 'N/A'} / {student.pucDetails.englishMax || 'N/A'}</Typography>
                              
                              <Typography variant="body2" color="text.secondary">Elective:</Typography>
                              <Typography variant="body2">{student.pucDetails.electiveObtained || 'N/A'} / {student.pucDetails.electiveMax || 'N/A'}</Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    )}
                  </>
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No previous education details available
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Box>

          {/* Entrance Exam Section */}
          <Box sx={{ mt: 4, mx: 3, mb: 3 }}>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: '4px 4px 0 0', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="500" color="primary.dark">Entrance Exam Details</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '0 0 4px 4px' }}>
              {(entranceExams && (entranceExams.kcetRank || entranceExams.comedkRank || entranceExams.jeeRank)) ? (
                <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'white' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' }, rowGap: 1 }}>
                    <Typography variant="body2" color="text.secondary">KCET Rank:</Typography>
                    <Typography variant="body2" fontWeight={entranceExams.kcetRank ? '500' : '400'}>  
                      {entranceExams.kcetRank || 'N/A'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">COMEDK Rank:</Typography>
                    <Typography variant="body2" fontWeight={entranceExams.comedkRank ? '500' : '400'}>
                      {entranceExams.comedkRank || 'N/A'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">JEE Rank:</Typography>
                    <Typography variant="body2" fontWeight={entranceExams.jeeRank ? '500' : '400'}>
                      {entranceExams.jeeRank || 'N/A'}
                    </Typography>
                  </Box>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No entrance exam details available
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default StudentDetail; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Button
  // Breadcrumbs, Link unused
} from '@mui/material';
import MainLayout from '../../components/layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';

// Define a proper type for student result data
interface StudentResultData {
  student: {
    usn: string;
    name: string;
    section: string;
    semester: number;
    department: string;
  };
  results: Array<{
    subject: {
      id: number;
      code: string;
      name: string;
      semester: number; 
    };
    result: {
      totalMarksObtained: number;
      totalMaxMarks: number;
      percentage: number;
      attendancePercentage: number;
      isEligible: boolean;
    };
  }>;
}

const StudentResults: React.FC = () => {
  const { usn, semester } = useParams<{ usn: string; semester?: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentResultData | null>(null);
  const [selectedTab, setSelectedTab] = useState('0'); // Change to string for TabContext

  useEffect(() => {
    if (usn) {
      fetchStudentResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usn, token, semester]);

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = semester 
        ? `/api/results/student/${usn}/semester/${semester}`
        : `/api/results/student/${usn}`;
        
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setData(response.data.data);
        
        // Group results by semester
        const semesters = [...new Set(response.data.data.results.map((r: any) => r.subject.semester))];
        // Use type assertion to tell TypeScript these are numbers
        semesters.sort((a, b) => (a as number) - (b as number));
      } else {
        setError(response.data.message || 'Failed to load student results');
      }
    } catch (error: any) {
      console.error('Error fetching student results:', error);
      setError(error.response?.data?.message || 'An error occurred while loading results');
    } finally {
      setLoading(false);
    }
  };

  // Format percentage
  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(2) + '%';
  };

  // Get color based on percentage
  const getColorByPercentage = (percentage: number) => {
    if (percentage < 40) return 'error';
    if (percentage < 60) return 'warning';
    return 'success';
  };

  // Calculate semester-wise totals
  const calculateSemesterTotals = (semester: number) => {
    if (!data?.results) return { totalObtained: 0, totalMax: 0, percentage: 0 };
    
    const semesterResults = data.results.filter((r) => r.subject.semester === semester);
    let totalObtained = 0;
    let totalMax = 0;
    
    semesterResults.forEach((result) => {
      totalObtained += result.result.totalMarksObtained;
      totalMax += result.result.totalMaxMarks;
    });
    
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    
    return {
      totalObtained,
      totalMax,
      percentage
    };
  };

  // Get list of unique semesters from results
  const getSemesters = (): number[] => {
    if (!data?.results) return [];
    const semesters = [...new Set(data.results.map((r) => r.subject.semester))];
    // Use type assertion to tell TypeScript these are numbers
    return semesters.sort((a, b) => (a as number) - (b as number));
  };

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Student Results
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : data ? (
            <>
              {/* Student Info Card */}
              <Card variant="outlined" sx={{ mb: 4 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6">
                        {data.student.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        USN: {data.student.usn}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <Typography variant="body2">
                        Department: {data.student.department}
                      </Typography>
                      <Typography variant="body2">
                        Semester: {data.student.semester} | Section: {data.student.section}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Use regular Tabs until we can install @mui/lab */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <div role="tablist">
                  {getSemesters().map((semester, index) => (
                    <button
                      key={semester}
                      role="tab"
                      aria-selected={selectedTab === index.toString()}
                      onClick={() => setSelectedTab(index.toString())}
                      style={{ 
                        padding: '12px 16px',
                        margin: '0 8px',
                        background: 'none',
                        border: 'none',
                        borderBottom: selectedTab === index.toString() ? '2px solid #1976d2' : 'none',
                        color: selectedTab === index.toString() ? '#1976d2' : 'inherit',
                        fontWeight: selectedTab === index.toString() ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      Semester {semester}
                    </button>
                  ))}
                </div>
              </Box>
              
              {/* Results for each semester */}
              {getSemesters().map((semester, index) => {
                const semesterResults = data.results.filter((r) => r.subject.semester === semester);
                const semesterTotals = calculateSemesterTotals(semester);
                
                return (
                  <div 
                    key={semester} 
                    role="tabpanel"
                    hidden={selectedTab !== index.toString()}
                    style={{ padding: '16px 0' }}
                  >
                    {selectedTab === index.toString() && (
                      <>
                        {/* Semester summary card */}
                        <Box sx={{ mb: 3 }}>
                          <Paper 
                            variant="outlined" 
                            sx={{ 
                              p: 2, 
                              display: 'flex', 
                              flexDirection: { xs: 'column', sm: 'row' }, 
                              alignItems: 'center', 
                              justifyContent: 'space-between' 
                            }}
                          >
                            <Box sx={{ mb: { xs: 2, sm: 0 } }}>
                              <Typography variant="h6">
                                Semester {semester} Summary
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Total: {semesterTotals.totalObtained} / {semesterTotals.totalMax}
                              </Typography>
                            </Box>
                            <Box sx={{ width: { xs: '100%', sm: '60%', md: '40%' } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  Overall: {formatPercentage(semesterTotals.percentage)}
                                </Typography>
                                <Chip
                                  label={semesterTotals.percentage >= 40 ? 'PASS' : 'FAIL'}
                                  color={semesterTotals.percentage >= 40 ? 'success' : 'error'}
                                  size="small"
                                />
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(semesterTotals.percentage, 100)}
                                sx={{ height: 8, borderRadius: 5 }}
                                color={getColorByPercentage(semesterTotals.percentage)}
                              />
                            </Box>
                          </Paper>
                        </Box>
                        
                        {/* Subject results */}
                        <Grid container spacing={3}>
                          {semesterResults.map((result) => (
                            <Grid item xs={12} md={6} key={result.subject.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6">
                                      {result.subject.code}
                                    </Typography>
                                    <Chip
                                      label={result.result.isEligible ? 'Eligible' : 'Not Eligible'}
                                      color={result.result.isEligible ? 'success' : 'error'}
                                      size="small"
                                    />
                                  </Box>
                                  
                                  <Typography variant="body1" gutterBottom>
                                    {result.subject.name}
                                  </Typography>
                                  
                                  <Divider sx={{ my: 1.5 }} />
                                  
                                  <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Attendance:
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                      <Chip
                                        label={formatPercentage(result.result.attendancePercentage)}
                                        color={result.result.attendancePercentage >= 85 ? 'success' : 'error'}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Marks:
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                      <Typography variant="body2" fontWeight="medium">
                                        {result.result.totalMarksObtained} / {result.result.totalMaxMarks}
                                      </Typography>
                                    </Grid>
                                    
                                    <Grid item xs={12} sx={{ mt: 1 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2">
                                          {formatPercentage(result.result.percentage)}
                                        </Typography>
                                      </Box>
                                      <LinearProgress
                                        variant="determinate"
                                        value={Math.min(result.result.percentage, 100)}
                                        sx={{ height: 5, borderRadius: 5 }}
                                        color={getColorByPercentage(result.result.percentage)}
                                      />
                                    </Grid>
                                  </Grid>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <Alert severity="info">
              No results available for this student.
            </Alert>
          )}
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default StudentResults; 
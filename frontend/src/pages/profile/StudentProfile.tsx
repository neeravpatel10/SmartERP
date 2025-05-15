import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import MainLayout from '../../components/layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';

// @ts-ignore
import { Bar, Line } from 'react-chartjs-2';
// @ts-ignore
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartJsTooltip,
  Legend as ChartJsLegend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Title,
  ChartJsTooltip,
  ChartJsLegend
);

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`semester-tabpanel-${index}`}
      aria-labelledby={`semester-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// For the student profile data structure

// For backward compatibility with existing component structure
interface StudentProfileData {
  student: {
    usn: string;
    name: string;
    email: string;
    phone: string;
    dob?: string | null;
    gender?: string | null;
    department: {
      id: number;
      name: string;
      code: string;
    };
    batch: {
      id: number;
      name: string;
      year: number;
    };
    currentSemester: number;
    section: string;
  };
  academicData: {
    semesters: Array<{
      semester: number;
      subjects: Array<{
        id: number;
        code: string;
        name: string;
        credits: number;
        isLab: boolean;
        components: Array<{
          id: number;
          name: string;
          type: string;
          maxMarks: number;
          marksObtained: number;
        }>;
        totalMarksObtained: number;
        totalMaxMarks: number;
        percentage: number;
      }>;
      attendance: Array<{
        subject: {
          id: number;
          code: string;
          name: string;
        };
        sessions: number;
        present: number;
        absent: number;
        other: number;
        percentage: number;
      }>;
      totalMarks: {
        obtained: number;
        max: number;
        percentage: number;
      };
    }>;
    cumulativeSummary: {
      totalAttendanceAverage: number;
      totalSubjectsAttempted: number;
    };
  };
  personalInfo?: {
    addresses: {
      present: any | null;
      permanent: any | null;
    };
    guardians: {
      father: any | null;
      mother: any | null;
      guardian: any | null;
    };
    education: {
      entranceExams: any | null;
      pucRecord: any | null;
      sslcRecord: any | null;
    };
  };
  userAccount?: {
    id: number;
    username: string;
    active: boolean;
    lastLogin: string | null;
    displayPicture: any;
    recentActivity: any[];
  } | null;
}

// Component to render the grade
function getGradeColor(percentage: number) {
  if (percentage >= 90) return { color: '#388e3c', grade: 'Excellent' };
  if (percentage >= 80) return { color: '#689f38', grade: 'Very Good' };
  if (percentage >= 70) return { color: '#afb42b', grade: 'Good' };
  if (percentage >= 60) return { color: '#ffa000', grade: 'Average' };
  if (percentage >= 50) return { color: '#f57c00', grade: 'Pass' };
  return { color: '#d32f2f', grade: 'Fail' };
}

const StudentProfile: React.FC = () => {
  const { usn } = useParams<{ usn: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [data, setData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [downloading, setDownloading] = useState<boolean>(false);

  // Fetch student profile data
  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        setLoading(true);
        
        // First try to fetch comprehensive data from the new endpoint
        try {
          const completeResponse = await axios.get(`/api/students/${usn}/complete`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (completeResponse.data.success) {
            // Convert the comprehensive format to the format expected by the component
            const comprehensiveData = completeResponse.data.data;
            
            // Create compatible data structure
            const compatibleData: StudentProfileData = {
              student: {
                usn: comprehensiveData.usn,
                name: comprehensiveData.name.full,
                email: comprehensiveData.email || '',
                phone: comprehensiveData.phone,
                dob: comprehensiveData.dob,
                gender: comprehensiveData.gender,
                department: comprehensiveData.academicInfo.department,
                batch: comprehensiveData.academicInfo.batch,
                currentSemester: comprehensiveData.academicInfo.semester,
                section: comprehensiveData.academicInfo.section
              },
              academicData: {
                // We'll have placeholder semesters data until we have proper formatting
                semesters: [{
                  semester: comprehensiveData.academicInfo.semester,
                  subjects: [],
                  attendance: [],
                  totalMarks: {
                    obtained: 0,
                    max: 0,
                    percentage: 0
                  }
                }],
                cumulativeSummary: {
                  totalAttendanceAverage: 0,
                  totalSubjectsAttempted: 0
                }
              },
              // Add the comprehensive data's personal info and user account
              personalInfo: {
                addresses: comprehensiveData.personalInfo.addresses,
                guardians: comprehensiveData.personalInfo.guardians,
                education: {
                  entranceExams: comprehensiveData.personalInfo.entranceExams,
                  pucRecord: comprehensiveData.personalInfo.pucRecord,
                  sslcRecord: comprehensiveData.personalInfo.sslcRecord
                }
              },
              userAccount: comprehensiveData.userAccount
            };
            
            setData(compatibleData);
            setSelectedTab(0); // First semester/tab
            return; // Successfully fetched and converted, no need to try the old endpoint
          }
        } catch (comprehensiveErr) {
          console.log('Comprehensive endpoint not available or error, falling back to old format', comprehensiveErr);
          // If it fails, we'll fall back to the old endpoint
        }
        
        // Fallback to original endpoint
        const response = await axios.get(`/profile/${usn}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setData(response.data.data);
          
          // Default to the current semester tab if available
          if (response.data.data.student.currentSemester) {
            const semesters = response.data.data.academicData.semesters;
            const currentSemIndex = semesters.findIndex(
              (sem: {semester: number}) => sem.semester === response.data.data.student.currentSemester      
            );
            
            if (currentSemIndex !== -1) {
              setSelectedTab(currentSemIndex);
            }
          }
        } else {
          setError('Failed to load student profile');
        }
      } catch (err: any) {
        console.error('Error fetching student profile:', err);
        setError(err.response?.data?.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };

    if (usn && token) {
      fetchStudentProfile();
    }
  }, [usn, token]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Download profile (only for faculty and admins)
  const downloadProfile = async () => {
    try {
      setDownloading(true);

      // Either use window.open for direct download or handle response properly
      window.open(`/profile/${usn}/download`, '_blank');
      
      setDownloading(false);
    } catch (error) {
      console.error('Download error:', error);
      setDownloading(false);
    }
  };

  // Check if current user can download profile
  const canDownloadProfile = () => {
    return user && user.loginType !== 4; // Not a student
  };

  if (loading) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Container>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning">No data available for this student.</Alert>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Container>
      </MainLayout>
    );
  }

  // Prepare data for charts
  const semesterMarksData = {
    labels: data.academicData.semesters.map(sem => `Semester ${sem.semester}`),
    datasets: [
      {
        label: 'Average Marks (%)',
        data: data.academicData.semesters.map(sem => sem.totalMarks.percentage),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.5)',
      },
    ],
  };

  const semesterAttendanceData = {
    labels: data.academicData.semesters.map(sem => `Semester ${sem.semester}`),
    datasets: [
      {
        label: 'Average Attendance (%)',
        data: data.academicData.semesters.map((sem: { attendance: Array<{ percentage: number }> }) => {
          if (sem.attendance.length === 0) return 0;
          const total = sem.attendance.reduce((sum, att) => sum + att.percentage, 0);
          return total / sem.attendance.length;
        }),
        borderColor: '#388e3c',
        backgroundColor: 'rgba(56, 142, 60, 0.5)',
      },
    ],
  };

  // Current semester attendance chart
  const currentSemester = data.academicData.semesters[selectedTab];
  const subjectAttendanceData = {
    labels: currentSemester?.attendance.map(att => att.subject.code) || [],
    datasets: [
      {
        label: 'Attendance (%)',
        data: currentSemester?.attendance.map(att => att.percentage) || [],
        backgroundColor: currentSemester?.attendance.map(att => 
          att.percentage >= 85 ? 'rgba(56, 142, 60, 0.7)' : 
          att.percentage >= 75 ? 'rgba(255, 193, 7, 0.7)' : 
          'rgba(211, 47, 47, 0.7)'
        ) || [],
      },
    ],
  };

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Left sidebar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    mb: 2, 
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem'
                  }}
                >
                  {data.student.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" align="center">
                  {data.student.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                  {data.student.usn}
                </Typography>
                <Chip 
                  icon={<SchoolIcon />} 
                  label={`${data.student.department.code} - ${data.student.currentSemester}${data.student.section}`} 
                  size="small" 
                  sx={{ mb: 1 }}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Email" 
                    secondary={data.student.email || 'Not specified'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Phone" 
                    secondary={data.student.phone || 'Not specified'} 
                  />
                </ListItem>
                {data.student.dob && (
                  <ListItem>
                    <ListItemText 
                      primary="Date of Birth" 
                      secondary={new Date(data.student.dob).toLocaleDateString()} 
                    />
                  </ListItem>
                )}
                {data.student.gender && (
                  <ListItem>
                    <ListItemText primary="Gender" secondary={data.student.gender} />
                  </ListItem>
                )}
              </List>
              
              {canDownloadProfile() && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    fullWidth
                    onClick={downloadProfile}
                    disabled={downloading}
                  >
                    {downloading ? 'Downloading...' : 'Download Profile'}
                  </Button>
                </>
              )}
            </Paper>
            
            {/* Cumulative Summary Card */}
            <Paper sx={{ p: 3 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                Cumulative Summary
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Overall Attendance Average
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(data.academicData.cumulativeSummary.totalAttendanceAverage, 100)} 
                      color={data.academicData.cumulativeSummary.totalAttendanceAverage >= 85 ? "success" : "warning"}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">
                      {data.academicData.cumulativeSummary.totalAttendanceAverage.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Typography variant="body2" gutterBottom>
                Total Subjects Attempted
              </Typography>
              <Typography variant="h5" color="primary">
                {data.academicData.cumulativeSummary.totalSubjectsAttempted}
              </Typography>
            </Paper>
          </Grid>
          
          {/* Main content */}
          <Grid item xs={12} md={9}>
            {/* Personal Information and Guardian Details */}
            {data.personalInfo && (
              <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {/* Addresses */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Address Information</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Present Address */}
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Present Address
                            </Typography>
                            {data.personalInfo.addresses.present ? (
                              <>
                                <Typography variant="body2">
                                  {data.personalInfo.addresses.present.line1}
                                </Typography>
                                {data.personalInfo.addresses.present.line2 && (
                                  <Typography variant="body2">
                                    {data.personalInfo.addresses.present.line2}
                                  </Typography>
                                )}
                                <Typography variant="body2">
                                  {data.personalInfo.addresses.present.city}, {data.personalInfo.addresses.present.state} {data.personalInfo.addresses.present.postalCode}
                                </Typography>
                                <Typography variant="body2">
                                  {data.personalInfo.addresses.present.country}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No present address information available
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      {/* Permanent Address */}
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Permanent Address
                            </Typography>
                            {data.personalInfo.addresses.permanent ? (
                              <>
                                <Typography variant="body2">
                                  {data.personalInfo.addresses.permanent.line1}
                                </Typography>
                                {data.personalInfo.addresses.permanent.line2 && (
                                  <Typography variant="body2">
                                    {data.personalInfo.addresses.permanent.line2}
                                  </Typography>
                                )}
                                <Typography variant="body2">
                                  {data.personalInfo.addresses.permanent.city}, {data.personalInfo.addresses.permanent.state} {data.personalInfo.addresses.permanent.postalCode}
                                </Typography>
                                <Typography variant="body2">
                                  {data.personalInfo.addresses.permanent.country}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No permanent address information available
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                
                {/* Guardians */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Guardian Information</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Father */}
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Father
                            </Typography>
                            {data.personalInfo.guardians.father ? (
                              <List dense>
                                <ListItem>
                                  <ListItemText primary="Name" secondary={data.personalInfo.guardians.father.name} />
                                </ListItem>
                                {data.personalInfo.guardians.father.occupation && (
                                  <ListItem>
                                    <ListItemText primary="Occupation" secondary={data.personalInfo.guardians.father.occupation} />
                                  </ListItem>
                                )}
                                <ListItem>
                                  <ListItemText primary="Phone" secondary={data.personalInfo.guardians.father.phone} />
                                </ListItem>
                                {data.personalInfo.guardians.father.email && (
                                  <ListItem>
                                    <ListItemText primary="Email" secondary={data.personalInfo.guardians.father.email} />
                                  </ListItem>
                                )}
                                {data.personalInfo.guardians.father.income && (
                                  <ListItem>
                                    <ListItemText primary="Annual Income" secondary={data.personalInfo.guardians.father.income} />
                                  </ListItem>
                                )}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No father's information available
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      {/* Mother */}
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Mother
                            </Typography>
                            {data.personalInfo.guardians.mother ? (
                              <List dense>
                                <ListItem>
                                  <ListItemText primary="Name" secondary={data.personalInfo.guardians.mother.name} />
                                </ListItem>
                                {data.personalInfo.guardians.mother.occupation && (
                                  <ListItem>
                                    <ListItemText primary="Occupation" secondary={data.personalInfo.guardians.mother.occupation} />
                                  </ListItem>
                                )}
                                <ListItem>
                                  <ListItemText primary="Phone" secondary={data.personalInfo.guardians.mother.phone} />
                                </ListItem>
                                {data.personalInfo.guardians.mother.email && (
                                  <ListItem>
                                    <ListItemText primary="Email" secondary={data.personalInfo.guardians.mother.email} />
                                  </ListItem>
                                )}
                                {data.personalInfo.guardians.mother.income && (
                                  <ListItem>
                                    <ListItemText primary="Annual Income" secondary={data.personalInfo.guardians.mother.income} />
                                  </ListItem>
                                )}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No mother's information available
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      {/* Guardian */}
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Guardian
                            </Typography>
                            {data.personalInfo.guardians.guardian ? (
                              <List dense>
                                <ListItem>
                                  <ListItemText primary="Name" secondary={data.personalInfo.guardians.guardian.name} />
                                </ListItem>
                                {data.personalInfo.guardians.guardian.relation && (
                                  <ListItem>
                                    <ListItemText primary="Relation" secondary={data.personalInfo.guardians.guardian.relation} />
                                  </ListItem>
                                )}
                                {data.personalInfo.guardians.guardian.occupation && (
                                  <ListItem>
                                    <ListItemText primary="Occupation" secondary={data.personalInfo.guardians.guardian.occupation} />
                                  </ListItem>
                                )}
                                <ListItem>
                                  <ListItemText primary="Phone" secondary={data.personalInfo.guardians.guardian.phone} />
                                </ListItem>
                                {data.personalInfo.guardians.guardian.email && (
                                  <ListItem>
                                    <ListItemText primary="Email" secondary={data.personalInfo.guardians.guardian.email} />
                                  </ListItem>
                                )}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No guardian's information available
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                
                {/* Education History */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Education History</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Education records */}
                      {data.personalInfo.education?.sslcRecord && (
                        <Grid item xs={12} md={4}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                SSLC / 10th Standard
                              </Typography>
                              <List dense>
                                <ListItem>
                                  <ListItemText 
                                    primary="School" 
                                    secondary={data.personalInfo.education.sslcRecord.schoolName || 'Not specified'} 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Board" 
                                    secondary={data.personalInfo.education.sslcRecord.board || 'Not specified'} 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Year of Passing" 
                                    secondary={data.personalInfo.education.sslcRecord.yearOfPassing || 'Not specified'} 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Percentage/CGPA" 
                                    secondary={data.personalInfo.education.sslcRecord.percentage || 'Not specified'} 
                                  />
                                </ListItem>
                              </List>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                      
                      {data.personalInfo.education?.pucRecord && (
                        <Grid item xs={12} md={4}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                PUC / 12th Standard
                              </Typography>
                              <List dense>
                                <ListItem>
                                  <ListItemText 
                                    primary="College" 
                                    secondary={data.personalInfo.education.pucRecord.collegeName || 'Not specified'} 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Board" 
                                    secondary={data.personalInfo.education.pucRecord.board || 'Not specified'} 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Year of Passing" 
                                    secondary={data.personalInfo.education.pucRecord.yearOfPassing || 'Not specified'} 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Percentage/CGPA" 
                                    secondary={data.personalInfo.education.pucRecord.percentage || 'Not specified'} 
                                  />
                                </ListItem>
                              </List>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                      
                      {data.personalInfo.education?.entranceExams && (
                        <Grid item xs={12} md={4}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                Entrance Exam
                              </Typography>
                              <List dense>
                                <ListItem>
                                  <ListItemText 
                                    primary="Exam Name" 
                                    secondary={data.personalInfo.education.entranceExams.examName || 'Not specified'} 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Exam ID" 
                                    secondary={data.personalInfo.education.entranceExams.examId || 'Not specified'} 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Year" 
                                    secondary={data.personalInfo.education.entranceExams.year || 'Not specified'} 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Rank" 
                                    secondary={data.personalInfo.education.entranceExams.rank || 'Not specified'} 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Score" 
                                    secondary={data.personalInfo.education.entranceExams.score || 'Not specified'} 
                                  />
                                </ListItem>
                              </List>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            )}
            
            {/* User Account Information */}
            {data.userAccount && (
              <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Username" 
                      secondary={data.userAccount.username} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Account Status" 
                      secondary={data.userAccount.active ? 'Active' : 'Inactive'} 
                    />
                  </ListItem>
                  {data.userAccount.lastLogin && (
                    <ListItem>
                      <ListItemText 
                        primary="Last Login" 
                        secondary={new Date(data.userAccount.lastLogin).toLocaleString()} 
                      />
                    </ListItem>
                  )}
                </List>
                
                {data.userAccount.recentActivity && data.userAccount.recentActivity.length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Recent Activity
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Action</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.userAccount.recentActivity.map((activity: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{activity.action}</TableCell>
                              <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </Paper>
            )}
            
            {/* Performance Charts */}
            <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                Academic Performance Trends
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom align="center">
                    Marks Trend
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <Line 
                      data={semesterMarksData} 
                      options={{ 
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            min: 0,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Percentage'
                            }
                          }
                        }
                      }} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom align="center">
                    Attendance Trend
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <Line 
                      data={semesterAttendanceData} 
                      options={{ 
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            min: 0,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Percentage'
                            }
                          }
                        }
                      }} 
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Semester Tabs */}
            <Paper sx={{ mb: 4 }} elevation={2}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={selectedTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="semester tabs"
                >
                  {data.academicData.semesters.map((sem, index) => (
                    <Tab key={index} label={`Semester ${sem.semester}`} />
                  ))}
                </Tabs>
              </Box>
              
              {data.academicData.semesters.map((semester, index) => (
                <TabPanel key={index} value={selectedTab} index={index}>
                  <Grid container spacing={3}>
                    {/* Semester Summary */}
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Total Marks
                              </Typography>
                              <Typography variant="h6">
                                {semester.totalMarks.obtained} / {semester.totalMarks.max}
                              </Typography>
                              <Typography variant="body2">
                                {semester.totalMarks.percentage.toFixed(1)}%
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Grade
                              </Typography>
                              <Typography 
                                variant="h6" 
                                sx={{ color: getGradeColor(semester.totalMarks.percentage).color }}
                              >
                                {getGradeColor(semester.totalMarks.percentage).grade}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Subjects
                              </Typography>
                              <Typography variant="h6">
                                {semester.subjects.length}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Attendance Chart */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ mb: 3, height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Subject Attendance
                          </Typography>
                          <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                            {semester.attendance.length > 0 ? (
                              <Bar 
                                data={subjectAttendanceData} 
                                options={{ 
                                  maintainAspectRatio: false,
                                  scales: {
                                    y: {
                                      min: 0,
                                      max: 100,
                                      title: {
                                        display: true,
                                        text: 'Percentage'
                                      }
                                    }
                                  }
                                }} 
                              />
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography variant="body2" color="text.secondary">
                                  No attendance data available
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Subject Marks */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ mb: 3, height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Subject Marks Distribution
                          </Typography>
                          <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                            {semester.subjects.length > 0 ? (
                              <Bar 
                                data={{
                                  labels: semester.subjects.map(subj => subj.code),
                                  datasets: [{
                                    label: 'Marks (%)',
                                    data: semester.subjects.map(subj => subj.percentage),
                                    backgroundColor: semester.subjects.map(subj => 
                                      subj.percentage >= 70 ? 'rgba(56, 142, 60, 0.7)' : 
                                      subj.percentage >= 50 ? 'rgba(255, 193, 7, 0.7)' : 
                                      'rgba(211, 47, 47, 0.7)'
                                    ),
                                  }]
                                }} 
                                options={{ 
                                  maintainAspectRatio: false,
                                  scales: {
                                    y: {
                                      min: 0,
                                      max: 100,
                                      title: {
                                        display: true,
                                        text: 'Percentage'
                                      }
                                    }
                                  }
                                }} 
                              />
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography variant="body2" color="text.secondary">
                                  No marks data available
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Subject Details Accordion */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Subject Details
                      </Typography>
                      
                      {semester.subjects.map((subject) => (
                        <Accordion key={subject.id} sx={{ mb: 2 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Grid container alignItems="center">
                              <Grid item xs={6} md={4}>
                                <Typography variant="subtitle1">
                                  {subject.code} - {subject.name}
                                </Typography>
                              </Grid>
                              <Grid item xs={3} md={2}>
                                <Chip 
                                  label={subject.isLab ? 'Lab' : 'Theory'} 
                                  size="small" 
                                  color={subject.isLab ? 'info' : 'default'}
                                />
                              </Grid>
                              <Grid item xs={3} md={3}>
                                <Typography variant="body2">
                                  Marks: {subject.totalMarksObtained}/{subject.totalMaxMarks} ({subject.percentage.toFixed(1)}%)
                                </Typography>
                              </Grid>
                              <Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={subject.percentage} 
                                    sx={{ height: 10, borderRadius: 5, width: '80%', mr: 1 }}
                                    color={
                                      subject.percentage >= 70 ? "success" : 
                                      subject.percentage >= 50 ? "warning" : 
                                      "error"
                                    }
                                  />
                                </Box>
                              </Grid>
                            </Grid>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid container spacing={3}>
                              {/* Component Marks Table */}
                              <Grid item xs={12} md={8}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Component Marks
                                </Typography>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Component</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="right">Marks</TableCell>
                                        <TableCell align="right">Max</TableCell>
                                        <TableCell align="right">Percentage</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {subject.components.map((component) => (
                                        <TableRow key={component.id}>
                                          <TableCell>{component.name}</TableCell>
                                          <TableCell>{component.type}</TableCell>
                                          <TableCell align="right">{component.marksObtained}</TableCell>
                                          <TableCell align="right">{component.maxMarks}</TableCell>
                                          <TableCell align="right">
                                            {component.maxMarks > 0 
                                              ? ((component.marksObtained / component.maxMarks) * 100).toFixed(1) 
                                              : 0}%
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      <TableRow sx={{ '& td': { fontWeight: 'bold', borderTop: '2px solid rgba(224, 224, 224, 1)' } }}>
                                        <TableCell colSpan={2}>Total</TableCell>
                                        <TableCell align="right">{subject.totalMarksObtained}</TableCell>
                                        <TableCell align="right">{subject.totalMaxMarks}</TableCell>
                                        <TableCell align="right">{subject.percentage.toFixed(1)}%</TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Grid>
                              
                              {/* Attendance Details */}
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Attendance
                                </Typography>
                                
                                {semester.attendance.find(att => att.subject.id === subject.id) ? (
                                  <>
                                    {(() => {
                                      const attendance = semester.attendance.find(att => att.subject.id === subject.id)!;
                                      
                                      return (
                                        <>
                                          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                              <CircularProgress 
                                                variant="determinate" 
                                                value={attendance.percentage} 
                                                size={100}
                                                color={
                                                  attendance.percentage >= 85 ? "success" : 
                                                  attendance.percentage >= 75 ? "warning" : 
                                                  "error"
                                                }
                                              />
                                              <Box
                                                sx={{
                                                  top: 0,
                                                  left: 0,
                                                  bottom: 0,
                                                  right: 0,
                                                  position: 'absolute',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                }}
                                              >
                                                <Typography
                                                  variant="h6"
                                                  component="div"
                                                  color="text.secondary"
                                                >
                                                  {attendance.percentage.toFixed(1)}%
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </Box>
                                          
                                          <Typography variant="body2" align="center" gutterBottom>
                                            Present: {attendance.present} | Absent: {attendance.absent}
                                          </Typography>
                                          <Typography variant="body2" align="center">
                                            Total Sessions: {attendance.sessions}
                                          </Typography>
                                        </>
                                      );
                                    })()}
                                  </>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" align="center">
                                    No attendance data available
                                  </Typography>
                                )}
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Grid>
                  </Grid>
                </TabPanel>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default StudentProfile; 
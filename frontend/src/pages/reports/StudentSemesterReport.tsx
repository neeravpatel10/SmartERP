import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SchoolIcon from '@mui/icons-material/School';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MainLayout from '../../components/layouts/MainLayout';
import ReportCharts, { StatRow } from '../../components/reports/ReportCharts';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const StudentSemesterReport: React.FC = () => {
  const { usn, semester } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchReport();
  }, [usn, semester, token]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/reports/student/${usn}/semester/${semester}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load report');
      }
    } catch (error: any) {
      console.error('Error fetching student semester report:', error);
      setError(error.response?.data?.message || 'An error occurred while loading the report');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format percentage with 2 decimal places
  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(2) + '%';
  };

  // Determine color based on percentage
  const getColorByPercentage = (percentage: number) => {
    if (percentage < 40) return 'error';
    if (percentage < 60) return 'warning';
    return 'success';
  };

  const handleExportReport = () => {
    // This would be implemented to generate and download a PDF report
    alert('Export functionality would be implemented here');
  };

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Semester {semester} Report
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportReport}
                sx={{ mr: 2 }}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
            </Box>
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
                        Semester: {data.semester} | Section: {data.student.section}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Stats Summary */}
              <StatRow 
                stats={[
                  {
                    title: 'Overall Percentage',
                    value: data.summary.averagePercentage,
                    subtitle: `${data.summary.totalMarksObtained} / ${data.summary.totalMaxMarks} marks`,
                    icon: <SchoolIcon />,
                    percent: true,
                    color: getColorByPercentage(data.summary.averagePercentage) === 'success' ? '#388e3c' : 
                           getColorByPercentage(data.summary.averagePercentage) === 'warning' ? '#f57c00' : '#d32f2f'
                  },
                  {
                    title: 'Average Attendance',
                    value: data.summary.averageAttendance,
                    subtitle: `${data.summary.averageAttendance < 85 ? 'Below' : 'Above'} minimum requirement`,
                    icon: <EventNoteIcon />,
                    percent: true,
                    color: data.summary.averageAttendance < 85 ? '#d32f2f' : '#388e3c'
                  },
                  {
                    title: 'Total Subjects',
                    value: data.summary.totalSubjects,
                    icon: <AssignmentIcon />,
                    color: '#1565c0'
                  }
                ]}
              />
              
              {/* Tabs for different views */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
                  <Tab label="Marks & Attendance" id="tab-0" aria-controls="tabpanel-0" />
                  <Tab label="Visualizations" id="tab-1" aria-controls="tabpanel-1" />
                </Tabs>
              </Box>
              
              {/* Tab Panels */}
              <TabPanel value={tabValue} index={0}>
                <TableContainer component={Paper} variant="outlined">
                  <Table sx={{ minWidth: 650 }} aria-label="semester results table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell align="center">Components</TableCell>
                        <TableCell align="center">Total Marks</TableCell>
                        <TableCell align="center">Attendance</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.subjects.map((subject: any) => (
                        <TableRow key={subject.id}>
                          <TableCell component="th" scope="row">
                            <Typography variant="body2" fontWeight="medium">
                              {subject.code}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {subject.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {subject.components.map((component: any) => (
                                <Box key={component.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption">
                                    {component.name}:
                                  </Typography>
                                  <Typography variant="caption" fontWeight="medium">
                                    {component.marksObtained} / {component.maxMarks}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {subject.totalMarksObtained} / {subject.totalMaxMarks}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatPercentage(subject.percentage)}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(subject.percentage, 100)}
                                sx={{ height: 5, width: '80%', borderRadius: 5, mt: 0.5 }}
                                color={getColorByPercentage(subject.percentage)}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${formatPercentage(subject.attendance.percentage)}`}
                              color={subject.attendance.percentage >= 85 ? 'success' : 'error'}
                              size="small"
                              variant="outlined"
                            />
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {subject.attendance.presentSessions} / {subject.attendance.totalSessions} sessions
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={subject.percentage >= 40 && subject.attendance.percentage >= 85 ? 'Pass' : 'Needs Improvement'}
                              color={subject.percentage >= 40 && subject.attendance.percentage >= 85 ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <ReportCharts
                      title="Subject Marks Distribution"
                      type="bar"
                      data={data.subjects.map((subject: any) => ({
                        subject: subject.code,
                        percentage: subject.percentage
                      }))}
                      xKey="subject"
                      yKey="percentage"
                      dataKey="percentage"
                      height={300}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <ReportCharts
                      title="Attendance by Subject"
                      type="bar"
                      data={data.subjects.map((subject: any) => ({
                        subject: subject.code,
                        percentage: subject.attendance.percentage
                      }))}
                      xKey="subject"
                      yKey="percentage"
                      dataKey="percentage"
                      height={300}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ReportCharts
                      title="Marks vs Attendance Correlation"
                      type="scatter"
                      data={data.subjects.map((subject: any) => ({
                        name: subject.code,
                        attendance: subject.attendance.percentage,
                        marks: subject.percentage
                      }))}
                      xKey="attendance"
                      yKey="marks"
                      height={400}
                    />
                  </Grid>
                </Grid>
              </TabPanel>
            </>
          ) : (
            <Alert severity="info">
              No report data available for this semester.
            </Alert>
          )}
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default StudentSemesterReport; 
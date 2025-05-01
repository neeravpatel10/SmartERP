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
  Tooltip,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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

const FacultySubjectReport: React.FC = () => {
  const { facultyId, subjectId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReport();
  }, [facultyId, subjectId, token]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/reports/faculty/${facultyId}/subject/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load report');
      }
    } catch (error: any) {
      console.error('Error fetching faculty subject report:', error);
      setError(error.response?.data?.message || 'An error occurred while loading the report');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportReport = () => {
    // This would be implemented to generate and download a PDF report
    alert('Export functionality would be implemented here');
  };

  // Filter students based on search term
  const filteredStudents = data?.students.filter((student: any) => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.usn.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Subject Performance Report
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
              {/* Subject and Faculty Info Card */}
              <Card variant="outlined" sx={{ mb: 4 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6">
                        {data.subject.name} ({data.subject.code})
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Semester: {data.subject.semester} | Credits: {data.subject.credits}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <Typography variant="body2">
                        Faculty: {data.faculty.name}
                      </Typography>
                      <Typography variant="body2">
                        Department: {data.subject.department}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Stats Summary */}
              <StatRow 
                stats={[
                  {
                    title: 'Class Average',
                    value: data.summary.averageMarks,
                    subtitle: `${formatPercentage(data.summary.averagePercentage)}`,
                    icon: <InfoOutlinedIcon />,
                    color: getColorByPercentage(data.summary.averagePercentage) === 'success' ? '#388e3c' : 
                           getColorByPercentage(data.summary.averagePercentage) === 'warning' ? '#f57c00' : '#d32f2f'
                  },
                  {
                    title: 'Attendance Average',
                    value: data.summary.averageAttendance,
                    subtitle: `${data.summary.eligibleStudents} / ${data.summary.totalStudents} eligible students`,
                    icon: <InfoOutlinedIcon />,
                    percent: true,
                    color: data.summary.averageAttendance < 85 ? '#d32f2f' : '#388e3c'
                  },
                  {
                    title: 'Pass Percentage',
                    value: data.summary.passPercentage,
                    subtitle: `${data.summary.passingStudents} / ${data.summary.totalStudents} students passing`,
                    icon: <InfoOutlinedIcon />,
                    percent: true,
                    color: data.summary.passPercentage < 60 ? '#d32f2f' : 
                           data.summary.passPercentage < 80 ? '#f57c00' : '#388e3c'
                  }
                ]}
              />
              
              {/* Tabs for different views */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
                  <Tab label="Student Performance" id="tab-0" aria-controls="tabpanel-0" />
                  <Tab label="Component Analysis" id="tab-1" aria-controls="tabpanel-1" />
                  <Tab label="Visualizations" id="tab-2" aria-controls="tabpanel-2" />
                </Tabs>
              </Box>
              
              {/* Tab Panels */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <TextField
                    placeholder="Search by name or USN"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 300 }}
                  />
                  <Button startIcon={<FilterListIcon />} variant="outlined" size="small">
                    Filter
                  </Button>
                </Box>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table sx={{ minWidth: 650 }} aria-label="student performance table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        {data.components.map((component: any) => (
                          <TableCell key={component.id} align="center">
                            {component.name} ({component.maxMarks})
                          </TableCell>
                        ))}
                        <TableCell align="center">Total</TableCell>
                        <TableCell align="center">Attendance</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStudents && filteredStudents.map((student: any) => (
                        <TableRow key={student.usn}>
                          <TableCell component="th" scope="row">
                            <Typography variant="body2" fontWeight="medium">
                              {student.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {student.usn}
                            </Typography>
                          </TableCell>
                          
                          {data.components.map((component: any) => {
                            const studentMark = student.marks.find((mark: any) => 
                              mark.componentId === component.id
                            );
                            
                            return (
                              <TableCell key={`${student.usn}-${component.id}`} align="center">
                                {studentMark ? (
                                  <Typography variant="body2">
                                    {studentMark.marksObtained} / {component.maxMarks}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    N/A
                                  </Typography>
                                )}
                              </TableCell>
                            );
                          })}
                          
                          <TableCell align="center">
                            <Tooltip title={`${student.totalPercentage.toFixed(2)}%`} arrow>
                              <Typography variant="body2" fontWeight="medium">
                                {student.totalMarks} / {data.summary.totalMaxMarks}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Chip
                              label={`${student.attendance.percentage.toFixed(2)}%`}
                              color={student.attendance.percentage >= 85 ? 'success' : 'error'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          
                          <TableCell align="center">
                            <Chip
                              label={student.totalPercentage >= 40 && student.attendance.percentage >= 85 ? 'Pass' : 'Fail'}
                              color={student.totalPercentage >= 40 && student.attendance.percentage >= 85 ? 'success' : 'error'}
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
                <TableContainer component={Paper} variant="outlined">
                  <Table sx={{ minWidth: 650 }} aria-label="component analysis table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Component</TableCell>
                        <TableCell align="center">Average Score</TableCell>
                        <TableCell align="center">Highest Score</TableCell>
                        <TableCell align="center">Lowest Score</TableCell>
                        <TableCell align="center">Pass Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.componentAnalysis.map((analysis: any) => (
                        <TableRow key={analysis.component.id}>
                          <TableCell component="th" scope="row">
                            <Typography variant="body2" fontWeight="medium">
                              {analysis.component.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Max Marks: {analysis.component.maxMarks}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="medium">
                              {analysis.averageScore.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ({(analysis.averageScore / analysis.component.maxMarks * 100).toFixed(2)}%)
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {analysis.highestScore} ({analysis.highestScoringStudent})
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {analysis.lowestScore} ({analysis.lowestScoringStudent})
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${(analysis.passRate * 100).toFixed(2)}%`}
                              color={analysis.passRate < 0.6 ? 'error' : 
                                    analysis.passRate < 0.8 ? 'warning' : 'success'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <ReportCharts
                      title="Class Distribution"
                      type="pie"
                      data={[
                        { name: 'Excellent (>80%)', value: data.summary.excellentCount },
                        { name: 'Good (60-80%)', value: data.summary.goodCount },
                        { name: 'Average (40-60%)', value: data.summary.averageCount },
                        { name: 'Poor (<40%)', value: data.summary.poorCount }
                      ]}
                      height={300}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <ReportCharts
                      title="Component Performance"
                      type="bar"
                      data={data.componentAnalysis.map((analysis: any) => ({
                        component: analysis.component.name,
                        percentage: (analysis.averageScore / analysis.component.maxMarks * 100)
                      }))}
                      xKey="component"
                      yKey="percentage"
                      dataKey="percentage"
                      height={300}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ReportCharts
                      title="Marks vs Attendance Correlation"
                      type="scatter"
                      data={data.students.map((student: any) => ({
                        name: student.name,
                        marks: student.totalPercentage,
                        attendance: student.attendance.percentage
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
              No report data available for this subject.
            </Alert>
          )}
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default FacultySubjectReport; 
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ClassIcon from '@mui/icons-material/Class';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EventIcon from '@mui/icons-material/Event';

const Dashboard: React.FC = () => {
  const { isAuthenticated, user, loading: authLoading } = useSelector((state: RootState) => state.auth);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Log state variables on each render
  console.log('Dashboard render state:', { authLoading, isAuthenticated, userLoginType: user?.loginType, hasUserObject: !!user });

  const [stats, setStats] = useState<{
    subjects: number;
    students: number;
    faculty: number;
    departments: number;
    attendanceSessions: number;
    pendingMarks: number;
    recentAttendance: any[];
    recentMarks: any[];
    lowAttendance: any[];
    pendingComponents: any[];
    studentStats?: {
      attendance?: {
        overall: string;
        subjects: Record<string, number>;
      };
      performance?: {
        cgpa: number;
        semesters: any[];
      };
      recentMarks?: any[];
    };
  }>({
    subjects: 0,
    students: 0,
    faculty: 0,
    departments: 0,
    attendanceSessions: 0,
    pendingMarks: 0,
    recentAttendance: [],
    recentMarks: [],
    lowAttendance: [],
    pendingComponents: []
  });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardLoading(true);
        setError(null);
        
        // Fetch combined dashboard data from the backend
        const response = await axios.get('/dashboard');
        
        // Log the exact data received from the backend
        console.log('[Dashboard] Response Data:', response.data);

        if (response.data.success) {
          // Log the data being set to state
          console.log('[Dashboard] Setting dashboard stats:', response.data.data);
          setStats(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load dashboard data');
        }
      } catch (err: any) {
        console.error('[Dashboard] Data fetch error:', err);
        setError(err.response?.data?.message || 'An error occurred while fetching dashboard data');
      } finally {
        setDashboardLoading(false);
      }
    };
    
    // Only fetch if user is authenticated and has a role
    if (isAuthenticated && user?.loginType !== undefined) {
      fetchDashboardData();
    }
  }, [user?.id, isAuthenticated, user?.loginType]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Conditional rendering based on user role
  const renderRoleSpecificContent = () => {
    console.log('Rendering dashboard for user:', user?.username, 'Login Type:', user?.loginType);

    if (user?.loginType === 1) {  // Super Admin
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="System Overview" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <PeopleIcon color="primary" style={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.students}</Typography>
                      <Typography variant="body2" color="textSecondary">Students</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <PeopleIcon color="secondary" style={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.faculty}</Typography>
                      <Typography variant="body2" color="textSecondary">Faculty</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <ClassIcon style={{ fontSize: 40, color: '#4caf50' }} />
                      <Typography variant="h4">{stats.subjects}</Typography>
                      <Typography variant="body2" color="textSecondary">Subjects</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <AssignmentIcon style={{ fontSize: 40, color: '#ff9800' }} />
                      <Typography variant="h4">{stats.departments}</Typography>
                      <Typography variant="body2" color="textSecondary">Departments</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Action Items" />
              <CardContent>
                <List>
                  <ListItem button component={RouterLink} to="/subjects">
                    <ListItemText 
                      primary="Pending Marks" 
                      secondary={`${stats.pendingMarks} subjects need marks entry`} 
                    />
                    <Chip 
                      label={stats.pendingMarks} 
                      color="error" 
                      size="small" 
                    />
                  </ListItem>
                  <ListItem button component={RouterLink} to="/attendance/alerts">
                    <ListItemText 
                      primary="Attendance Alerts" 
                      secondary={`${stats.lowAttendance.length} students with low attendance`} 
                    />
                    <Chip 
                      label={stats.lowAttendance.length} 
                      color="warning" 
                      size="small" 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 0 }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
                <Tab label="Recent Attendance" />
                <Tab label="Recent Marks" />
              </Tabs>
              <Box p={3}>
                {tabValue === 0 && (
                  <List>
                    {stats.recentAttendance.length > 0 ? stats.recentAttendance.map((session: any, index: number) => (
                      <React.Fragment key={session.id}>
                        <ListItem 
                          button 
                          component={RouterLink} 
                          to={`/attendance/sessions/${session.id}`}
                        >
                          <ListItemText 
                            primary={`${session.subject.code} - ${session.subject.name}`}
                            secondary={`${new Date(session.date).toLocaleDateString()} | ${session.faculty.name} | ${session.present}/${session.total} present`}
                          />
                          <Chip 
                            label={`${Math.round((session.present / session.total) * 100)}%`}
                            color={session.present / session.total < 0.75 ? "error" : "success"}
                            size="small"
                          />
                        </ListItem>
                        {index < stats.recentAttendance.length - 1 && <Divider />}
                      </React.Fragment>
                    )) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No recent attendance sessions
                      </Typography>
                    )}
                  </List>
                )}
                {tabValue === 1 && (
                  <List>
                    {stats.recentMarks.length > 0 ? stats.recentMarks.map((entry: any, index: number) => (
                      <React.Fragment key={entry.id}>
                        <ListItem 
                          button 
                          component={RouterLink} 
                          to={`/marks/components/${entry.componentId}`}
                        >
                          <ListItemText 
                            primary={`${entry.component.name} - ${entry.subject.code}`}
                            secondary={`${new Date(entry.updatedAt).toLocaleDateString()} | Added by ${entry.faculty.name} | Avg: ${entry.averageMarks}/${entry.component.maxMarks}`}
                          />
                        </ListItem>
                        {index < stats.recentMarks.length - 1 && <Divider />}
                      </React.Fragment>
                    )) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No recent mark entries
                      </Typography>
                    )}
                  </List>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      );
    } else if (user?.loginType === 2) {  // Faculty
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="My Teaching Summary" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center" p={2}>
                      <ClassIcon color="primary" style={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.subjects}</Typography>
                      <Typography variant="body2" color="textSecondary">My Subjects</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center" p={2}>
                      <EventIcon color="secondary" style={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.attendanceSessions}</Typography>
                      <Typography variant="body2" color="textSecondary">Sessions Taken</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center" p={2}>
                      <AssignmentIcon style={{ fontSize: 40, color: '#ff9800' }} />
                      <Typography variant="h4">{stats.pendingComponents.length}</Typography>
                      <Typography variant="body2" color="textSecondary">Pending Assessments</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Action Items" />
              <CardContent>
                <List>
                  {stats.pendingComponents.length > 0 ? (
                    stats.pendingComponents.map((component: any) => (
                      <ListItem 
                        key={component.id}
                        button 
                        component={RouterLink} 
                        to={`/marks/entry?componentId=${component.id}`}
                      >
                        <ListItemText 
                          primary={component.name} 
                          secondary={`${component.subject.code} - ${component.subject.name}`} 
                        />
                        <Chip label="Pending" color="error" size="small" />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No pending assessments" />
                    </ListItem>
                  )}
                  <Divider />
                  <ListItem button component={RouterLink} to="/attendance/sessions/new">
                    <ListItemText primary="Take New Attendance" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 0 }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
                <Tab label="Recent Attendance" />
                <Tab label="Recent Marks" />
                <Tab label="Student Insights" />
              </Tabs>
              <Box p={3}>
                {tabValue === 0 && (
                  <List>
                    {stats.recentAttendance.length > 0 ? stats.recentAttendance.map((session: any, index: number) => (
                      <React.Fragment key={session.id}>
                        <ListItem 
                          button 
                          component={RouterLink} 
                          to={`/attendance/sessions/${session.id}`}
                        >
                          <ListItemText 
                            primary={`${session.subject.code} - ${session.subject.name}`}
                            secondary={`${new Date(session.date).toLocaleDateString()} | ${session.present}/${session.total} present (${Math.round((session.present / session.total) * 100)}%)`}
                          />
                        </ListItem>
                        {index < stats.recentAttendance.length - 1 && <Divider />}
                      </React.Fragment>
                    )) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No recent attendance sessions
                      </Typography>
                    )}
                  </List>
                )}
                {tabValue === 1 && (
                  <List>
                    {stats.recentMarks.length > 0 ? stats.recentMarks.map((entry: any, index: number) => (
                      <React.Fragment key={entry.id}>
                        <ListItem 
                          button 
                          component={RouterLink} 
                          to={`/marks/components/${entry.componentId}`}
                        >
                          <ListItemText 
                            primary={`${entry.component.name} - ${entry.subject.code}`}
                            secondary={`${new Date(entry.updatedAt).toLocaleDateString()} | Avg: ${entry.averageMarks}/${entry.component.maxMarks}`}
                          />
                        </ListItem>
                        {index < stats.recentMarks.length - 1 && <Divider />}
                      </React.Fragment>
                    )) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No recent mark entries
                      </Typography>
                    )}
                  </List>
                )}
                {tabValue === 2 && (
                  <List>
                    {stats.lowAttendance.length > 0 ? stats.lowAttendance.map((student: any, index: number) => (
                      <React.Fragment key={student.usn}>
                        <ListItem 
                          button 
                          component={RouterLink} 
                          to={`/student-profile/${student.usn}`}
                        >
                          <ListItemText 
                            primary={`${student.usn} - ${student.name}`}
                            secondary={`Attendance: ${student.attendancePercentage}% | Subjects: ${student.subjects.join(', ')}`}
                          />
                          <Chip 
                            label="Low Attendance" 
                            color="error" 
                            size="small" 
                          />
                        </ListItem>
                        {index < stats.lowAttendance.length - 1 && <Divider />}
                      </React.Fragment>
                    )) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No students with critically low attendance
                      </Typography>
                    )}
                  </List>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      );
    } else if (user?.loginType === -1) {  // Student
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="My Academic Summary" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center" p={2}>
                      <ClassIcon color="primary" style={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.subjects}</Typography>
                      <Typography variant="body2" color="textSecondary">Subjects</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center" p={2}>
                      <EventIcon color="secondary" style={{ fontSize: 40 }} />
                      <Typography variant="h4">
                        {stats.studentStats?.attendance?.overall || '0%'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Attendance</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center" p={2}>
                      <AssessmentIcon style={{ fontSize: 40, color: '#4caf50' }} />
                      <Typography variant="h4">
                        {stats.studentStats?.performance?.cgpa || '-'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">CGPA</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <List>
                  <ListItem button component={RouterLink} to="/attendance/student">
                    <ListItemText primary="View My Attendance" />
                  </ListItem>
                  <ListItem button component={RouterLink} to="/marks/student">
                    <ListItemText primary="View My Marks" />
                  </ListItem>
                  <ListItem button component={RouterLink} to="/timetable">
                    <ListItemText primary="Today's Classes" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 0 }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
                <Tab label="Attendance" />
                <Tab label="Recent Marks" />
                <Tab label="Performance" />
              </Tabs>
              <Box p={3}>
                {tabValue === 0 && (
                  <Grid container spacing={2}>
                    {stats.studentStats?.attendance?.subjects ? 
                      Object.entries(stats.studentStats.attendance.subjects).map(([subject, percentage]: [string, any]) => (
                        <Grid item xs={12} sm={6} md={4} key={subject}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6">{subject}</Typography>
                              <Box display="flex" alignItems="center" mt={1}>
                                <Box width="70%" mr={2}>
                                  <Box 
                                    sx={{ 
                                      height: 10, 
                                      borderRadius: 5,
                                      bgcolor: '#e0e0e0',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <Box 
                                      sx={{ 
                                        width: `${percentage}%`, 
                                        height: 10,
                                        borderRadius: 5,
                                        bgcolor: percentage < 75 ? '#f44336' : '#4caf50' 
                                      }} 
                                    />
                                  </Box>
                                </Box>
                                <Typography 
                                  variant="body2"
                                  color={percentage < 75 ? "error" : "success"}
                                >
                                  {percentage}%
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      )) : (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary" align="center">
                            No attendance data available
                          </Typography>
                        </Grid>
                      )
                    }
                  </Grid>
                )}
                {tabValue === 1 && (
                  <List>
                    {
                    
                    (stats.studentStats?.recentMarks?.length ?? 0) > 0 ? 
                      stats.studentStats?.recentMarks?.map((mark: any, index: number) => (
                        <React.Fragment key={mark.id}>
                          <ListItem>
                            <ListItemText 
                              primary={`${mark.component.name} - ${mark.subject.code}`}
                              secondary={`${new Date(mark.date).toLocaleDateString()} | Marks: ${mark.obtainedMarks}/${mark.component.maxMarks}`}
                            />
                            <Chip 
                              label={`${Math.round((mark.obtainedMarks / mark.component.maxMarks) * 100)}%`}
                              color={
                                (mark.obtainedMarks / mark.component.maxMarks) < 0.4 ? "error" :
                                (mark.obtainedMarks / mark.component.maxMarks) < 0.6 ? "warning" : "success"
                              }
                              size="small"
                            />
                          </ListItem>
                          {index < (stats.studentStats?.recentMarks?.length ?? 0) - 1 && <Divider />}
                        </React.Fragment>
                      )) : (
                        <Typography variant="body2" color="textSecondary" align="center">
                          No recent mark entries
                        </Typography>
                      )
                    }
                  </List>
                )}
                {tabValue === 2 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Semester Performance</Typography>
                          {stats.studentStats?.performance?.semesters ? (
                            <Box mt={2}>
                              {stats.studentStats.performance.semesters.map((semester: any) => (
                                <Box key={semester.semesterNumber} mb={2}>
                                  <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body1">
                                      Semester {semester.semesterNumber}
                                    </Typography>
                                    <Chip 
                                      label={`SGPA: ${semester.sgpa}`}
                                      color={
                                        semester.sgpa < 6 ? "error" : 
                                        semester.sgpa < 7.5 ? "warning" : "success"
                                      }
                                      size="small"
                                    />
                                  </Box>
                                  <Box 
                                    sx={{ 
                                      height: 8, 
                                      borderRadius: 4,
                                      bgcolor: '#e0e0e0',
                                      overflow: 'hidden',
                                      mt: 1
                                    }}
                                  >
                                    <Box 
                                      sx={{ 
                                        width: `${(semester.sgpa / 10) * 100}%`, 
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: 
                                          semester.sgpa < 6 ? '#f44336' : 
                                          semester.sgpa < 7.5 ? '#ff9800' : '#4caf50' 
                                      }} 
                                    />
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary" align="center">
                              No semester performance data available
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      );
    } else if (user?.loginType === 3) {  // Department Admin
      return (
        <Grid container spacing={3}>
          {/* Department Admin Overview Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Department Overview" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <PeopleIcon color="primary" style={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.students}</Typography>
                      <Typography variant="body2" color="textSecondary">Students</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <PeopleIcon color="secondary" style={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.faculty}</Typography>
                      <Typography variant="body2" color="textSecondary">Faculty</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <ClassIcon color="action" style={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.subjects}</Typography>
                      <Typography variant="body2" color="textSecondary">Subjects</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <EventIcon color="error" style={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.attendanceSessions || 0}</Typography>
                      <Typography variant="body2" color="textSecondary">Sessions</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Department Actions Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <List>
                  <ListItem button component={RouterLink} to="/subjects">
                    <ListItemText primary="Manage Subjects" />
                  </ListItem>
                  <Divider />
                  <ListItem button component={RouterLink} to="/attendance">
                    <ListItemText primary="Attendance Reports" />
                  </ListItem>
                  <Divider />
                  <ListItem button component={RouterLink} to="/faculty">
                    <ListItemText primary="Faculty Management" />
                  </ListItem>
                  <Divider />
                  <ListItem button component={RouterLink} to="/marks">
                    <ListItemText primary="Evaluation & Marks" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Recent Activity Card */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Recent Department Activity" />
              <CardContent>
                <Grid container spacing={3}>
                  {/* Recent Attendance */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Recent Attendance Sessions</Typography>
                    {stats.recentAttendance && stats.recentAttendance.length > 0 ? (
                      <List>
                        {stats.recentAttendance.slice(0, 5).map((session: any, index: number) => (
                          <React.Fragment key={session.id || index}>
                            <ListItem>
                              <ListItemText 
                                primary={session.subject?.name || 'Unknown Subject'} 
                                secondary={`${new Date(session.attendanceDate).toLocaleDateString()} - ${session.entries} students`} 
                              />
                            </ListItem>
                            {index < Math.min(stats.recentAttendance.length, 5) - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No recent attendance sessions
                      </Typography>
                    )}
                  </Grid>
                  
                  {/* Recent Marks */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Recent Mark Entries</Typography>
                    {stats.recentMarks && stats.recentMarks.length > 0 ? (
                      <List>
                        {stats.recentMarks.slice(0, 5).map((mark: any, index: number) => (
                          <React.Fragment key={mark.id || index}>
                            <ListItem>
                              <ListItemText 
                                primary={mark.subject?.name || 'Unknown Subject'} 
                                secondary={`${mark.component?.name || 'Component'} - ${mark.entries} students`} 
                              />
                            </ListItem>
                            {index < Math.min(stats.recentMarks.length, 5) - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No recent mark entries
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    } else {
      return (
        <Alert severity="info">
          Welcome to AIET College ERP. Please check with your administrator if you don't see your dashboard.
        </Alert>
      );
    }
  };

  return (
    <Container maxWidth="xl">
      {(authLoading || (isAuthenticated && !user?.loginType)) ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : dashboardLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        renderRoleSpecificContent()
      )}
    </Container>
  );
};

export default Dashboard; 

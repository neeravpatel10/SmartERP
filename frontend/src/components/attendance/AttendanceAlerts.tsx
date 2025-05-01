import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface StudentAlert {
  usn: string;
  student: {
    usn: string;
    firstName: string;
    lastName: string;
    section: string;
    semester: number;
  };
  subject: {
    id: number;
    name: string;
    code: string;
  };
  attendancePercentage: {
    theory: number | null;
    lab: number | null;
    overall: number;
  };
}

interface AttendanceAlertsProps {
  subjectId?: number;
  threshold?: number;
}

const AttendanceAlerts: React.FC<AttendanceAlertsProps> = ({ 
  subjectId, 
  threshold = 85 
}) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<StudentAlert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Build query params
        const params = new URLSearchParams();
        
        if (user.loginType === 2) { // Faculty
          params.append('facultyId', user.id.toString());
        }
        
        if (subjectId) {
          params.append('subjectId', subjectId.toString());
        }
        
        params.append('threshold', threshold.toString());
        
        const response = await axios.get(
          `/api/attendance/alerts/threshold?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.success) {
          setAlerts(response.data.data);
        } else {
          setError('Failed to load attendance alerts.');
        }
      } catch (error) {
        console.error('Error fetching attendance alerts:', error);
        setError('An error occurred while loading attendance alerts.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, [user, token, subjectId, threshold]);

  // Get severity color based on percentage
  const getSeverityColor = (percentage: number) => {
    if (percentage < 75) return 'error';
    if (percentage < threshold) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (alerts.length === 0) {
    return (
      <Alert severity="info">
        No students are below the {threshold}% attendance threshold.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Students Below {threshold}% Attendance
      </Typography>
      
      <List sx={{ width: '100%' }}>
        {alerts.map((alert, index) => (
          <React.Fragment key={`${alert.usn}-${alert.subject.id}`}>
            {index > 0 && <Divider component="li" />}
            <ListItem
              alignItems="flex-start"
              sx={{
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemText
                primary={
                  <Typography 
                    component="span" 
                    variant="body1" 
                    fontWeight="medium"
                  >
                    {alert.student.firstName} {alert.student.lastName}
                    <Chip
                      label={`${alert.attendancePercentage.overall}%`}
                      size="small"
                      color={getSeverityColor(alert.attendancePercentage.overall)}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                }
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      display="block"
                    >
                      {alert.subject.code} - {alert.subject.name}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      USN: {alert.usn} | Section: {alert.student.section} | Semester: {alert.student.semester}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {alert.attendancePercentage.theory !== null && (
                        <Chip
                          label={`Theory: ${alert.attendancePercentage.theory}%`}
                          size="small"
                          variant="outlined"
                          color={getSeverityColor(alert.attendancePercentage.theory)}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      {alert.attendancePercentage.lab !== null && (
                        <Chip
                          label={`Lab: ${alert.attendancePercentage.lab}%`}
                          size="small"
                          variant="outlined"
                          color={getSeverityColor(alert.attendancePercentage.lab)}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                    </Box>
                    <Button
                      component={Link}
                      to={`/attendance/student/${alert.usn}`}
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      View Details
                    </Button>
                  </React.Fragment>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default AttendanceAlerts; 
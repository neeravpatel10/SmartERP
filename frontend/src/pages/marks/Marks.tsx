import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface Subject {
  id: number;
  code: string;
  name: string;
  semester: number;
}

const Marks: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch faculty's subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get('/api/subjects/faculty-mapping', {
          headers: { Authorization: `Bearer ${token}` },
          params: { active: true }
        });
        
        if (response.data.success) {
          // Extract unique subjects from mappings
          const mappedSubjects = response.data.data.map((mapping: any) => mapping.subject);
          const uniqueSubjects = Array.from(
            new Map(mappedSubjects.map((item: any) => [item.id, item])).values()
          );
          setSubjects(uniqueSubjects as Subject[]);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubjects();
  }, [token]);

  // Check if user is faculty
  const isFaculty = user?.loginType === 2;
  // Check if user is department admin or super admin
  const isAdmin = user?.loginType === 1 || user?.loginType === 3;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Marks Module
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {/* Mark Entry Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EditIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Mark Entry</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Enter and manage marks for internal assessments, assignments, and lab components.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  onClick={() => navigate('/marks/entry')}
                  variant="contained" 
                  fullWidth
                >
                  Enter Marks
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          {/* Components Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SettingsIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Components</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Configure exam components such as CIE structure, assignment weightages, and lab evaluations.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  onClick={() => navigate('/marks/components')}
                  variant="outlined" 
                  fullWidth
                >
                  Manage Components
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          {/* Results Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Results</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  View and analyze student performance across subjects, semesters, and components.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  onClick={() => navigate('/results')}
                  variant="outlined" 
                  fullWidth
                >
                  View Results
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          {/* Additional cards for Admins */}
          {isAdmin && (
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CloudUploadIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Bulk Operations</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Upload and manage marks in bulk for multiple subjects or components.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    onClick={() => navigate('/marks/bulk')}
                    variant="outlined" 
                    fullWidth
                  >
                    Bulk Operations
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* My Subjects */}
      {isFaculty && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            My Subjects
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : subjects.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
              No subjects assigned. Contact the department admin to get subject mappings.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {subjects.map((subject) => (
                <Grid item xs={12} sm={6} md={4} key={subject.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {subject.code}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {subject.name}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Semester {subject.semester}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => navigate(`/marks/subjects/${subject.id}`)}
                      >
                        View Components
                      </Button>
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => navigate(`/marks/entry?subject=${subject.id}`)}
                      >
                        Enter Marks
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default Marks; 
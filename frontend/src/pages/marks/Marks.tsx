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
import AssignmentIcon from '@mui/icons-material/Assignment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import QuizIcon from '@mui/icons-material/Quiz';
import SummarizeIcon from '@mui/icons-material/Summarize';

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
        // CRITICAL FIX: Use a completely different endpoint to avoid the 400 error
        // Instead of /subjects/faculty-mapping which has validation issues,
        // directly use /faculty-subject-mapping which is more reliable
        // Use the same approach as in FacultySubjectMappingTable (direct axios call)
        const apiUrl = 'http://localhost:3000/api/faculty-subject-mapping';
        const token = localStorage.getItem('token');
        
        const response = await axios.get(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
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
  const isFaculty = user?.loginType === 2 || user?.loginType === 3;

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
          {/* Internal Marks */}
          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Internal Marks</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Create blueprints and enter CIE/IA marks with the best-scoring question calculation.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  onClick={() => navigate('/marks/internal')}
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<AssignmentIcon />}
                >
                  Internal Marks
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Assignment & Quiz Marks */}
          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <QuizIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Assignment & Quiz</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Enter and manage marks for assignments, quizzes and seminars with Excel import/export.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  onClick={() => navigate('/marks/assignment-quiz')}
                  variant="contained"
                  color="secondary"
                  fullWidth
                  startIcon={<QuizIcon />}
                >
                  Assignment & Quiz
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Overall Totals */}
          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SummarizeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Overall Totals</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  View combined totals of all components (CIE, assignments, quizzes, seminars).
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  onClick={() => navigate('/marks/overall-totals')}
                  variant="contained"
                  color="info"
                  fullWidth
                  startIcon={<SummarizeIcon />}
                >
                  Overall Totals
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Marks View Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VisibilityIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Marks View & Download</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  View CIE/IA marks with filtering options and export data in XLSX, CSV, or PDF formats.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  onClick={() => navigate('/marks/view')}
                  variant="contained" 
                  color="success"
                  fullWidth
                  startIcon={<FileDownloadIcon />}
                >
                  View & Download Marks
                </Button>
              </CardActions>
            </Card>
          </Grid>
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
                        color="primary"
                        variant="contained"
                        onClick={() => navigate(`/marks/internal?subjectId=${subject.id}`)}
                        startIcon={<AssignmentIcon />}
                      >
                        Internal Marks
                      </Button>
                      <Button 
                        size="small" 
                        color="secondary"
                        variant="contained"
                        onClick={() => navigate(`/marks/assignment-quiz?subjectId=${subject.id}`)}
                        startIcon={<QuizIcon />}
                      >
                        Assignment & Quiz
                      </Button>
                      <Button 
                        size="small" 
                        color="success"
                        variant="contained"
                        onClick={() => navigate(`/marks/view?subjectId=${subject.id}`)}
                        startIcon={<VisibilityIcon />}
                      >
                        View & Download
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
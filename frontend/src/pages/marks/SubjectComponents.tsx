import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Breadcrumbs,
  Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

interface Subject {
  id: number;
  code: string;
  name: string;
  semester: number;
  credits: number;
  isLab: boolean;
}

interface ExamComponent {
  id: number;
  name: string;
  componentType: string;
  maxMarks: number;
  weightagePercent: number | null;
}

const SubjectComponents: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [components, setComponents] = useState<ExamComponent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subject details and components
  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const parsedId = parseInt(subjectId);
        if (isNaN(parsedId)) {
          throw new Error('Invalid subject ID');
        }

        const [subjectRes, componentsRes] = await Promise.all([
          api.get(`/api/subjects/${parsedId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          
          api.get('/api/marks/exam-components', {
            params: { subjectId: parsedId }
          })
        ]);
        
        if (subjectRes.data.success) {
          setSubject(subjectRes.data.data);
        } else {
          throw new Error(subjectRes.data.message || 'Failed to fetch subject');
        }
        
        if (componentsRes.data.success) {
          setComponents(componentsRes.data.data);
        } else {
          throw new Error(componentsRes.data.message || 'Failed to fetch components');
        }
      } catch (err: any) {
        console.error('Error fetching subject data:', err);
        setError(err.message || 'Failed to load subject data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [subjectId, token]);

  // Group components by type
  const groupedComponents = components.reduce((acc, component) => {
    const type = component.componentType.includes('CIE') ? 'cie' :
                component.componentType.includes('Lab') ? 'lab' :
                component.componentType.includes('Assignment') ? 'assignment' : 'other';
    
    if (!acc[type]) {
      acc[type] = [];
    }
    
    acc[type].push(component);
    return acc;
  }, {} as Record<string, ExamComponent[]>);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate('/marks')}
            sx={{ cursor: 'pointer' }}
          >
            Marks
          </Link>
          <Typography color="text.primary">Components</Typography>
        </Breadcrumbs>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/marks')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            {loading ? 'Loading...' : subject?.name || 'Subject Components'}
          </Typography>
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
        ) : (
          <>
            {/* Subject Info */}
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6">
                    {subject?.code}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Semester {subject?.semester} • {subject?.credits} Credits
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      size="small" 
                      color={subject?.isLab ? 'secondary' : 'primary'}
                      label={subject?.isLab ? 'Lab Course' : 'Theory Course'} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate(`/results/subjects/${subjectId}`)}
                    sx={{ mr: 1 }}
                  >
                    View Results
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/marks/entry?subject=${subjectId}`)}
                  >
                    Enter Marks
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ mb: 4 }} />
            
            {/* Components by Category */}
            {components.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="subtitle1" color="text.secondary">
                  No exam components found for this subject.
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/marks/components')}
                >
                  Add Components
                </Button>
              </Box>
            ) : (
              <>
                {/* CIE Components */}
                {groupedComponents.cie && groupedComponents.cie.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Internal Assessment Components
                    </Typography>
                    <Grid container spacing={3}>
                      {groupedComponents.cie.map((component) => (
                        <Grid item xs={12} sm={6} md={4} key={component.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {component.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Max Marks: {component.maxMarks}
                              </Typography>
                              {component.weightagePercent && (
                                <Typography variant="body2" color="text.secondary">
                                  Weightage: {component.weightagePercent}%
                                </Typography>
                              )}
                            </CardContent>
                            <CardActions>
                              <Button 
                                size="small" 
                                startIcon={<SettingsIcon />}
                                onClick={() => navigate(`/marks/components/${component.id}/config`)}
                              >
                                Configure
                              </Button>
                              <Button 
                                size="small" 
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={() => navigate(`/marks/entry?subject=${subjectId}&component=${component.id}`)}
                              >
                                Enter Marks
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {/* Assignment Components */}
                {groupedComponents.assignment && groupedComponents.assignment.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Assignment Components
                    </Typography>
                    <Grid container spacing={3}>
                      {groupedComponents.assignment.map((component) => (
                        <Grid item xs={12} sm={6} md={4} key={component.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {component.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Max Marks: {component.maxMarks}
                              </Typography>
                              {component.weightagePercent && (
                                <Typography variant="body2" color="text.secondary">
                                  Weightage: {component.weightagePercent}%
                                </Typography>
                              )}
                            </CardContent>
                            <CardActions>
                              <Button 
                                size="small" 
                                startIcon={<SettingsIcon />}
                                onClick={() => navigate(`/marks/components/${component.id}/config`)}
                              >
                                Configure
                              </Button>
                              <Button 
                                size="small" 
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={() => navigate(`/marks/entry?subject=${subjectId}&component=${component.id}`)}
                              >
                                Enter Marks
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {/* Lab Components */}
                {groupedComponents.lab && groupedComponents.lab.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Lab Components
                    </Typography>
                    <Grid container spacing={3}>
                      {groupedComponents.lab.map((component) => (
                        <Grid item xs={12} sm={6} md={4} key={component.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {component.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Max Marks: {component.maxMarks}
                              </Typography>
                              {component.weightagePercent && (
                                <Typography variant="body2" color="text.secondary">
                                  Weightage: {component.weightagePercent}%
                                </Typography>
                              )}
                            </CardContent>
                            <CardActions>
                              <Button 
                                size="small" 
                                startIcon={<SettingsIcon />}
                                onClick={() => navigate(`/marks/components/${component.id}/config`)}
                              >
                                Configure
                              </Button>
                              <Button 
                                size="small" 
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={() => navigate(`/marks/entry?subject=${subjectId}&component=${component.id}`)}
                              >
                                Enter Marks
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {/* Other Components */}
                {groupedComponents.other && groupedComponents.other.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Other Components
                    </Typography>
                    <Grid container spacing={3}>
                      {groupedComponents.other.map((component) => (
                        <Grid item xs={12} sm={6} md={4} key={component.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {component.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Max Marks: {component.maxMarks}
                              </Typography>
                              {component.weightagePercent && (
                                <Typography variant="body2" color="text.secondary">
                                  Weightage: {component.weightagePercent}%
                                </Typography>
                              )}
                            </CardContent>
                            <CardActions>
                              <Button 
                                size="small" 
                                startIcon={<SettingsIcon />}
                                onClick={() => navigate(`/marks/components/${component.id}/config`)}
                              >
                                Configure
                              </Button>
                              <Button 
                                size="small" 
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={() => navigate(`/marks/entry?subject=${subjectId}&component=${component.id}`)}
                              >
                                Enter Marks
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default SubjectComponents; 
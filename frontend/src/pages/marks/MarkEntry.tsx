import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MarkEntryForm from '../../components/marks/MarkEntryForm';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

interface Subject {
  id: number;
  code: string;
  name: string;
  semester: number;
}

interface ExamComponent {
  id: number;
  name: string;
  componentType: string;
  maxMarks: number;
}

const MarkEntry: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [components, setComponents] = useState<ExamComponent[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedComponent, setSelectedComponent] = useState<number | ''>('');

  // Fetch faculty's subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get('/subjects/faculty-mapping', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          // Extract unique subjects from mappings
          const mappedSubjects = response.data.data.map((mapping: any) => mapping.subject);
          const uniqueSubjects = Array.from(
            new Map(mappedSubjects.map((item: Subject) => [item.id, item])).values()
          ) as Subject[];
          setSubjects(uniqueSubjects);
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

  // Fetch components when subject changes
  useEffect(() => {
    const fetchComponents = async () => {
      if (!selectedSubject) {
        setComponents([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get(`/marks/exam-components`, {
          params: { subjectId: selectedSubject }
        });
        
        if (response.data.success) {
          setComponents(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching components:', err);
        setError('Failed to load exam components. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComponents();
  }, [selectedSubject]);

  // Handle subject change
  const handleSubjectChange = (event: any) => {
    const value = event.target.value;
    setSelectedSubject(value);
    setSelectedComponent('');
  };

  // Handle component change
  const handleComponentChange = (event: any) => {
    setSelectedComponent(event.target.value);
  };

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
          <Typography color="text.primary">Mark Entry</Typography>
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
            Mark Entry
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={handleSubjectChange}
                disabled={loading}
              >
                <MenuItem value="">Select Subject</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name} (Sem {subject.semester})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!selectedSubject || loading}>
              <InputLabel>Component</InputLabel>
              <Select
                value={selectedComponent}
                label="Component"
                onChange={handleComponentChange}
              >
                <MenuItem value="">Select Component</MenuItem>
                {components.map((component) => (
                  <MenuItem key={component.id} value={component.id}>
                    {component.name} ({component.maxMarks} marks)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {selectedSubject && selectedComponent ? (
          <MarkEntryForm
            componentId={Number(selectedComponent)}
            subjectId={Number(selectedSubject)}
            onMarksSaved={() => {
              // Optional: Add any post-save logic here
            }}
          />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Select a subject and component to enter marks
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default MarkEntry; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box,
  Slider
} from '@mui/material';
import AttendanceAlerts from '../../components/attendance/AttendanceAlerts';

interface Subject {
  id: number;
  name: string;
  code: string;
}

const AttendanceAlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number>(85);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get('/api/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setSubjects(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };
    
    fetchSubjects();
  }, [token]);

  const handleThresholdChange = (_event: Event, newValue: number | number[]) => {
    setThreshold(newValue as number);
  };

  const handleSubjectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedSubject(event.target.value as number);
  };

  const handleClearFilters = () => {
    setSelectedSubject(null);
    setThreshold(85);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Attendance Alerts
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate('/attendance')}
          >
            Back to Attendance
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Students who are below the attendance threshold. These students may not be eligible for exams.
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="subject-label">Subject</InputLabel>
                <Select
                  labelId="subject-label"
                  value={selectedSubject || ''}
                  onChange={handleSubjectChange}
                  label="Subject"
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map(subject => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography id="threshold-slider" gutterBottom>
                Attendance Threshold: {threshold}%
              </Typography>
              <Slider
                value={threshold}
                onChange={handleThresholdChange}
                aria-labelledby="threshold-slider"
                valueLabelDisplay="auto"
                step={5}
                marks
                min={50}
                max={100}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  sx={{ ml: 1 }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Paper variant="outlined" sx={{ p: 3 }}>
          <AttendanceAlerts 
            subjectId={selectedSubject || undefined}
            threshold={threshold}
          />
        </Paper>
      </Paper>
    </Container>
  );
};

export default AttendanceAlertsPage; 
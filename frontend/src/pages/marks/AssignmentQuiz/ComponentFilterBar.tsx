import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography,
  Box
} from '@mui/material';
// Event types for select changes
import { useAuth } from '../../../contexts/AuthContext';
import useSubjects from '../../../hooks/useSubjects';
import { ComponentType, ComponentConfig } from '../../../hooks/useComponentMarks';

interface ComponentFilterBarProps {
  onSubjectChange: (subjectId: number | null) => void;
  onComponentChange: (component: ComponentType | null) => void;
  onAttemptChange: (attempt: number) => void;
  selectedSubject: number | null;
  selectedComponent: ComponentType | null;
  selectedAttempt: number;
  components: ComponentConfig[];
}

const ComponentFilterBar: React.FC<ComponentFilterBarProps> = ({
  onSubjectChange,
  onComponentChange,
  onAttemptChange,
  selectedSubject,
  selectedComponent,
  selectedAttempt,
  components
}) => {
  const { user } = useAuth();
  const { loading: subjectsLoading, subjects, fetchSubjects } = useSubjects();
  const [maxAttempts, setMaxAttempts] = useState<number>(1);

  // Load subjects based on user role
  useEffect(() => {
    if (user) {
      // For department admin, pass the departmentId
      if (user.loginType === 3 && user.departmentId) {
        fetchSubjects(user.departmentId);
      } else {
        fetchSubjects();
      }
    }
  }, [user, fetchSubjects]);

  // Update max attempts when component changes
  useEffect(() => {
    if (selectedComponent) {
      const componentConfig = components.find(c => c.component === selectedComponent);
      if (componentConfig) {
        setMaxAttempts(componentConfig.attemptCount);
        // If current selected attempt is higher than max, reset it
        if (selectedAttempt > componentConfig.attemptCount) {
          onAttemptChange(1);
        }
      }
    }
  }, [selectedComponent, components, selectedAttempt, onAttemptChange]);

  // Handle subject change
  const handleSubjectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value;
    if (value) {
      onSubjectChange(Number(value));
      // Reset component and attempt when subject changes
      onComponentChange(null);
      onAttemptChange(1);
    } else {
      onSubjectChange(null);
    }
  };

  // Handle component change
  const handleComponentChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as ComponentType;
    if (value) {
      onComponentChange(value as ComponentType);
      // Reset attempt to 1 when component changes
      onAttemptChange(1);
    } else {
      onComponentChange(null);
    }
  };

  // Handle attempt change
  const handleAttemptChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value;
    if (value) {
      onAttemptChange(Number(value));
    }
  };

  // Prepare component label mapping
  const componentLabels: Record<string, string> = {
    'A1': 'Assignment 1',
    'A2': 'Assignment 2',
    'QZ': 'Quiz',
    'SM': 'Seminar',
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      
      <Grid container spacing={2} alignItems="center">
        {/* Subject Dropdown */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="subject-select-label">Subject</InputLabel>
            <Select
              labelId="subject-select-label"
              id="subject-select"
              value={selectedSubject?.toString() || ''}
              label="Subject"
              onChange={handleSubjectChange}
              disabled={subjectsLoading}
            >
              <MenuItem value="">
                <em>Select Subject</em>
              </MenuItem>
              {subjects.map((subject: any) => (
                <MenuItem key={subject.id} value={subject.id.toString()}>
                  {subject.code} - {subject.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Component Dropdown */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth disabled={!selectedSubject || components.length === 0}>
            <InputLabel id="component-select-label">Component</InputLabel>
            <Select
              labelId="component-select-label"
              id="component-select"
              value={selectedComponent || ''}
              label="Component"
              onChange={handleComponentChange}
            >
              <MenuItem value="">
                <em>Select Component</em>
              </MenuItem>
              {components.map((config) => (
                <MenuItem key={config.component} value={config.component}>
                  {componentLabels[config.component]} (Max: {config.maxMarks})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Attempt Number Dropdown */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth disabled={!selectedComponent}>
            <InputLabel id="attempt-select-label">Attempt Number</InputLabel>
            <Select
              labelId="attempt-select-label"
              id="attempt-select"
              value={selectedAttempt.toString()}
              label="Attempt Number"
              onChange={handleAttemptChange}
            >
              {[...Array(maxAttempts)].map((_, i) => (
                <MenuItem key={i + 1} value={(i + 1).toString()}>
                  Attempt {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {selectedSubject && selectedComponent && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {componentLabels[selectedComponent]} - Attempt {selectedAttempt}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ComponentFilterBar;

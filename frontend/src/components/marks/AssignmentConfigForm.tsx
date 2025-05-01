import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  IconButton, 
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface AssignmentConfig {
  id?: number;
  name: string;
  maxMarks: number;
  weightage?: number | null;
}

interface AssignmentConfigFormProps {
  componentId: number;
  componentName: string;
  onConfigSaved: () => void;
}

const AssignmentConfigForm: React.FC<AssignmentConfigFormProps> = ({ 
  componentId, 
  componentName, 
  onConfigSaved 
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configs, setConfigs] = useState<AssignmentConfig[]>([]);
  
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(
          `/api/assignment-config/components/${componentId}/assignment-config`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.data.length > 0) {
          setConfigs(response.data.data);
        } else {
          // Default structure with two assignments
          setConfigs([
            {
              name: 'Assignment 1',
              maxMarks: 10,
              weightage: 50
            },
            {
              name: 'Assignment 2',
              maxMarks: 10,
              weightage: 50
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching assignment config:', err);
        setError('Failed to load assignment configuration. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, [componentId, token]);
  
  const handleAddAssignment = () => {
    const assignmentNumber = configs.length + 1;
    
    setConfigs([
      ...configs,
      {
        name: `Assignment ${assignmentNumber}`,
        maxMarks: 10,
        weightage: 100 / (configs.length + 1)
      }
    ]);
    
    // Recalculate weightages to distribute evenly
    setTimeout(() => {
      const newConfigs = [...configs];
      const newWeightage = 100 / newConfigs.length;
      
      newConfigs.forEach(config => {
        config.weightage = newWeightage;
      });
      
      setConfigs(newConfigs);
    }, 0);
  };
  
  const handleRemoveAssignment = (index: number) => {
    if (configs.length <= 1) {
      setError('At least one assignment is required');
      return;
    }
    
    const newConfigs = [...configs];
    newConfigs.splice(index, 1);
    
    // Recalculate weightages to distribute evenly
    const newWeightage = 100 / newConfigs.length;
    newConfigs.forEach(config => {
      config.weightage = newWeightage;
    });
    
    setConfigs(newConfigs);
  };
  
  const handleConfigChange = (index: number, field: keyof AssignmentConfig, value: any) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setConfigs(newConfigs);
  };
  
  const handleSaveConfig = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await axios.post(
        `/api/assignment-config/components/${componentId}/assignment-config`,
        { configurations: configs },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('Assignment configuration saved successfully!');
      onConfigSaved();
    } catch (err) {
      console.error('Error saving assignment config:', err);
      setError('Failed to save assignment configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Configure Assignments for {componentName}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Assignment Structure
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure multiple assignments with custom names, marks, and weightages.
          The total weightage across all assignments should sum to 100%.
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2">Name</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2">Max Marks</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2">Weightage (%)</Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Typography variant="subtitle2">Actions</Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ mb: 2 }} />
          
          {configs.map((config, index) => (
            <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Assignment Name"
                  value={config.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange(index, 'name', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Max Marks"
                  type="number"
                  value={config.maxMarks}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange(
                    index, 
                    'maxMarks', 
                    parseFloat(e.target.value)
                  )}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Weightage (%)"
                  type="number"
                  value={config.weightage || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange(
                    index, 
                    'weightage', 
                    parseFloat(e.target.value)
                  )}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, max: 100, step: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <IconButton 
                  color="error" 
                  onClick={() => handleRemoveAssignment(index)}
                  disabled={configs.length <= 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          
          <Box sx={{ mt: 3 }}>
            <Button 
              startIcon={<AddIcon />}
              variant="outlined" 
              color="primary" 
              onClick={handleAddAssignment}
            >
              Add Assignment
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleSaveConfig}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Configuration'}
        </Button>
      </Box>
    </Box>
  );
};

export default AssignmentConfigForm; 
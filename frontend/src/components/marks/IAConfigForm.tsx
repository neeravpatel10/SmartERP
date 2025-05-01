import React, { useState, useEffect, ChangeEvent } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  IconButton, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface IAQuestionConfig {
  questionNumber: number;
  subpart?: string | null;
  part?: string | null;
  maxMarks: number;
}

interface IAConfigFormProps {
  componentId: number;
  componentName: string;
  onConfigSaved: () => void;
}

const IAConfigForm: React.FC<IAConfigFormProps> = ({ componentId, componentName, onConfigSaved }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configs, setConfigs] = useState<IAQuestionConfig[]>([]);
  
  // Initialize with a default structure if none exists
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(
          `/api/ia-config/components/${componentId}/config`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.data.length > 0) {
          setConfigs(response.data.data);
        } else {
          // Default structure with 4 questions, each with 3 subparts
          const defaultConfigs: IAQuestionConfig[] = [];
          
          for (let q = 1; q <= 4; q++) {
            const part = q <= 2 ? 'A' : 'B';
            
            for (let sp of ['a', 'b', 'c']) {
              defaultConfigs.push({
                questionNumber: q,
                subpart: sp,
                part,
                maxMarks: 5
              });
            }
          }
          
          setConfigs(defaultConfigs);
        }
      } catch (err) {
        console.error('Error fetching IA config:', err);
        setError('Failed to load IA configuration. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, [componentId, token]);
  
  const handleAddQuestion = () => {
    // Find the highest question number
    const maxQuestionNumber = Math.max(...configs.map(c => c.questionNumber), 0);
    
    // Add a new question with default subparts
    const newConfigs = [
      ...configs,
      {
        questionNumber: maxQuestionNumber + 1,
        subpart: 'a',
        part: 'A',
        maxMarks: 5
      },
      {
        questionNumber: maxQuestionNumber + 1,
        subpart: 'b',
        part: 'A',
        maxMarks: 5
      },
      {
        questionNumber: maxQuestionNumber + 1,
        subpart: 'c',
        part: 'A',
        maxMarks: 5
      }
    ];
    
    setConfigs(newConfigs);
  };
  
  const handleAddSubpart = (questionNumber: number) => {
    // Find the existing subparts for this question
    const existingSubparts = configs
      .filter(c => c.questionNumber === questionNumber)
      .map(c => c.subpart || '');
    
    // Generate the next subpart letter
    const lastSubpart = existingSubparts.sort().pop() || '';
    const nextSubpart = String.fromCharCode(lastSubpart.charCodeAt(0) + 1);
    
    // Get the part from an existing subpart of this question
    const part = configs.find(c => c.questionNumber === questionNumber)?.part || 'A';
    
    // Add the new subpart
    const newConfigs = [
      ...configs,
      {
        questionNumber,
        subpart: nextSubpart,
        part,
        maxMarks: 5
      }
    ];
    
    setConfigs(newConfigs);
  };
  
  const handleRemoveConfig = (index: number) => {
    const newConfigs = [...configs];
    newConfigs.splice(index, 1);
    setConfigs(newConfigs);
  };
  
  const handleConfigChange = (index: number, field: keyof IAQuestionConfig, value: any) => {
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
        `/api/ia-config/components/${componentId}/config`,
        { configData: configs },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('IA configuration saved successfully!');
      onConfigSaved();
    } catch (err) {
      console.error('Error saving IA config:', err);
      setError('Failed to save IA configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Group configs by question number for better UI organization
  const groupedConfigs: { [key: number]: IAQuestionConfig[] } = {};
  configs.forEach(config => {
    if (!groupedConfigs[config.questionNumber]) {
      groupedConfigs[config.questionNumber] = [];
    }
    groupedConfigs[config.questionNumber].push(config);
  });
  
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
        Configure Questions for {componentName}
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
          Question Structure
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure the question structure by adding questions, subparts, and assigning marks.
          Questions can be organized into parts (like Part A or Part B).
        </Typography>
      </Box>
      
      {Object.entries(groupedConfigs).map(([questionNumber, configGroup]) => (
        <Card key={questionNumber} sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="h6">
                  Question {questionNumber}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id={`part-label-${questionNumber}`}>Part</InputLabel>
                  <Select
                    labelId={`part-label-${questionNumber}`}
                    value={configGroup[0]?.part || ''}
                    label="Part"
                    onChange={(e: SelectChangeEvent) => {
                      // Update part for all subparts of this question
                      const newConfigs = configs.map(c => 
                        c.questionNumber === parseInt(questionNumber) 
                          ? { ...c, part: e.target.value } 
                          : c
                      );
                      setConfigs(newConfigs);
                    }}
                  >
                    <MenuItem value="A">Part A</MenuItem>
                    <MenuItem value="B">Part B</MenuItem>
                    <MenuItem value="C">Part C</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    startIcon={<AddIcon />}
                    onClick={() => handleAddSubpart(parseInt(questionNumber))}
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  >
                    Add Subpart
                  </Button>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            {configGroup.map((config, idx) => {
              // Find the actual index in the main configs array
              const mainIndex = configs.findIndex(c => 
                c.questionNumber === config.questionNumber && c.subpart === config.subpart
              );
              
              return (
                <Grid container spacing={2} key={idx} alignItems="center" sx={{ mb: 1 }}>
                  <Grid item xs={12} sm={4} md={3}>
                    <Typography variant="body1">
                      {config.questionNumber}{config.subpart ? `.${config.subpart}` : ''}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4} md={3}>
                    <TextField
                      label="Max Marks"
                      type="number"
                      size="small"
                      value={config.maxMarks}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleConfigChange(
                        mainIndex, 
                        'maxMarks', 
                        parseFloat(e.target.value)
                      )}
                      fullWidth
                      inputProps={{ min: 0, step: 0.5 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4} md={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton 
                        color="error" 
                        onClick={() => handleRemoveConfig(mainIndex)}
                        disabled={configGroup.length <= 1} // Prevent removing the last subpart
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              );
            })}
          </CardContent>
        </Card>
      ))}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button 
          startIcon={<AddIcon />}
          variant="contained" 
          color="primary" 
          onClick={handleAddQuestion}
        >
          Add Question
        </Button>
        
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

export default IAConfigForm; 
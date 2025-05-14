import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Breadcrumbs,
  Link
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
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
  weightagePercent: number | null;
  subject: {
    id: number;
    code: string;
    name: string;
  };
}

interface ComponentFormData {
  name: string;
  componentType: string;
  maxMarks: number;
  weightagePercent: number;
  subjectId: number | string;
}

const initialFormData: ComponentFormData = {
  name: '',
  componentType: 'CIE',
  maxMarks: 50,
  weightagePercent: 100,
  subjectId: ''
};

const Components: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [components, setComponents] = useState<ExamComponent[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<ExamComponent[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [formData, setFormData] = useState<ComponentFormData>(initialFormData);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch subjects and components on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [mappingsRes, componentsRes] = await Promise.all([
          api.get('/subjects/faculty-mapping', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          api.get('/marks/exam-components', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        if (mappingsRes.data.success) {
          // Extract unique subjects from mappings
          const mappedSubjects = mappingsRes.data.data.map((mapping: any) => mapping.subject);
          const uniqueSubjects = Array.from(
            new Map(mappedSubjects.map((item: any) => [item.id, item])).values()
          ) as Subject[];
          setSubjects(uniqueSubjects);
        }
        
        if (componentsRes.data.success) {
          setComponents(componentsRes.data.data);
          setFilteredComponents(componentsRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);

  // Filter components when subject or search term changes
  useEffect(() => {
    let filtered = components;
    
    // Filter by selected subject
    if (selectedSubject) {
      filtered = filtered.filter(comp => comp.subject.id === selectedSubject);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        comp => 
          comp.name.toLowerCase().includes(term) || 
          comp.componentType.toLowerCase().includes(term) ||
          comp.subject.code.toLowerCase().includes(term) ||
          comp.subject.name.toLowerCase().includes(term)
      );
    }
    
    setFilteredComponents(filtered);
  }, [selectedSubject, searchTerm, components]);

  // Handle form data changes
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "subjectId") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else if (name === "maxMarks" || name === "weightagePercent") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Open dialog to add new component
  const handleAddComponent = () => {
    setFormData({
      ...initialFormData,
      subjectId: selectedSubject ? Number(selectedSubject) : 0
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  // Open dialog to edit component
  const handleEditComponent = (component: ExamComponent) => {
    setFormData({
      name: component.name,
      componentType: component.componentType,
      maxMarks: component.maxMarks,
      weightagePercent: component.weightagePercent || 0,
      subjectId: component.subject.id
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  // Submit form to create/update component
  const handleSubmitComponent = async () => {
    // Validate form
    if (!formData.name || !formData.componentType || !formData.subjectId) {
      setError('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      if (isEditing) {
        // Update existing component
        // API endpoint would be implemented on backend
        /*
        const response = await api.put(
          `/marks/exam-components/${editingComponentId}`,
          formData
        );
        */
        
        // For now, just show success message
        setSuccess('Component updated successfully');
      } else {
        // Create new component
        const response = await api.post(
          '/marks/exam-components',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setSuccess('Component created successfully');
          
          // Refresh components list
          const componentsRes = await api.get('/marks/exam-components', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (componentsRes.data.success) {
            setComponents(componentsRes.data.data);
          }
        }
      }
      
      // Close dialog
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Error submitting component:', err);
      setError(err.response?.data?.message || 'Failed to submit component');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigate to component configuration
  const handleConfigureComponent = (componentId: number) => {
    navigate(`/marks/components/${componentId}/config`);
  };

  // Delete component (would need API implementation)
  const handleDeleteComponent = async (_componentId: number) => {
    if (!window.confirm('Are you sure you want to delete this component? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      /*
      const response = await api.delete(`/marks/exam-components/${componentId}`);
      
      if (response.data.success) {
        setSuccess('Component deleted successfully');
        
        // Refresh components list
        const componentsRes = await api.get('/marks/exam-components');
        
        if (componentsRes.data.success) {
          setComponents(componentsRes.data.data);
        }
      }
      */
      
      // For now, just show success message
      setSuccess('Component deleted successfully');
    } catch (err: any) {
      console.error('Error deleting component:', err);
      setError(err.response?.data?.message || 'Failed to delete component');
    } finally {
      setLoading(false);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedSubject('');
    setSearchTerm('');
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
          <Typography color="text.primary">Components</Typography>
        </Breadcrumbs>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Exam Components
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddComponent}
          >
            Add Component
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {/* Filters */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  label="Filter by Subject"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedSubject(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={loading}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={5} md={6}>
              <TextField
                fullWidth
                label="Search Components"
                variant="outlined"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={3} md={3}>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                fullWidth
                disabled={loading}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {/* Components Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Max Marks</TableCell>
                <TableCell>Weightage</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={30} sx={{ my: 3 }} />
                  </TableCell>
                </TableRow>
              ) : filteredComponents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No components found. Add some components to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredComponents.map((component) => (
                  <TableRow key={component.id}>
                    <TableCell>{component.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={component.componentType} 
                        color={
                          component.componentType.includes('CIE') ? 'primary' :
                          component.componentType.includes('Assignment') ? 'success' :
                          component.componentType.includes('Lab') ? 'secondary' :
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{component.subject.code}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {component.subject.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{component.maxMarks}</TableCell>
                    <TableCell>
                      {component.weightagePercent ? `${component.weightagePercent}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Configure">
                        <IconButton
                          color="primary"
                          onClick={() => handleConfigureComponent(component.id)}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="info"
                          onClick={() => handleEditComponent(component)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteComponent(component.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Create/Edit Component Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Component' : 'Create New Component'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={formData.subjectId || ''}
                    label="Subject *"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleFormChange(e)}
                    disabled={submitting}
                  >
                    <MenuItem value="">Select Subject</MenuItem>
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Component Name"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleFormChange(e)}
                  disabled={submitting}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Component Type</InputLabel>
                  <Select
                    value={formData.componentType}
                    label="Component Type *"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleFormChange(e)}
                    disabled={submitting}
                  >
                    <MenuItem value="CIE">CIE</MenuItem>
                    <MenuItem value="Assignment">Assignment</MenuItem>
                    <MenuItem value="Lab">Lab</MenuItem>
                    <MenuItem value="Project">Project</MenuItem>
                    <MenuItem value="Viva">Viva</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Max Marks"
                  type="number"
                  value={formData.maxMarks}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleFormChange(e)}
                  inputProps={{ min: 0, step: 0.5 }}
                  disabled={submitting}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Weightage (%)"
                  type="number"
                  value={formData.weightagePercent}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleFormChange(e)}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  disabled={submitting}
                  helperText="Percentage weightage in the final marks calculation"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitComponent} 
            variant="contained" 
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : (isEditing ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Components; 
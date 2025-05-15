import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Using any for toast since we're having type issues with react-toastify
const toast: any = {
  success: (message: string) => console.log('Success:', message)
};

// Mock ToastContainer component
const ToastContainer = () => null;

interface SectionRule {
  id: number;
  startUsn: string;
  endUsn: string;
  section: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Batch {
  id: string;
  name: string;
}

const StudentSectionAssignment = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [sectionRules, setSectionRules] = useState<SectionRule[]>([
    { id: 1, startUsn: '', endUsn: '', section: '' }
  ]);
  const availableSections = ['A', 'B', 'C', 'D', 'E', 'F'];
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const user = useSelector((state: any) => state.auth.user);
  const isSuperAdmin = user && user.loginType === 1;
  const isDeptAdmin = user && user.loginType === 2;

  // Fetch departments and batches on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // If user is dept admin, set the department automatically
        if (isDeptAdmin && user?.departmentId) {
          setSelectedDepartment(user.departmentId);
          
          const batchResponse = await axios.get(`${API_BASE_URL}/batches`, {
            params: { departmentId: user.departmentId }
          });
          
          if (batchResponse.data && batchResponse.data.success) {
            // Ensure we're setting an array
            const batchData = batchResponse.data.data;
            setBatches(Array.isArray(batchData) ? batchData : []);
          }
        } else {
          // Fetch departments for super admin
          const deptResponse = await axios.get(`${API_BASE_URL}/departments`);
          if (deptResponse.data && deptResponse.data.success) {
            // Ensure we're setting an array
            const deptData = deptResponse.data.data;
            setDepartments(Array.isArray(deptData) ? deptData : []);
          }
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isDeptAdmin, user]);

  // Fetch batches when department changes (for super admin)
  useEffect(() => {
    const fetchBatches = async () => {
      if (selectedDepartment) {
        setLoading(true);
        try {
          const response = await axios.get(`${API_BASE_URL}/batches`, {
            params: { departmentId: selectedDepartment }
          });
          
          if (response.data && response.data.success) {
            // Ensure we're setting an array
            const batchData = response.data.data;
            setBatches(Array.isArray(batchData) ? batchData : []);
            setSelectedBatch(''); // Reset batch selection
          }
        } catch (err) {
          console.error('Error fetching batches:', err);
          setError('Failed to load batches. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isSuperAdmin && selectedDepartment) {
      fetchBatches();
    }
  }, [selectedDepartment, isSuperAdmin]);

  const handleAddRule = () => {
    const newId = sectionRules.length > 0 
      ? Math.max(...sectionRules.map(rule => rule.id)) + 1 
      : 1;
    
    setSectionRules([...sectionRules, { id: newId, startUsn: '', endUsn: '', section: '' }]);
  };

  const handleRemoveRule = (id: number) => {
    if (sectionRules.length > 1) {
      setSectionRules(sectionRules.filter(rule => rule.id !== id));
    }
  };

  const handleRuleChange = (id: number, field: keyof SectionRule, value: string) => {
    setSectionRules(
      sectionRules.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const validateRules = () => {
    // Check if any fields are empty
    const hasEmptyFields = sectionRules.some(
      rule => !rule.startUsn || !rule.endUsn || !rule.section
    );
    
    if (hasEmptyFields) {
      setError('All fields in the rules table must be filled.');
      return false;
    }

    // Check for overlapping USN ranges
    for (let i = 0; i < sectionRules.length; i++) {
      const rule1 = sectionRules[i];
      
      for (let j = i + 1; j < sectionRules.length; j++) {
        const rule2 = sectionRules[j];
        
        // Simple string comparison to check for overlaps
        // This assumes USNs follow a consistent format and can be compared lexicographically
        if (
          (rule1.startUsn <= rule2.endUsn && rule2.startUsn <= rule1.endUsn) ||
          (rule2.startUsn <= rule1.endUsn && rule1.startUsn <= rule2.endUsn)
        ) {
          setError(`Overlapping USN ranges detected between rules ${i + 1} and ${j + 1}.`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    // Reset status messages
    setError(null);
    setSuccess(null);
    
    // Validate form inputs
    if (!selectedDepartment) {
      setError('Please select a department.');
      return;
    }
    
    if (!selectedBatch) {
      setError('Please select a batch.');
      return;
    }
    
    if (!validateRules()) {
      return;
    }

    // Prepare payload
    const payload = {
      departmentId: selectedDepartment,
      batchId: selectedBatch,
      rules: sectionRules.map(rule => ({
        startUsn: rule.startUsn,
        endUsn: rule.endUsn,
        section: rule.section
      }))
    };

    setSubmitting(true);
    
    try {
      const response = await axios.patch(`${API_BASE_URL}/students/assign-section-by-usn`, payload);
      
      if (response.data.success) {
        setSuccess(`Sections updated for ${response.data.count} students based on USN ranges.`);
        toast.success(`Sections updated for ${response.data.count} students.`);
      } else {
        setError(response.data.message || 'Failed to assign sections. Please try again.');
      }
    } catch (err: any) {
      console.error('Error assigning sections:', err);
      setError(err.response?.data?.message || 'Failed to assign sections. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ToastContainer />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Auto Assign Sections by USN
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Use the table below to define section assignment based on USN ranges. Students within these ranges will be reassigned accordingly. 
            This will overwrite any existing section values for the selected batch and department.
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
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {isSuperAdmin && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="department-label">Department</InputLabel>
                  <Select
                    labelId="department-label"
                    value={selectedDepartment}
                    label="Department"
                    onChange={(e: any) => setSelectedDepartment(Number(e.target.value))}
                    disabled={isDeptAdmin || submitting}
                  >
                    {Array.isArray(departments) && departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} md={isSuperAdmin ? 6 : 12}>
              <FormControl fullWidth>
                <InputLabel id="batch-label">Batch</InputLabel>
                <Select
                  labelId="batch-label"
                  value={selectedBatch}
                  label="Batch"
                  onChange={(e: any) => setSelectedBatch(String(e.target.value))}
                  disabled={!selectedDepartment || submitting}
                >
                  {Array.isArray(batches) && batches.map((batch) => (
                    <MenuItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Section Assignment Rules
          </Typography>
          
          <Typography variant="body2" color="error" paragraph>
            ⚠️ Make sure the ranges do not overlap.
          </Typography>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Start USN</TableCell>
                  <TableCell>End USN</TableCell>
                  <TableCell>Target Section</TableCell>
                  <TableCell width="50px">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sectionRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="e.g., 4AI22CS001"
                        value={rule.startUsn}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRuleChange(rule.id, 'startUsn', e.target.value)}
                        disabled={submitting}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="e.g., 4AI22CS050"
                        value={rule.endUsn}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRuleChange(rule.id, 'endUsn', e.target.value)}
                        disabled={submitting}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={rule.section}
                          onChange={(e: any) => handleRuleChange(rule.id, 'section', String(e.target.value))}
                          displayEmpty
                          disabled={submitting}
                        >
                          <MenuItem value="" disabled>
                            Select Section
                          </MenuItem>
                          {availableSections.map((section) => (
                            <MenuItem key={section} value={section}>
                              {section}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="error" 
                        onClick={() => handleRemoveRule(rule.id)}
                        disabled={sectionRules.length <= 1 || submitting}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddRule}
              disabled={submitting}
            >
              Add Row
            </Button>
            
            <Box>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitting}
                sx={{ ml: 2 }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Assign Sections'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default StudentSectionAssignment;

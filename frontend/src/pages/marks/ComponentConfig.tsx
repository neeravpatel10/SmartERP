import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  Button,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IAConfigForm from '../../components/marks/IAConfigForm';
import AssignmentConfigForm from '../../components/marks/AssignmentConfigForm';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`component-tabpanel-${index}`}
      aria-labelledby={`component-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ComponentConfig: React.FC = () => {
  const { componentId } = useParams<{ componentId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [component, setComponent] = useState<any>(null);
  
  useEffect(() => {
    const fetchComponent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(
          `/api/marks/exam-components/${componentId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setComponent(response.data.data);
      } catch (err) {
        console.error('Error fetching component:', err);
        setError('Failed to load exam component. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (componentId) {
      fetchComponent();
    }
  }, [componentId, token]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleConfigSaved = () => {
    // Refresh component data if needed
  };
  
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error || !component) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Component not found'}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/marks/components')}
          sx={{ mt: 2 }}
        >
          Back to Components
        </Button>
      </Container>
    );
  }
  
  const showIAConfig = component.componentType === 'CIE';
  const showAssignmentConfig = component.componentType === 'Assignment';
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="#"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
          >
            Dashboard
          </Link>
          <Link 
            color="inherit" 
            href="#"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              navigate('/marks/components');
            }}
          >
            Exam Components
          </Link>
          <Typography color="text.primary">{component.name}</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Configure {component.name}
          </Typography>
          
          <Button 
            startIcon={<ArrowBackIcon />} 
            variant="outlined"
            onClick={() => navigate('/marks/components')}
          >
            Back to Components
          </Button>
        </Box>
        
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Component Details
            </Typography>
            <Typography>
              <strong>Subject:</strong> {component.subject?.name || 'N/A'} ({component.subject?.code || 'N/A'})
            </Typography>
            <Typography>
              <strong>Type:</strong> {component.componentType}
            </Typography>
            <Typography>
              <strong>Maximum Marks:</strong> {component.maxMarks}
            </Typography>
            <Typography>
              <strong>Weightage:</strong> {component.weightagePercent || 'Not specified'}%
            </Typography>
          </Box>
        </Paper>
        
        <Paper elevation={3}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="component configuration tabs">
              {showIAConfig && <Tab label="IA Question Structure" />}
              {showAssignmentConfig && <Tab label="Assignment Structure" />}
              <Tab label="Student Marks" />
            </Tabs>
          </Box>
          
          {showIAConfig && (
            <TabPanel value={tabValue} index={0}>
              <IAConfigForm 
                componentId={Number(componentId)}
                componentName={component.name}
                onConfigSaved={handleConfigSaved}
              />
            </TabPanel>
          )}
          
          {showAssignmentConfig && (
            <TabPanel value={tabValue} index={0}>
              <AssignmentConfigForm 
                componentId={Number(componentId)}
                componentName={component.name}
                onConfigSaved={handleConfigSaved}
              />
            </TabPanel>
          )}
          
          <TabPanel value={tabValue} index={showIAConfig || showAssignmentConfig ? 1 : 0}>
            <Typography variant="h6">Student Marks</Typography>
            <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
              This functionality will be implemented soon. Before entering marks,
              please configure the component structure using the tabs above.
            </Typography>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default ComponentConfig; 
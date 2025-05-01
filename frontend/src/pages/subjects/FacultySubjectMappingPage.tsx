import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab
  // Alert, // Unused
  // CircularProgress, // Unused
} from '@mui/material';
import FacultySubjectMappingTable from '../../components/subjects/FacultySubjectMappingTable';
import FacultySubjectMappingForm from '../../components/subjects/FacultySubjectMappingForm';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mapping-tabpanel-${index}`}
      aria-labelledby={`mapping-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const FacultySubjectMappingPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Department ID based on user role/context
  const departmentId = user?.departmentId || undefined;
  
  // Check if user can approve (Department Admin or Super Admin)
  const canApprove = user?.loginType === 1 || user?.loginType === 3;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMappingChange = () => {
    // Trigger a refresh of the table data
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Subject & Faculty Mapping
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage how subjects are assigned to faculty members. This affects attendance tracking, 
          marks entry, and other teaching-related activities.
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Faculty-Subject Mappings" id="mapping-tab-0" />
            <Tab label="Create New Mapping" id="mapping-tab-1" />
            {canApprove && <Tab label="Pending Approvals" id="mapping-tab-2" />}
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <FacultySubjectMappingTable 
            departmentId={departmentId} 
            key={`mapping-table-${refreshTrigger}`}
            onMappingChange={handleMappingChange}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <FacultySubjectMappingForm 
            departmentId={departmentId}
            onMappingCreated={handleMappingChange}
          />
        </TabPanel>
        
        {canApprove && (
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Pending Approval Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Review and approve or reject faculty-subject mapping requests.
            </Typography>
            <FacultySubjectMappingTable 
              departmentId={departmentId} 
              key={`approval-table-${refreshTrigger}`}
              onMappingChange={handleMappingChange}
              initialFilters={{ status: 'pending' }}
            />
          </TabPanel>
        )}
      </Paper>
    </Container>
  );
};

export default FacultySubjectMappingPage; 
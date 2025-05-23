import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Avatar, 
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { 
  PersonOutline as PersonIcon,
  ContactPhone as ContactIcon,
  School as SchoolIcon,
  LockOutlined as LockIcon
} from '@mui/icons-material';
// No router hooks needed
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';
import BasicTab from './BasicTab';
import ContactTab from './ContactTab';
import AcademicTab from './AcademicTab';
import SecurityTab from './SecurityTab';
import AvatarUploader from './AvatarUploader';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

interface ProfileTabsProps {
  userId?: string | number; // Optional, for admin editing other users
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ userId }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !userId || (user?.id === Number(userId));
  
  // Fetch profile data with retry
  const fetchProfileData = async (retryCount = 0) => {
    console.log(`Starting profile data fetch (attempt ${retryCount + 1}), isOwnProfile:`, isOwnProfile, 'userId:', userId);
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Make sure authorization header is set correctly for the request
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      
      if (!token) {
        console.error('No auth token found in localStorage');
        setError('Authentication token missing. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Set auth header for this specific request
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      if (isOwnProfile) {
        // Fetch own profile
        console.log('Fetching own profile with /auth/me endpoint');
        response = await api.get('/auth/me', config);
        console.log('Profile response received:', response);
      } else {
        // Admin fetch another user's profile
        console.log(`Fetching user profile with ID ${userId}`);
        response = await api.get(`/users/${userId}`, config);
        console.log('Profile response received:', response);
      }
      
      if (response.data.success) {
        console.log('Profile data successfully fetched:', response.data.data);
        setProfileData(response.data.data);
      } else {
        console.warn('Profile API returned failure:', response.data.message);
        setError(response.data.message || 'Failed to load profile data');
        
        // If we got a response but it wasn't successful, try to retry
        if (retryCount < 2) {
          console.log(`Retrying profile fetch (attempt ${retryCount + 2})`);
          setTimeout(() => fetchProfileData(retryCount + 1), 1000);
          return;
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.message || 'An error occurred while loading profile data');
      
      // On network error, try to retry
      if (retryCount < 2) {
        console.log(`Retrying after error (attempt ${retryCount + 2})`);
        setTimeout(() => fetchProfileData(retryCount + 1), 1000);
        return;
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  // Load profile data on component mount
  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  // Note: We're intentionally excluding fetchProfileData from dependencies
  // as it would cause an infinite loop since it depends on isOwnProfile which depends on userId

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle profile update
  const handleProfileUpdate = async (data: any): Promise<void> => {
    try {
      let response;
      
      // Make sure authorization header is set correctly for the request
      const token = localStorage.getItem('token');
      console.log('Token available for update:', !!token);
      
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }
      
      // Set auth header for this specific request
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      if (isOwnProfile) {
        // Update own profile using the correct endpoint with /auth prefix
        console.log('Updating own profile with /auth/me endpoint');
        response = await api.put('/auth/me', data, config);
      } else {
        // Admin update another user's profile
        console.log(`Updating user profile with ID ${userId}`);
        response = await api.put(`/users/${userId}`, data, config);
      }
      
      if (response.data.success) {
        showSuccess('Profile updated successfully');
        // Update local state with the updated data
        setProfileData((prevData: any) => ({
          ...prevData,
          ...data
        }));
      } else {
        showError(response.data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showError(error.message || 'An error occurred while updating profile');
    }
  };

  // Handle avatar change
  const handleAvatarChange = (url: string) => {
    setProfileData((prevData: any) => ({
      ...prevData,
      avatarUrl: url
    }));
  };

  // Handle retry on error
  const handleRetry = () => {
    setIsRetrying(true);
    fetchProfileData();
  };

  // Determine user role for display
  const getUserRoleLabel = (loginType: number) => {
    switch (loginType) {
      case -1: return 'Student';
      case 1: return 'Super Admin';
      case 2: return 'Faculty';
      case 3: return 'Department Admin';
      default: return 'Unknown';
    }
  };

  const getUserRoleColor = (loginType: number) => {
    switch (loginType) {
      case -1: return 'default';
      case 1: return 'error';
      case 2: return 'primary';
      case 3: return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRetry} disabled={isRetrying}>
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Cover image and profile header */}
      <Paper 
        sx={{ 
          borderRadius: 0, 
          position: 'relative', 
          bgcolor: '#f5f5f5',
          height: { xs: 120, sm: 160 },
          backgroundImage: 'linear-gradient(to right, #8e2de2, #4a00e0)',
          mb: 8
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: -50,
            left: { xs: 16, sm: 32 },
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <Box sx={{ position: 'relative' }}>
            {isOwnProfile ? (
              <AvatarUploader
                currentAvatar={profileData?.avatarUrl}
                onAvatarChange={handleAvatarChange}
              />
            ) : (
              <Avatar
                src={profileData?.avatarUrl}
                sx={{ 
                  width: 96, 
                  height: 96,
                  border: '4px solid white'
                }}
              />
            )}
          </Box>
          <Box sx={{ ml: 2, mb: 1 }}>
            <Typography variant="h5" component="h1" color="white" sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              {profileData?.name || profileData?.username || 'User Profile'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip 
                label={getUserRoleLabel(profileData?.loginType)}
                color={getUserRoleColor(profileData?.loginType) as any}
                size="small"
              />
              {profileData?.department && (
                <Chip 
                  label={profileData.department.name}
                  color="info"
                  size="small"
                />
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'white', zIndex: 10 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="profile tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              minWidth: { xs: 'auto', sm: 160 },
            },
            '& .Mui-selected': {
              color: '#8e2de2 !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#8e2de2',
            },
          }}
        >
          <Tab 
            label="Basic" 
            icon={<PersonIcon />} 
            iconPosition="start"
            {...a11yProps(0)} 
          />
          <Tab 
            label="Contact" 
            icon={<ContactIcon />} 
            iconPosition="start"
            {...a11yProps(1)} 
          />
          <Tab 
            label="Academic" 
            icon={<SchoolIcon />} 
            iconPosition="start"
            {...a11yProps(2)} 
          />
          <Tab 
            label="Security" 
            icon={<LockIcon />} 
            iconPosition="start"
            {...a11yProps(3)} 
          />
        </Tabs>
      </Box>

      {/* Tab panels */}
      <TabPanel value={tabValue} index={0}>
        <BasicTab 
          profileData={profileData} 
          isOwnProfile={isOwnProfile} 
          onUpdate={handleProfileUpdate}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <ContactTab 
          profileData={profileData} 
          isOwnProfile={isOwnProfile} 
          onUpdate={handleProfileUpdate}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <AcademicTab 
          profileData={profileData} 
          isOwnProfile={isOwnProfile} 
          onUpdate={handleProfileUpdate}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <SecurityTab isOwnProfile={isOwnProfile} />
      </TabPanel>
    </Box>
  );
};

export default ProfileTabs;

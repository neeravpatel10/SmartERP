import React, { useEffect } from 'react';
import { Container, Paper, CircularProgress, Box } from '@mui/material';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileTabs from '../components/profile/ProfileTabs';

const ProfilePage: React.FC = () => {
  console.log('ProfilePage component rendering');
  const { user, isAdmin, isDeptAdmin } = useAuth();
  console.log('ProfilePage auth context:', { 
    userExists: !!user,
    userId: user?.id,
    isAdmin, 
    isDeptAdmin 
  });
  const { id } = useParams<{ id: string }>();
  console.log('ProfilePage params id:', id);
  const location = useLocation();
  
  // Add a useEffect to log when component mounts and unmounts
  useEffect(() => {
    console.log('ProfilePage mounted, pathname:', location.pathname);
    return () => {
      console.log('ProfilePage unmounted');
    };
  }, [location.pathname]);
  
  // Check for loading state first
  const userLoading = !user;
  if (userLoading) {
    console.log('ProfilePage: User data loading or not available yet');
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <div style={{ marginLeft: 16 }}>Loading profile data...</div>
        </Box>
      </Container>
    );
  }
  
  // Check if user is authorized to view this profile
  const isViewingOtherUser = !!id;
  console.log('ProfilePage isViewingOtherUser:', isViewingOtherUser);
  
  // Only admins can view other users' profiles
  if (isViewingOtherUser && !isAdmin && !isDeptAdmin) {
    console.log('ProfilePage: Unauthorized to view other profile, redirecting');
    return <Navigate to="/unauthorized" />;
  }
  
  console.log('ProfilePage: Rendering profile content');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ overflow: 'hidden' }}>
        <ProfileTabs userId={id} />
      </Paper>
    </Container>
  );
};

export default ProfilePage;

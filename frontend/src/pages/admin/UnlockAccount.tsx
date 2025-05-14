import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import api from '../../utils/api';
import { unlockAccount, resetAccountUnlockState } from '../../store/auth/authSlice';
import { RootState, AppDispatch } from '../../store';

interface LockedUser {
  id: string;
  username: string;
  name: string;
  loginAttempts: number;
  lockedAt: string;
}

// Update AuthState interface in the authSlice to include accountUnlockSuccess
declare module '../../store/auth/authSlice' {
  interface AuthState {
    accountUnlockSuccess?: boolean;
  }
}

const UnlockAccount: React.FC = () => {
  const [lockedUsers, setLockedUsers] = useState<LockedUser[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const fetchLockedUsers = async () => {
    try {
      const response = await api.get('/admin/locked-users');
      if (response.data.success) {
        setLockedUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching locked users:', err);
      setFetchError('Failed to fetch locked users');
    }
  };

  useEffect(() => {
    fetchLockedUsers();
    
    return () => {
      // Cleanup
      dispatch(resetAccountUnlockState());
    };
  }, [dispatch]);

  const handleUserChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedUserId(event.target.value as string);
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) return;
    
    // Dispatch unlock action
    dispatch(unlockAccount({ userId: selectedUserId }));
    
    // Refresh the list of locked users after successful unlock
    if (auth.accountUnlockSuccess) {
      fetchLockedUsers();
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Unlock User Accounts
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          Select a locked user account to unlock
        </Typography>
        
        {fetchError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fetchError}
          </Alert>
        )}
        
        {auth.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {auth.error}
          </Alert>
        )}
        
        {auth.accountUnlockSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Account successfully unlocked
          </Alert>
        )}
        
        {lockedUsers.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No locked user accounts found
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleUnlockSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="user-select-label">Select User</InputLabel>
              <Select
                labelId="user-select-label"
                id="user-select"
                value={selectedUserId}
                onChange={handleUserChange}
                label="Select User"
              >
                {lockedUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.username}) - Locked at: {new Date(user.lockedAt).toLocaleString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!selectedUserId || auth.loading}
              >
                {auth.loading ? 'Unlocking...' : 'Unlock Account'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UnlockAccount; 
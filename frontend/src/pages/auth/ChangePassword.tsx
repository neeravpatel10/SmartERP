import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { changePassword, resetError, updateUserFirstLogin } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Grid, 
  Alert, 
  LinearProgress, 
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import { useToast } from '../../hooks/useToast';

const ChangePassword: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const { showSuccess } = useToast();
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Only redirect to dashboard after password is changed or if it's a forced first login
  useEffect(() => {
    // Check if this is a forced first login
    const isForceFirstLoginChange = user?.firstLogin === true;
    
    // Only redirect in two cases:
    // 1. If password was successfully changed
    // 2. If this is NOT a forced first login but user explicitly navigated here
    if (passwordChanged || (isForceFirstLoginChange && user)) {
      navigate('/dashboard');
    }
  }, [user, passwordChanged, navigate]);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear specific field error when typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    
    // Clear API error when typing
    if (error) {
      dispatch(resetError());
    }

    // Update password strength when new password changes
    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
      isValid = false;
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter';
      isValid = false;
    } else if (!/[a-z]/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain at least one lowercase letter';
      isValid = false;
    } else if (!/[0-9]/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain at least one number';
      isValid = false;
    } else if (!/[^A-Za-z0-9]/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain at least one special character';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const resultAction = await dispatch(
        changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }) as any
      );
      
      if (changePassword.fulfilled.match(resultAction)) {
        showSuccess('Password updated successfully');
        // Update local state to trigger redirect
        setPasswordChanged(true);
        // Update user state
        dispatch(updateUserFirstLogin(false));
        
        // Set a timeout to redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      // Error handling is done in the reducer
    }
  };

  // Function to calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 20;
    
    // Character type checks
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    
    return strength;
  };

  // Function to get color based on password strength
  const getStrengthColor = (strength: number): string => {
    if (strength < 40) return '#f44336'; // Red
    if (strength < 70) return '#ff9800'; // Orange
    return '#4caf50'; // Green
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardHeader 
              title="Change Password" 
              subheader="Update your password for enhanced security"
              avatar={<LockIcon color="primary" />}
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '& .MuiCardHeader-subheader': {
                  color: 'rgba(255, 255, 255, 0.8)'
                }
              }}
            />
            <Divider />
            <CardContent>
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="currentPassword"
                  label="Current Password"
                  type="password"
                  id="currentPassword"
                  autoComplete="current-password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  error={!!formErrors.currentPassword}
                  helperText={formErrors.currentPassword}
                  disabled={loading}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="newPassword"
                  label="New Password"
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={!!formErrors.newPassword}
                  helperText={formErrors.newPassword}
                  disabled={loading}
                />
                
                {formData.newPassword && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength}
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        bgcolor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getStrengthColor(passwordStrength),
                        },
                      }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 0.5,
                        fontSize: '0.75rem',
                      }}
                    >
                      <span>Weak</span>
                      <span>Medium</span>
                      <span>Strong</span>
                    </Box>
                  </Box>
                )}
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  disabled={loading}
                />
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChangePassword;
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, LinearProgress, Box } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
}

interface PasswordFormInputs {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const schema = yup.object().shape({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

// Calculate password strength
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

const getStrengthColor = (strength: number): string => {
  if (strength < 40) return '#f44336'; // Red
  if (strength < 70) return '#ff9800'; // Orange
  return '#4caf50'; // Green
};

export const PasswordModal: React.FC<PasswordModalProps> = ({ open, onClose }) => {
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<PasswordFormInputs>({
    resolver: yupResolver(schema),
    mode: 'onChange',
  });

  // Watch the new password for the strength meter
  // Watch the new password value and calculate strength when it changes
  const newPassword = watch('newPassword') as string;
  React.useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword || ''));
  }, [newPassword]);

  const onSubmit = async (data: PasswordFormInputs) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.data.success) {
        showSuccess('Password updated successfully');
        reset();
        onClose();
        
        // Set a timeout to log out the user
        let countdown = 5;
        const logoutTimer = setInterval(() => {
          showSuccess(`Password updated, logging out in ${countdown} seconds...`);
          countdown--;
          if (countdown < 0) {
            clearInterval(logoutTimer);
            logout();
          }
        }, 1000);
      } else {
        showError(response.data.message || 'Failed to update password');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      showError(error.message || 'An error occurred while updating password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Change Password</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            margin="dense"
            label="Current Password"
            type="password"
            fullWidth
            {...register('currentPassword')}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword?.message}
            disabled={isSubmitting}
          />
          <TextField
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            {...register('newPassword')}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
            disabled={isSubmitting}
          />
          {newPassword && (
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
            margin="dense"
            label="Confirm New Password"
            type="password"
            fullWidth
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            disabled={isSubmitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={!isValid || isSubmitting}
          >
            Update Password
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PasswordModal;

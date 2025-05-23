import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import PasswordModal from './PasswordModal';

interface SecurityTabProps {
  isOwnProfile: boolean;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ isOwnProfile }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleOpenPasswordModal = () => {
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <LockIcon color="action" sx={{ mr: 2 }} />
        <Typography variant="h6">Account Security</Typography>
      </Box>

      <Typography variant="body2" color="textSecondary" paragraph>
        Manage your account password and security settings. We recommend changing your password regularly for enhanced security.
      </Typography>

      {isOwnProfile ? (
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenPasswordModal}
          startIcon={<LockIcon />}
          sx={{ mt: 2 }}
        >
          Change Password
        </Button>
      ) : (
        <Typography variant="body2" color="error">
          You can only change the password for your own account.
        </Typography>
      )}

      <PasswordModal
        open={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
      />
    </Box>
  );
};

export default SecurityTab;

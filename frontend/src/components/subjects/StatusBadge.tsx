import React from 'react';
import { Chip } from '@mui/material';
import DraftsIcon from '@mui/icons-material/Drafts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ArchiveIcon from '@mui/icons-material/Archive';

type StatusType = 'draft' | 'active' | 'locked' | 'archived';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'small' | 'medium';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'draft':
        return {
          icon: <DraftsIcon />,
          label: 'Draft',
          color: 'warning' as const,
          variant: 'outlined' as const
        };
      case 'active':
        return {
          icon: <CheckCircleIcon />,
          label: 'Active',
          color: 'success' as const,
          variant: 'outlined' as const
        };
      case 'locked':
        return {
          icon: <LockIcon />,
          label: 'Locked',
          color: 'error' as const,
          variant: 'outlined' as const
        };
      case 'archived':
        return {
          icon: <ArchiveIcon />,
          label: 'Archived',
          color: 'default' as const,
          variant: 'outlined' as const
        };
      default:
        return {
          icon: <DraftsIcon />,
          label: 'Unknown',
          color: 'default' as const,
          variant: 'outlined' as const
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      variant={config.variant}
      size={size}
    />
  );
};

export default StatusBadge; 
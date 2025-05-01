import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

type StatusType = 'draft' | 'active' | 'locked' | 'archived';

interface StatusTransitionModalProps {
  open: boolean;
  onClose: () => void;
  subjectId: number;
  subjectName: string;
  targetStatus: StatusType;
  onTransitionComplete: () => void;
}

const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  open,
  onClose,
  subjectId,
  subjectName,
  targetStatus,
  onTransitionComplete
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<any>(null);

  useEffect(() => {
    if (open) {
      validateTransition();
    }
  }, [open, subjectId, targetStatus]);

  const validateTransition = async () => {
    setValidating(true);
    setError(null);

    try {
      const response = await axios.post(
        `/api/lifecycle/subjects/${subjectId}/validate-transition`,
        { targetStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setValidationData(response.data.data);
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate status transition. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const handleTransition = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      switch (targetStatus) {
        case 'active':
          endpoint = `/api/lifecycle/subjects/${subjectId}/activate`;
          break;
        case 'locked':
          endpoint = `/api/lifecycle/subjects/${subjectId}/lock`;
          break;
        case 'archived':
          endpoint = `/api/lifecycle/subjects/${subjectId}/archive`;
          break;
        default:
          throw new Error('Invalid target status');
      }

      await axios.put(
        endpoint,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      onTransitionComplete();
      onClose();
    } catch (err: any) {
      console.error('Transition error:', err);
      setError(err.response?.data?.message || 'Failed to transition subject status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTransitionTitle = () => {
    switch (targetStatus) {
      case 'active':
        return 'Activate Subject';
      case 'locked':
        return 'Lock Subject';
      case 'archived':
        return 'Archive Subject';
      default:
        return 'Change Subject Status';
    }
  };

  const getTransitionMessage = () => {
    switch (targetStatus) {
      case 'active':
        return `Are you sure you want to activate the subject "${subjectName}"? This will enable attendance tracking and mark entry.`;
      case 'locked':
        return `Are you sure you want to lock the subject "${subjectName}"? This will prevent further edits to marks and attendance.`;
      case 'archived':
        return `Are you sure you want to archive the subject "${subjectName}"? This will make it read-only and move it to the archives.`;
      default:
        return `Are you sure you want to change the status of "${subjectName}"?`;
    }
  };

  const renderChecklist = () => {
    if (!validationData || !validationData.checks) {
      return null;
    }

    const { checks } = validationData;
    const checkItems = [];

    if (targetStatus === 'active') {
      checkItems.push({
        label: 'Category assigned',
        value: checks.hasCategory || false
      });
      checkItems.push({
        label: 'Faculty mapped',
        value: checks.hasFacultyMappings || false
      });
      checkItems.push({
        label: 'Exam components created',
        value: checks.hasComponents || false
      });
    } else if (targetStatus === 'locked') {
      checkItems.push({
        label: 'Exam components created',
        value: checks.hasComponents || false
      });
      checkItems.push({
        label: 'Marks recorded',
        value: checks.hasMarks || false
      });
      checkItems.push({
        label: 'Attendance sessions created',
        value: checks.hasAttendance || false
      });
    }

    return (
      <List sx={{ mt: 2, mb: 2 }}>
        {checkItems.map((item, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              {item.value ? (
                <CheckCircleIcon color="success" />
              ) : (
                <CancelIcon color="error" />
              )}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="transition-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="transition-dialog-title">
        {getTransitionTitle()}
      </DialogTitle>
      <DialogContent>
        {validating ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress />
          </div>
        ) : (
          <>
            <DialogContentText>
              {getTransitionMessage()}
            </DialogContentText>

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}

            {validationData && !validationData.valid && (
              <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon sx={{ mr: 1 }} />
                  {validationData.message}
                </div>
              </Alert>
            )}

            <Divider sx={{ mt: 2, mb: 2 }} />

            {renderChecklist()}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleTransition} 
          color="primary" 
          variant="contained"
          disabled={loading || validating || (validationData && !validationData.valid)}
        >
          {loading ? <CircularProgress size={24} /> : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusTransitionModal; 
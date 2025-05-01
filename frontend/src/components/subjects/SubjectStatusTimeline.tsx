import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import DraftsIcon from '@mui/icons-material/Drafts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ArchiveIcon from '@mui/icons-material/Archive';
import PersonIcon from '@mui/icons-material/Person';

interface SubjectStatusTimelineProps {
  subjectId: number;
}

interface StatusLog {
  id: number;
  subjectId: number;
  status: string;
  createdAt: string;
  updatedBy: {
    id: number;
    name: string;
  };
}

const SubjectStatusTimeline: React.FC<SubjectStatusTimelineProps> = ({ subjectId }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);

  useEffect(() => {
    fetchStatusHistory();
  }, [subjectId]);

  const fetchStatusHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/lifecycle/subjects/${subjectId}/status-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatusLogs(response.data.data);
    } catch (err) {
      console.error('Error fetching status history:', err);
      setError('Failed to load status history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <DraftsIcon />;
      case 'active':
        return <CheckCircleIcon />;
      case 'locked':
        return <LockIcon />;
      case 'archived':
        return <ArchiveIcon />;
      default:
        return <DraftsIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'grey';
      case 'active':
        return 'success';
      case 'locked':
        return 'primary';
      case 'archived':
        return 'warning';
      default:
        return 'grey';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Created as Draft';
      case 'active':
        return 'Activated';
      case 'locked':
        return 'Locked';
      case 'archived':
        return 'Archived';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (statusLogs.length === 0) {
    return <Alert severity="info">No status history available.</Alert>;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Status History
        </Typography>
        <Timeline position="alternate">
          {statusLogs.map((log, index) => (
            <TimelineItem key={log.id}>
              <TimelineOppositeContent sx={{ color: 'text.secondary' }}>
                {formatDate(log.createdAt)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={getStatusColor(log.status) as any}>
                  {getStatusIcon(log.status)}
                </TimelineDot>
                {index < statusLogs.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={3} sx={{ padding: 2, maxWidth: 300 }}>
                  <Typography variant="h6" component="h1">
                    {getStatusTitle(log.status)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                    By: {log.updatedBy.name}
                  </Typography>
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
};

export default SubjectStatusTimeline; 
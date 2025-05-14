import React from 'react';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';

interface StatusLogEntry {
  id: number;
  status: 'draft' | 'active' | 'locked' | 'archived';
  changedBy: number | string;
  timestamp: string;
  user?: {
    username: string;
  };
}

interface SubjectStatusLogProps {
  logs: StatusLogEntry[];
}

const SubjectStatusLog: React.FC<SubjectStatusLogProps> = ({ logs }) => {
  // Function to get a badge for each status
  const getStatusBadge = (status: string) => {
    let badgeVariant = '';
    let badgeText = '';
    
    switch (status) {
      case 'draft':
        badgeText = 'Draft';
        badgeVariant = 'warning';
        break;
      case 'active':
        badgeText = 'Active';
        badgeVariant = 'success';
        break;
      case 'locked':
        badgeText = 'Locked';
        badgeVariant = 'danger';
        break;
      case 'archived':
        badgeText = 'Archived';
        badgeVariant = 'secondary';
        break;
      default:
        badgeText = status;
        badgeVariant = 'light';
    }
    
    return <Badge bg={badgeVariant}>{badgeText}</Badge>;
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!logs || logs.length === 0) {
    return <p>No status transitions recorded yet.</p>;
  }

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Date & Time</th>
          <th>Status</th>
          <th>Changed By</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td>{formatTimestamp(log.timestamp)}</td>
            <td>{getStatusBadge(log.status)}</td>
            <td>{log.user?.username || log.changedBy}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default SubjectStatusLog; 
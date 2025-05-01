import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container } from '@mui/material';

interface Subject {
  id: number;
  code: string;
  name: string;
  semester: number;
  credits: number;
  isLab: boolean;
  status: 'draft' | 'active' | 'locked' | 'archived';
  lockedAt: string | null;
  archivedAt: string | null;
  departmentId: number;
  categoryId: number | null;
  schemeYear: number | null;
  department: {
    code: string;
    name: string;
  };
  category: {
    code: string;
    name: string;
  } | null;
  facultyMappings: {
    faculty: {
      id: number;
      firstName: string;
      lastName: string;
    };
  }[];
  statusLogs: {
    id: number;
    status: 'draft' | 'active' | 'locked' | 'archived';
    changedBy: number;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

const SubjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const navigate = useNavigate();

  // Wrap fetchSubjectDetails in useCallback
  const fetchSubjectDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/subjects/${id}`);
      setSubject(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching subject details:', error);
      setError(error.response?.data?.message || 'Failed to fetch subject details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubjectDetails();
  }, [fetchSubjectDetails]); // Use fetchSubjectDetails from useCallback

  const handleStatusChangeClick = (newStatus: string) => {
    setTargetStatus(newStatus);
    setShowModal(true);
  };

  const handleStatusChange = async () => {
    try {
      await axios.put(`/api/subjects/${id}/status`, { 
        status: targetStatus 
      });
      
      alert(`Subject status changed to ${targetStatus}`);
      fetchSubjectDetails();
      setShowModal(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Status validation checks
  const getStatusChecks = () => {
    const checks = [];
    
    // Faculty assignment check
    if (subject?.facultyMappings && subject.facultyMappings.length > 0) {
      checks.push({ 
        label: 'Faculty assigned', 
        passed: true 
      });
    } else {
      checks.push({ 
        label: 'Faculty assigned', 
        passed: false,
        warning: 'No faculty members have been assigned to this subject'
      });
    }
    
    // Category check
    if (subject?.categoryId) {
      checks.push({ 
        label: 'Subject category selected', 
        passed: true 
      });
    } else {
      checks.push({ 
        label: 'Subject category selected', 
        passed: false,
        warning: 'Subject category must be selected before making active'
      });
    }
    
    return checks;
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    let badgeText = '';
    let badgeClass = '';
    
    switch (status) {
      case 'draft':
        badgeText = '🟡 Draft';
        badgeClass = 'badge-yellow';
        break;
      case 'active':
        badgeText = '🟢 Active';
        badgeClass = 'badge-green';
        break;
      case 'locked':
        badgeText = '🔒 Locked';
        badgeClass = 'badge-red';
        break;
      case 'archived':
        badgeText = '📦 Archived';
        badgeClass = 'badge-gray';
        break;
      default:
        badgeText = 'Unknown';
        badgeClass = 'badge-default';
    }
    
    return <span className={`badge ${badgeClass}`}>{badgeText}</span>;
  };

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get available status transitions based on current status
  const getAvailableTransitions = () => {
    if (!subject) return [];
    
    switch (subject.status) {
      case 'draft':
        return [{ value: 'active', label: 'Set to Active', className: 'btn-green' }];
      case 'active':
        return [{ value: 'locked', label: 'Lock Subject', className: 'btn-orange' }];
      case 'locked':
        return [
          { value: 'active', label: 'Unlock Subject', className: 'btn-green' },
          { value: 'archived', label: 'Archive Subject', className: 'btn-gray' }
        ];
      case 'archived':
        return [];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading subject details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  if (!subject) {
    return <div>Subject not found</div>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <div className="subject-detail-container">
        <div className="subject-header">
          <h1 className="subject-title">{subject.code}: {subject.name}</h1>
          {getStatusBadge(subject.status)}
        </div>

        <button
          className="btn btn-blue"
          onClick={() => navigate('/subjects')}
        >
          Back to Subjects
        </button>

        <div className="subject-content">
          {/* Subject Details Card */}
          <div className="card">
            <div className="card-header">
              <h2>Subject Details</h2>
            </div>
            <div className="card-body">
              <div className="detail-row">
                <span className="detail-label">Department:</span>
                <span>{subject.department?.name} ({subject.department?.code})</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Semester:</span>
                <span>{subject.semester}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Credits:</span>
                <span>{subject.credits}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span>{subject.isLab ? 'Laboratory' : 'Theory'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span>{subject.category ? `${subject.category.name} (${subject.category.code})` : 'Not Assigned'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Scheme Year:</span>
                <span>{subject.schemeYear || 'Not Specified'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created At:</span>
                <span>{formatDate(subject.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span>{formatDate(subject.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Lifecycle Info Card */}
          <div className="card">
            <div className="card-header">
              <h2>Lifecycle Information</h2>
            </div>
            <div className="card-body">
              <div className="status-details">
                <div className="status-label">Current Status</div>
                <div className="status-value">{subject.status.toUpperCase()}</div>
                <div className="status-meta">
                  {subject.status === 'locked' && subject.lockedAt && `Locked at: ${formatDate(subject.lockedAt)}`}
                  {subject.status === 'archived' && subject.archivedAt && `Archived at: ${formatDate(subject.archivedAt)}`}
                </div>
              </div>
              
              <hr className="divider" />
              
              <div className="status-actions">
                <p className="action-label">Available Actions:</p>
                <div className="action-buttons">
                  {getAvailableTransitions().map((transition) => (
                    <button
                      key={transition.value}
                      className={`btn ${transition.className}`}
                      onClick={() => handleStatusChangeClick(transition.value)}
                    >
                      {transition.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="subject-content">
          {/* Faculty Card */}
          <div className="card">
            <div className="card-header">
              <h2>Assigned Faculty</h2>
            </div>
            <div className="card-body">
              {subject.facultyMappings && subject.facultyMappings.length > 0 ? (
                <ul className="faculty-list">
                  {subject.facultyMappings.map((mapping) => (
                    <li key={mapping.faculty.id} className="faculty-item">
                      <span className="arrow">→</span> {mapping.faculty.firstName} {mapping.faculty.lastName}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="warning-message">
                  No faculty assigned to this subject
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline Card */}
          <div className="card">
            <div className="card-header">
              <h2>Status Timeline</h2>
            </div>
            <div className="card-body timeline-container">
              {subject.statusLogs && subject.statusLogs.length > 0 ? (
                <table className="timeline-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Changed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject.statusLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{getStatusBadge(log.status)}</td>
                        <td>{formatDate(log.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No status history found</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Change Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Confirm Status Change to {targetStatus.charAt(0).toUpperCase() + targetStatus.slice(1)}</h3>
                <button className="close-button" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to change the subject status from{' '}
                  <strong>{subject.status}</strong> to <strong>{targetStatus}</strong>?
                </p>
                
                <p className="check-heading">Validation Checks:</p>
                <ul className="validation-list">
                  {getStatusChecks().map((check, index) => (
                    <li key={index} className={`validation-item ${check.passed ? 'passed' : 'warning'}`}>
                      <span className="check-icon">{check.passed ? '✓' : '⚠️'}</span>
                      {check.label} {!check.passed && check.warning && (
                        <div className="warning-text">
                          Warning: {check.warning}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                
                {targetStatus === 'locked' && (
                  <div className="warning-message">
                    Locking will prevent further edits to marks and attendance.
                  </div>
                )}
                
                {targetStatus === 'archived' && (
                  <div className="warning-message">
                    Archiving is permanent and cannot be reversed. The subject will be read-only.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-gray" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-blue" onClick={handleStatusChange}>
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default SubjectDetail; 
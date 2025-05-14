import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Badge, Spinner, Alert } from 'react-bootstrap';
import { facultySubjectMappingService } from '../../services/facultySubjectMappingService';
import ButtonLink from '../../components/common/ButtonLink';

interface Mapping {
  id: number;
  facultyId: string;
  subjectId: number;
  section: string | null;
  semester: number;
  batchId: string;
  academicYear: string;
  componentScope: string;
  isPrimary: boolean;
  active: boolean;
  faculty: {
    id: string;
    name: string;
  };
  subject: {
    id: number;
    name: string;
    code: string;
    semester: number;
  };
  batch: {
    id: string;
    name: string;
    academicYear: string;
  };
}

const FacultyDashboard: React.FC = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('current');
  
  // Role-based features will be implemented later
  
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        setLoading(true);
        
        // Get current academic year
        // We'll use the current date for filtering in the future
        // const now = new Date();
        
        // Fetch all mappings for the logged-in faculty
        // The backend filters by faculty ID based on the authenticated user
        const response = await facultySubjectMappingService.getAllMappings({
          active: true
        });
        
        setMappings(response.data || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching subject mappings:', err);
        setError(err.response?.data?.message || 'Failed to load subject mappings');
        setLoading(false);
      }
    };
    
    fetchMappings();
  }, []);
  
  // Filter mappings based on active tab
  const filteredMappings = mappings.filter(mapping => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const currentAcademicYear = month < 6 ? `${year-1}-${year}` : `${year}-${year+1}`;
    
    if (activeTab === 'current') {
      return mapping.academicYear === currentAcademicYear;
    } else {
      return mapping.academicYear !== currentAcademicYear;
    }
  });
  
  // Group mappings by semester
  const groupedMappings: { [key: string]: Mapping[] } = {};
  filteredMappings.forEach(mapping => {
    const key = `Semester ${mapping.semester}`;
    if (!groupedMappings[key]) {
      groupedMappings[key] = [];
    }
    groupedMappings[key].push(mapping);
  });
  
  return (
    <Container fluid className="p-4">
      <h2 className="mb-4">Faculty Dashboard</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'current')}
            className="mb-3"
          >
            <Tab eventKey="current" title="Current Academic Year" />
            <Tab eventKey="past" title="Past Academic Years" />
          </Tabs>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : filteredMappings.length === 0 ? (
            <Alert variant="info">
              No subjects assigned for {activeTab === 'current' ? 'current academic year' : 'past academic years'}.
            </Alert>
          ) : (
            Object.keys(groupedMappings).map(semester => (
              <div key={semester} className="mb-4">
                <h4 className="mb-3">{semester}</h4>
                <Row>
                  {groupedMappings[semester].map(mapping => (
                    <Col key={mapping.id} md={6} lg={4} className="mb-3">
                      <Card className="h-100">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                          <span>{mapping.subject.code}</span>
                          {mapping.isPrimary && <Badge bg="success">Primary</Badge>}
                        </Card.Header>
                        <Card.Body>
                          <Card.Title>{mapping.subject.name}</Card.Title>
                          <div className="mb-3">
                            <div>
                              <strong>Batch:</strong> {mapping.batch.name}
                            </div>
                            <div>
                              <strong>Section:</strong> {mapping.section || 'All Sections'}
                            </div>
                            <div>
                              <strong>Academic Year:</strong> {mapping.academicYear}
                            </div>
                            <div>
                              <strong>Component:</strong>{' '}
                              {mapping.componentScope === 'theory' && 'Theory'}
                              {mapping.componentScope === 'lab' && 'Lab'}
                              {mapping.componentScope === 'both' && 'Theory & Lab'}
                            </div>
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            <ButtonLink
                              to={`/faculty/students/${mapping.id}`}
                              variant="outline-primary"
                              size="sm"
                            >
                              View Students
                            </ButtonLink>
                            
                            {(mapping.componentScope === 'theory' || mapping.componentScope === 'both') && (
                              <ButtonLink
                                to={`/attendance/theory/${mapping.subject.id}/${mapping.section || 'all'}`}
                                variant="outline-success"
                                size="sm"
                              >
                                Theory Attendance
                              </ButtonLink>
                            )}
                            
                            {(mapping.componentScope === 'lab' || mapping.componentScope === 'both') && (
                              <ButtonLink
                                to={`/attendance/lab/${mapping.subject.id}/${mapping.section || 'all'}`}
                                variant="outline-info"
                                size="sm"
                              >
                                Lab Attendance
                              </ButtonLink>
                            )}
                            
                            <ButtonLink
                              to={`/marks/subject/${mapping.subject.id}/${mapping.section || 'all'}`}
                              variant="outline-warning"
                              size="sm"
                            >
                              Marks
                            </ButtonLink>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ))
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FacultyDashboard;

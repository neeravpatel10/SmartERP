import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { facultySubjectMappingService } from '../../services/facultySubjectMappingService';
import ButtonLink from '../../components/common/ButtonLink';

interface Student {
  usn: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: string;
  semester: number;
  section: string;
}

interface Mapping {
  id: number;
  semester: number;
  section: string | null;
  subject: {
    id: number;
    name: string;
    code: string;
  };
  batch: {
    id: string;
    name: string;
    academicYear: string;
  };
  componentScope: string;
}

const FacultySubjectStudents: React.FC = () => {
  const { mappingId } = useParams<{ mappingId: string }>();
  
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStudents = async () => {
      if (!mappingId) return;
      
      try {
        setLoading(true);
        
        const response = await facultySubjectMappingService.getStudentsForMapping(parseInt(mappingId));
        
        setMapping(response.data.mapping);
        setStudents(response.data.students || []);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching students:', err);
        setError(err.response?.data?.message || 'Failed to load students');
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [mappingId]);
  
  // Export students list to CSV
  const exportToCSV = () => {
    if (!students.length || !mapping) return;
    
    const headers = ['USN', 'Name', 'Email', 'Phone', 'Gender', 'Section'];
    
    const csvRows = [
      headers.join(','), // Header row
      ...students.map(student => [
        student.usn,
        `"${student.name}"`, // Wrap in quotes to handle names with commas
        student.email || '',
        student.phone || '',
        student.gender || '',
        student.section
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${mapping.subject.code}_students.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Container fluid className="p-4">
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : mapping ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Students List</h2>
            <div>
              <ButtonLink 
                variant="primary" 
                to="/faculty/dashboard" 
                className="me-2"
              >
                Back to Dashboard
              </ButtonLink>
              
              <Button 
                variant="success" 
                onClick={exportToCSV}
                disabled={students.length === 0}
              >
                Export to CSV
              </Button>
            </div>
          </div>
          
          <Card className="mb-4">
            <Card.Header>
              <h4>{mapping.subject.name} ({mapping.subject.code})</h4>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <p className="mb-1"><strong>Semester:</strong> {mapping.semester}</p>
                <p className="mb-1"><strong>Section:</strong> {mapping.section || 'All Sections'}</p>
                <p className="mb-1"><strong>Batch:</strong> {mapping.batch.name} ({mapping.batch.academicYear})</p>
                <p className="mb-0">
                  <strong>Component:</strong>{' '}
                  {mapping.componentScope === 'theory' && 'Theory'}
                  {mapping.componentScope === 'lab' && 'Lab'}
                  {mapping.componentScope === 'both' && 'Theory & Lab'}
                </p>
              </div>
              
              <div className="mb-3">
                <ButtonLink 
                  variant="outline-primary" 
                  to={`/attendance/${mapping.componentScope === 'lab' ? 'lab' : 'theory'}/${mapping.subject.id}/${mapping.section || 'all'}`}
                  className="me-2"
                >
                  Manage Attendance
                </ButtonLink>
                
                <ButtonLink 
                  variant="outline-success" 
                  to={`/marks/subject/${mapping.subject.id}/${mapping.section || 'all'}`}
                >
                  Manage Marks
                </ButtonLink>
              </div>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h4 className="mb-0">Students ({students.length})</h4>
            </Card.Header>
            <Card.Body>
              {students.length === 0 ? (
                <Alert variant="info">
                  No students found for this subject and section.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>USN</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Section</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => (
                        <tr key={student.usn}>
                          <td>{student.usn}</td>
                          <td>{student.name}</td>
                          <td>{student.email || '-'}</td>
                          <td>{student.phone || '-'}</td>
                          <td>{student.section}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <ButtonLink 
                                size="sm" 
                                variant="outline-primary"
                                to={`/attendance/student/${student.usn}/${mapping.subject.id}`}
                              >
                                Attendance
                              </ButtonLink>
                              <ButtonLink 
                                size="sm" 
                                variant="outline-success"
                                to={`/marks/student/${student.usn}/${mapping.subject.id}`}
                              >
                                Marks
                              </ButtonLink>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      ) : (
        <Alert variant="danger">Mapping not found</Alert>
      )}
    </Container>
  );
};

export default FacultySubjectStudents;

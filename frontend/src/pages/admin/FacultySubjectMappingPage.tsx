import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, Table, Badge, 
  Alert, Spinner, Modal, Tabs, Tab
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ROLES } from '../../config/constants';
import axios from 'axios';

interface Faculty {
  id: string;
  name: string;
  email: string;
  designation: string;
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

interface Subject {
  id: number;
  name: string;
  code: string;
  semester: number;
  departmentId: number;
  category: string;
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

interface Batch {
  id: string;
  name: string;
  academicYear: string;
  currentSemester: number;
}

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
  faculty: Faculty;
  subject: Subject;
  batch: Batch;
}

const FacultySubjectMappingPage: React.FC = () => {
  // State for form and data
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    facultyId: '',
    subjectId: '',
    section: '',
    semester: '',
    batchId: '',
    academicYear: '',
    componentScope: 'theory',
    isPrimary: true
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<Mapping | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  
  const auth = useSelector((state: RootState) => state.auth);
  // Define a proper type for departments or access it directly
  const departments = useSelector((state: RootState) => {
    // @ts-ignore - Ignore the type error for now, will be fixed when departments state is properly typed
    return state.departments?.items || [];
  });
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Setup axios configuration to avoid API issues
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        
        // Fetch all data with proper axios configuration
        const [facultiesRes, subjectsRes, batchesRes, sectionsRes, mappingsRes] = await Promise.all([
          // Fetch faculties
          axios({
            method: 'GET',
            baseURL,
            url: '/faculty',
            params: { limit: 1000 },
            headers
          }),
          
          // Fetch subjects
          axios({
            method: 'GET',
            baseURL,
            url: '/subjects',
            headers
          }),
          
          // Fetch batches
          axios({
            method: 'GET',
            baseURL, 
            url: '/batches',
            headers
          }),
          
          // Fetch sections
          axios({
            method: 'GET',
            baseURL,
            url: '/sections',
            headers
          }),
          
          // Use the updated facultySubjectMappingService
          axios({
            method: 'GET',
            baseURL,
            url: '/faculty-subject-mapping',
            headers
          })
        ]);
        
        // Process the responses
        setFaculties(facultiesRes.data?.data?.faculty || []);
        setSubjects(subjectsRes.data?.data || []);
        setBatches(batchesRes.data?.data || []);
        setSections(sectionsRes.data?.data || []);
        setMappings(mappingsRes.data?.data || []);
        
        // Set default academic year from current date
        const currentYear = new Date().getFullYear();
        setFormData(prev => ({
          ...prev,
          academicYear: `${currentYear}-${currentYear + 1}`
        }));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch required data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Auto-fill semester based on selected subject
      if (name === 'subjectId' && value) {
        const selectedSubject = subjects.find(s => s.id === parseInt(value));
        if (selectedSubject) {
          setFormData(prev => ({ ...prev, semester: selectedSubject.semester.toString() }));
        }
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Setup axios configuration for direct API call
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      
      const response = await axios({
        method: 'POST',
        baseURL,
        url: '/faculty-subject-mapping',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: formData
      });
      
      // Add new mapping to the state
      if (response.data?.success && response.data?.data) {
        setMappings(prev => [response.data.data, ...prev]);
        
        // Reset form
        setFormData({
          facultyId: '',
          subjectId: '',
          section: '',
          semester: '',
          batchId: '',
          academicYear: formData.academicYear, // Keep academic year
          componentScope: 'theory',
          isPrimary: true
        });
        
        setSuccess('Faculty-Subject mapping created successfully');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError('Failed to create mapping: Invalid response from server');
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating mapping:', err);
      setError(err.response?.data?.message || 'Failed to create mapping');
      setLoading(false);
    }
  };
  
  // Handle mapping deactivation/activation
  const handleStatusChange = async (mapping: Mapping, newStatus: boolean) => {
    try {
      setLoading(true);
      
      // Setup axios configuration for direct API call
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      
      await axios({
        method: 'PUT',
        baseURL,
        url: `/faculty-subject-mapping/status/${mapping.id}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: { active: newStatus }
      });
      
      // Update mapping in the state
      setMappings(prev => 
        prev.map(m => m.id === mapping.id ? { ...m, active: newStatus } : m)
      );
      
      setSuccess(`Mapping ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(null), 5000);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error updating mapping status:', err);
      setError(err.response?.data?.message || 'Failed to update mapping status');
      setLoading(false);
    }
  };
  
  // Handle mapping deletion
  const handleDelete = async () => {
    if (!selectedMapping) return;
    
    try {
      setLoading(true);
      
      // Setup axios configuration for direct API call
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      
      await axios({
        method: 'DELETE',
        baseURL,
        url: `/faculty-subject-mapping/${selectedMapping.id}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Remove mapping from state
      setMappings(prev => prev.filter(m => m.id !== selectedMapping.id));
      
      setShowDeleteModal(false);
      setSelectedMapping(null);
      
      setSuccess('Mapping deleted successfully');
      setTimeout(() => setSuccess(null), 5000);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error deleting mapping:', err);
      setError(err.response?.data?.message || 'Failed to delete mapping');
      setLoading(false);
      setShowDeleteModal(false);
    }
  };
  
  // Filter mappings based on active status and department
  const filteredMappings = mappings.filter(mapping => {
    const activeFilter = activeTab === 'active' ? mapping.active : !mapping.active;
    const departmentMatch = departmentFilter === '' || 
      mapping.subject.departmentId === (departmentFilter ? parseInt(departmentFilter) : 0);
    
    return activeFilter && departmentMatch;
  });
  
  // Get filtered faculties based on department
  const filteredFaculties = departmentFilter 
    ? faculties.filter(f => f.department?.id === (departmentFilter ? parseInt(departmentFilter) : 0))
    : faculties;
  
  // Get filtered subjects based on department  
  const filteredSubjects = departmentFilter
    ? subjects.filter(s => s.departmentId === (departmentFilter ? parseInt(departmentFilter) : 0))
    : subjects;
  
  return (
    <Container fluid className="p-4">
      <h2 className="mb-4">Faculty-Subject Mapping</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      {/* Department filter for admins */}
      {/* @ts-ignore - Ignore the role property type error */}
      {auth.user?.role === ROLES.SUPER_ADMIN && departments.length > 0 && (
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Filter by Department</Form.Label>
                  <Form.Select 
                    value={departmentFilter} 
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {/* Create mapping form */}
      <Card className="mb-4">
        <Card.Header>
          <h4>Create New Mapping</h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Faculty</Form.Label>
                  <Form.Select 
                    name="facultyId" 
                    value={formData.facultyId} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Faculty</option>
                    {filteredFaculties.map(faculty => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name} {faculty.department && `(${faculty.department.code})`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Select 
                    name="subjectId" 
                    value={formData.subjectId} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Subject</option>
                    {filteredSubjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code}) - Sem {subject.semester}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Batch</Form.Label>
                  <Form.Select 
                    name="batchId" 
                    value={formData.batchId} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Batch</option>
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} ({batch.academicYear})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section</Form.Label>
                  <Form.Select 
                    name="section" 
                    value={formData.section} 
                    onChange={handleChange}
                  >
                    <option value="">All Sections</option>
                    {sections.map(section => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester</Form.Label>
                  <Form.Select 
                    name="semester" 
                    value={formData.semester} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Academic Year</Form.Label>
                  <Form.Control
                    type="text"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    placeholder="e.g. 2023-2024"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Component Scope</Form.Label>
                  <Form.Select 
                    name="componentScope" 
                    value={formData.componentScope} 
                    onChange={handleChange}
                    required
                  >
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                    <option value="both">Both (Theory & Lab)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    id="isPrimary"
                    name="isPrimary"
                    label="Is Primary Faculty"
                    checked={formData.isPrimary}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    Primary faculty is responsible for the overall subject coordination.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
            >
              {loading ? <><Spinner size="sm" animation="border" /> Creating...</> : 'Create Mapping'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Mappings list */}
      <Card>
        <Card.Header>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'active')}
            className="mb-3"
          >
            <Tab eventKey="active" title="Active Mappings" />
            <Tab eventKey="inactive" title="Inactive Mappings" />
          </Tabs>
        </Card.Header>
        <Card.Body>
          {loading && mappings.length === 0 ? (
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : filteredMappings.length === 0 ? (
            <Alert variant="info">
              No {activeTab} faculty-subject mappings found.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Subject</th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>Batch</th>
                    <th>Component</th>
                    <th>Primary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMappings.map(mapping => (
                    <tr key={mapping.id}>
                      <td>
                        {mapping.faculty.name}
                        <div className="small text-muted">{mapping.faculty.email}</div>
                      </td>
                      <td>
                        {mapping.subject.name}
                        <div className="small text-muted">{mapping.subject.code}</div>
                      </td>
                      <td>{mapping.semester}</td>
                      <td>{mapping.section || 'All'}</td>
                      <td>
                        {mapping.batch.name}
                        <div className="small text-muted">{mapping.academicYear}</div>
                      </td>
                      <td>
                        {mapping.componentScope === 'theory' && <Badge bg="primary">Theory</Badge>}
                        {mapping.componentScope === 'lab' && <Badge bg="success">Lab</Badge>}
                        {mapping.componentScope === 'both' && <Badge bg="info">Both</Badge>}
                      </td>
                      <td>
                        {mapping.isPrimary ? 
                          <Badge bg="success">Yes</Badge> : 
                          <Badge bg="secondary">No</Badge>
                        }
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          {mapping.active ? (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleStatusChange(mapping, false)}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() => handleStatusChange(mapping, true)}
                            >
                              Activate
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => {
                              setSelectedMapping(mapping);
                              setShowDeleteModal(true);
                            }}
                          >
                            Delete
                          </Button>
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
      
      {/* Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this mapping?</p>
          <p className="text-danger">
            <strong>Warning:</strong> This action cannot be undone. If there are any attendance or marks entries, 
            you should deactivate the mapping instead of deleting it.
          </p>
          {selectedMapping && (
            <div className="bg-light p-3 rounded">
              <p className="mb-1"><strong>Faculty:</strong> {selectedMapping.faculty.name}</p>
              <p className="mb-1"><strong>Subject:</strong> {selectedMapping.subject.name} ({selectedMapping.subject.code})</p>
              <p className="mb-0"><strong>Batch/Section:</strong> {selectedMapping.batch.name}, {selectedMapping.section || 'All'}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FacultySubjectMappingPage;

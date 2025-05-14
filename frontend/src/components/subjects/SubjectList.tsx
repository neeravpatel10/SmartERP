import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import AddEditSubjectModal from './AddEditSubjectModal';

interface Subject {
  id: number;
  code: string;
  name: string;
  semester: number;
  section?: string;
  sectionId?: number;
  credits: number;
  isLab: boolean;
  status: 'draft' | 'active' | 'locked' | 'archived';
  departmentId: number;
  categoryId: number | null;
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
      firstName: string;
      lastName: string;
    };
  }[];
}

const SubjectList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      // Try both endpoints to ensure compatibility
      let response;
      try {
        // First try with the /subjects endpoint
        response = await api.get('/subjects');
        console.log('API Response from /subjects:', response.data);
      } catch (err) {
        // If that fails, try with the /api/subjects endpoint
        console.log('Trying fallback endpoint /api/subjects');
        response = await api.get('/api/subjects');
        console.log('API Response from /api/subjects:', response.data);
      }
      
      // Handle different response formats
      let subjectsData = [];
      
      // Check for the nested structure in the response
      if (response.data?.success && response.data?.data?.subjects) {
        // Format: { success: true, data: { subjects: [...] } }
        subjectsData = response.data.data.subjects;
        console.log('Found subjects in response.data.data.subjects:', subjectsData.length);
      } else if (response.data?.success && Array.isArray(response.data?.data)) {
        // Format: { success: true, data: [...] }
        subjectsData = response.data.data;
        console.log('Found subjects in response.data.data array:', subjectsData.length);
      } else if (response.data?.subjects && Array.isArray(response.data.subjects)) {
        // Format: { subjects: [...] }
        subjectsData = response.data.subjects;
        console.log('Found subjects in response.data.subjects:', subjectsData.length);
      } else if (Array.isArray(response.data)) {
        // Format: [...]
        subjectsData = response.data;
        console.log('Found subjects in direct array:', subjectsData.length);
      } else {
        console.error('Unexpected API response format:', response.data);
      }
      
      // Ensure each subject has the required properties
      const processedSubjects = subjectsData.map((subject: Partial<Subject>) => {
        // Log each subject to help debug
        console.log('Processing subject:', subject);
        
        return {
          ...subject,
          facultyMappings: subject.facultyMappings || [],
          department: subject.department || { code: 'N/A', name: 'N/A' },
          status: subject.status || 'active',
          // Ensure section data is preserved
          section: subject.section || null,
          sectionId: subject.sectionId || null
        };
      }) as Subject[];
      
      setSubjects(processedSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (subjectId: number, newStatus: string) => {
    try {
      await api.put(`/api/subjects/${subjectId}/status`, { 
        status: newStatus 
      });
      
      alert(`Subject status changed to ${newStatus}`);
      fetchSubjects();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Delete subject function (kept for future use)
  const handleDeleteSubject = async (subjectId: number) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await api.delete(`/api/subjects/${subjectId}`);
        alert('Subject deleted successfully');
        fetchSubjects();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete subject');
      }
    }
  };

  // Filter subjects based on selected filters
  const filteredSubjects = Array.isArray(subjects) ? subjects.filter(subject => {
    const matchesStatus = statusFilter === 'all' || subject.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || subject.department?.code === departmentFilter;
    const matchesSection = sectionFilter === 'all' || subject.section === sectionFilter;
    const matchesSearch = !searchQuery || 
      subject.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesDepartment && matchesSection && matchesSearch;
  }) : [];

  // Get unique departments for filter dropdown
  const departmentCodes = subjects.map(subject => subject.department?.code).filter(Boolean);
  const departments = Array.from(new Set(departmentCodes));
  
  // Get unique sections for filter dropdown
  const sectionNames = subjects.map(subject => subject.section).filter(Boolean);
  const sections = Array.from(new Set(sectionNames));

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setSubjectToEdit(null);
  };

  // Handle edit subject
  const handleEditSubject = (subject: Subject) => {
    setSubjectToEdit(subject);
    setShowModal(true);
  };

  // Handle modal success
  const handleModalSuccess = () => {
    handleModalClose();
    fetchSubjects(); // Refresh the subjects list
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Subject Management</h2>
      
      {/* Add/Edit Subject Modal */}
      <AddEditSubjectModal
        show={showModal}
        handleClose={handleModalClose}
        subjectToEdit={subjectToEdit}
        onSuccess={handleModalSuccess}
      />
      
      {/* Enhanced Filter Section */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        marginBottom: '20px', 
        backgroundColor: '#f8f9fa', 
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Filters</h3>
          <button 
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            onClick={() => setShowModal(true)}
          >
            Add New Subject
          </button>
        </div>
        
        {/* Search Bar */}
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px'
            }}
          />
        </div>
        
        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: 'white', 
            padding: '8px 12px', 
            borderRadius: '4px',
            border: '1px solid #e0e0e0'
          }}>
            <span style={{ marginRight: '8px', fontWeight: 'bold', color: '#555' }}>Status:</span>
            <select 
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '120px' }}
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: 'white', 
            padding: '8px 12px', 
            borderRadius: '4px',
            border: '1px solid #e0e0e0'
          }}>
            <span style={{ marginRight: '8px', fontWeight: 'bold', color: '#555' }}>Department:</span>
            <select 
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '120px' }}
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: 'white', 
            padding: '8px 12px', 
            borderRadius: '4px',
            border: '1px solid #e0e0e0'
          }}>
            <span style={{ marginRight: '8px', fontWeight: 'bold', color: '#555' }}>Section:</span>
            <select 
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '120px' }}
              value={sectionFilter} 
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="all">All Sections</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 2s linear infinite' }}></div>
          <p>Loading subjects...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>No subjects found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Code</th>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Department</th>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Semester</th>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Section</th>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((subject) => (
                <tr key={subject.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px 15px' }}>{subject.code}</td>
                  <td style={{ padding: '12px 15px' }}>{subject.name}</td>
                  <td style={{ padding: '12px 15px' }}>{subject.department?.code || 'N/A'}</td>
                  <td style={{ padding: '12px 15px' }}>{subject.semester}</td>
                  <td style={{ padding: '12px 15px' }}>
                    {/* Display section name more prominently if available */}
                    {subject.section ? (
                      <strong>{subject.section}</strong>
                    ) : (
                      'All'
                    )}
                  </td>
                  <td style={{ padding: '12px 15px' }}>{subject.category?.code || 'N/A'}</td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: subject.status === 'draft' ? '#ffeeba' : 
                                       subject.status === 'active' ? '#c3e6cb' :
                                       subject.status === 'locked' ? '#f5c6cb' : '#e2e3e5',
                      color: subject.status === 'draft' ? '#856404' :
                             subject.status === 'active' ? '#155724' :
                             subject.status === 'locked' ? '#721c24' : '#383d41'
                    }}>
                      {subject.status === 'draft' ? 'Draft' :
                       subject.status === 'active' ? 'Active' :
                       subject.status === 'locked' ? 'Locked' : 'Archived'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleEditSubject(subject)}
                      >
                        Edit
                      </button>
                      
                      {subject.status === 'draft' && (
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleStatusChange(subject.id, 'active')}
                        >
                          Activate
                        </button>
                      )}
                      
                      {subject.status !== 'archived' && (
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleStatusChange(subject.id, 'archived')}
                        >
                          Archive
                        </button>
                      )}
                      
                      {/* Add delete button for draft subjects */}
                      {subject.status === 'draft' && (
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SubjectList; 
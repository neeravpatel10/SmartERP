import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

interface Subject {
  id: number;
  code: string;
  name: string;
  semester: number;
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subjects');
      console.log('API Response:', response.data);
      
      // Handle different response formats
      let subjectsData;
      if (response.data?.subjects && Array.isArray(response.data.subjects)) {
        subjectsData = response.data.subjects;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        subjectsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        subjectsData = response.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        subjectsData = [];
      }
      
      setSubjects(subjectsData);
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

  // Get status badge style
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

  // Filter subjects based on selected filters
  const filteredSubjects = Array.isArray(subjects) ? subjects.filter(subject => {
    return (
      (statusFilter === 'all' || subject.status === statusFilter) &&
      (departmentFilter === 'all' || subject.department?.code === departmentFilter)
    );
  }) : [];

  // Get unique departments for filter dropdown
  const departmentCodes = subjects.map(subject => subject.department?.code).filter(Boolean);
  const departments = Array.from(new Set(departmentCodes));

  return (
    <div className="subject-list-container">
      <h1 className="heading">Subject Management</h1>
      
      <div className="filter-container">
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/subjects/create')}
        >
          Add New Subject
        </button>
        
        <div className="filter">
          <label htmlFor="status-filter">Status:</label>
          <select 
            id="status-filter"
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
        
        <div className="filter">
          <label htmlFor="department-filter">Department:</label>
          <select 
            id="department-filter"
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
      </div>
      
      {loading ? (
        <div className="loading">Loading subjects...</div>
      ) : filteredSubjects.length === 0 ? (
        <p>No subjects found.</p>
      ) : (
        <table className="subject-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Category</th>
              <th>Faculty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.code}</td>
                <td>{subject.name}</td>
                <td>{subject.department?.code}</td>
                <td>{subject.semester}</td>
                <td>{subject.category?.code || 'N/A'}</td>
                <td>
                  {subject.facultyMappings.length > 0 
                    ? subject.facultyMappings.map(fm => 
                        `${fm.faculty.firstName} ${fm.faculty.lastName}`
                      ).join(', ')
                    : 'Not Assigned'
                  }
                </td>
                <td>{getStatusBadge(subject.status)}</td>
                <td>
                  <div className="actions-dropdown">
                    <button className="dropdown-btn">Actions</button>
                    <div className="dropdown-content">
                      <button 
                        onClick={() => navigate(`/subjects/${subject.id}`)}
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => navigate(`/subjects/${subject.id}/edit`)}
                      >
                        Edit
                      </button>
                      
                      {/* Status transitions based on current status */}
                      {subject.status === 'draft' && (
                        <button 
                          onClick={() => handleStatusChange(subject.id, 'active')}
                        >
                          Set to Active
                        </button>
                      )}
                      
                      {subject.status === 'active' && (
                        <button 
                          onClick={() => handleStatusChange(subject.id, 'locked')}
                        >
                          Lock
                        </button>
                      )}
                      
                      {subject.status === 'locked' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(subject.id, 'active')}
                          >
                            Unlock
                          </button>
                          <button 
                            onClick={() => handleStatusChange(subject.id, 'archived')}
                          >
                            Archive
                          </button>
                        </>
                      )}
                      
                      {/* Delete only for draft subjects */}
                      {subject.status === 'draft' && (
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style>
        {`
        .subject-list-container {
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .heading {
          font-size: 24px;
          margin-bottom: 20px;
        }
        
        .filter-container {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .filter {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .btn {
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          border: none;
        }
        
        .btn-primary {
          background-color: #3182ce;
          color: white;
        }
        
        .btn-delete {
          background-color: #e53e3e;
          color: white;
        }
        
        .subject-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .subject-table th, .subject-table td {
          border: 1px solid #e2e8f0;
          padding: 10px;
          text-align: left;
        }
        
        .subject-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .badge-yellow {
          background-color: #fefcbf;
          color: #975a16;
        }
        
        .badge-green {
          background-color: #c6f6d5;
          color: #276749;
        }
        
        .badge-red {
          background-color: #fed7d7;
          color: #9b2c2c;
        }
        
        .badge-gray {
          background-color: #edf2f7;
          color: #4a5568;
        }
        
        .actions-dropdown {
          position: relative;
          display: inline-block;
        }
        
        .dropdown-btn {
          background-color: #4a5568;
          color: white;
          padding: 8px 12px;
          border: none;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .dropdown-content {
          display: none;
          position: absolute;
          right: 0;
          background-color: #f9f9f9;
          min-width: 160px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          z-index: 1;
          border-radius: 4px;
        }
        
        .dropdown-content button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          border: none;
          background: none;
          cursor: pointer;
        }
        
        .dropdown-content button:hover {
          background-color: #f1f1f1;
        }
        
        .actions-dropdown:hover .dropdown-content {
          display: block;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #718096;
        }
        `}
      </style>
    </div>
  );
};

export default SubjectList; 
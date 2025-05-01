import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container } from '@mui/material';

interface AttendanceSession {
  id: number;
  subjectId: number;
  subject: {
    id: number;
    name: string;
    code: string;
  };
  facultyId?: number;
  faculty?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  attendanceDate: string;
  sessionSlot: number;
  duration: number;
  academicYear: string;
  semester: number;
  section?: string;
  batchId?: number;
  batch?: {
    id: number;
    name: string;
  };
  _count: {
    entries: number;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FilterState {
  subjectId?: string;
  startDate?: string;
  endDate?: string;
  academicYear?: string;
  semester?: string;
  section?: string;
  batchId?: string;
}

const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<FilterState>({
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  });

  const fetchAttendanceSessions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      
      // Add filters if they exist
      if (filters.subjectId) params.append('subjectId', filters.subjectId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.section) params.append('section', filters.section);
      if (filters.batchId) params.append('batchId', filters.batchId);
      
      const response = await axios.get(`/api/attendance/sessions?${params.toString()}`);
      
      if (response.data.success) {
        setSessions(response.data.data.attendanceSessions);
        setPagination(response.data.data.pagination);
      } else {
        console.error('Failed to fetch attendance sessions:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching attendance sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters.subjectId, filters.startDate, filters.endDate, filters.academicYear, filters.semester, filters.section, filters.batchId]);

  useEffect(() => {
    fetchAttendanceSessions();
  }, [fetchAttendanceSessions]);

  const handlePageChange = (newPage: number) => {
    fetchAttendanceSessions(newPage);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleViewSession = (id: number) => {
    navigate(`/attendance/sessions/${id}`);
  };

  const handleCreateSession = () => {
    navigate('/attendance/sessions/new');
  };

  const handleCreateBatchSession = () => {
    navigate('/attendance/sessions/batch');
  };

  const handleViewAlerts = () => {
    navigate('/attendance/alerts');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
          <div className="flex gap-2">
            <button
              onClick={handleViewAlerts}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center"
            >
              <span className="mr-1">⚠️</span> Attendance Alerts
            </button>
            <button
              onClick={handleCreateBatchSession}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm"
            >
              Batch Sessions
            </button>
            <button
              onClick={handleCreateSession}
              className="bg-[#b50900] hover:bg-[#940800] text-white px-4 py-2 rounded-md shadow-sm"
            >
              Create New Session
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                name="academicYear"
                value={filters.academicYear || ''}
                onChange={handleFilterChange}
                placeholder="e.g. 2023-2024"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                name="semester"
                value={filters.semester || ''}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input
                type="text"
                name="section"
                value={filters.section || ''}
                onChange={handleFilterChange}
                placeholder="e.g. A"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate || ''}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate || ''}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]"
              />
            </div>
          </div>
        </div>

        {/* Attendance Sessions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch/Section
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#b50900] mx-auto"></div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No attendance sessions found. Create a new session to get started.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(session.attendanceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold">{session.subject.name}</div>
                      <div className="text-xs text-gray-500">{session.subject.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Slot {session.sessionSlot} ({session.duration} {session.duration > 1 ? 'hours' : 'hour'})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.batch?.name || 'N/A'} {session.section ? `/ ${session.section}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session._count.entries > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {session._count.entries > 0
                          ? `${session._count.entries} entries`
                          : 'No entries'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewSession(session.id)}
                        className="text-[#b50900] hover:text-[#940800]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 border border-gray-300 text-sm font-medium ${
                    pagination.page === page
                      ? 'bg-[#b50900] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Attendance; 
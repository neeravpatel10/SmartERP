import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container } from '@mui/material';

interface Student {
  usn: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
}

interface AttendanceEntry {
  id: number;
  sessionId: number;
  usn: string;
  status: 'Present' | 'Absent';
  student: Student;
}

interface Session {
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
  entries: AttendanceEntry[];
}

// Structure for bulk attendance upload
interface AttendanceUpload {
  sessionId: number;
  entries: {
    usn: string;
    status: 'Present' | 'Absent';
  }[];
}

const AttendanceSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<Map<string, 'Present' | 'Absent'>>(new Map());
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [error, setError] = useState<string>('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState<'Present' | 'Absent' | null>(null);

  // Fetch the attendance session data
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!id) {
        setError('Session ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/api/attendance/sessions/${id}`);
        
        if (response.data.success) {
          setSession(response.data.data);
          
          // Initialize entries map
          const entriesMap = new Map<string, 'Present' | 'Absent'>();
          
          // Add existing entries to the map
          response.data.data.entries.forEach((entry: AttendanceEntry) => {
            entriesMap.set(entry.usn, entry.status);
          });
          
          setEntries(entriesMap);
        } else {
          setError('Failed to fetch session data');
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
        setError('An error occurred while fetching session data');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [id]);

  // Fetch students for this batch/section if needed
  useEffect(() => {
    if (session && (!session.entries || session.entries.length === 0)) {
      const fetchStudents = async () => {
        try {
          // Build query parameters
          const params = new URLSearchParams();
          if (session.batchId) params.append('batchId', session.batchId.toString());
          if (session.semester) params.append('semester', session.semester.toString());
          if (session.section) params.append('section', session.section);
          
          const response = await axios.get(`/api/students?${params.toString()}`);
          
          if (response.data.success) {
            setStudentList(response.data.data.students);
          } else {
            console.error('Failed to fetch students:', response.data.message);
          }
        } catch (error) {
          console.error('Error fetching students:', error);
        }
      };

      fetchStudents();
    }
  }, [session]);

  // Handle attendance status change
  const handleStatusChange = (usn: string, status: 'Present' | 'Absent') => {
    const newEntries = new Map(entries);
    newEntries.set(usn, status);
    setEntries(newEntries);
  };

  // Handle 'Mark All' as present or absent with confirmation
  const handleMarkAllClick = (status: 'Present' | 'Absent') => {
    setShowBulkConfirm(status);
  };

  // Confirm bulk attendance update
  const confirmBulkUpdate = () => {
    if (!showBulkConfirm) return;
    
    const status = showBulkConfirm;
    const newEntries = new Map(entries);
    
    if (studentList.length > 0) {
      studentList.forEach((student) => {
        newEntries.set(student.usn, status);
      });
    } else if (session?.entries) {
      session.entries.forEach((entry) => {
        newEntries.set(entry.usn, status);
      });
    }
    
    setEntries(newEntries);
    setShowBulkConfirm(null);
    
    setNotification({
      message: `All students marked as ${status}`,
      type: 'success'
    });
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  // Cancel bulk update
  const cancelBulkUpdate = () => {
    setShowBulkConfirm(null);
  };

  // Save attendance with notification
  const handleSaveAttendance = async () => {
    if (!session) return;
    
    try {
      setSaving(true);
      setNotification({
        message: 'Saving attendance data...',
        type: 'info'
      });
      
      // Convert entries map to array for API
      const entriesArray: { usn: string; status: 'Present' | 'Absent' }[] = [];
      
      // If we have students from the batch, use those entries
      if (studentList.length > 0) {
        studentList.forEach((student) => {
          entriesArray.push({
            usn: student.usn,
            status: entries.get(student.usn) || 'Absent' // Default to absent if not marked
          });
        });
      } else {
        // Otherwise, use entries from the map
        entries.forEach((status, usn) => {
          entriesArray.push({ usn, status });
        });
      }
      
      // Create payload
      const payload: AttendanceUpload = {
        sessionId: session.id,
        entries: entriesArray
      };
      
      // Send to API
      const response = await axios.post('/api/attendance/upload', payload);
      
      if (response.data.success) {
        // Reload session data
        const sessionResponse = await axios.get(`/api/attendance/sessions/${id}`);
        if (sessionResponse.data.success) {
          setSession(sessionResponse.data.data);
          setNotification({
            message: 'Attendance saved successfully!',
            type: 'success'
          });
        }
      } else {
        setError('Failed to save attendance: ' + response.data.message);
        setNotification({
          message: 'Failed to save attendance: ' + response.data.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      setError('An error occurred while saving attendance');
      setNotification({
        message: 'An error occurred while saving attendance',
        type: 'error'
      });
    } finally {
      setSaving(false);
      // Clear success notification after 3 seconds
      if (notification?.type === 'success') {
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get the full name of a student
  const getFullName = (student: Student) => {
    return [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(' ');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b50900] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading session data...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            <h2 className="text-lg font-semibold">Error</h2>
            <p>{error}</p>
            <button
              onClick={() => navigate('/attendance')}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Return to Attendance List
            </button>
          </div>
        </div>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-6">
            <h2 className="text-lg font-semibold">No Data</h2>
            <p>No session data found. This session may have been deleted.</p>
            <button
              onClick={() => navigate('/attendance')}
              className="mt-2 text-yellow-600 hover:text-yellow-800 font-medium"
            >
              Return to Attendance List
            </button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md shadow-md ${
          notification.type === 'success' ? 'bg-green-50 border-l-4 border-green-500 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border-l-4 border-red-500 text-red-800' :
          'bg-blue-50 border-l-4 border-blue-500 text-blue-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Bulk Confirmation Modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mr-3 ${showBulkConfirm === 'Present' ? 'text-green-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showBulkConfirm === 'Present' ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"} />
              </svg>
              <h3 className="text-xl font-semibold">Confirm Bulk Update</h3>
            </div>
            <p className="mb-6 text-gray-600">
              Are you sure you want to mark all students as <span className={`font-bold ${showBulkConfirm === 'Present' ? 'text-green-600' : 'text-red-600'}`}>{showBulkConfirm}</span>?
              <span className="block mt-2 text-sm">This will update the status for {studentList.length || (session?.entries ? session.entries.length : 0)} students.</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelBulkUpdate}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkUpdate}
                className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  showBulkConfirm === 'Present' 
                    ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500' 
                    : 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                } transition-colors`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2 text-[#b50900]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Attendance Session
            </h1>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">{session.subject.name}</span>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">{session.subject.code}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(session.attendanceDate)}
              </div>
              <div className="flex items-center text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Slot {session.sessionSlot} ({session.duration} {session.duration > 1 ? 'hours' : 'hour'})
                {session.section && <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">Section {session.section}</span>}
              </div>
            </div>
          </div>
          <div className="mt-4 lg:mt-0 flex space-x-3">
            <button
              onClick={() => navigate('/attendance')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md shadow-sm flex items-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to List
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="bg-[#b50900] hover:bg-[#940800] text-white px-4 py-2 rounded-md shadow-sm disabled:opacity-50 flex items-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      {/* Batch Status Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-800">
                {studentList.length || (session.entries ? session.entries.length : 0)}
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-2xl font-bold text-green-600">
                {Array.from(entries.values()).filter(status => status === 'Present').length}
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-2xl font-bold text-red-600">
                {Array.from(entries.values()).filter(status => status === 'Absent').length}
              </p>
            </div>
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Not Marked</p>
              <p className="text-2xl font-bold text-gray-500">
                {(studentList.length || (session.entries ? session.entries.length : 0)) - 
                Array.from(entries.values()).filter(status => status === 'Present' || status === 'Absent').length}
              </p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center mb-4 md:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Student Attendance
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => handleMarkAllClick('Present')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAllClick('Absent')}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark All Absent
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  USN
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
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
              {studentList.length > 0 ? (
                // If we have students from batch, show them
                studentList.map((student) => (
                  <tr key={student.usn} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.usn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getFullName(student)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        entries.get(student.usn) === 'Present'
                          ? 'bg-green-100 text-green-800'
                          : entries.get(student.usn) === 'Absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {entries.get(student.usn) || 'Not Marked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusChange(student.usn, 'Present')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            entries.get(student.usn) === 'Present'
                              ? 'bg-green-500 text-white'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.usn, 'Absent')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            entries.get(student.usn) === 'Absent'
                              ? 'bg-red-500 text-white'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : session.entries && session.entries.length > 0 ? (
                // If we have entries, show them
                session.entries.map((entry) => (
                  <tr key={entry.usn} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.usn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getFullName(entry.student)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (entries.get(entry.usn) || entry.status) === 'Present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entries.get(entry.usn) || entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusChange(entry.usn, 'Present')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            (entries.get(entry.usn) || entry.status) === 'Present'
                              ? 'bg-green-500 text-white'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(entry.usn, 'Absent')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            (entries.get(entry.usn) || entry.status) === 'Absent'
                              ? 'bg-red-500 text-white'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg mb-1">No students found for this session</p>
                    <p className="text-sm">Please add students to this batch/section</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">{(studentList.length || (session.entries ? session.entries.length : 0))}</span> students total
          </div>
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="bg-[#b50900] hover:bg-[#940800] text-white px-5 py-2 rounded-md shadow-sm disabled:opacity-50 flex items-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </Container>
  );
};

export default AttendanceSession; 
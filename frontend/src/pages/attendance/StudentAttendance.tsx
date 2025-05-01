import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Box, CircularProgress, Alert, Container } from '@mui/material';
import { RootState } from '../../store';

interface AttendanceEntry {
  id: number;
  usn: string;
  status: 'Present' | 'Absent';
  session: {
    id: number;
    attendanceDate: string;
    sessionSlot: number;
    subject: {
      id: number;
      name: string;
      code: string;
    };
  };
}

interface SubjectAttendance {
  subject: {
    id: number;
    name: string;
    code: string;
  };
  totalSessions: number;
  present: number;
  absent: number;
  other: number;
  percentage: number;
}

interface AttendanceSummary {
  student: {
    usn: string;
    name: string;
  };
  summary: SubjectAttendance[];
  entries: AttendanceEntry[];
}

// Extended User interface to include student property
interface ExtendedUser {
  id: number;
  username: string;
  email: string;
  loginType: number;
  department?: any;
  firstLogin: boolean;
  student?: {
    usn: string;
    firstName: string;
    lastName?: string;
  };
}

const StudentAttendance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AttendanceSummary | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  
  // Get the current user from redux store with extended type
  const { user } = useSelector((state: RootState) => state.auth);
  const extendedUser = user as ExtendedUser | null;
  
  // If the user is a student, they have a student property with usn
  const userUSN = extendedUser?.student?.usn || '';
  
  // Filter states
  const [filters, setFilters] = useState({
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    semester: '',
  });

  // Fetch student attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!userUSN) {
        setError('Student USN not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (filters.academicYear) params.append('academicYear', filters.academicYear);
        if (filters.semester) params.append('semester', filters.semester);
        if (selectedSubject !== 'all') params.append('subjectId', selectedSubject);
        
        const response = await axios.get(`/api/attendance/student/${userUSN}?${params.toString()}`);
        
        if (response.data.success) {
          setAttendanceData(response.data.data);
        } else {
          setError('Failed to fetch attendance data');
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setError('An error occurred while fetching attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [userUSN, filters, selectedSubject]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
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

  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate if any subjects are below threshold
  const getAttendanceWarnings = () => {
    if (!attendanceData) return [];
    
    const warnings = attendanceData.summary
      .filter(subject => subject.percentage < 85)
      .map(subject => ({
        subject: subject.subject,
        percentage: subject.percentage,
        needed: Math.ceil((0.85 * subject.totalSessions - subject.present) / 0.15)
      }));
      
    return warnings;
  };

  const attendanceWarnings = getAttendanceWarnings();
  
  // Calculate overall attendance
  const calculateOverallAttendance = () => {
    if (!attendanceData || !attendanceData.summary.length) return 100;
    
    const totalPresent = attendanceData.summary.reduce((acc, curr) => acc + curr.present, 0);
    const totalSessions = attendanceData.summary.reduce((acc, curr) => acc + curr.totalSessions, 0);
    return totalSessions ? (totalPresent / totalSessions) * 100 : 0;
  };
  
  const overallAttendance = calculateOverallAttendance();
  const isBelowThreshold = overallAttendance < 85;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!attendanceData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No attendance data found
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Attendance Dashboard</h1>
              <p className="text-gray-600">
                {attendanceData.student.name} ({attendanceData.student.usn})
              </p>
            </div>
            
            {/* Quick Stats */}
            {attendanceData.summary.length > 0 && (
              <div className="mt-4 md:mt-0 flex items-center bg-gray-50 px-4 py-2 rounded-lg">
                <div className="mr-6">
                  <span className="text-sm text-gray-500 block">Overall</span>
                  <span className={`text-xl font-bold ${
                    overallAttendance >= 85 
                    ? 'text-green-600' 
                    : overallAttendance >= 75 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                  }`}>
                    {overallAttendance.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Status</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    overallAttendance >= 85 
                    ? 'bg-green-100 text-green-800' 
                    : overallAttendance >= 75 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                  }`}>
                    {overallAttendance >= 85 
                    ? 'Good' 
                    : overallAttendance >= 75 
                    ? 'Warning' 
                    : 'Low Attendance'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Warning */}
        {(isBelowThreshold || attendanceWarnings.length > 0) && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-md mb-6 shadow-md">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-semibold">Attendance Warning</h2>
            </div>
            {isBelowThreshold && (
              <p className="mb-3 pl-8">
                Your overall attendance is <span className="font-bold">{overallAttendance.toFixed(1)}%</span>, 
                which is below the required minimum of <span className="font-bold">85%</span>.
              </p>
            )}
            {attendanceWarnings.length > 0 && (
              <div className="pl-8">
                <p className="mb-2">You have low attendance in the following subjects:</p>
                <ul className="list-disc pl-5 space-y-2">
                  {attendanceWarnings.map(warning => (
                    <li key={warning.subject.id}>
                      <span className="font-semibold">{warning.subject.name}</span>: {warning.percentage.toFixed(1)}% 
                      {warning.needed > 0 && (
                        <span className="block text-sm mt-1"> 
                          <span className="bg-red-200 px-2 py-1 rounded">Action needed:</span> Attend <span className="font-bold">{warning.needed}</span> more 
                          {warning.needed === 1 ? ' class' : ' classes'} to reach 85%
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                name="academicYear"
                value={filters.academicYear}
                onChange={handleFilterChange}
                placeholder="e.g. 2023-2024"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900] transition-colors"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900] transition-colors"
              >
                <option value="all">All Subjects</option>
                {attendanceData.summary.map((subject) => (
                  <option key={subject.subject.id} value={subject.subject.id}>
                    {subject.subject.name} ({subject.subject.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Summary & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Attendance Summary */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Attendance Summary
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.summary.map((subject) => (
                    <tr key={subject.subject.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-semibold">{subject.subject.name}</div>
                        <div className="text-xs text-gray-500">{subject.subject.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {subject.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.totalSessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            subject.percentage >= 85
                              ? 'bg-green-100 text-green-800'
                              : subject.percentage >= 75
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {subject.percentage.toFixed(1)}%
                          </span>
                          <div className="ml-4 w-24 bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                subject.percentage >= 85
                                  ? 'bg-green-500'
                                  : subject.percentage >= 75
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, subject.percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {attendanceData.summary.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No data available for the selected filters.</p>
                        <p className="text-sm mt-1">Try changing your filter settings.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attendance Overview */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Attendance Overview
              </h2>
            </div>
            <div className="p-6">
              {attendanceData.summary.length > 0 ? (
                <div>
                  {/* Calculate overall attendance */}
                  {(() => {
                    const totalPresent = attendanceData.summary.reduce((acc, curr) => acc + curr.present, 0);
                    const totalSessions = attendanceData.summary.reduce((acc, curr) => acc + curr.totalSessions, 0);
                    const overallPercentage = totalSessions ? (totalPresent / totalSessions) * 100 : 0;
                    
                    return (
                      <div className="flex flex-col md:flex-row md:items-center md:justify-around">
                        <div className="relative h-40 w-40 mx-auto md:mx-0 mb-6 md:mb-0">
                          <svg viewBox="0 0 36 36" className="h-40 w-40 stroke-current">
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#eee"
                              strokeWidth="3"
                              className="stroke-current text-gray-200"
                            />
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={overallPercentage >= 85 ? '#10b981' : overallPercentage >= 75 ? '#f59e0b' : '#ef4444'}
                              strokeWidth="3"
                              strokeDasharray={`${overallPercentage}, 100`}
                              className={`${
                                overallPercentage >= 85 
                                  ? 'text-green-500' 
                                  : overallPercentage >= 75 
                                  ? 'text-yellow-500' 
                                  : 'text-red-500'
                              }`}
                            />
                          </svg>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <div className="text-3xl font-bold">
                              {overallPercentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">attendance</div>
                          </div>
                        </div>
                        <div className="space-y-4 md:w-1/2">
                          <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
                            <div>
                              <div className="text-sm text-gray-500">Present</div>
                              <div className="text-xl font-bold text-green-600">{totalPresent} days</div>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
                            <div>
                              <div className="text-sm text-gray-500">Total Classes</div>
                              <div className="text-xl font-bold text-gray-800">{totalSessions} days</div>
                            </div>
                            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg flex justify-between ${
                            overallPercentage >= 85 
                              ? 'bg-green-50' 
                              : overallPercentage >= 75 
                              ? 'bg-yellow-50' 
                              : 'bg-red-50'
                          }`}>
                            <div>
                              <div className="text-sm text-gray-500">Status</div>
                              <div className={`text-xl font-bold ${
                                overallPercentage >= 85 
                                  ? 'text-green-600' 
                                  : overallPercentage >= 75 
                                  ? 'text-yellow-600' 
                                  : 'text-red-600'
                              }`}>
                                {overallPercentage >= 85 
                                  ? 'Good Standing' 
                                  : overallPercentage >= 75 
                                  ? 'Warning' 
                                  : 'Low Attendance'}
                              </div>
                            </div>
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              overallPercentage >= 85 
                                ? 'bg-green-100' 
                                : overallPercentage >= 75 
                                ? 'bg-yellow-100' 
                                : 'bg-red-100'
                            }`}>
                              {overallPercentage >= 85 ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : overallPercentage >= 75 ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg">No attendance data available</p>
                  <p className="text-sm mt-1">Try changing your filter settings or check back later</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Attendance Details
            </h2>
          </div>
          <div className="overflow-x-auto">
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
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.entries.length > 0 ? (
                  attendanceData.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.session.attendanceDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-semibold">{entry.session.subject.name}</div>
                        <div className="text-xs text-gray-500">{entry.session.subject.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Slot {entry.session.sessionSlot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg">No attendance entries found</p>
                      <p className="text-sm mt-1">Try changing your filter settings</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default StudentAttendance; 
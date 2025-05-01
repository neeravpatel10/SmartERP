import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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

interface AttendanceWidgetProps {
  usn?: string;
  limit?: number;
}

const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ usn, limit = 3 }) => {
  const [loading, setLoading] = useState(true);
  const [attendanceSummary, setAttendanceSummary] = useState<SubjectAttendance[]>([]);
  const [overallPercentage, setOverallPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!usn) {
        setLoading(false);
        return;
      }

      try {
        const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        const response = await axios.get(`/api/attendance/student/${usn}?academicYear=${academicYear}`);
        
        if (response.data.success) {
          const summary = response.data.data.summary.slice(0, limit);
          setAttendanceSummary(summary);
          
          // Calculate overall attendance
          if (summary.length > 0) {
            const totalPresent = summary.reduce((acc: number, curr: SubjectAttendance) => acc + curr.present, 0);
            const totalSessions = summary.reduce((acc: number, curr: SubjectAttendance) => acc + curr.totalSessions, 0);
            const percentage = totalSessions ? (totalPresent / totalSessions) * 100 : 0;
            setOverallPercentage(percentage);
          }
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setError('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [usn, limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-[#b50900] mb-2">Attendance Overview</h2>
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#b50900]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-[#b50900] mb-2">Attendance Overview</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!usn) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-[#b50900] mb-2">Attendance Overview</h2>
        <p className="text-gray-500">Not available for your role</p>
      </div>
    );
  }

  if (attendanceSummary.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-[#b50900] mb-2">Attendance Overview</h2>
        <p className="text-gray-500">No attendance data available</p>
        <Link to="/attendance/student" className="text-xs text-[#b50900] mt-2 inline-block">View Details →</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-[#b50900] mb-2">Attendance Overview</h2>
      
      <div className="flex items-center mb-4">
        <div className="relative h-16 w-16 mr-4">
          <svg viewBox="0 0 36 36" className="h-16 w-16">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#eee"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={overallPercentage >= 75 ? '#10b981' : overallPercentage >= 65 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeDasharray={`${overallPercentage}, 100`}
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold">
            {overallPercentage.toFixed(1)}%
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">
            Status: 
            <span className={`ml-1 ${
              overallPercentage >= 75 
                ? 'text-green-600' 
                : overallPercentage >= 65 
                ? 'text-yellow-600' 
                : 'text-red-600'
            }`}>
              {overallPercentage >= 75 
                ? 'Good' 
                : overallPercentage >= 65 
                ? 'Warning' 
                : 'Low Attendance'}
            </span>
          </p>
          <Link to="/attendance/student" className="text-xs text-[#b50900] mt-1 inline-block">View Details →</Link>
        </div>
      </div>

      <div className="space-y-2">
        {attendanceSummary.map((item) => (
          <div key={item.subject.id} className="flex justify-between text-sm">
            <div className="flex-1 truncate">{item.subject.name}</div>
            <div className="ml-2 font-medium">
              <span className={
                item.percentage >= 75 
                  ? 'text-green-600' 
                  : item.percentage >= 65 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
              }>
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceWidget; 
import { Request, Response } from 'express';
import { prisma } from '../index';

// Use the JwtPayload interface from auth middleware
interface JwtPayload {
  userId: number;
  username: string;
  loginType: number;
  departmentId?: number;
}

// Request with authenticated user
interface AuthRequest extends Request {
  user: JwtPayload;
}

/**
 * Get integrated dashboard data based on user role
 */
export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, loginType } = req.user;
    let dashboardData = {};

    if (loginType === 1) {
      // Super Admin Dashboard
      dashboardData = await getSuperAdminDashboard();
    } else if (loginType === 2) {
      // Faculty Dashboard
      dashboardData = await getFacultyDashboard(userId);
    } else if (loginType === 3) {
      // Department Admin Dashboard
      dashboardData = await getDepartmentAdminDashboard(userId);
    } else if (loginType === -1) {
      try {
        // Student Dashboard
        dashboardData = await getStudentDashboard(userId);
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message === 'Student record not found') {
          return res.status(404).json({
            success: false,
            message: 'No student profile found for your account. Please contact an administrator.'
          });
        }
        throw error; // re-throw any other errors
      }
    }

    return res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

/**
 * Get dashboard data for Super Admin
 */
const getSuperAdminDashboard = async () => {
  // Run queries in parallel for better performance
  const [
    studentsCount,
    facultyCount,
    departmentsCount,
    subjectsCount,
    recentAttendance,
    recentMarks,
    lowAttendance,
    pendingMarksCount
  ] = await Promise.all([
    // Count of students
    prisma.student.count(),
    
    // Count of faculty
    prisma.faculty.count(),
    
    // Count of departments
    prisma.department.count(),
    
    // Count of subjects
    prisma.subject.count(),
    
    // Recent attendance sessions
    prisma.attendanceSession.findMany({
      take: 5,
      orderBy: { attendanceDate: 'desc' },
      include: {
        subject: true,
        faculty: true,
        _count: {
          select: { entries: true }
        },
        entries: {
          select: { status: true }
        }
      }
    }),
    
    // Recent marks entries
    prisma.studentComponentMark.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        component: {
          include: {
            subject: true
          }
        },
        recorder: {
          include: {
            faculty: true
          }
        }
      },
      distinct: ['componentId']
    }),
    
    // Students with low attendance
    prisma.$queryRaw`
      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, 
        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,
        GROUP_CONCAT(DISTINCT subj.code) as subjects
      FROM Student s
      JOIN AttendanceEntry ae ON s.usn = ae.usn
      JOIN AttendanceSession sess ON ae.sessionId = sess.id
      JOIN Subject subj ON sess.subjectId = subj.id
      GROUP BY s.usn
      HAVING attendancePercentage < 75
      LIMIT 10
    `,
    
    // Count subjects needing marks entry
    prisma.examComponent.count({
      where: {
        studentMarks: {
          none: {}
        }
      }
    })
  ]);

  // Process the attendance data
  const formattedAttendance = recentAttendance.map((session: any) => {
    const total = session._count.entries;
    const present = session.entries.filter((entry: any) => entry.status === 'Present').length;
    
    return {
      id: session.id,
      date: session.attendanceDate,
      faculty: { 
        name: session.faculty ? `${session.faculty.firstName} ${session.faculty.lastName}` : 'N/A' 
      },
      subject: { 
        code: session.subject.code,
        name: session.subject.name
      },
      total,
      present
    };
  });

  // Process the marks data
  const formattedMarks = recentMarks.map((mark: any) => {
    return {
      id: mark.id,
      componentId: mark.componentId,
      updatedAt: mark.updatedAt,
      component: {
        name: mark.component.name,
        maxMarks: mark.component.maxMarks
      },
      subject: {
        code: mark.component.subject.code
      },
      faculty: {
        name: mark.recorder && mark.recorder.faculty ? 
          `${mark.recorder.faculty.firstName} ${mark.recorder.faculty.lastName}` : 'N/A'
      },
      averageMarks: 0 // This would ideally be calculated
    };
  });

  return {
    students: studentsCount,
    faculty: facultyCount,
    departments: departmentsCount,
    subjects: subjectsCount,
    recentAttendance: formattedAttendance,
    recentMarks: formattedMarks,
    lowAttendance,
    pendingMarks: pendingMarksCount
  };
};

/**
 * Get dashboard data for Faculty
 */
const getFacultyDashboard = async (facultyId: number) => {
  // Run queries in parallel for better performance
  const [
    subjectsCount,
    attendanceSessionsCount,
    recentAttendance,
    recentMarks,
    lowAttendance,
    pendingComponents
  ] = await Promise.all([
    // Count of subjects assigned to faculty
    prisma.facultySubjectMapping.count({
      where: {
        facultyId: String(facultyId),
        status: 'active' as any
      }
    }),
    
    // Count of attendance sessions taken by faculty
    prisma.attendanceSession.count({
      where: {
        facultyId: String(facultyId)
      }
    }),
    
    // Recent attendance sessions by faculty
    prisma.attendanceSession.findMany({
      where: {
        facultyId: String(facultyId)
      },
      take: 5,
      orderBy: { attendanceDate: 'desc' },
      include: {
        subject: true,
        _count: {
          select: { entries: true }
        },
        entries: {
          select: { status: true }
        }
      }
    }),
    
    // Recent marks entries by faculty
    prisma.studentComponentMark.findMany({
      where: {
        recordedBy: facultyId
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        component: {
          include: {
            subject: true
          }
        }
      },
      distinct: ['componentId']
    }),
    
    // Students with low attendance in faculty's subjects
    prisma.$queryRaw`
      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, 
        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,
        GROUP_CONCAT(DISTINCT subj.code) as subjects
      FROM Student s
      JOIN AttendanceEntry ae ON s.usn = ae.usn
      JOIN AttendanceSession sess ON ae.sessionId = sess.id
      JOIN Subject subj ON sess.subjectId = subj.id
      WHERE sess.facultyId = ${String(facultyId)}
      GROUP BY s.usn
      HAVING attendancePercentage < 75
      LIMIT 10
    `,
    
    // Components pending mark entry for faculty
    prisma.examComponent.findMany({
      where: {
        subject: {
          facultyMappings: {
            some: {
              facultyId: String(facultyId),
              status: 'active' as any
            }
          }
        },
        studentMarks: {
          none: {}
        }
      },
      include: {
        subject: {
          select: {
            code: true,
            name: true
          }
        }
      }
    })
  ]);

  // Process the attendance data
  const formattedAttendance = recentAttendance.map((session: any) => {
    const total = session._count.entries;
    const present = session.entries.filter((entry: any) => entry.status === 'Present').length;
    
    return {
      id: session.id,
      date: session.attendanceDate,
      subject: { 
        code: session.subject.code,
        name: session.subject.name
      },
      total,
      present
    };
  });

  // Process the marks data
  const formattedMarks = recentMarks.map((mark: any) => {
    return {
      id: mark.id,
      componentId: mark.componentId,
      updatedAt: mark.updatedAt,
      component: {
        name: mark.component.name,
        maxMarks: mark.component.maxMarks
      },
      subject: {
        code: mark.component.subject.code
      },
      averageMarks: 0 // This would ideally be calculated
    };
  });

  return {
    subjects: subjectsCount,
    attendanceSessions: attendanceSessionsCount,
    recentAttendance: formattedAttendance,
    recentMarks: formattedMarks,
    lowAttendance,
    pendingComponents
  };
};

/**
 * Get dashboard data for Department Admin
 */
const getDepartmentAdminDashboard = async (userId: number) => {
  // Get the department ID for this admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true }
  });

  if (!user?.departmentId) {
    throw new Error('Department admin without department assignment');
  }

  const departmentId = user.departmentId;

  // Run queries in parallel for better performance
  const [
    studentsCount,
    facultyCount,
    subjectsCount,
    recentAttendance,
    recentMarks,
    lowAttendance,
    pendingMarksCount
  ] = await Promise.all([
    // Count of students in department
    prisma.student.count({
      where: {
        departmentId
      }
    }),
    
    // Count of faculty in department
    prisma.faculty.count({
      where: {
        departmentId
      }
    }),
    
    // Count of subjects in department
    prisma.subject.count({
      where: {
        departmentId
      }
    }),
    
    // Recent attendance sessions in department
    prisma.attendanceSession.findMany({
      where: {
        subject: {
          departmentId
        }
      },
      take: 5,
      orderBy: { attendanceDate: 'desc' },
      include: {
        subject: true,
        faculty: true,
        _count: {
          select: { entries: true }
        },
        entries: {
          select: { status: true }
        }
      }
    }),
    
    // Recent marks entries in department
    prisma.studentComponentMark.findMany({
      where: {
        component: {
          subject: {
            departmentId
          }
        }
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        component: {
          include: {
            subject: true
          }
        },
        recorder: {
          include: {
            faculty: true
          }
        }
      },
      distinct: ['componentId']
    }),
    
    // Students with low attendance in department
    prisma.$queryRaw`
      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, 
        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,
        GROUP_CONCAT(DISTINCT subj.code) as subjects
      FROM Student s
      JOIN AttendanceEntry ae ON s.usn = ae.usn
      JOIN AttendanceSession sess ON ae.sessionId = sess.id
      JOIN Subject subj ON sess.subjectId = subj.id
      WHERE s.departmentId = ${departmentId}
      GROUP BY s.usn
      HAVING attendancePercentage < 75
      LIMIT 10
    `,
    
    // Count subjects needing marks entry in department
    prisma.examComponent.count({
      where: {
        subject: {
          departmentId
        },
        studentMarks: {
          none: {}
        }
      }
    })
  ]);

  // Process the attendance data
  const formattedAttendance = recentAttendance.map((session: any) => {
    const total = session._count.entries;
    const present = session.entries.filter((entry: any) => entry.status === 'present').length;
    
    return {
      id: session.id,
      date: session.attendanceDate,
      faculty: { 
        name: session.faculty ? `${session.faculty.firstName} ${session.faculty.lastName}` : 'N/A' 
      },
      subject: { 
        code: session.subject.code,
        name: session.subject.name
      },
      total,
      present
    };
  });

  // Process the marks data
  const formattedMarks = recentMarks.map((mark: any) => {
    return {
      id: mark.id,
      componentId: mark.componentId,
      updatedAt: mark.updatedAt,
      component: {
        name: mark.component.name,
        maxMarks: mark.component.maxMarks
      },
      subject: {
        code: mark.component.subject.code
      },
      faculty: {
        name: mark.recorder && mark.recorder.faculty ? 
          `${mark.recorder.faculty.firstName} ${mark.recorder.faculty.lastName}` : 'N/A'
      },
      averageMarks: 0 // This would ideally be calculated
    };
  });

  return {
    students: studentsCount,
    faculty: facultyCount,
    subjects: subjectsCount,
    recentAttendance: formattedAttendance,
    recentMarks: formattedMarks,
    lowAttendance,
    pendingMarks: pendingMarksCount
  };
};

/**
 * Get dashboard data for Student
 */
const getStudentDashboard = async (userId: number) => {
  console.log(`Looking for student with userId: ${userId}`);
  
  // Get the student details
  const student = await prisma.student.findFirst({
    where: {
      userId
    },
    select: {
      usn: true
    }
  });

  if (!student) {
    console.log(`No student found with userId: ${userId}`);
    throw new Error('Student record not found');
  }

  const usn = student.usn;

  // Run queries in parallel for better performance
  const [
    subjectsCount,
    attendanceData,
    marksData,
    semesterPerformance
  ] = await Promise.all([
    // Count of subjects for the student - using raw query to avoid schema mismatch
    prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM Subject s
      JOIN StudentSubjectEnrollment sse ON s.id = sse.subjectId
      WHERE sse.studentUsn = ${usn}
    `,
    
    // Fetch attendance data for the student
    prisma.$queryRaw`
      SELECT 
        subj.code as subjectCode,
        subj.name as subjectName,
        COUNT(ae.id) as totalSessions,
        SUM(CASE WHEN ae.status = 'present' THEN 1 ELSE 0 END) as presentCount
      FROM Student s
      JOIN AttendanceEntry ae ON s.usn = ae.usn
      JOIN AttendanceSession sess ON ae.sessionId = sess.id
      JOIN Subject subj ON sess.subjectId = subj.id
      WHERE s.usn = ${usn}
      GROUP BY subj.id
    `,
    
    // Fetch recent marks for the student
    prisma.studentComponentMark.findMany({
      where: {
        student: {
          usn
        }
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        component: {
          include: {
            subject: true
          }
        }
      }
    }),
    
    // Fetch semester performance data
    prisma.$queryRaw`
      SELECT 
        s.semester as semesterNumber,
        AVG(scm.marksObtained / ec.maxMarks * 10) as sgpa
      FROM Student s
      JOIN StudentComponentMark scm ON s.usn = scm.studentUsn
      JOIN ExamComponent ec ON scm.componentId = ec.id
      WHERE s.usn = ${usn}
        AND ec.maxMarks IS NOT NULL AND ec.maxMarks <> 0
      GROUP BY s.semester
      ORDER BY s.semester
    `
  ]);

  // Process attendance data
  const subjects: Record<string, number> = {};
  let overallAttendance = 0;
  let totalSessions = 0;
  let totalPresent = 0;

  if (Array.isArray(attendanceData)) {
    attendanceData.forEach((data: any) => {
      const percentage = data.totalSessions > 0 
        ? Math.round((data.presentCount / data.totalSessions) * 100)
        : 0; // Avoid division by zero
      subjects[data.subjectName] = percentage;
      
      totalSessions += data.totalSessions;
      totalPresent += data.presentCount;
    });
    
    overallAttendance = totalSessions > 0 
      ? Math.round((totalPresent / totalSessions) * 100) 
      : 0;
  }

  // Process marks data
  const formattedMarks = marksData.map((mark: any) => {
    return {
      id: mark.id,
      component: {
        name: mark.component?.name || 'N/A',
        maxMarks: mark.component?.maxMarks || 0
      },
      subject: {
        code: mark.component?.subject?.code || 'N/A'
      },
      obtainedMarks: mark.marksObtained,
      date: mark.updatedAt
    };
  });

  // Calculate CGPA if semester data is available
  let cgpa = 0;
  if (Array.isArray(semesterPerformance) && semesterPerformance.length > 0) {
    let validSemesters = 0;
    const totalPoints = semesterPerformance.reduce((sum, sem: any) => {
      const sgpaValue = parseFloat(sem.sgpa);
      if (!isNaN(sgpaValue)) {
        validSemesters++;
        return sum + sgpaValue;
      }
      return sum;
    }, 0);
    
    if (validSemesters > 0) {
        cgpa = parseFloat((totalPoints / validSemesters).toFixed(2));
    }
  }

  // Extract subject count from raw query result
  const subjectCountResult = subjectsCount as any;
  const subjectCount = Array.isArray(subjectCountResult) && subjectCountResult.length > 0 
    ? Number(subjectCountResult[0].count) 
    : 0;

  return {
    subjects: subjectCount,
    studentStats: {
      attendance: {
        overall: `${overallAttendance}%`,
        subjects
      },
      performance: {
        cgpa,
        semesters: semesterPerformance
      },
      recentMarks: formattedMarks
    }
  };
}; 
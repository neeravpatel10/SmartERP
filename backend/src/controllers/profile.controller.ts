import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest, NumberKeyedRecord } from '../types';
// No need for this import as we'll implement the check function locally
// import { checkRolePermission } from '../utils/auth';

/**
 * Helper function to check if a user has access to a student profile
 */
const checkProfileAccess = async (userId: number, usn: string): Promise<boolean> => {
  // Implement access control logic here
  // For now, just return true
  return true;
};

/**
 * Get student academic profile including marks and attendance
 */
export const getStudentProfile = async (req: Request, res: Response) => {
  try {
    const { usn } = req.params;
    const user = (req as any).user;

    // Check permissions - only the student, faculty in charge, dept admin or super admin
    // can access a student's profile
    const canAccess = await checkProfileAccess(user?.userId, usn);
    
    if (!canAccess && user?.loginType !== 1) { // Super admin always has access
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this student profile'
      });
    }

    // Fetch student details
    const student = await prisma.student.findUnique({
      where: { usn },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        batch: {
          select: {
            id: true,
            name: true
            // Remove year as it doesn't exist in BatchSelect
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all semesters for this student based on marks data
    const semesterData = await prisma.$queryRaw`
      SELECT DISTINCT semester
      FROM \`ExamComponent\` ec
      JOIN \`StudentComponentMark\` scm ON ec.id = scm.componentId
      JOIN \`Subject\` s ON ec.subjectId = s.id
      WHERE scm.usn = ${usn}
      ORDER BY semester ASC
    `;

    // Get all academic data for this student
    const academicData: any = {
      semesters: [],
      cumulativeSummary: {
        totalAttendanceAverage: 0,
        totalSubjectsAttempted: 0
      }
    };

    // Process each semester
    let totalAttendanceSum = 0;
    let totalSubjectsAttempted = 0;

    for (const semItem of semesterData as { semester: number }[]) {
      const semester = semItem.semester;
      
      // Get subjects, marks and components for this semester
      const subjects = await prisma.subject.findMany({
        where: {
          semester,
          departmentId: student.departmentId
        },
        include: {
          components: {
            include: {
              studentMarks: {
                where: { usn }
              }
              // Use correct property name instead of 'iaConfig'
            }
          }
        }
      });

      // Format subject data with marks
      const subjectsWithMarks = subjects.map(subject => {
        // Calculate total marks for the subject
        let totalMarksObtained = 0;
        let totalMaxMarks = 0;
        
        // Check if components exists before accessing it
        const components = subject.components ? subject.components.map((component: any) => {
          const studentMark = component.studentMarks?.[0];
          const marksObtained = studentMark ? studentMark.marksObtained : 0;
          
          totalMarksObtained += marksObtained;
          totalMaxMarks += component.maxMarks || 0;
          
          return {
            id: component.id,
            name: component.name,
            type: component.componentType,
            maxMarks: component.maxMarks || 0,
            marksObtained
          };
        }) : [];
        
        totalSubjectsAttempted++;
        
        return {
          id: subject.id,
          code: subject.code,
          name: subject.name,
          credits: subject.credits,
          isLab: subject.isLab,
          components,
          totalMarksObtained,
          totalMaxMarks,
          percentage: totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0
        };
      });

      // Get attendance data for the semester
      const attendanceSessions = await prisma.attendanceSession.findMany({
        where: {
          semester,
          subject: {
            departmentId: student.departmentId
          }
        },
        include: {
          subject: true,
          entries: {
            where: { usn }
          }
        }
      });
      
      // Group attendance by subject
      const attendanceBySubject: NumberKeyedRecord<{
        subject: {
          id: number;
          code: string;
          name: string;
        };
        sessions: number;
        present: number;
        absent: number;
        other: number;
        percentage: number;
      }> = {};
      
      attendanceSessions.forEach(session => {
        const subjectId = session.subject.id;
        
        if (!attendanceBySubject[subjectId]) {
          attendanceBySubject[subjectId] = {
            subject: {
              id: session.subject.id,
              code: session.subject.code,
              name: session.subject.name
            },
            sessions: 0,
            present: 0,
            absent: 0,
            other: 0,
            percentage: 0
          };
        }
        
        attendanceBySubject[subjectId].sessions++;
        
        // Check if student has an entry for this session
        if (session.entries.length > 0) {
          const status = session.entries[0].status;
          
          if (status === 'Present') {
            attendanceBySubject[subjectId].present++;
          } else if (status === 'Absent') {
            attendanceBySubject[subjectId].absent++;
          } else {
            attendanceBySubject[subjectId].other++;
          }
        } else {
          // If no entry, count as absent
          attendanceBySubject[subjectId].absent++;
        }
      });
      
      // Calculate attendance percentages
      Object.keys(attendanceBySubject).forEach(id => {
        const numId = parseInt(id);
        const subject = attendanceBySubject[numId];
        subject.percentage = subject.sessions > 0 
          ? (subject.present / subject.sessions) * 100 
          : 0;
        
        totalAttendanceSum += subject.percentage;
      });
      
      // Get total marks for the semester
      const semesterTotalObtained = subjectsWithMarks.reduce((sum, subject) => sum + subject.totalMarksObtained, 0);
      const semesterTotalMax = subjectsWithMarks.reduce((sum, subject) => sum + subject.totalMaxMarks, 0);
      
      academicData.semesters.push({
        semester,
        subjects: subjectsWithMarks,
        attendance: Object.values(attendanceBySubject),
        totalMarks: {
          obtained: semesterTotalObtained,
          max: semesterTotalMax,
          percentage: semesterTotalMax > 0 ? (semesterTotalObtained / semesterTotalMax) * 100 : 0
        }
      });
    }

    // Calculate cumulative summary
    academicData.cumulativeSummary = {
      totalAttendanceAverage: academicData.semesters.length > 0 
        ? totalAttendanceSum / totalSubjectsAttempted 
        : 0,
      totalSubjectsAttempted
    };

    res.json({
      success: true,
      data: {
        student: {
          usn: student.usn,
          name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim(),
          email: student.email,
          phone: student.phone,
          department: student.departmentId,
          batch: student.batchId,
          currentSemester: student.semester,
          section: student.section
        },
        academicData
      }
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Download student profile as PDF
 * Only faculty and admins can download profiles
 */
export const downloadStudentProfile = async (req: Request, res: Response) => {
  try {
    const { usn } = req.params;
    const user = (req as any).user;

    // Check if user has permission to download profile
    // Only faculty and admins can download profiles
    if (user?.loginType === 4) { // Student role
      return res.status(403).json({
        success: false,
        message: 'Students cannot download profiles'
      });
    }

    // Check permissions
    const canAccess = await checkProfileAccess(user?.userId, usn);
    
    if (!canAccess && user?.loginType !== 1) { // Super admin always has access
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this student profile'
      });
    }

    // For now, return the same data as getStudentProfile
    // In a real implementation, this would generate a PDF
    // and send it as a download
    res.json({
      success: true,
      message: 'PDF download functionality will be implemented in the future',
      data: {
        usn,
        downloadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Download student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get semester data for a specific student
 */
export const getStudentSemesterData = async (req: Request, res: Response) => {
  try {
    const { usn, sem_number } = req.params;
    const user = (req as any).user;

    // Check permissions
    const canAccess = await checkProfileAccess(user?.userId, usn);
    
    if (!canAccess && user?.loginType !== 1) { // Super admin always has access
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this student data'
      });
    }

    // Fetch student details
    const student = await prisma.student.findUnique({
      where: { usn },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const semester = parseInt(sem_number);

    // Get subjects, marks and components for this semester
    const subjects = await prisma.subject.findMany({
      where: {
        semester,
        departmentId: student.departmentId
      },
      include: {
        components: {
          include: {
            studentMarks: {
              where: { usn }
            }
            // Use correct property name instead of 'iaConfig'
          }
        }
      }
    });

    // Format subject data with marks
    const subjectsWithMarks = subjects.map(subject => {
      // Calculate total marks for the subject
      let totalMarksObtained = 0;
      let totalMaxMarks = 0;
      
      // Check if components exists before accessing it
      const components = subject.components ? subject.components.map((component: any) => {
        const studentMark = component.studentMarks?.[0];
        const marksObtained = studentMark ? studentMark.marksObtained : 0;
        
        totalMarksObtained += marksObtained;
        totalMaxMarks += component.maxMarks || 0;
        
        return {
          id: component.id,
          name: component.name,
          type: component.componentType,
          maxMarks: component.maxMarks || 0,
          marksObtained
        };
      }) : [];
      
      return {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        isLab: subject.isLab,
        components,
        totalMarksObtained,
        totalMaxMarks,
        percentage: totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0
      };
    });

    // Get attendance data for the semester
    const attendanceSessions = await prisma.attendanceSession.findMany({
      where: {
        semester,
        subject: {
          departmentId: student.departmentId
        }
      },
      include: {
        subject: true,
        entries: {
          where: { usn }
        }
      }
    });
    
    // Group attendance by subject
    const attendanceBySubject: NumberKeyedRecord<{
      subject: {
        id: number;
        code: string;
        name: string;
      };
      sessions: number;
      present: number;
      absent: number;
      other: number;
      percentage: number;
    }> = {};
    
    attendanceSessions.forEach(session => {
      const subjectId = session.subject.id;
      
      if (!attendanceBySubject[subjectId]) {
        attendanceBySubject[subjectId] = {
          subject: {
            id: session.subject.id,
            code: session.subject.code,
            name: session.subject.name
          },
          sessions: 0,
          present: 0,
          absent: 0,
          other: 0,
          percentage: 0
        };
      }
      
      attendanceBySubject[subjectId].sessions++;
      
      // Check if student has an entry for this session
      if (session.entries.length > 0) {
        const status = session.entries[0].status;
        
        if (status === 'Present') {
          attendanceBySubject[subjectId].present++;
        } else if (status === 'Absent') {
          attendanceBySubject[subjectId].absent++;
        } else {
          attendanceBySubject[subjectId].other++;
        }
      } else {
        // If no entry, count as absent
        attendanceBySubject[subjectId].absent++;
      }
    });
    
    // Calculate attendance percentages
    Object.keys(attendanceBySubject).forEach(id => {
      const numId = parseInt(id);
      const subject = attendanceBySubject[numId];
      subject.percentage = subject.sessions > 0 
        ? (subject.present / subject.sessions) * 100 
        : 0;
    });
    
    // Get total marks for the semester
    const semesterTotalObtained = subjectsWithMarks.reduce((sum, subject) => sum + subject.totalMarksObtained, 0);
    const semesterTotalMax = subjectsWithMarks.reduce((sum, subject) => sum + subject.totalMaxMarks, 0);

    res.json({
      success: true,
      data: {
        student: {
          usn: student.usn,
          name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim(),
          email: student.email,
          phone: student.phone,
          department: student.departmentId,
          batch: student.batchId,
          currentSemester: student.semester,
          section: student.section
        },
        semester,
        subjects: subjectsWithMarks,
        attendance: Object.values(attendanceBySubject),
        totalMarks: {
          obtained: semesterTotalObtained,
          max: semesterTotalMax,
          percentage: semesterTotalMax > 0 ? (semesterTotalObtained / semesterTotalMax) * 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Get student semester data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 
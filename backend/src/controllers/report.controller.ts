import { Request, Response } from 'express';
import { prisma } from '../index';
import { ApiError, BadRequestError, NotFoundError } from '../utils/errors';
import { calculateAttendancePercentage } from '../utils/helpers';

// Get faculty subject report
export const getFacultySubjectReport = async (req: Request, res: Response) => {
  try {
    const { facultyId, subjectId } = req.params;
    
    if (!facultyId || !subjectId) {
      throw new BadRequestError('Faculty ID and Subject ID are required');
    }

    // Get faculty and subject details
    const faculty = await prisma.user.findUnique({
      where: { id: parseInt(facultyId) },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) },
      select: {
        id: true,
        name: true,
        code: true,
        credits: true,
        semester: true,
        department: { select: { name: true } },
      },
    });

    if (!faculty) {
      throw new NotFoundError('Faculty not found');
    }

    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    // Get all students for this subject and semester
    // Note: Using Mark model as a proxy for enrollment since there's no studentSubject model
    const enrollments = await prisma.mark.findMany({
      where: { subjectId: parseInt(subjectId) },
      include: {
        student: {
          select: {
            usn: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Get attendance records
    const attendanceSessions = await prisma.attendanceSession.findMany({
      where: {
        subjectId: parseInt(subjectId),
        facultyId,
      },
      include: {
        entries: {
          include: {
            student: true,
          },
        },
      },
    });

    // Get exam components
    const examComponents = await prisma.examComponent.findMany({
      where: {
        subjectId: parseInt(subjectId),
      },
      include: {
        iaConfigs: true,
        studentMarks: {
          include: {
            student: true,
          },
        },
      },
    });

    // Calculate attendance statistics
    const totalClasses = attendanceSessions.length;
    
    // Process student data
    const studentData = enrollments.map((enrollment: any) => {
      const student = enrollment.student;
      
      // Calculate attendance
      const studentAttendances = attendanceSessions.flatMap((record: any) => 
        record.entries.filter((sa: any) => sa.usn === student.usn)
      );
      
      const attendedClasses = studentAttendances.filter((sa: any) => sa.status === 'Present').length;
      const attendancePercentage = calculateAttendancePercentage(attendedClasses, totalClasses);
      
      // Calculate marks
      const componentMarks = examComponents.map((component: any) => {
        const studentMark = component.studentMarks?.find(
          (mark: any) => mark.usn === student.usn
        );
        
        return {
          componentId: component.id,
          componentName: component.name,
          maxMarks: component.maxMarks,
          marksObtained: studentMark?.marksObtained || 0,
          percentage: studentMark ? (studentMark.marksObtained / component.maxMarks) * 100 : 0,
        };
      });
      
      // Calculate overall performance
      const totalMaxMarks = componentMarks.reduce((sum: number, comp: any) => sum + comp.maxMarks, 0);
      const totalMarksObtained = componentMarks.reduce((sum: number, comp: any) => sum + comp.marksObtained, 0);
      const overallPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
      
      return {
        usn: student.usn,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        email: student.email,
        attendance: {
          present: attendedClasses,
          absent: totalClasses - attendedClasses,
          percentage: attendancePercentage,
        },
        components: componentMarks,
        overallPerformance: {
          totalMaxMarks,
          totalMarksObtained,
          percentage: overallPercentage,
        },
      };
    });

    // Calculate class averages
    const classAverages = {
      attendance: studentData.reduce((sum: number, student: any) => sum + student.attendance.percentage, 0) / studentData.length || 0,
      components: examComponents.map((component: any) => {
        const componentStudentMarks = studentData.map((student: any) => 
          student.components.find((c: any) => c.componentId === component.id)?.percentage || 0
        );
        
        return {
          componentId: component.id,
          componentName: component.name,
          averagePercentage: componentStudentMarks.reduce((sum: number, mark: any) => sum + mark, 0) / componentStudentMarks.length || 0,
        };
      }),
      overallPerformance: studentData.reduce((sum: number, student: any) => sum + student.overallPerformance.percentage, 0) / studentData.length || 0,
    };

    // Count students in different grade brackets
    const gradeCounts = {
      excellent: studentData.filter((student: any) => student.overallPerformance.percentage >= 80).length,
      good: studentData.filter((student: any) => student.overallPerformance.percentage >= 60 && student.overallPerformance.percentage < 80).length,
      average: studentData.filter((student: any) => student.overallPerformance.percentage >= 40 && student.overallPerformance.percentage < 60).length,
      belowAverage: studentData.filter((student: any) => student.overallPerformance.percentage < 40).length,
    };

    // Attendance distribution
    const attendanceDistribution = [
      { name: 'Above 90%', value: studentData.filter((student: any) => student.attendance.percentage >= 90).length },
      { name: '75-90%', value: studentData.filter((student: any) => student.attendance.percentage >= 75 && student.attendance.percentage < 90).length },
      { name: '60-75%', value: studentData.filter((student: any) => student.attendance.percentage >= 60 && student.attendance.percentage < 75).length },
      { name: 'Below 60%', value: studentData.filter((student: any) => student.attendance.percentage < 60).length },
    ];

    // Component comparison
    const componentComparison = examComponents.map((component: any) => ({
      name: component.name,
      value: classAverages.components.find((c: any) => c.componentId === component.id)?.averagePercentage || 0,
    }));

    // Prepare scatter data for correlation analysis
    const correlationData = studentData.map((student: any) => ({
      name: student.name,
      attendance: student.attendance.percentage,
      performance: student.overallPerformance.percentage,
    }));

    return res.json({
      faculty,
      subject,
      statistics: {
        totalStudents: studentData.length,
        totalClasses,
        classAverages,
        gradeCounts,
      },
      charts: {
        attendanceDistribution,
        componentComparison,
        correlationData,
      },
      studentData,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Error in getFacultySubjectReport:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 
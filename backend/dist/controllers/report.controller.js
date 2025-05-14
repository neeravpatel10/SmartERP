"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFacultySubjectReport = void 0;
const index_1 = require("../index");
const errors_1 = require("../utils/errors");
const helpers_1 = require("../utils/helpers");
// Get faculty subject report
const getFacultySubjectReport = async (req, res) => {
    try {
        const { facultyId, subjectId } = req.params;
        if (!facultyId || !subjectId) {
            throw new errors_1.BadRequestError('Faculty ID and Subject ID are required');
        }
        // Get faculty and subject details
        const faculty = await index_1.prisma.user.findUnique({
            where: { id: parseInt(facultyId) },
            select: {
                id: true,
                username: true,
                email: true,
            },
        });
        const subject = await index_1.prisma.subject.findUnique({
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
            throw new errors_1.NotFoundError('Faculty not found');
        }
        if (!subject) {
            throw new errors_1.NotFoundError('Subject not found');
        }
        // Get all students for this subject and semester
        // Note: Using Mark model as a proxy for enrollment since there's no studentSubject model
        const enrollments = await index_1.prisma.mark.findMany({
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
        const attendanceSessions = await index_1.prisma.attendanceSession.findMany({
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
        const examComponents = await index_1.prisma.examComponent.findMany({
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
        const studentData = enrollments.map((enrollment) => {
            const student = enrollment.student;
            // Calculate attendance
            const studentAttendances = attendanceSessions.flatMap((record) => record.entries.filter((sa) => sa.usn === student.usn));
            const attendedClasses = studentAttendances.filter((sa) => sa.status === 'Present').length;
            const attendancePercentage = (0, helpers_1.calculateAttendancePercentage)(attendedClasses, totalClasses);
            // Calculate marks
            const componentMarks = examComponents.map((component) => {
                var _a;
                const studentMark = (_a = component.studentMarks) === null || _a === void 0 ? void 0 : _a.find((mark) => mark.usn === student.usn);
                return {
                    componentId: component.id,
                    componentName: component.name,
                    maxMarks: component.maxMarks,
                    marksObtained: (studentMark === null || studentMark === void 0 ? void 0 : studentMark.marksObtained) || 0,
                    percentage: studentMark ? (studentMark.marksObtained / component.maxMarks) * 100 : 0,
                };
            });
            // Calculate overall performance
            const totalMaxMarks = componentMarks.reduce((sum, comp) => sum + comp.maxMarks, 0);
            const totalMarksObtained = componentMarks.reduce((sum, comp) => sum + comp.marksObtained, 0);
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
            attendance: studentData.reduce((sum, student) => sum + student.attendance.percentage, 0) / studentData.length || 0,
            components: examComponents.map((component) => {
                const componentStudentMarks = studentData.map((student) => { var _a; return ((_a = student.components.find((c) => c.componentId === component.id)) === null || _a === void 0 ? void 0 : _a.percentage) || 0; });
                return {
                    componentId: component.id,
                    componentName: component.name,
                    averagePercentage: componentStudentMarks.reduce((sum, mark) => sum + mark, 0) / componentStudentMarks.length || 0,
                };
            }),
            overallPerformance: studentData.reduce((sum, student) => sum + student.overallPerformance.percentage, 0) / studentData.length || 0,
        };
        // Count students in different grade brackets
        const gradeCounts = {
            excellent: studentData.filter((student) => student.overallPerformance.percentage >= 80).length,
            good: studentData.filter((student) => student.overallPerformance.percentage >= 60 && student.overallPerformance.percentage < 80).length,
            average: studentData.filter((student) => student.overallPerformance.percentage >= 40 && student.overallPerformance.percentage < 60).length,
            belowAverage: studentData.filter((student) => student.overallPerformance.percentage < 40).length,
        };
        // Attendance distribution
        const attendanceDistribution = [
            { name: 'Above 90%', value: studentData.filter((student) => student.attendance.percentage >= 90).length },
            { name: '75-90%', value: studentData.filter((student) => student.attendance.percentage >= 75 && student.attendance.percentage < 90).length },
            { name: '60-75%', value: studentData.filter((student) => student.attendance.percentage >= 60 && student.attendance.percentage < 75).length },
            { name: 'Below 60%', value: studentData.filter((student) => student.attendance.percentage < 60).length },
        ];
        // Component comparison
        const componentComparison = examComponents.map((component) => {
            var _a;
            return ({
                name: component.name,
                value: ((_a = classAverages.components.find((c) => c.componentId === component.id)) === null || _a === void 0 ? void 0 : _a.averagePercentage) || 0,
            });
        });
        // Prepare scatter data for correlation analysis
        const correlationData = studentData.map((student) => ({
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
    }
    catch (error) {
        if (error instanceof errors_1.ApiError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Error in getFacultySubjectReport:', error instanceof Error ? error.message : 'Unknown error');
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getFacultySubjectReport = getFacultySubjectReport;

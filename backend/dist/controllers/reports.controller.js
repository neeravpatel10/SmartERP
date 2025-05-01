"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepartmentReport = exports.getAttendanceReport = exports.getFacultySubjectReport = exports.getStudentSemesterReport = void 0;
console.log('Loading reports.controller.ts'); // Log file load
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// User login types
const ADMIN_ROLE = 1;
const FACULTY_ROLE = 2;
const DEPT_ADMIN_ROLE = 3;
/**
 * Get student's marks report by semester
 */
const getStudentSemesterReport = async (req, res) => {
    try {
        const { usn, semester } = req.params;
        // Verify student exists
        const student = await prisma.student.findUnique({
            where: { usn },
            include: {
                department: true
            }
        });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        // Get subjects for the specified semester
        const subjects = await prisma.subject.findMany({
            where: {
                semester: parseInt(semester),
                departmentId: student.departmentId
            },
            include: {
                examComponents: {
                    include: {
                        studentMarks: {
                            where: { usn }
                        }
                    }
                }
            }
        });
        // Format subject data with marks
        const subjectsWithMarks = subjects.map(subject => {
            // Calculate total marks for the subject
            let totalMarksObtained = 0;
            let totalMaxMarks = 0;
            const components = subject.examComponents.map(component => {
                const studentMark = component.studentMarks[0];
                const marksObtained = studentMark ? studentMark.marksObtained : 0;
                totalMarksObtained += marksObtained;
                totalMaxMarks += component.maxMarks;
                return {
                    id: component.id,
                    name: component.name,
                    type: component.componentType,
                    maxMarks: component.maxMarks,
                    marksObtained
                };
            });
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
                semester: parseInt(semester),
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
        const attendanceBySubject = {};
        for (const session of attendanceSessions) {
            const subjectId = session.subjectId.toString();
            if (!attendanceBySubject[subjectId]) {
                attendanceBySubject[subjectId] = {
                    totalSessions: 0,
                    presentSessions: 0,
                    percentage: 0
                };
            }
            attendanceBySubject[subjectId].totalSessions++;
            // Check if student was present
            const entry = session.entries[0];
            if (entry && entry.status === 'Present') {
                attendanceBySubject[subjectId].presentSessions++;
            }
        }
        // Calculate attendance percentages
        for (const subjectId in attendanceBySubject) {
            const attendance = attendanceBySubject[subjectId];
            attendance.percentage = attendance.totalSessions > 0
                ? (attendance.presentSessions / attendance.totalSessions) * 100
                : 0;
        }
        // Add attendance data to subject reports
        const reportWithAttendance = subjectsWithMarks.map(subject => ({
            ...subject,
            attendance: attendanceBySubject[subject.id.toString()] || {
                totalSessions: 0,
                presentSessions: 0,
                percentage: 0
            }
        }));
        // Calculate semester summary
        const semesterSummary = {
            totalSubjects: reportWithAttendance.length,
            totalMarksObtained: reportWithAttendance.reduce((sum, subject) => sum + subject.totalMarksObtained, 0),
            totalMaxMarks: reportWithAttendance.reduce((sum, subject) => sum + subject.totalMaxMarks, 0),
            averagePercentage: 0,
            averageAttendance: 0
        };
        semesterSummary.averagePercentage = semesterSummary.totalMaxMarks > 0
            ? (semesterSummary.totalMarksObtained / semesterSummary.totalMaxMarks) * 100
            : 0;
        const totalAttendancePercentage = reportWithAttendance.reduce((sum, subject) => sum + subject.attendance.percentage, 0);
        semesterSummary.averageAttendance = reportWithAttendance.length > 0
            ? totalAttendancePercentage / reportWithAttendance.length
            : 0;
        res.json({
            success: true,
            data: {
                student: {
                    usn: student.usn,
                    name: `${student.firstName} ${student.lastName}`,
                    department: student.department.name,
                    semester: parseInt(semester),
                    section: student.section
                },
                semester: parseInt(semester),
                subjects: reportWithAttendance,
                summary: semesterSummary
            }
        });
    }
    catch (error) {
        console.error('Get student semester report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStudentSemesterReport = getStudentSemesterReport;
/**
 * Get faculty's subject-wise report
 */
const getFacultySubjectReport = async (req, res) => {
    var _a;
    try {
        const { facultyId, subjectId } = req.params;
        // Verify faculty exists
        const faculty = await prisma.faculty.findUnique({
            where: { id: parseInt(facultyId) }
        });
        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Faculty not found'
            });
        }
        // Verify subject exists
        const subject = await prisma.subject.findUnique({
            where: { id: parseInt(subjectId) },
            include: {
                examComponents: true
            }
        });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // Check faculty-subject mapping
        const mapping = await prisma.facultySubjectMapping.findFirst({
            where: {
                facultyId: parseInt(facultyId),
                subjectId: parseInt(subjectId)
            }
        });
        if (!mapping && ((_a = req.user) === null || _a === void 0 ? void 0 : _a.loginType) !== ADMIN_ROLE) {
            return res.status(403).json({
                success: false,
                message: 'Faculty not authorized for this subject'
            });
        }
        // Get all students for this subject's semester
        const students = await prisma.student.findMany({
            where: {
                semester: subject.semester,
                departmentId: subject.departmentId,
                section: (mapping === null || mapping === void 0 ? void 0 : mapping.section) || undefined
            }
        });
        // Get all marks for each student
        const studentsData = [];
        for (const student of students) {
            // Get component marks
            const componentMarks = [];
            let totalMarksObtained = 0;
            let totalMaxMarks = 0;
            for (const component of subject.examComponents) {
                const mark = await prisma.studentComponentMark.findFirst({
                    where: {
                        usn: student.usn,
                        componentId: component.id
                    }
                });
                const marksObtained = mark ? mark.marksObtained : 0;
                totalMarksObtained += marksObtained;
                totalMaxMarks += component.maxMarks;
                componentMarks.push({
                    componentId: component.id,
                    componentName: component.name,
                    componentType: component.componentType,
                    maxMarks: component.maxMarks,
                    marksObtained
                });
            }
            // Get attendance data
            const attendanceSessions = await prisma.attendanceSession.findMany({
                where: {
                    subjectId: parseInt(subjectId),
                    section: student.section
                },
                include: {
                    entries: {
                        where: { usn: student.usn }
                    }
                }
            });
            let totalSessions = attendanceSessions.length;
            let presentSessions = 0;
            for (const session of attendanceSessions) {
                const entry = session.entries[0];
                if (entry && entry.status === 'Present') {
                    presentSessions++;
                }
            }
            const attendancePercentage = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;
            const marksPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
            studentsData.push({
                usn: student.usn,
                name: `${student.firstName} ${student.lastName}`,
                section: student.section,
                components: componentMarks,
                totalMarksObtained,
                totalMaxMarks,
                percentage: marksPercentage,
                attendance: {
                    totalSessions,
                    presentSessions,
                    percentage: attendancePercentage
                }
            });
        }
        // Calculate statistics
        const statistics = {
            totalStudents: studentsData.length,
            averageMarks: 0,
            highestMarks: 0,
            lowestMarks: studentsData.length > 0 ? studentsData[0].totalMarksObtained : 0,
            aboveAverageCount: 0,
            belowThresholdCount: 0,
            threshold: 40, // configurable
            attendanceAverage: 0
        };
        let totalMarks = 0;
        let totalAttendance = 0;
        for (const student of studentsData) {
            totalMarks += student.percentage;
            totalAttendance += student.attendance.percentage;
            if (student.totalMarksObtained > statistics.highestMarks) {
                statistics.highestMarks = student.totalMarksObtained;
            }
            if (student.totalMarksObtained < statistics.lowestMarks) {
                statistics.lowestMarks = student.totalMarksObtained;
            }
        }
        statistics.averageMarks = studentsData.length > 0 ? totalMarks / studentsData.length : 0;
        statistics.attendanceAverage = studentsData.length > 0 ? totalAttendance / studentsData.length : 0;
        // Count students above average and below threshold
        for (const student of studentsData) {
            if (student.percentage > statistics.averageMarks) {
                statistics.aboveAverageCount++;
            }
            if (student.percentage < statistics.threshold) {
                statistics.belowThresholdCount++;
            }
        }
        res.json({
            success: true,
            data: {
                subject: {
                    id: subject.id,
                    code: subject.code,
                    name: subject.name,
                    semester: subject.semester,
                    credits: subject.credits,
                    isLab: subject.isLab
                },
                students: studentsData,
                statistics,
                components: subject.examComponents.map(comp => ({
                    id: comp.id,
                    name: comp.name,
                    type: comp.componentType,
                    maxMarks: comp.maxMarks
                }))
            }
        });
    }
    catch (error) {
        console.error('Get faculty subject report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFacultySubjectReport = getFacultySubjectReport;
console.log('Exporting getAttendanceReport'); // Log before export
const getAttendanceReport = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { section, threshold = 85 } = req.query;
        // Verify subject exists
        const subject = await prisma.subject.findUnique({
            where: { id: parseInt(subjectId) }
        });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // Get all sessions for this subject
        const sessions = await prisma.attendanceSession.findMany({
            where: {
                subjectId: parseInt(subjectId),
                ...(section && { section: section })
            },
            include: {
                entries: true
            }
        });
        // Get all students for this subject's semester
        const students = await prisma.student.findMany({
            where: {
                semester: subject.semester,
                departmentId: subject.departmentId,
                ...(section && { section: section })
            }
        });
        // Calculate attendance for each student
        const studentsAttendance = [];
        for (const student of students) {
            let totalSessions = 0;
            let presentSessions = 0;
            for (const session of sessions) {
                totalSessions++;
                const entry = session.entries.find(e => e.usn === student.usn);
                if (entry && entry.status === 'Present') {
                    presentSessions++;
                }
            }
            const attendancePercentage = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;
            const isBelowThreshold = attendancePercentage < parseFloat(threshold);
            studentsAttendance.push({
                usn: student.usn,
                name: `${student.firstName} ${student.lastName}`,
                section: student.section,
                totalSessions,
                presentSessions,
                percentage: attendancePercentage,
                isBelowThreshold
            });
        }
        // Sort by attendance percentage (ascending)
        studentsAttendance.sort((a, b) => a.percentage - b.percentage);
        // Calculate statistics
        const statistics = {
            totalStudents: studentsAttendance.length,
            totalSessions: sessions.length,
            averageAttendance: 0,
            belowThresholdCount: 0,
            threshold: parseFloat(threshold)
        };
        let totalAttendance = 0;
        for (const student of studentsAttendance) {
            totalAttendance += student.percentage;
            if (student.isBelowThreshold) {
                statistics.belowThresholdCount++;
            }
        }
        statistics.averageAttendance = studentsAttendance.length > 0
            ? totalAttendance / studentsAttendance.length
            : 0;
        res.json({
            success: true,
            data: {
                subject: {
                    id: subject.id,
                    code: subject.code,
                    name: subject.name,
                    semester: subject.semester
                },
                students: studentsAttendance,
                statistics
            }
        });
    }
    catch (error) {
        console.error('Get attendance report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAttendanceReport = getAttendanceReport;
console.log('Exporting getDepartmentReport'); // Log before export
const getDepartmentReport = async (req, res) => {
    var _a;
    try {
        const { departmentId } = req.params;
        const { semester, batch } = req.query;
        // Verify department exists
        const department = await prisma.department.findUnique({
            where: { id: parseInt(departmentId) }
        });
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        // Get subjects for this department and semester
        const subjects = await prisma.subject.findMany({
            where: {
                departmentId: parseInt(departmentId),
                ...(semester && { semester: parseInt(semester) })
            }
        });
        // Get all students for this department and batch
        const students = await prisma.student.findMany({
            where: {
                departmentId: parseInt(departmentId),
                ...(semester && { semester: parseInt(semester) }),
                ...(batch && { batchId: parseInt(batch) })
            },
            include: {
                batch: true
            }
        });
        // Get all exam components for these subjects
        const examComponents = await prisma.examComponent.findMany({
            where: {
                subject: {
                    departmentId: parseInt(departmentId),
                    ...(semester && { semester: parseInt(semester) })
                }
            },
            include: {
                subject: true
            }
        });
        // Get all marks for these students and components
        const studentComponentMarks = await prisma.studentComponentMark.findMany({
            where: {
                usn: {
                    in: students.map(s => s.usn)
                },
                componentId: {
                    in: examComponents.map(c => c.id)
                }
            }
        });
        // Group marks by subject
        const subjectPerformance = [];
        for (const subject of subjects) {
            const subjectComponents = examComponents.filter(c => c.subjectId === subject.id);
            if (subjectComponents.length === 0)
                continue;
            const totalMaxMarks = subjectComponents.reduce((sum, c) => sum + c.maxMarks, 0);
            const studentPerformance = [];
            let totalPercentage = 0;
            let highestPercentage = 0;
            let lowestPercentage = 100;
            let aboveThresholdCount = 0;
            const threshold = 40; // configurable
            for (const student of students) {
                let totalMarksObtained = 0;
                for (const component of subjectComponents) {
                    const mark = studentComponentMarks.find(m => m.usn === student.usn && m.componentId === component.id);
                    if (mark) {
                        totalMarksObtained += mark.marksObtained;
                    }
                }
                const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
                totalPercentage += percentage;
                if (percentage > highestPercentage) {
                    highestPercentage = percentage;
                }
                if (percentage < lowestPercentage && percentage > 0) {
                    lowestPercentage = percentage;
                }
                if (percentage >= threshold) {
                    aboveThresholdCount++;
                }
                studentPerformance.push({
                    usn: student.usn,
                    name: `${student.firstName} ${student.lastName}`,
                    section: student.section,
                    batch: (_a = student.batch) === null || _a === void 0 ? void 0 : _a.name,
                    totalMarksObtained,
                    totalMaxMarks,
                    percentage
                });
            }
            // Sort by percentage (descending)
            studentPerformance.sort((a, b) => b.percentage - a.percentage);
            const averagePercentage = studentPerformance.length > 0
                ? totalPercentage / studentPerformance.length
                : 0;
            subjectPerformance.push({
                id: subject.id,
                code: subject.code,
                name: subject.name,
                semester: subject.semester,
                totalStudents: studentPerformance.length,
                statistics: {
                    averagePercentage,
                    highestPercentage,
                    lowestPercentage: lowestPercentage === 100 ? 0 : lowestPercentage,
                    aboveThresholdCount,
                    threshold
                },
                topPerformers: studentPerformance.slice(0, 5), // Top 5 students
                bottomPerformers: studentPerformance.slice(-5).reverse() // Bottom 5 students
            });
        }
        // Calculate overall department statistics
        const departmentStatistics = {
            totalStudents: students.length,
            totalSubjects: subjects.length,
            averagePerformance: 0,
            subjectsWithHighestAverage: [],
            subjectsWithLowestAverage: []
        };
        if (subjectPerformance.length > 0) {
            const totalAverage = subjectPerformance.reduce((sum, s) => sum + s.statistics.averagePercentage, 0);
            departmentStatistics.averagePerformance = totalAverage / subjectPerformance.length;
            // Sort subjects by average performance
            const sortedSubjects = [...subjectPerformance].sort((a, b) => b.statistics.averagePercentage - a.statistics.averagePercentage);
            departmentStatistics.subjectsWithHighestAverage = sortedSubjects.slice(0, 3).map(s => ({
                id: s.id,
                code: s.code,
                name: s.name,
                average: s.statistics.averagePercentage
            }));
            departmentStatistics.subjectsWithLowestAverage = sortedSubjects.slice(-3).reverse().map(s => ({
                id: s.id,
                code: s.code,
                name: s.name,
                average: s.statistics.averagePercentage
            }));
        }
        res.json({
            success: true,
            data: {
                department: {
                    id: department.id,
                    name: department.name,
                    code: department.code
                },
                filters: {
                    semester: semester ? parseInt(semester) : null,
                    batch: batch ? parseInt(batch) : null
                },
                statistics: departmentStatistics,
                subjects: subjectPerformance
            }
        });
    }
    catch (error) {
        console.error('Get department report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getDepartmentReport = getDepartmentReport;

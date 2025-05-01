"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewStudentResults = exports.viewSubjectResults = exports.calculateStudentResult = exports.calculateStudentSubjectResult = exports.calculateSubjectResults = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Calculate final results for a subject
 */
const calculateSubjectResults = async (req, res) => {
    try {
        const { subject_id } = req.params;
        const subjectId = parseInt(subject_id);
        if (isNaN(subjectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID'
            });
        }
        // Verify subject exists
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
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
        // Get students for this subject
        const students = await prisma.student.findMany({
            where: {
                semester: subject.semester,
                departmentId: subject.departmentId
            }
        });
        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found for this subject'
            });
        }
        // Process each student
        const results = [];
        for (const student of students) {
            const result = await (0, exports.calculateStudentSubjectResult)(student.usn, subjectId);
            if (result) {
                results.push(result);
            }
        }
        res.json({
            success: true,
            data: {
                subject: {
                    id: subject.id,
                    code: subject.code,
                    name: subject.name
                },
                results
            }
        });
    }
    catch (error) {
        console.error('Calculate subject results error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.calculateSubjectResults = calculateSubjectResults;
/**
 * Calculate results for a specific student in a subject
 */
const calculateStudentSubjectResult = async (usn, subjectId) => {
    try {
        // Get all components for the subject
        const components = await prisma.examComponent.findMany({
            where: { subjectId }
        });
        if (components.length === 0) {
            return null; // No components defined for this subject
        }
        // Get student marks for each component
        let totalMarksObtained = 0;
        let totalMaxMarks = 0;
        const componentDetails = [];
        for (const component of components) {
            // Get student mark for this component
            const studentMark = await prisma.studentComponentMark.findFirst({
                where: {
                    usn,
                    componentId: component.id
                }
            });
            const marksObtained = studentMark ? studentMark.marksObtained : 0;
            totalMarksObtained += marksObtained;
            totalMaxMarks += component.maxMarks;
            componentDetails.push({
                componentId: component.id,
                componentName: component.name,
                maxMarks: component.maxMarks,
                marksObtained
            });
        }
        // Calculate attendance percentage
        const attendancePercentage = await calculateAttendancePercentage(usn, subjectId);
        // Check eligibility based on attendance
        const isEligible = attendancePercentage >= 85; // Configurable threshold
        // Get student details
        const student = await prisma.student.findUnique({
            where: { usn },
            select: {
                usn: true,
                firstName: true,
                lastName: true,
                section: true,
                semester: true
            }
        });
        if (!student) {
            return null;
        }
        // Create or update result
        const finalResult = {
            usn,
            subjectId,
            totalMarksObtained,
            totalMaxMarks,
            percentage: totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0,
            attendancePercentage,
            isEligible,
            components: componentDetails,
            student
        };
        return finalResult;
    }
    catch (error) {
        console.error('Calculate student subject result error:', error);
        return null;
    }
};
exports.calculateStudentSubjectResult = calculateStudentSubjectResult;
/**
 * Calculate results for a specific student in a subject
 */
const calculateStudentResult = async (req, res) => {
    try {
        const { subject_id, usn } = req.params;
        const subjectId = parseInt(subject_id);
        if (isNaN(subjectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID'
            });
        }
        // Verify subject exists
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId }
        });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // Verify student exists
        const student = await prisma.student.findUnique({
            where: { usn }
        });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        const result = await (0, exports.calculateStudentSubjectResult)(usn, subjectId);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Could not calculate result, missing components or student data'
            });
        }
        res.json({
            success: true,
            data: {
                subject: {
                    id: subject.id,
                    code: subject.code,
                    name: subject.name
                },
                result
            }
        });
    }
    catch (error) {
        console.error('Calculate student result error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.calculateStudentResult = calculateStudentResult;
/**
 * Helper function to calculate attendance percentage
 */
const calculateAttendancePercentage = async (usn, subjectId) => {
    try {
        // Get all attendance sessions for this subject
        const sessions = await prisma.attendanceSession.findMany({
            where: { subjectId },
            include: {
                entries: {
                    where: { usn }
                }
            }
        });
        if (sessions.length === 0) {
            return 0; // No sessions recorded yet
        }
        let totalPeriods = 0;
        let presentPeriods = 0;
        for (const session of sessions) {
            totalPeriods += session.duration;
            // Check if student was present
            const entry = session.entries.find(e => e.usn === usn);
            if (entry && entry.status === 'Present') {
                presentPeriods += session.duration;
            }
        }
        return totalPeriods > 0 ? (presentPeriods / totalPeriods) * 100 : 0;
    }
    catch (error) {
        console.error('Calculate attendance percentage error:', error);
        return 0;
    }
};
/**
 * View results for a specific subject
 */
const viewSubjectResults = async (req, res) => {
    try {
        const { subject_id } = req.params;
        const subjectId = parseInt(subject_id);
        if (isNaN(subjectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID'
            });
        }
        // Verify subject exists
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
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
        // Get stored results for this subject or calculate on-the-fly
        const results = await getAllSubjectResults(subjectId);
        res.json({
            success: true,
            data: {
                subject: {
                    id: subject.id,
                    code: subject.code,
                    name: subject.name
                },
                components: subject.examComponents.map(comp => ({
                    id: comp.id,
                    name: comp.name,
                    type: comp.componentType,
                    maxMarks: comp.maxMarks
                })),
                results
            }
        });
    }
    catch (error) {
        console.error('View subject results error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.viewSubjectResults = viewSubjectResults;
/**
 * Helper function to calculate results for all students in a subject
 */
const getAllSubjectResults = async (subjectId) => {
    try {
        // First get the subject info to get semester
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            select: { semester: true, departmentId: true }
        });
        if (!subject)
            return [];
        // Get all students for this subject
        const students = await prisma.student.findMany({
            where: {
                semester: subject.semester,
                departmentId: subject.departmentId
            }
        });
        const results = [];
        for (const student of students) {
            const result = await (0, exports.calculateStudentSubjectResult)(student.usn, subjectId);
            if (result) {
                results.push(result);
            }
        }
        return results;
    }
    catch (error) {
        console.error('Calculate subject results error:', error);
        return [];
    }
};
/**
 * View results for a specific student
 */
const viewStudentResults = async (req, res) => {
    try {
        const { usn } = req.params;
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
        // Get subjects for this student's semester
        const subjects = await prisma.subject.findMany({
            where: {
                semester: student.semester,
                departmentId: student.departmentId
            }
        });
        const results = [];
        for (const subject of subjects) {
            const result = await (0, exports.calculateStudentSubjectResult)(usn, subject.id);
            if (result) {
                results.push({
                    subject: {
                        id: subject.id,
                        code: subject.code,
                        name: subject.name
                    },
                    result
                });
            }
        }
        res.json({
            success: true,
            data: {
                student: {
                    usn: student.usn,
                    name: `${student.firstName} ${student.lastName}`,
                    section: student.section,
                    semester: student.semester,
                    department: student.department.name
                },
                results
            }
        });
    }
    catch (error) {
        console.error('View student results error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.viewStudentResults = viewStudentResults;

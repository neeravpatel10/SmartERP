"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentsBelowThreshold = exports.batchEditAttendance = exports.createBatchAttendanceSessions = exports.getStudentAttendanceSummary = exports.bulkUploadAttendance = exports.addAttendanceEntry = exports.getAttendanceSessionById = exports.getAttendanceSessions = exports.createAttendanceSession = void 0;
const index_1 = require("../index");
const zod_1 = require("zod");
/**
 * Create a new attendance session
 */
const createAttendanceSession = async (req, res) => {
    try {
        const { subjectId, facultyId, attendanceDate, sessionSlot, duration, academicYear, semester, section, batchId } = req.body;
        // Validate that subject exists
        const subject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId }
        });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // Validate that faculty exists if facultyId is provided
        if (facultyId) {
            const faculty = await index_1.prisma.faculty.findUnique({
                where: { id: facultyId }
            });
            if (!faculty) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty not found'
                });
            }
        }
        // Check if session already exists for this subject, date and slot
        const existingSession = await index_1.prisma.attendanceSession.findFirst({
            where: {
                subjectId,
                attendanceDate: new Date(attendanceDate),
                sessionSlot
            }
        });
        if (existingSession) {
            return res.status(400).json({
                success: false,
                message: 'An attendance session already exists for this subject, date and slot'
            });
        }
        // Create attendance session
        const attendanceSession = await index_1.prisma.attendanceSession.create({
            data: {
                subjectId,
                facultyId,
                attendanceDate: new Date(attendanceDate),
                sessionSlot,
                duration: duration || 1,
                academicYear,
                semester,
                section,
                batchId
            }
        });
        res.status(201).json({
            success: true,
            message: 'Attendance session created successfully',
            data: attendanceSession
        });
    }
    catch (error) {
        console.error('Create attendance session error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createAttendanceSession = createAttendanceSession;
/**
 * Get all attendance sessions with filters
 */
const getAttendanceSessions = async (req, res) => {
    try {
        const { subjectId, facultyId, startDate, endDate, academicYear, semester, section, batchId, page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        // Build filter conditions
        const filterConditions = {};
        if (subjectId) {
            filterConditions.subjectId = parseInt(subjectId);
        }
        if (facultyId) {
            filterConditions.facultyId = parseInt(facultyId);
        }
        if (academicYear) {
            filterConditions.academicYear = academicYear;
        }
        if (semester) {
            filterConditions.semester = parseInt(semester);
        }
        if (section) {
            filterConditions.section = section;
        }
        if (batchId) {
            filterConditions.batchId = parseInt(batchId);
        }
        // Date range filter
        if (startDate || endDate) {
            filterConditions.attendanceDate = {};
            if (startDate) {
                filterConditions.attendanceDate.gte = new Date(startDate);
            }
            if (endDate) {
                filterConditions.attendanceDate.lte = new Date(endDate);
            }
        }
        // Get total count for pagination
        const total = await index_1.prisma.attendanceSession.count({
            where: filterConditions
        });
        // Get attendance sessions with pagination and filters
        const attendanceSessions = await index_1.prisma.attendanceSession.findMany({
            where: filterConditions,
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        entries: true
                    }
                }
            },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            orderBy: {
                attendanceDate: 'desc'
            }
        });
        res.json({
            success: true,
            data: {
                attendanceSessions,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(total / limitNumber)
                }
            }
        });
    }
    catch (error) {
        console.error('Get attendance sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAttendanceSessions = getAttendanceSessions;
/**
 * Get a specific attendance session by ID
 */
const getAttendanceSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const attendanceSession = await index_1.prisma.attendanceSession.findUnique({
            where: { id: parseInt(id) },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                entries: {
                    include: {
                        student: {
                            select: {
                                usn: true,
                                firstName: true,
                                middleName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });
        if (!attendanceSession) {
            return res.status(404).json({
                success: false,
                message: 'Attendance session not found'
            });
        }
        res.json({
            success: true,
            data: attendanceSession
        });
    }
    catch (error) {
        console.error('Get attendance session by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAttendanceSessionById = getAttendanceSessionById;
/**
 * Add an attendance entry for a student
 */
const addAttendanceEntry = async (req, res) => {
    try {
        const { sessionId, usn, status } = req.body;
        // Validate session exists
        const session = await index_1.prisma.attendanceSession.findUnique({
            where: { id: sessionId }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Attendance session not found'
            });
        }
        // Validate student exists
        const student = await index_1.prisma.student.findUnique({
            where: { usn }
        });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        // Check if entry already exists
        const existingEntry = await index_1.prisma.attendanceEntry.findFirst({
            where: {
                sessionId,
                usn
            }
        });
        if (existingEntry) {
            // Update existing entry
            const updatedEntry = await index_1.prisma.attendanceEntry.update({
                where: {
                    id: existingEntry.id
                },
                data: {
                    status
                }
            });
            return res.json({
                success: true,
                message: 'Attendance entry updated successfully',
                data: updatedEntry
            });
        }
        // Create new entry
        const attendanceEntry = await index_1.prisma.attendanceEntry.create({
            data: {
                sessionId,
                usn,
                status
            }
        });
        res.status(201).json({
            success: true,
            message: 'Attendance entry added successfully',
            data: attendanceEntry
        });
    }
    catch (error) {
        console.error('Add attendance entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.addAttendanceEntry = addAttendanceEntry;
/**
 * Bulk upload attendance for a session
 */
const bulkUploadAttendance = async (req, res) => {
    try {
        const { sessionId, entries } = req.body;
        // Validate session exists
        const session = await index_1.prisma.attendanceSession.findUnique({
            where: { id: sessionId }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Attendance session not found'
            });
        }
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Entries must be a non-empty array'
            });
        }
        // Schema for validating entries
        const entrySchema = zod_1.z.object({
            usn: zod_1.z.string(),
            status: zod_1.z.enum(['Present', 'Absent', 'OD', 'Leave'])
        });
        // Validate all entries
        const validationResult = zod_1.z.array(entrySchema).safeParse(entries);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid entries format',
                errors: validationResult.error.errors
            });
        }
        // Get all student USNs
        const usns = entries.map(entry => entry.usn);
        // Verify all students exist
        const students = await index_1.prisma.student.findMany({
            where: {
                usn: {
                    in: usns
                }
            },
            select: {
                usn: true
            }
        });
        if (students.length !== usns.length) {
            const foundUsns = students.map(student => student.usn);
            const missingUsns = usns.filter(usn => !foundUsns.includes(usn));
            return res.status(400).json({
                success: false,
                message: 'Some students were not found',
                data: {
                    missingUsns
                }
            });
        }
        // Delete existing entries for this session (to replace them)
        await index_1.prisma.attendanceEntry.deleteMany({
            where: {
                sessionId
            }
        });
        // Create all entries in a transaction
        const createdEntries = await index_1.prisma.$transaction(entries.map(entry => index_1.prisma.attendanceEntry.create({
            data: {
                sessionId,
                usn: entry.usn,
                status: entry.status
            }
        })));
        res.json({
            success: true,
            message: `Successfully uploaded ${createdEntries.length} attendance entries`,
            data: {
                sessionId,
                entriesCount: createdEntries.length
            }
        });
    }
    catch (error) {
        console.error('Bulk upload attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.bulkUploadAttendance = bulkUploadAttendance;
/**
 * Get attendance summary for a student
 */
const getStudentAttendanceSummary = async (req, res) => {
    try {
        const { usn } = req.params;
        const { subjectId, academicYear, semester } = req.query;
        // Validate student exists
        const student = await index_1.prisma.student.findUnique({
            where: { usn }
        });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        // Build filter conditions
        const filterConditions = {
            usn
        };
        if (subjectId) {
            filterConditions.session = {
                subjectId: parseInt(subjectId)
            };
        }
        if (academicYear) {
            if (!filterConditions.session)
                filterConditions.session = {};
            filterConditions.session.academicYear = academicYear;
        }
        if (semester) {
            if (!filterConditions.session)
                filterConditions.session = {};
            filterConditions.session.semester = parseInt(semester);
        }
        // Get attendance entries with session details
        const attendanceEntries = await index_1.prisma.attendanceEntry.findMany({
            where: filterConditions,
            include: {
                session: {
                    include: {
                        subject: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                session: {
                    attendanceDate: 'desc'
                }
            }
        });
        // Calculate attendance percentage by subject
        const subjectAttendance = {};
        for (const entry of attendanceEntries) {
            const subjectId = entry.session.subject.id;
            if (!subjectAttendance[subjectId]) {
                subjectAttendance[subjectId] = {
                    subject: entry.session.subject,
                    totalSessions: 0,
                    present: 0,
                    absent: 0,
                    other: 0,
                    percentage: 0
                };
            }
            subjectAttendance[subjectId].totalSessions++;
            if (entry.status === 'Present') {
                subjectAttendance[subjectId].present++;
            }
            else if (entry.status === 'Absent') {
                subjectAttendance[subjectId].absent++;
            }
            else {
                subjectAttendance[subjectId].other++;
            }
        }
        // Calculate percentages
        for (const key in subjectAttendance) {
            const subject = subjectAttendance[key];
            subject.percentage = (subject.present / subject.totalSessions) * 100;
        }
        res.json({
            success: true,
            data: {
                student: {
                    usn: student.usn,
                    name: `${student.firstName} ${student.lastName}`
                },
                summary: Object.values(subjectAttendance),
                entries: attendanceEntries
            }
        });
    }
    catch (error) {
        console.error('Get student attendance summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStudentAttendanceSummary = getStudentAttendanceSummary;
/**
 * Create multiple attendance sessions at once (batch creation)
 */
const createBatchAttendanceSessions = async (req, res) => {
    try {
        const { subjectId, facultyId, dateRange, sessionSlot, sessionType, duration, academicYear, semester, section, batchId } = req.body;
        // Validate that subject exists
        const subject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId }
        });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // Validate subject is active
        if (subject.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot create attendance sessions for subjects that are not active'
            });
        }
        // Validate that faculty exists if facultyId is provided
        if (facultyId) {
            const faculty = await index_1.prisma.faculty.findUnique({
                where: { id: facultyId }
            });
            if (!faculty) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty not found'
                });
            }
            // Check faculty-subject mapping
            const mapping = await index_1.prisma.facultySubjectMapping.findFirst({
                where: {
                    facultyId,
                    subjectId
                }
            });
            if (!mapping) {
                return res.status(403).json({
                    success: false,
                    message: 'Faculty is not mapped to this subject'
                });
            }
        }
        // Set default duration based on session type
        let calculatedDuration = duration || 1;
        if (sessionType === 'lab' && !duration) {
            calculatedDuration = 3; // Default 3 periods for lab sessions
        }
        // Parse date range
        const { startDate, endDate } = dateRange;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be after end date'
            });
        }
        // Generate array of dates in range
        const dates = [];
        const currentDate = new Date(start);
        while (currentDate <= end) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        // Check for existing sessions in the date range
        const existingSessions = await index_1.prisma.attendanceSession.findMany({
            where: {
                subjectId,
                sessionSlot,
                attendanceDate: {
                    gte: start,
                    lte: end
                }
            }
        });
        // Create a lookup for existing dates to avoid duplicates
        const existingDates = new Map();
        existingSessions.forEach(session => {
            const dateKey = session.attendanceDate.toISOString().split('T')[0];
            existingDates.set(dateKey, true);
        });
        // Create batch data for insertion
        const batchData = dates
            .filter(date => {
            const dateKey = date.toISOString().split('T')[0];
            return !existingDates.has(dateKey);
        })
            .map(date => ({
            subjectId,
            facultyId,
            attendanceDate: date,
            sessionSlot,
            duration: calculatedDuration,
            academicYear,
            semester,
            section,
            batchId
        }));
        if (batchData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No new sessions to create. Sessions may already exist for these dates.'
            });
        }
        // Create attendance sessions in batch
        const createdSessions = await index_1.prisma.$transaction(batchData.map(data => index_1.prisma.attendanceSession.create({ data })));
        res.status(201).json({
            success: true,
            message: `${createdSessions.length} attendance sessions created successfully`,
            data: {
                sessions: createdSessions,
                skippedDates: dates.length - createdSessions.length
            }
        });
    }
    catch (error) {
        console.error('Create batch attendance sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createBatchAttendanceSessions = createBatchAttendanceSessions;
/**
 * Edit multiple attendance entries at once (batch edit)
 */
const batchEditAttendance = async (req, res) => {
    try {
        const { sessionIds, entries } = req.body;
        // Validate that sessions exist
        const sessions = await index_1.prisma.attendanceSession.findMany({
            where: {
                id: {
                    in: sessionIds
                }
            }
        });
        if (sessions.length !== sessionIds.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more attendance sessions not found'
            });
        }
        // Validate the USNs exist
        const usns = Array.from(new Set(entries.map((entry) => entry.usn)));
        const students = await index_1.prisma.student.findMany({
            where: {
                usn: {
                    in: usns
                }
            },
            select: {
                usn: true
            }
        });
        if (students.length !== usns.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more students not found'
            });
        }
        // Get existing entries for these sessions and students
        const existingEntries = await index_1.prisma.attendanceEntry.findMany({
            where: {
                sessionId: {
                    in: sessionIds
                },
                usn: {
                    in: usns
                }
            }
        });
        // Create a map for quick lookup
        const entryMap = new Map();
        existingEntries.forEach(entry => {
            const key = `${entry.sessionId}-${entry.usn}`;
            entryMap.set(key, entry);
        });
        // Separate updates and creates
        const updates = [];
        const creates = [];
        // Process each entry for each session
        for (const sessionId of sessionIds) {
            for (const entry of entries) {
                const { usn, status } = entry;
                const key = `${sessionId}-${usn}`;
                if (entryMap.has(key)) {
                    // Entry exists, update it
                    const existingEntry = entryMap.get(key);
                    updates.push(index_1.prisma.attendanceEntry.update({
                        where: { id: existingEntry.id },
                        data: { status }
                    }));
                }
                else {
                    // Entry doesn't exist, create it
                    creates.push(index_1.prisma.attendanceEntry.create({
                        data: {
                            sessionId,
                            usn,
                            status
                        }
                    }));
                }
            }
        }
        // Execute all operations in a transaction
        let updatedEntriesResults = [];
        let createdEntriesResults = [];
        // Only attempt transactions if there are operations to perform
        if (updates.length > 0 || creates.length > 0) {
            if (updates.length > 0) {
                updatedEntriesResults = await Promise.all(updates);
            }
            if (creates.length > 0) {
                createdEntriesResults = await Promise.all(creates);
            }
        }
        res.json({
            success: true,
            message: 'Attendance entries updated successfully',
            data: {
                updated: updatedEntriesResults.length,
                created: createdEntriesResults.length
            }
        });
    }
    catch (error) {
        console.error('Batch edit attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.batchEditAttendance = batchEditAttendance;
/**
 * Get students below attendance threshold
 */
const getStudentsBelowThreshold = async (req, res) => {
    try {
        const { facultyId, threshold = 85, subjectId, academicYear, semester } = req.query;
        // Build filter conditions
        const filterConditions = {};
        if (facultyId) {
            // Get subjects mapped to this faculty
            const facultySubjects = await index_1.prisma.facultySubjectMapping.findMany({
                where: { facultyId: String(facultyId) },
                select: { subjectId: true }
            });
            const subjectIds = facultySubjects.map(mapping => mapping.subjectId);
            if (subjectIds.length === 0) {
                return res.json({
                    success: true,
                    data: [] // No subjects mapped to faculty
                });
            }
            filterConditions.subjectId = {
                in: subjectIds
            };
        }
        if (subjectId) {
            filterConditions.subjectId = parseInt(subjectId);
        }
        if (academicYear) {
            filterConditions.academicYear = academicYear;
        }
        if (semester) {
            filterConditions.semester = parseInt(semester);
        }
        // Get all attendance sessions matching the filters
        const sessions = await index_1.prisma.attendanceSession.findMany({
            where: filterConditions,
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                entries: true
            }
        });
        // Group sessions by subject
        const sessionsBySubject = new Map();
        sessions.forEach(session => {
            const subjectId = session.subjectId;
            if (!sessionsBySubject.has(subjectId)) {
                sessionsBySubject.set(subjectId, []);
            }
            sessionsBySubject.get(subjectId).push(session);
        });
        // Calculate attendance percentages
        const studentsData = [];
        for (const [subjectId, subjectSessions] of sessionsBySubject.entries()) {
            // Group sessions by type (theory/lab)
            const theoryPeriods = subjectSessions
                .filter((s) => s.duration === 1)
                .reduce((total, s) => total + s.duration, 0);
            const labPeriods = subjectSessions
                .filter((s) => s.duration > 1)
                .reduce((total, s) => total + s.duration, 0);
            // Get unique students for this subject
            const studentUsns = new Set();
            subjectSessions.forEach(session => {
                session.entries.forEach(entry => {
                    studentUsns.add(entry.usn);
                });
            });
            // Calculate attendance for each student
            for (const usn of studentUsns) {
                let theoryPresent = 0;
                let labPresent = 0;
                subjectSessions.forEach(session => {
                    const studentEntry = session.entries.find(e => e.usn === usn);
                    if (studentEntry && studentEntry.status === 'Present') {
                        if (session.duration === 1) {
                            theoryPresent += session.duration;
                        }
                        else {
                            labPresent += session.duration;
                        }
                    }
                });
                // Calculate percentages
                const theoryPercentage = theoryPeriods > 0
                    ? (theoryPresent / theoryPeriods) * 100
                    : null;
                const labPercentage = labPeriods > 0
                    ? (labPresent / labPeriods) * 100
                    : null;
                const overallPercentage = (theoryPeriods + labPeriods > 0)
                    ? ((theoryPresent + labPresent) / (theoryPeriods + labPeriods)) * 100
                    : null;
                // Add students below threshold
                if (overallPercentage !== null && overallPercentage < parseInt(threshold)) {
                    studentsData.push({
                        usn,
                        subjectId,
                        subject: subjectSessions[0].subject,
                        attendancePercentage: {
                            theory: theoryPercentage !== null ? parseFloat(theoryPercentage.toFixed(2)) : null,
                            lab: labPercentage !== null ? parseFloat(labPercentage.toFixed(2)) : null,
                            overall: parseFloat(overallPercentage.toFixed(2))
                        },
                        totalClasses: {
                            theory: theoryPeriods,
                            lab: labPeriods,
                            total: theoryPeriods + labPeriods
                        },
                        present: {
                            theory: theoryPresent,
                            lab: labPresent,
                            total: theoryPresent + labPresent
                        }
                    });
                }
            }
        }
        // Get student details
        const studentUsns = studentsData.map(data => data.usn);
        const students = await index_1.prisma.student.findMany({
            where: {
                usn: {
                    in: studentUsns
                }
            },
            select: {
                usn: true,
                firstName: true,
                lastName: true,
                section: true,
                semester: true
            }
        });
        // Create a map for quick lookup
        const studentMap = new Map();
        students.forEach(student => {
            studentMap.set(student.usn, student);
        });
        // Combine data
        const result = studentsData.map(data => ({
            ...data,
            student: studentMap.get(data.usn)
        }));
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Get students below threshold error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStudentsBelowThreshold = getStudentsBelowThreshold;

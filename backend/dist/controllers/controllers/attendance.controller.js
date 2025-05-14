"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentsBelowThreshold = exports.batchEditAttendance = exports.createBatchAttendanceSessions = exports.getStudentAttendanceSummary = exports.bulkUploadAttendance = exports.addAttendanceEntry = exports.getAttendanceSessionById = exports.getAttendanceSessions = exports.createAttendanceSession = void 0;
var index_1 = require("../index");
var zod_1 = require("zod");
/**
 * Create a new attendance session
 */
var createAttendanceSession = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, subjectId, facultyId, attendanceDate, sessionSlot, duration, academicYear, semester, section, batchId, subject, faculty, existingSession, attendanceSession, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, subjectId = _a.subjectId, facultyId = _a.facultyId, attendanceDate = _a.attendanceDate, sessionSlot = _a.sessionSlot, duration = _a.duration, academicYear = _a.academicYear, semester = _a.semester, section = _a.section, batchId = _a.batchId;
                return [4 /*yield*/, index_1.prisma.subject.findUnique({
                        where: { id: subjectId }
                    })];
            case 1:
                subject = _b.sent();
                if (!subject) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                if (!facultyId) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: facultyId }
                    })];
            case 2:
                faculty = _b.sent();
                if (!faculty) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Faculty not found'
                        })];
                }
                _b.label = 3;
            case 3: return [4 /*yield*/, index_1.prisma.attendanceSession.findFirst({
                    where: {
                        subjectId: subjectId,
                        attendanceDate: new Date(attendanceDate),
                        sessionSlot: sessionSlot
                    }
                })];
            case 4:
                existingSession = _b.sent();
                if (existingSession) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'An attendance session already exists for this subject, date and slot'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.attendanceSession.create({
                        data: {
                            subjectId: subjectId,
                            facultyId: facultyId,
                            attendanceDate: new Date(attendanceDate),
                            sessionSlot: sessionSlot,
                            duration: duration || 1,
                            academicYear: academicYear,
                            semester: semester,
                            section: section,
                            batchId: batchId
                        }
                    })];
            case 5:
                attendanceSession = _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'Attendance session created successfully',
                    data: attendanceSession
                });
                return [3 /*break*/, 7];
            case 6:
                error_1 = _b.sent();
                console.error('Create attendance session error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.createAttendanceSession = createAttendanceSession;
/**
 * Get all attendance sessions with filters
 */
var getAttendanceSessions = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, subjectId, facultyId, startDate, endDate, academicYear, semester, section, batchId, _b, page, _c, limit, pageNumber, limitNumber, filterConditions, total, attendanceSessions, error_2;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                _a = req.query, subjectId = _a.subjectId, facultyId = _a.facultyId, startDate = _a.startDate, endDate = _a.endDate, academicYear = _a.academicYear, semester = _a.semester, section = _a.section, batchId = _a.batchId, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c;
                pageNumber = parseInt(page);
                limitNumber = parseInt(limit);
                filterConditions = {};
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
                return [4 /*yield*/, index_1.prisma.attendanceSession.count({
                        where: filterConditions
                    })];
            case 1:
                total = _d.sent();
                return [4 /*yield*/, index_1.prisma.attendanceSession.findMany({
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
                    })];
            case 2:
                attendanceSessions = _d.sent();
                res.json({
                    success: true,
                    data: {
                        attendanceSessions: attendanceSessions,
                        pagination: {
                            total: total,
                            page: pageNumber,
                            limit: limitNumber,
                            totalPages: Math.ceil(total / limitNumber)
                        }
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _d.sent();
                console.error('Get attendance sessions error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAttendanceSessions = getAttendanceSessions;
/**
 * Get a specific attendance session by ID
 */
var getAttendanceSessionById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, attendanceSession, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, index_1.prisma.attendanceSession.findUnique({
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
                    })];
            case 1:
                attendanceSession = _a.sent();
                if (!attendanceSession) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Attendance session not found'
                        })];
                }
                res.json({
                    success: true,
                    data: attendanceSession
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Get attendance session by ID error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAttendanceSessionById = getAttendanceSessionById;
/**
 * Add an attendance entry for a student
 */
var addAttendanceEntry = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, sessionId, usn, status_1, session, student, existingEntry, updatedEntry, attendanceEntry, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                _a = req.body, sessionId = _a.sessionId, usn = _a.usn, status_1 = _a.status;
                return [4 /*yield*/, index_1.prisma.attendanceSession.findUnique({
                        where: { id: sessionId }
                    })];
            case 1:
                session = _b.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Attendance session not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.student.findUnique({
                        where: { usn: usn }
                    })];
            case 2:
                student = _b.sent();
                if (!student) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.attendanceEntry.findFirst({
                        where: {
                            sessionId: sessionId,
                            usn: usn
                        }
                    })];
            case 3:
                existingEntry = _b.sent();
                if (!existingEntry) return [3 /*break*/, 5];
                return [4 /*yield*/, index_1.prisma.attendanceEntry.update({
                        where: {
                            id: existingEntry.id
                        },
                        data: {
                            status: status_1
                        }
                    })];
            case 4:
                updatedEntry = _b.sent();
                return [2 /*return*/, res.json({
                        success: true,
                        message: 'Attendance entry updated successfully',
                        data: updatedEntry
                    })];
            case 5: return [4 /*yield*/, index_1.prisma.attendanceEntry.create({
                    data: {
                        sessionId: sessionId,
                        usn: usn,
                        status: status_1
                    }
                })];
            case 6:
                attendanceEntry = _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'Attendance entry added successfully',
                    data: attendanceEntry
                });
                return [3 /*break*/, 8];
            case 7:
                error_4 = _b.sent();
                console.error('Add attendance entry error:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.addAttendanceEntry = addAttendanceEntry;
/**
 * Bulk upload attendance for a session
 */
var bulkUploadAttendance = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, sessionId_1, entries, session, entrySchema, validationResult, usns, students, foundUsns_1, missingUsns, createdEntries, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, sessionId_1 = _a.sessionId, entries = _a.entries;
                return [4 /*yield*/, index_1.prisma.attendanceSession.findUnique({
                        where: { id: sessionId_1 }
                    })];
            case 1:
                session = _b.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Attendance session not found'
                        })];
                }
                if (!Array.isArray(entries) || entries.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Entries must be a non-empty array'
                        })];
                }
                entrySchema = zod_1.z.object({
                    usn: zod_1.z.string(),
                    status: zod_1.z.enum(['Present', 'Absent', 'OD', 'Leave'])
                });
                validationResult = zod_1.z.array(entrySchema).safeParse(entries);
                if (!validationResult.success) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid entries format',
                            errors: validationResult.error.errors
                        })];
                }
                usns = entries.map(function (entry) { return entry.usn; });
                return [4 /*yield*/, index_1.prisma.student.findMany({
                        where: {
                            usn: {
                                in: usns
                            }
                        },
                        select: {
                            usn: true
                        }
                    })];
            case 2:
                students = _b.sent();
                if (students.length !== usns.length) {
                    foundUsns_1 = students.map(function (student) { return student.usn; });
                    missingUsns = usns.filter(function (usn) { return !foundUsns_1.includes(usn); });
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Some students were not found',
                            data: {
                                missingUsns: missingUsns
                            }
                        })];
                }
                // Delete existing entries for this session (to replace them)
                return [4 /*yield*/, index_1.prisma.attendanceEntry.deleteMany({
                        where: {
                            sessionId: sessionId_1
                        }
                    })];
            case 3:
                // Delete existing entries for this session (to replace them)
                _b.sent();
                return [4 /*yield*/, index_1.prisma.$transaction(entries.map(function (entry) {
                        return index_1.prisma.attendanceEntry.create({
                            data: {
                                sessionId: sessionId_1,
                                usn: entry.usn,
                                status: entry.status
                            }
                        });
                    }))];
            case 4:
                createdEntries = _b.sent();
                res.json({
                    success: true,
                    message: "Successfully uploaded ".concat(createdEntries.length, " attendance entries"),
                    data: {
                        sessionId: sessionId_1,
                        entriesCount: createdEntries.length
                    }
                });
                return [3 /*break*/, 6];
            case 5:
                error_5 = _b.sent();
                console.error('Bulk upload attendance error:', error_5);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.bulkUploadAttendance = bulkUploadAttendance;
/**
 * Get attendance summary for a student
 */
var getStudentAttendanceSummary = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var usn, _a, subjectId, academicYear, semester, student, filterConditions, attendanceEntries, subjectAttendance, _i, attendanceEntries_1, entry, subjectId_1, key, subject, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                usn = req.params.usn;
                _a = req.query, subjectId = _a.subjectId, academicYear = _a.academicYear, semester = _a.semester;
                return [4 /*yield*/, index_1.prisma.student.findUnique({
                        where: { usn: usn }
                    })];
            case 1:
                student = _b.sent();
                if (!student) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        })];
                }
                filterConditions = {
                    usn: usn
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
                return [4 /*yield*/, index_1.prisma.attendanceEntry.findMany({
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
                    })];
            case 2:
                attendanceEntries = _b.sent();
                subjectAttendance = {};
                for (_i = 0, attendanceEntries_1 = attendanceEntries; _i < attendanceEntries_1.length; _i++) {
                    entry = attendanceEntries_1[_i];
                    subjectId_1 = entry.session.subject.id;
                    if (!subjectAttendance[subjectId_1]) {
                        subjectAttendance[subjectId_1] = {
                            subject: entry.session.subject,
                            totalSessions: 0,
                            present: 0,
                            absent: 0,
                            other: 0,
                            percentage: 0
                        };
                    }
                    subjectAttendance[subjectId_1].totalSessions++;
                    if (entry.status === 'Present') {
                        subjectAttendance[subjectId_1].present++;
                    }
                    else if (entry.status === 'Absent') {
                        subjectAttendance[subjectId_1].absent++;
                    }
                    else {
                        subjectAttendance[subjectId_1].other++;
                    }
                }
                // Calculate percentages
                for (key in subjectAttendance) {
                    subject = subjectAttendance[key];
                    subject.percentage = (subject.present / subject.totalSessions) * 100;
                }
                res.json({
                    success: true,
                    data: {
                        student: {
                            usn: student.usn,
                            name: "".concat(student.firstName, " ").concat(student.lastName)
                        },
                        summary: Object.values(subjectAttendance),
                        entries: attendanceEntries
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                console.error('Get student attendance summary error:', error_6);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getStudentAttendanceSummary = getStudentAttendanceSummary;
/**
 * Create multiple attendance sessions at once (batch creation)
 */
var createBatchAttendanceSessions = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, subjectId_2, facultyId_1, dateRange, sessionSlot_1, sessionType, duration, academicYear_1, semester_1, section_1, batchId_1, subject, faculty, mapping, calculatedDuration_1, startDate, endDate, start, end, dates, currentDate, existingSessions, existingDates_1, batchData, createdSessions, error_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                _a = req.body, subjectId_2 = _a.subjectId, facultyId_1 = _a.facultyId, dateRange = _a.dateRange, sessionSlot_1 = _a.sessionSlot, sessionType = _a.sessionType, duration = _a.duration, academicYear_1 = _a.academicYear, semester_1 = _a.semester, section_1 = _a.section, batchId_1 = _a.batchId;
                return [4 /*yield*/, index_1.prisma.subject.findUnique({
                        where: { id: subjectId_2 }
                    })];
            case 1:
                subject = _b.sent();
                if (!subject) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                // Validate subject is active
                if (subject.status !== 'active') {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Cannot create attendance sessions for subjects that are not active'
                        })];
                }
                if (!facultyId_1) return [3 /*break*/, 4];
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: facultyId_1 }
                    })];
            case 2:
                faculty = _b.sent();
                if (!faculty) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Faculty not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.findFirst({
                        where: {
                            facultyId: facultyId_1,
                            subjectId: subjectId_2
                        }
                    })];
            case 3:
                mapping = _b.sent();
                if (!mapping) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Faculty is not mapped to this subject'
                        })];
                }
                _b.label = 4;
            case 4:
                calculatedDuration_1 = duration || 1;
                if (sessionType === 'lab' && !duration) {
                    calculatedDuration_1 = 3; // Default 3 periods for lab sessions
                }
                startDate = dateRange.startDate, endDate = dateRange.endDate;
                if (!startDate || !endDate) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Start date and end date are required'
                        })];
                }
                start = new Date(startDate);
                end = new Date(endDate);
                if (start > end) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Start date cannot be after end date'
                        })];
                }
                dates = [];
                currentDate = new Date(start);
                while (currentDate <= end) {
                    dates.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                return [4 /*yield*/, index_1.prisma.attendanceSession.findMany({
                        where: {
                            subjectId: subjectId_2,
                            sessionSlot: sessionSlot_1,
                            attendanceDate: {
                                gte: start,
                                lte: end
                            }
                        }
                    })];
            case 5:
                existingSessions = _b.sent();
                existingDates_1 = new Map();
                existingSessions.forEach(function (session) {
                    var dateKey = session.attendanceDate.toISOString().split('T')[0];
                    existingDates_1.set(dateKey, true);
                });
                batchData = dates
                    .filter(function (date) {
                    var dateKey = date.toISOString().split('T')[0];
                    return !existingDates_1.has(dateKey);
                })
                    .map(function (date) { return ({
                    subjectId: subjectId_2,
                    facultyId: facultyId_1,
                    attendanceDate: date,
                    sessionSlot: sessionSlot_1,
                    duration: calculatedDuration_1,
                    academicYear: academicYear_1,
                    semester: semester_1,
                    section: section_1,
                    batchId: batchId_1
                }); });
                if (batchData.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'No new sessions to create. Sessions may already exist for these dates.'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.$transaction(batchData.map(function (data) {
                        return index_1.prisma.attendanceSession.create({ data: data });
                    }))];
            case 6:
                createdSessions = _b.sent();
                res.status(201).json({
                    success: true,
                    message: "".concat(createdSessions.length, " attendance sessions created successfully"),
                    data: {
                        sessions: createdSessions,
                        skippedDates: dates.length - createdSessions.length
                    }
                });
                return [3 /*break*/, 8];
            case 7:
                error_7 = _b.sent();
                console.error('Create batch attendance sessions error:', error_7);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.createBatchAttendanceSessions = createBatchAttendanceSessions;
/**
 * Edit multiple attendance entries at once (batch edit)
 */
var batchEditAttendance = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, sessionIds, entries, sessions, usns, students, existingEntries, entryMap_1, updates, creates, _i, sessionIds_1, sessionId, _b, entries_1, entry, usn, status_2, key, existingEntry, updatedEntriesResults, createdEntriesResults, error_8;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 8, , 9]);
                _a = req.body, sessionIds = _a.sessionIds, entries = _a.entries;
                return [4 /*yield*/, index_1.prisma.attendanceSession.findMany({
                        where: {
                            id: {
                                in: sessionIds
                            }
                        }
                    })];
            case 1:
                sessions = _c.sent();
                if (sessions.length !== sessionIds.length) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'One or more attendance sessions not found'
                        })];
                }
                usns = Array.from(new Set(entries.map(function (entry) { return entry.usn; })));
                return [4 /*yield*/, index_1.prisma.student.findMany({
                        where: {
                            usn: {
                                in: usns
                            }
                        },
                        select: {
                            usn: true
                        }
                    })];
            case 2:
                students = _c.sent();
                if (students.length !== usns.length) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'One or more students not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.attendanceEntry.findMany({
                        where: {
                            sessionId: {
                                in: sessionIds
                            },
                            usn: {
                                in: usns
                            }
                        }
                    })];
            case 3:
                existingEntries = _c.sent();
                entryMap_1 = new Map();
                existingEntries.forEach(function (entry) {
                    var key = "".concat(entry.sessionId, "-").concat(entry.usn);
                    entryMap_1.set(key, entry);
                });
                updates = [];
                creates = [];
                // Process each entry for each session
                for (_i = 0, sessionIds_1 = sessionIds; _i < sessionIds_1.length; _i++) {
                    sessionId = sessionIds_1[_i];
                    for (_b = 0, entries_1 = entries; _b < entries_1.length; _b++) {
                        entry = entries_1[_b];
                        usn = entry.usn, status_2 = entry.status;
                        key = "".concat(sessionId, "-").concat(usn);
                        if (entryMap_1.has(key)) {
                            existingEntry = entryMap_1.get(key);
                            updates.push(index_1.prisma.attendanceEntry.update({
                                where: { id: existingEntry.id },
                                data: { status: status_2 }
                            }));
                        }
                        else {
                            // Entry doesn't exist, create it
                            creates.push(index_1.prisma.attendanceEntry.create({
                                data: {
                                    sessionId: sessionId,
                                    usn: usn,
                                    status: status_2
                                }
                            }));
                        }
                    }
                }
                updatedEntriesResults = [];
                createdEntriesResults = [];
                if (!(updates.length > 0 || creates.length > 0)) return [3 /*break*/, 7];
                if (!(updates.length > 0)) return [3 /*break*/, 5];
                return [4 /*yield*/, Promise.all(updates)];
            case 4:
                updatedEntriesResults = _c.sent();
                _c.label = 5;
            case 5:
                if (!(creates.length > 0)) return [3 /*break*/, 7];
                return [4 /*yield*/, Promise.all(creates)];
            case 6:
                createdEntriesResults = _c.sent();
                _c.label = 7;
            case 7:
                res.json({
                    success: true,
                    message: 'Attendance entries updated successfully',
                    data: {
                        updated: updatedEntriesResults.length,
                        created: createdEntriesResults.length
                    }
                });
                return [3 /*break*/, 9];
            case 8:
                error_8 = _c.sent();
                console.error('Batch edit attendance error:', error_8);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.batchEditAttendance = batchEditAttendance;
/**
 * Get students below attendance threshold
 */
var getStudentsBelowThreshold = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, facultyId, _b, threshold, subjectId, academicYear, semester, filterConditions, facultySubjects, subjectIds, sessions, sessionsBySubject_1, studentsData, _loop_1, _i, _c, _d, subjectId_3, subjectSessions, studentUsns, students, studentMap_1, result, error_9;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 5, , 6]);
                _a = req.query, facultyId = _a.facultyId, _b = _a.threshold, threshold = _b === void 0 ? 85 : _b, subjectId = _a.subjectId, academicYear = _a.academicYear, semester = _a.semester;
                filterConditions = {};
                if (!facultyId) return [3 /*break*/, 2];
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.findMany({
                        where: { facultyId: String(facultyId) },
                        select: { subjectId: true }
                    })];
            case 1:
                facultySubjects = _e.sent();
                subjectIds = facultySubjects.map(function (mapping) { return mapping.subjectId; });
                if (subjectIds.length === 0) {
                    return [2 /*return*/, res.json({
                            success: true,
                            data: [] // No subjects mapped to faculty
                        })];
                }
                filterConditions.subjectId = {
                    in: subjectIds
                };
                _e.label = 2;
            case 2:
                if (subjectId) {
                    filterConditions.subjectId = parseInt(subjectId);
                }
                if (academicYear) {
                    filterConditions.academicYear = academicYear;
                }
                if (semester) {
                    filterConditions.semester = parseInt(semester);
                }
                return [4 /*yield*/, index_1.prisma.attendanceSession.findMany({
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
                    })];
            case 3:
                sessions = _e.sent();
                sessionsBySubject_1 = new Map();
                sessions.forEach(function (session) {
                    var subjectId = session.subjectId;
                    if (!sessionsBySubject_1.has(subjectId)) {
                        sessionsBySubject_1.set(subjectId, []);
                    }
                    sessionsBySubject_1.get(subjectId).push(session);
                });
                studentsData = [];
                _loop_1 = function (subjectId_3, subjectSessions) {
                    // Group sessions by type (theory/lab)
                    var theoryPeriods = subjectSessions
                        .filter(function (s) { return s.duration === 1; })
                        .reduce(function (total, s) { return total + s.duration; }, 0);
                    var labPeriods = subjectSessions
                        .filter(function (s) { return s.duration > 1; })
                        .reduce(function (total, s) { return total + s.duration; }, 0);
                    // Get unique students for this subject
                    var studentUsns_2 = new Set();
                    subjectSessions.forEach(function (session) {
                        session.entries.forEach(function (entry) {
                            studentUsns_2.add(entry.usn);
                        });
                    });
                    var _loop_2 = function (usn) {
                        var theoryPresent = 0;
                        var labPresent = 0;
                        subjectSessions.forEach(function (session) {
                            var studentEntry = session.entries.find(function (e) { return e.usn === usn; });
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
                        var theoryPercentage = theoryPeriods > 0
                            ? (theoryPresent / theoryPeriods) * 100
                            : null;
                        var labPercentage = labPeriods > 0
                            ? (labPresent / labPeriods) * 100
                            : null;
                        var overallPercentage = (theoryPeriods + labPeriods > 0)
                            ? ((theoryPresent + labPresent) / (theoryPeriods + labPeriods)) * 100
                            : null;
                        // Add students below threshold
                        if (overallPercentage !== null && overallPercentage < parseInt(threshold)) {
                            studentsData.push({
                                usn: usn,
                                subjectId: subjectId_3,
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
                    };
                    // Calculate attendance for each student
                    for (var _f = 0, studentUsns_1 = studentUsns_2; _f < studentUsns_1.length; _f++) {
                        var usn = studentUsns_1[_f];
                        _loop_2(usn);
                    }
                };
                for (_i = 0, _c = sessionsBySubject_1.entries(); _i < _c.length; _i++) {
                    _d = _c[_i], subjectId_3 = _d[0], subjectSessions = _d[1];
                    _loop_1(subjectId_3, subjectSessions);
                }
                studentUsns = studentsData.map(function (data) { return data.usn; });
                return [4 /*yield*/, index_1.prisma.student.findMany({
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
                    })];
            case 4:
                students = _e.sent();
                studentMap_1 = new Map();
                students.forEach(function (student) {
                    studentMap_1.set(student.usn, student);
                });
                result = studentsData.map(function (data) { return (__assign(__assign({}, data), { student: studentMap_1.get(data.usn) })); });
                res.json({
                    success: true,
                    data: result
                });
                return [3 /*break*/, 6];
            case 5:
                error_9 = _e.sent();
                console.error('Get students below threshold error:', error_9);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getStudentsBelowThreshold = getStudentsBelowThreshold;

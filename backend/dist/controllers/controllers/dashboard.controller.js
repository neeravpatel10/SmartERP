"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.getDashboardData = void 0;
var index_1 = require("../index");
/**
 * Get integrated dashboard data based on user role
 */
var getDashboardData = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, loginType, dashboardData, error_1, err, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 11, , 12]);
                _a = req.user, userId = _a.userId, loginType = _a.loginType;
                dashboardData = {};
                if (!(loginType === 1)) return [3 /*break*/, 2];
                return [4 /*yield*/, getSuperAdminDashboard()];
            case 1:
                // Super Admin Dashboard
                dashboardData = _b.sent();
                return [3 /*break*/, 10];
            case 2:
                if (!(loginType === 2)) return [3 /*break*/, 4];
                return [4 /*yield*/, getFacultyDashboard(userId)];
            case 3:
                // Faculty Dashboard
                dashboardData = _b.sent();
                return [3 /*break*/, 10];
            case 4:
                if (!(loginType === 3)) return [3 /*break*/, 6];
                return [4 /*yield*/, getDepartmentAdminDashboard(userId)];
            case 5:
                // Department Admin Dashboard
                dashboardData = _b.sent();
                return [3 /*break*/, 10];
            case 6:
                if (!(loginType === -1)) return [3 /*break*/, 10];
                _b.label = 7;
            case 7:
                _b.trys.push([7, 9, , 10]);
                return [4 /*yield*/, getStudentDashboard(userId)];
            case 8:
                // Student Dashboard
                dashboardData = _b.sent();
                return [3 /*break*/, 10];
            case 9:
                error_1 = _b.sent();
                err = error_1;
                if (err.message === 'Student record not found') {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'No student profile found for your account. Please contact an administrator.'
                        })];
                }
                throw error_1; // re-throw any other errors
            case 10: return [2 /*return*/, res.json({
                    success: true,
                    data: dashboardData
                })];
            case 11:
                error_2 = _b.sent();
                console.error('Dashboard data error:', error_2);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to fetch dashboard data'
                    })];
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.getDashboardData = getDashboardData;
/**
 * Get dashboard data for Super Admin
 */
var getSuperAdminDashboard = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, studentsCount, facultyCount, departmentsCount, subjectsCount, recentAttendance, recentMarks, lowAttendance, pendingMarksCount, formattedAttendance, formattedMarks;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    // Count of students
                    index_1.prisma.student.count(),
                    // Count of faculty
                    index_1.prisma.faculty.count(),
                    // Count of departments
                    index_1.prisma.department.count(),
                    // Count of subjects
                    index_1.prisma.subject.count(),
                    // Recent attendance sessions
                    index_1.prisma.attendanceSession.findMany({
                        take: 5,
                        orderBy: { attendanceDate: 'desc' },
                        include: {
                            subject: true,
                            faculty: true,
                            _count: {
                                select: { attendanceentry: true }
                            },
                            attendanceentry: {
                                select: { status: true }
                            }
                        }
                    }),
                    // Recent marks entries
                    index_1.prisma.studentcomponentmark.findMany({
                        take: 5,
                        orderBy: { updatedAt: 'desc' },
                        include: {
                            examcomponent: {
                                include: {
                                    subject: true
                                }
                            },
                            user: {
                                include: {
                                    facultyAccount: true
                                }
                            }
                        },
                        distinct: ['componentId']
                    }),
                    // Students with low attendance
                    index_1.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, \n        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,\n        GROUP_CONCAT(DISTINCT subj.code SEPARATOR ', ') as subjects\n      FROM student s\n      JOIN attendanceentry ae ON s.usn = ae.usn\n      JOIN attendancesession sess ON ae.sessionId = sess.id\n      JOIN subject subj ON sess.subjectId = subj.id\n      GROUP BY s.usn\n      HAVING attendancePercentage < 75\n      LIMIT 10\n    "], ["\n      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, \n        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,\n        GROUP_CONCAT(DISTINCT subj.code SEPARATOR ', ') as subjects\n      FROM student s\n      JOIN attendanceentry ae ON s.usn = ae.usn\n      JOIN attendancesession sess ON ae.sessionId = sess.id\n      JOIN subject subj ON sess.subjectId = subj.id\n      GROUP BY s.usn\n      HAVING attendancePercentage < 75\n      LIMIT 10\n    "]))),
                    // Count subjects needing marks entry
                    index_1.prisma.examcomponent.count({
                        where: {
                            studentcomponentmark: {
                                none: {}
                            }
                        }
                    })
                ])];
            case 1:
                _a = _b.sent(), studentsCount = _a[0], facultyCount = _a[1], departmentsCount = _a[2], subjectsCount = _a[3], recentAttendance = _a[4], recentMarks = _a[5], lowAttendance = _a[6], pendingMarksCount = _a[7];
                formattedAttendance = recentAttendance.map(function (session) {
                    var total = session._count.attendanceentry;
                    var present = session.attendanceentry.filter(function (entry) { return entry.status === 'Present'; }).length;
                    return {
                        id: session.id,
                        date: session.attendanceDate,
                        faculty: {
                            name: session.faculty ? "".concat(session.faculty.name || '') : 'N/A'
                        },
                        subject: {
                            code: session.subject.code,
                            name: session.subject.name
                        },
                        total: total,
                        present: present
                    };
                });
                formattedMarks = recentMarks.map(function (mark) {
                    var _a, _b;
                    return {
                        id: mark.id,
                        componentId: mark.componentId,
                        updatedAt: mark.updatedAt,
                        component: {
                            name: mark.examcomponent.name,
                            maxMarks: mark.examcomponent.maxMarks
                        },
                        subject: {
                            code: mark.examcomponent.subject.code
                        },
                        faculty: {
                            name: ((_b = (_a = mark.user) === null || _a === void 0 ? void 0 : _a.facultyAccount) === null || _b === void 0 ? void 0 : _b.name) || 'N/A'
                        },
                        averageMarks: 0 // This would ideally be calculated
                    };
                });
                return [2 /*return*/, {
                        students: studentsCount,
                        faculty: facultyCount,
                        departments: departmentsCount,
                        subjects: subjectsCount,
                        recentAttendance: formattedAttendance,
                        recentMarks: formattedMarks,
                        lowAttendance: lowAttendance,
                        pendingMarks: pendingMarksCount
                    }];
        }
    });
}); };
/**
 * Get dashboard data for Faculty
 */
var getFacultyDashboard = function (facultyId) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, subjectsCount, attendanceSessionsCount, recentAttendance, recentMarks, lowAttendance, pendingComponents, formattedAttendance, formattedMarks;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    // Count of subjects assigned to faculty
                    index_1.prisma.facultySubjectMapping.count({
                        where: {
                            facultyId: String(facultyId),
                            status: 'active'
                        }
                    }),
                    // Count of attendance sessions taken by faculty
                    index_1.prisma.attendancesession.count({
                        where: {
                            facultyId: String(facultyId)
                        }
                    }),
                    // Recent attendance sessions by faculty
                    index_1.prisma.attendanceSession.findMany({
                        where: {
                            facultyId: String(facultyId)
                        },
                        take: 5,
                        orderBy: { attendanceDate: 'desc' },
                        include: {
                            subject: true,
                            _count: {
                                select: { attendanceentry: true }
                            },
                            attendanceentry: {
                                select: { status: true }
                            }
                        }
                    }),
                    // Recent marks entries by faculty
                    index_1.prisma.studentcomponentmark.findMany({
                        where: {
                            recordedBy: facultyId
                        },
                        take: 5,
                        orderBy: { updatedAt: 'desc' },
                        include: {
                            examcomponent: {
                                include: {
                                    subject: true
                                }
                            }
                        },
                        distinct: ['componentId']
                    }),
                    // Students with low attendance in faculty's subjects
                    index_1.prisma.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, \n        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,\n        GROUP_CONCAT(DISTINCT subj.code SEPARATOR ', ') as subjects\n      FROM student s\n      JOIN attendanceentry ae ON s.usn = ae.usn\n      JOIN attendancesession sess ON ae.sessionId = sess.id\n      JOIN subject subj ON sess.subjectId = subj.id\n      WHERE sess.facultyId = ", "\n      GROUP BY s.usn\n      HAVING attendancePercentage < 75\n      LIMIT 10\n    "], ["\n      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, \n        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,\n        GROUP_CONCAT(DISTINCT subj.code SEPARATOR ', ') as subjects\n      FROM student s\n      JOIN attendanceentry ae ON s.usn = ae.usn\n      JOIN attendancesession sess ON ae.sessionId = sess.id\n      JOIN subject subj ON sess.subjectId = subj.id\n      WHERE sess.facultyId = ", "\n      GROUP BY s.usn\n      HAVING attendancePercentage < 75\n      LIMIT 10\n    "])), String(facultyId)),
                    // Components pending mark entry for faculty
                    index_1.prisma.examcomponent.findMany({
                        where: {
                            subject: {
                                facultyMappings: {
                                    some: {
                                        facultyId: String(facultyId),
                                        status: 'active'
                                    }
                                }
                            },
                            studentcomponentmark: {
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
                ])];
            case 1:
                _a = _b.sent(), subjectsCount = _a[0], attendanceSessionsCount = _a[1], recentAttendance = _a[2], recentMarks = _a[3], lowAttendance = _a[4], pendingComponents = _a[5];
                formattedAttendance = recentAttendance.map(function (session) {
                    var total = session._count.attendanceentry;
                    var present = session.attendanceentry.filter(function (entry) { return entry.status === 'Present'; }).length;
                    return {
                        id: session.id,
                        date: session.attendanceDate,
                        subject: {
                            code: session.subject.code,
                            name: session.subject.name
                        },
                        total: total,
                        present: present
                    };
                });
                formattedMarks = recentMarks.map(function (mark) {
                    return {
                        id: mark.id,
                        componentId: mark.componentId,
                        updatedAt: mark.updatedAt,
                        component: {
                            name: mark.examcomponent.name,
                            maxMarks: mark.examcomponent.maxMarks
                        },
                        subject: {
                            code: mark.examcomponent.subject.code
                        },
                        averageMarks: 0 // This would ideally be calculated
                    };
                });
                return [2 /*return*/, {
                        subjects: subjectsCount,
                        attendanceSessions: attendanceSessionsCount,
                        recentAttendance: formattedAttendance,
                        recentMarks: formattedMarks,
                        lowAttendance: lowAttendance,
                        pendingComponents: pendingComponents
                    }];
        }
    });
}); };
/**
 * Get dashboard data for Department Admin
 */
var getDepartmentAdminDashboard = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    var user, departmentId, _a, studentsCount, facultyCount, subjectsCount, recentAttendance, recentMarks, lowAttendance, pendingMarksCount, formattedAttendance, formattedMarks;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, index_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { departmentId: true }
                })];
            case 1:
                user = _b.sent();
                if (!(user === null || user === void 0 ? void 0 : user.departmentId)) {
                    throw new Error('Department admin without department assignment');
                }
                departmentId = user.departmentId;
                return [4 /*yield*/, Promise.all([
                        // Count of students in department
                        index_1.prisma.student.count({
                            where: {
                                departmentId: departmentId
                            }
                        }),
                        // Count of faculty in department
                        index_1.prisma.faculty.count({
                            where: {
                                departmentId: departmentId
                            }
                        }),
                        // Count of subjects in department
                        index_1.prisma.subject.count({
                            where: {
                                departmentId: departmentId
                            }
                        }),
                        // Recent attendance sessions in department
                        index_1.prisma.attendanceSession.findMany({
                            where: {
                                subject: {
                                    departmentId: departmentId
                                }
                            },
                            take: 5,
                            orderBy: { attendanceDate: 'desc' },
                            include: {
                                subject: true,
                                faculty: true,
                                _count: {
                                    select: { attendanceentry: true }
                                },
                                attendanceentry: {
                                    select: { status: true }
                                }
                            }
                        }),
                        // Recent marks entries in department
                        index_1.prisma.studentcomponentmark.findMany({
                            where: {
                                examcomponent: {
                                    subject: {
                                        departmentId: departmentId
                                    }
                                }
                            },
                            take: 5,
                            orderBy: { updatedAt: 'desc' },
                            include: {
                                examcomponent: {
                                    include: {
                                        subject: true
                                    }
                                },
                                user: {
                                    include: {
                                        facultyAccount: true
                                    }
                                }
                            },
                            distinct: ['componentId']
                        }),
                        // Students with low attendance in department
                        index_1.prisma.$queryRaw(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, \n        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,\n        GROUP_CONCAT(DISTINCT subj.code SEPARATOR ', ') as subjects\n      FROM student s\n      JOIN attendanceentry ae ON s.usn = ae.usn\n      JOIN attendancesession sess ON ae.sessionId = sess.id\n      JOIN subject subj ON sess.subjectId = subj.id\n      WHERE s.departmentId = ", "\n      GROUP BY s.usn\n      HAVING attendancePercentage < 75\n      LIMIT 10\n    "], ["\n      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, \n        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,\n        GROUP_CONCAT(DISTINCT subj.code SEPARATOR ', ') as subjects\n      FROM student s\n      JOIN attendanceentry ae ON s.usn = ae.usn\n      JOIN attendancesession sess ON ae.sessionId = sess.id\n      JOIN subject subj ON sess.subjectId = subj.id\n      WHERE s.departmentId = ", "\n      GROUP BY s.usn\n      HAVING attendancePercentage < 75\n      LIMIT 10\n    "])), departmentId),
                        // Count subjects needing marks entry in department
                        index_1.prisma.examcomponent.count({
                            where: {
                                subject: {
                                    departmentId: departmentId
                                },
                                studentcomponentmark: {
                                    none: {}
                                }
                            }
                        })
                    ])];
            case 2:
                _a = _b.sent(), studentsCount = _a[0], facultyCount = _a[1], subjectsCount = _a[2], recentAttendance = _a[3], recentMarks = _a[4], lowAttendance = _a[5], pendingMarksCount = _a[6];
                formattedAttendance = recentAttendance.map(function (session) {
                    var total = session._count.attendanceentry;
                    var present = session.attendanceentry.filter(function (entry) { return entry.status === 'Present'; }).length;
                    return {
                        id: session.id,
                        date: session.attendanceDate,
                        faculty: {
                            name: session.faculty ? "".concat(session.faculty.name || '') : 'N/A'
                        },
                        subject: {
                            code: session.subject.code,
                            name: session.subject.name
                        },
                        total: total,
                        present: present
                    };
                });
                formattedMarks = recentMarks.map(function (mark) {
                    var _a, _b;
                    return {
                        id: mark.id,
                        componentId: mark.componentId,
                        updatedAt: mark.updatedAt,
                        component: {
                            name: mark.examcomponent.name,
                            maxMarks: mark.examcomponent.maxMarks
                        },
                        subject: {
                            code: mark.examcomponent.subject.code
                        },
                        faculty: {
                            name: ((_b = (_a = mark.user) === null || _a === void 0 ? void 0 : _a.facultyAccount) === null || _b === void 0 ? void 0 : _b.name) || 'N/A'
                        },
                        averageMarks: 0 // This would ideally be calculated
                    };
                });
                return [2 /*return*/, {
                        students: studentsCount,
                        faculty: facultyCount,
                        subjects: subjectsCount,
                        recentAttendance: formattedAttendance,
                        recentMarks: formattedMarks,
                        lowAttendance: lowAttendance,
                        pendingMarks: pendingMarksCount
                    }];
        }
    });
}); };
/**
 * Get dashboard data for Student
 */
var getStudentDashboard = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    var student, usn, _a, subjectsCount, attendanceData, marksData, semesterPerformance, subjects, overallAttendance, totalSessions, totalPresent, formattedMarks, cgpa, validSemesters_1, totalPoints, subjectCountResult, subjectCount;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("Looking for student with userId: ".concat(userId));
                return [4 /*yield*/, index_1.prisma.student.findFirst({
                        where: {
                            userId: userId
                        },
                        select: {
                            usn: true
                        }
                    })];
            case 1:
                student = _b.sent();
                if (!student) {
                    console.log("No student found with userId: ".concat(userId));
                    throw new Error('Student record not found');
                }
                usn = student.usn;
                return [4 /*yield*/, Promise.all([
                        // Count of subjects for the student - using raw query to avoid schema mismatch
                        index_1.prisma.$queryRaw(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n      SELECT COUNT(*) as count\n      FROM subject s\n      JOIN studentsubjectenrollment sse ON s.id = sse.subjectId\n      WHERE sse.studentUsn = ", "\n    "], ["\n      SELECT COUNT(*) as count\n      FROM subject s\n      JOIN studentsubjectenrollment sse ON s.id = sse.subjectId\n      WHERE sse.studentUsn = ", "\n    "])), usn),
                        // Fetch attendance data for the student
                        index_1.prisma.$queryRaw(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n      SELECT \n        subj.code as subjectCode,\n        subj.name as subjectName,\n        COUNT(ae.id) as totalSessions,\n        SUM(CASE WHEN ae.status = 'Present' THEN 1 ELSE 0 END) as presentCount\n      FROM student s\n      JOIN attendanceentry ae ON s.usn = ae.usn\n      JOIN attendancesession sess ON ae.sessionId = sess.id\n      JOIN subject subj ON sess.subjectId = subj.id\n      WHERE s.usn = ", "\n      GROUP BY subj.id\n    "], ["\n      SELECT \n        subj.code as subjectCode,\n        subj.name as subjectName,\n        COUNT(ae.id) as totalSessions,\n        SUM(CASE WHEN ae.status = 'Present' THEN 1 ELSE 0 END) as presentCount\n      FROM student s\n      JOIN attendanceentry ae ON s.usn = ae.usn\n      JOIN attendancesession sess ON ae.sessionId = sess.id\n      JOIN subject subj ON sess.subjectId = subj.id\n      WHERE s.usn = ", "\n      GROUP BY subj.id\n    "])), usn),
                        // Fetch recent marks for the student
                        index_1.prisma.studentcomponentmark.findMany({
                            where: {
                                usn: usn
                            },
                            take: 5,
                            orderBy: { updatedAt: 'desc' },
                            include: {
                                examcomponent: {
                                    include: {
                                        subject: true
                                    }
                                }
                            }
                        }),
                        // Fetch semester performance data
                        index_1.prisma.$queryRaw(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n      SELECT \n        s.semester as semesterNumber,\n        AVG(scm.marksObtained / ec.maxMarks * 10) as sgpa\n      FROM student s\n      JOIN studentcomponentmark scm ON s.usn = scm.studentUsn\n      JOIN examcomponent ec ON scm.componentId = ec.id\n      WHERE s.usn = ", "\n        AND ec.maxMarks IS NOT NULL AND ec.maxMarks <> 0\n      GROUP BY s.semester\n      ORDER BY s.semester\n    "], ["\n      SELECT \n        s.semester as semesterNumber,\n        AVG(scm.marksObtained / ec.maxMarks * 10) as sgpa\n      FROM student s\n      JOIN studentcomponentmark scm ON s.usn = scm.studentUsn\n      JOIN examcomponent ec ON scm.componentId = ec.id\n      WHERE s.usn = ", "\n        AND ec.maxMarks IS NOT NULL AND ec.maxMarks <> 0\n      GROUP BY s.semester\n      ORDER BY s.semester\n    "])), usn)
                    ])];
            case 2:
                _a = _b.sent(), subjectsCount = _a[0], attendanceData = _a[1], marksData = _a[2], semesterPerformance = _a[3];
                subjects = {};
                overallAttendance = 0;
                totalSessions = 0;
                totalPresent = 0;
                if (Array.isArray(attendanceData)) {
                    attendanceData.forEach(function (data) {
                        var percentage = data.totalSessions > 0
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
                formattedMarks = marksData.map(function (mark) {
                    var _a, _b, _c, _d;
                    return {
                        id: mark.id,
                        component: {
                            name: ((_a = mark.examcomponent) === null || _a === void 0 ? void 0 : _a.name) || 'N/A',
                            maxMarks: ((_b = mark.examcomponent) === null || _b === void 0 ? void 0 : _b.maxMarks) || 0
                        },
                        subject: {
                            code: ((_d = (_c = mark.examcomponent) === null || _c === void 0 ? void 0 : _c.subject) === null || _d === void 0 ? void 0 : _d.code) || 'N/A'
                        },
                        obtainedMarks: mark.marksObtained,
                        date: mark.updatedAt
                    };
                });
                cgpa = 0;
                if (Array.isArray(semesterPerformance) && semesterPerformance.length > 0) {
                    validSemesters_1 = 0;
                    totalPoints = semesterPerformance.reduce(function (sum, sem) {
                        var sgpaValue = parseFloat(sem.sgpa);
                        if (!isNaN(sgpaValue)) {
                            validSemesters_1++;
                            return sum + sgpaValue;
                        }
                        return sum;
                    }, 0);
                    if (validSemesters_1 > 0) {
                        cgpa = parseFloat((totalPoints / validSemesters_1).toFixed(2));
                    }
                }
                subjectCountResult = subjectsCount;
                subjectCount = Array.isArray(subjectCountResult) && subjectCountResult.length > 0
                    ? Number(subjectCountResult[0].count)
                    : 0;
                return [2 /*return*/, {
                        subjects: subjectCount,
                        studentStats: {
                            attendance: {
                                overall: "".concat(overallAttendance, "%"),
                                subjects: subjects
                            },
                            performance: {
                                cgpa: cgpa,
                                semesters: semesterPerformance
                            },
                            recentMarks: formattedMarks
                        }
                    }];
        }
    });
}); };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;

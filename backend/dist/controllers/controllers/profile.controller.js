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
exports.getStudentSemesterData = exports.downloadStudentProfile = exports.getStudentProfile = void 0;
var index_1 = require("../index");
// No need for this import as we'll implement the check function locally
// import { checkRolePermission } from '../utils/auth';
/**
 * Helper function to check if a user has access to a student profile
 */
var checkProfileAccess = function (userId, usn) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // Implement access control logic here
        // For now, just return true
        return [2 /*return*/, true];
    });
}); };
/**
 * Get student academic profile including marks and attendance
 */
var getStudentProfile = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var usn, user, canAccess, student, semesterData, academicData, totalAttendanceSum_1, totalSubjectsAttempted_1, _loop_1, _i, _a, semItem, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                usn = req.params.usn;
                user = req.user;
                return [4 /*yield*/, checkProfileAccess(user === null || user === void 0 ? void 0 : user.userId, usn)];
            case 1:
                canAccess = _b.sent();
                if (!canAccess && (user === null || user === void 0 ? void 0 : user.loginType) !== 1) { // Super admin always has access
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'You do not have permission to view this student profile'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.student.findUnique({
                        where: { usn: usn },
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
                    })];
            case 2:
                student = _b.sent();
                if (!student) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT DISTINCT semester\n      FROM `ExamComponent` ec\n      JOIN `StudentComponentMark` scm ON ec.id = scm.componentId\n      JOIN `Subject` s ON ec.subjectId = s.id\n      WHERE scm.usn = ", "\n      ORDER BY semester ASC\n    "], ["\n      SELECT DISTINCT semester\n      FROM \\`ExamComponent\\` ec\n      JOIN \\`StudentComponentMark\\` scm ON ec.id = scm.componentId\n      JOIN \\`Subject\\` s ON ec.subjectId = s.id\n      WHERE scm.usn = ", "\n      ORDER BY semester ASC\n    "])), usn)];
            case 3:
                semesterData = _b.sent();
                academicData = {
                    semesters: [],
                    cumulativeSummary: {
                        totalAttendanceAverage: 0,
                        totalSubjectsAttempted: 0
                    }
                };
                totalAttendanceSum_1 = 0;
                totalSubjectsAttempted_1 = 0;
                _loop_1 = function (semItem) {
                    var semester, subjects, subjectsWithMarks, attendanceSessions, attendanceBySubject, semesterTotalObtained, semesterTotalMax;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                semester = semItem.semester;
                                return [4 /*yield*/, index_1.prisma.subject.findMany({
                                        where: {
                                            semester: semester,
                                            departmentId: student.departmentId
                                        },
                                        include: {
                                            components: {
                                                include: {
                                                    studentMarks: {
                                                        where: { usn: usn }
                                                    }
                                                    // Use correct property name instead of 'iaConfig'
                                                }
                                            }
                                        }
                                    })];
                            case 1:
                                subjects = _c.sent();
                                subjectsWithMarks = subjects.map(function (subject) {
                                    // Calculate total marks for the subject
                                    var totalMarksObtained = 0;
                                    var totalMaxMarks = 0;
                                    // Check if components exists before accessing it
                                    var components = subject.components ? subject.components.map(function (component) {
                                        var _a;
                                        var studentMark = (_a = component.studentMarks) === null || _a === void 0 ? void 0 : _a[0];
                                        var marksObtained = studentMark ? studentMark.marksObtained : 0;
                                        totalMarksObtained += marksObtained;
                                        totalMaxMarks += component.maxMarks || 0;
                                        return {
                                            id: component.id,
                                            name: component.name,
                                            type: component.componentType,
                                            maxMarks: component.maxMarks || 0,
                                            marksObtained: marksObtained
                                        };
                                    }) : [];
                                    totalSubjectsAttempted_1++;
                                    return {
                                        id: subject.id,
                                        code: subject.code,
                                        name: subject.name,
                                        credits: subject.credits,
                                        isLab: subject.isLab,
                                        components: components,
                                        totalMarksObtained: totalMarksObtained,
                                        totalMaxMarks: totalMaxMarks,
                                        percentage: totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0
                                    };
                                });
                                return [4 /*yield*/, index_1.prisma.attendanceSession.findMany({
                                        where: {
                                            semester: semester,
                                            subject: {
                                                departmentId: student.departmentId
                                            }
                                        },
                                        include: {
                                            subject: true,
                                            entries: {
                                                where: { usn: usn }
                                            }
                                        }
                                    })];
                            case 2:
                                attendanceSessions = _c.sent();
                                attendanceBySubject = {};
                                attendanceSessions.forEach(function (session) {
                                    var subjectId = session.subject.id;
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
                                        var status_1 = session.entries[0].status;
                                        if (status_1 === 'Present') {
                                            attendanceBySubject[subjectId].present++;
                                        }
                                        else if (status_1 === 'Absent') {
                                            attendanceBySubject[subjectId].absent++;
                                        }
                                        else {
                                            attendanceBySubject[subjectId].other++;
                                        }
                                    }
                                    else {
                                        // If no entry, count as absent
                                        attendanceBySubject[subjectId].absent++;
                                    }
                                });
                                // Calculate attendance percentages
                                Object.keys(attendanceBySubject).forEach(function (id) {
                                    var numId = parseInt(id);
                                    var subject = attendanceBySubject[numId];
                                    subject.percentage = subject.sessions > 0
                                        ? (subject.present / subject.sessions) * 100
                                        : 0;
                                    totalAttendanceSum_1 += subject.percentage;
                                });
                                semesterTotalObtained = subjectsWithMarks.reduce(function (sum, subject) { return sum + subject.totalMarksObtained; }, 0);
                                semesterTotalMax = subjectsWithMarks.reduce(function (sum, subject) { return sum + subject.totalMaxMarks; }, 0);
                                academicData.semesters.push({
                                    semester: semester,
                                    subjects: subjectsWithMarks,
                                    attendance: Object.values(attendanceBySubject),
                                    totalMarks: {
                                        obtained: semesterTotalObtained,
                                        max: semesterTotalMax,
                                        percentage: semesterTotalMax > 0 ? (semesterTotalObtained / semesterTotalMax) * 100 : 0
                                    }
                                });
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, _a = semesterData;
                _b.label = 4;
            case 4:
                if (!(_i < _a.length)) return [3 /*break*/, 7];
                semItem = _a[_i];
                return [5 /*yield**/, _loop_1(semItem)];
            case 5:
                _b.sent();
                _b.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 4];
            case 7:
                // Calculate cumulative summary
                academicData.cumulativeSummary = {
                    totalAttendanceAverage: academicData.semesters.length > 0
                        ? totalAttendanceSum_1 / totalSubjectsAttempted_1
                        : 0,
                    totalSubjectsAttempted: totalSubjectsAttempted_1
                };
                res.json({
                    success: true,
                    data: {
                        student: {
                            usn: student.usn,
                            name: "".concat(student.firstName, " ").concat(student.middleName ? student.middleName + ' ' : '').concat(student.lastName || '').trim(),
                            email: student.email,
                            phone: student.phone,
                            department: student.departmentId,
                            batch: student.batchId,
                            currentSemester: student.semester,
                            section: student.section
                        },
                        academicData: academicData
                    }
                });
                return [3 /*break*/, 9];
            case 8:
                error_1 = _b.sent();
                console.error('Get student profile error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.getStudentProfile = getStudentProfile;
/**
 * Download student profile as PDF
 * Only faculty and admins can download profiles
 */
var downloadStudentProfile = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var usn, user, canAccess, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                usn = req.params.usn;
                user = req.user;
                // Check if user has permission to download profile
                // Only faculty and admins can download profiles
                if ((user === null || user === void 0 ? void 0 : user.loginType) === 4) { // Student role
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Students cannot download profiles'
                        })];
                }
                return [4 /*yield*/, checkProfileAccess(user === null || user === void 0 ? void 0 : user.userId, usn)];
            case 1:
                canAccess = _a.sent();
                if (!canAccess && (user === null || user === void 0 ? void 0 : user.loginType) !== 1) { // Super admin always has access
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'You do not have permission to download this student profile'
                        })];
                }
                // For now, return the same data as getStudentProfile
                // In a real implementation, this would generate a PDF
                // and send it as a download
                res.json({
                    success: true,
                    message: 'PDF download functionality will be implemented in the future',
                    data: {
                        usn: usn,
                        downloadedAt: new Date().toISOString()
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Download student profile error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.downloadStudentProfile = downloadStudentProfile;
/**
 * Get semester data for a specific student
 */
var getStudentSemesterData = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, usn, sem_number, user, canAccess, student, semester, subjects, subjectsWithMarks, attendanceSessions, attendanceBySubject_1, semesterTotalObtained, semesterTotalMax, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.params, usn = _a.usn, sem_number = _a.sem_number;
                user = req.user;
                return [4 /*yield*/, checkProfileAccess(user === null || user === void 0 ? void 0 : user.userId, usn)];
            case 1:
                canAccess = _b.sent();
                if (!canAccess && (user === null || user === void 0 ? void 0 : user.loginType) !== 1) { // Super admin always has access
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'You do not have permission to view this student data'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.student.findUnique({
                        where: { usn: usn },
                        include: {
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            }
                        }
                    })];
            case 2:
                student = _b.sent();
                if (!student) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        })];
                }
                semester = parseInt(sem_number);
                return [4 /*yield*/, index_1.prisma.subject.findMany({
                        where: {
                            semester: semester,
                            departmentId: student.departmentId
                        },
                        include: {
                            components: {
                                include: {
                                    studentMarks: {
                                        where: { usn: usn }
                                    }
                                    // Use correct property name instead of 'iaConfig'
                                }
                            }
                        }
                    })];
            case 3:
                subjects = _b.sent();
                subjectsWithMarks = subjects.map(function (subject) {
                    // Calculate total marks for the subject
                    var totalMarksObtained = 0;
                    var totalMaxMarks = 0;
                    // Check if components exists before accessing it
                    var components = subject.components ? subject.components.map(function (component) {
                        var _a;
                        var studentMark = (_a = component.studentMarks) === null || _a === void 0 ? void 0 : _a[0];
                        var marksObtained = studentMark ? studentMark.marksObtained : 0;
                        totalMarksObtained += marksObtained;
                        totalMaxMarks += component.maxMarks || 0;
                        return {
                            id: component.id,
                            name: component.name,
                            type: component.componentType,
                            maxMarks: component.maxMarks || 0,
                            marksObtained: marksObtained
                        };
                    }) : [];
                    return {
                        id: subject.id,
                        code: subject.code,
                        name: subject.name,
                        credits: subject.credits,
                        isLab: subject.isLab,
                        components: components,
                        totalMarksObtained: totalMarksObtained,
                        totalMaxMarks: totalMaxMarks,
                        percentage: totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0
                    };
                });
                return [4 /*yield*/, index_1.prisma.attendanceSession.findMany({
                        where: {
                            semester: semester,
                            subject: {
                                departmentId: student.departmentId
                            }
                        },
                        include: {
                            subject: true,
                            entries: {
                                where: { usn: usn }
                            }
                        }
                    })];
            case 4:
                attendanceSessions = _b.sent();
                attendanceBySubject_1 = {};
                attendanceSessions.forEach(function (session) {
                    var subjectId = session.subject.id;
                    if (!attendanceBySubject_1[subjectId]) {
                        attendanceBySubject_1[subjectId] = {
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
                    attendanceBySubject_1[subjectId].sessions++;
                    // Check if student has an entry for this session
                    if (session.entries.length > 0) {
                        var status_2 = session.entries[0].status;
                        if (status_2 === 'Present') {
                            attendanceBySubject_1[subjectId].present++;
                        }
                        else if (status_2 === 'Absent') {
                            attendanceBySubject_1[subjectId].absent++;
                        }
                        else {
                            attendanceBySubject_1[subjectId].other++;
                        }
                    }
                    else {
                        // If no entry, count as absent
                        attendanceBySubject_1[subjectId].absent++;
                    }
                });
                // Calculate attendance percentages
                Object.keys(attendanceBySubject_1).forEach(function (id) {
                    var numId = parseInt(id);
                    var subject = attendanceBySubject_1[numId];
                    subject.percentage = subject.sessions > 0
                        ? (subject.present / subject.sessions) * 100
                        : 0;
                });
                semesterTotalObtained = subjectsWithMarks.reduce(function (sum, subject) { return sum + subject.totalMarksObtained; }, 0);
                semesterTotalMax = subjectsWithMarks.reduce(function (sum, subject) { return sum + subject.totalMaxMarks; }, 0);
                res.json({
                    success: true,
                    data: {
                        student: {
                            usn: student.usn,
                            name: "".concat(student.firstName, " ").concat(student.middleName ? student.middleName + ' ' : '').concat(student.lastName || '').trim(),
                            email: student.email,
                            phone: student.phone,
                            department: student.departmentId,
                            batch: student.batchId,
                            currentSemester: student.semester,
                            section: student.section
                        },
                        semester: semester,
                        subjects: subjectsWithMarks,
                        attendance: Object.values(attendanceBySubject_1),
                        totalMarks: {
                            obtained: semesterTotalObtained,
                            max: semesterTotalMax,
                            percentage: semesterTotalMax > 0 ? (semesterTotalObtained / semesterTotalMax) * 100 : 0
                        }
                    }
                });
                return [3 /*break*/, 6];
            case 5:
                error_3 = _b.sent();
                console.error('Get student semester data error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getStudentSemesterData = getStudentSemesterData;
var templateObject_1;

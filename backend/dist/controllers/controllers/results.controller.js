"use strict";
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
exports.viewStudentResults = exports.viewSubjectResults = exports.calculateStudentResult = exports.calculateStudentSubjectResult = exports.calculateSubjectResults = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
/**
 * Calculate final results for a subject
 */
var calculateSubjectResults = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var subject_id, subjectId, subject, students, results, _i, students_1, student, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                subject_id = req.params.subject_id;
                subjectId = parseInt(subject_id);
                if (isNaN(subjectId)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid subject ID'
                        })];
                }
                return [4 /*yield*/, prisma.subject.findUnique({
                        where: { id: subjectId },
                        include: {
                            examComponents: true
                        }
                    })];
            case 1:
                subject = _a.sent();
                if (!subject) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                return [4 /*yield*/, prisma.student.findMany({
                        where: {
                            semester: subject.semester,
                            departmentId: subject.departmentId
                        }
                    })];
            case 2:
                students = _a.sent();
                if (students.length === 0) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'No students found for this subject'
                        })];
                }
                results = [];
                _i = 0, students_1 = students;
                _a.label = 3;
            case 3:
                if (!(_i < students_1.length)) return [3 /*break*/, 6];
                student = students_1[_i];
                return [4 /*yield*/, (0, exports.calculateStudentSubjectResult)(student.usn, subjectId)];
            case 4:
                result = _a.sent();
                if (result) {
                    results.push(result);
                }
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6:
                res.json({
                    success: true,
                    data: {
                        subject: {
                            id: subject.id,
                            code: subject.code,
                            name: subject.name
                        },
                        results: results
                    }
                });
                return [3 /*break*/, 8];
            case 7:
                error_1 = _a.sent();
                console.error('Calculate subject results error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.calculateSubjectResults = calculateSubjectResults;
/**
 * Calculate results for a specific student in a subject
 */
var calculateStudentSubjectResult = function (usn, subjectId) { return __awaiter(void 0, void 0, void 0, function () {
    var components, totalMarksObtained, totalMaxMarks, componentDetails, _i, components_1, component, studentMark, marksObtained, attendancePercentage, isEligible, student, finalResult, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                return [4 /*yield*/, prisma.examComponent.findMany({
                        where: { subjectId: subjectId }
                    })];
            case 1:
                components = _a.sent();
                if (components.length === 0) {
                    return [2 /*return*/, null]; // No components defined for this subject
                }
                totalMarksObtained = 0;
                totalMaxMarks = 0;
                componentDetails = [];
                _i = 0, components_1 = components;
                _a.label = 2;
            case 2:
                if (!(_i < components_1.length)) return [3 /*break*/, 5];
                component = components_1[_i];
                return [4 /*yield*/, prisma.studentComponentMark.findFirst({
                        where: {
                            usn: usn,
                            componentId: component.id
                        }
                    })];
            case 3:
                studentMark = _a.sent();
                marksObtained = studentMark ? studentMark.marksObtained : 0;
                totalMarksObtained += marksObtained;
                totalMaxMarks += component.maxMarks;
                componentDetails.push({
                    componentId: component.id,
                    componentName: component.name,
                    maxMarks: component.maxMarks,
                    marksObtained: marksObtained
                });
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [4 /*yield*/, calculateAttendancePercentage(usn, subjectId)];
            case 6:
                attendancePercentage = _a.sent();
                isEligible = attendancePercentage >= 85;
                return [4 /*yield*/, prisma.student.findUnique({
                        where: { usn: usn },
                        select: {
                            usn: true,
                            firstName: true,
                            lastName: true,
                            section: true,
                            semester: true
                        }
                    })];
            case 7:
                student = _a.sent();
                if (!student) {
                    return [2 /*return*/, null];
                }
                finalResult = {
                    usn: usn,
                    subjectId: subjectId,
                    totalMarksObtained: totalMarksObtained,
                    totalMaxMarks: totalMaxMarks,
                    percentage: totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0,
                    attendancePercentage: attendancePercentage,
                    isEligible: isEligible,
                    components: componentDetails,
                    student: student
                };
                return [2 /*return*/, finalResult];
            case 8:
                error_2 = _a.sent();
                console.error('Calculate student subject result error:', error_2);
                return [2 /*return*/, null];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.calculateStudentSubjectResult = calculateStudentSubjectResult;
/**
 * Calculate results for a specific student in a subject
 */
var calculateStudentResult = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, subject_id, usn, subjectId, subject, student, result, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.params, subject_id = _a.subject_id, usn = _a.usn;
                subjectId = parseInt(subject_id);
                if (isNaN(subjectId)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid subject ID'
                        })];
                }
                return [4 /*yield*/, prisma.subject.findUnique({
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
                return [4 /*yield*/, prisma.student.findUnique({
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
                return [4 /*yield*/, (0, exports.calculateStudentSubjectResult)(usn, subjectId)];
            case 3:
                result = _b.sent();
                if (!result) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Could not calculate result, missing components or student data'
                        })];
                }
                res.json({
                    success: true,
                    data: {
                        subject: {
                            id: subject.id,
                            code: subject.code,
                            name: subject.name
                        },
                        result: result
                    }
                });
                return [3 /*break*/, 5];
            case 4:
                error_3 = _b.sent();
                console.error('Calculate student result error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.calculateStudentResult = calculateStudentResult;
/**
 * Helper function to calculate attendance percentage
 */
var calculateAttendancePercentage = function (usn, subjectId) { return __awaiter(void 0, void 0, void 0, function () {
    var sessions, totalPeriods, presentPeriods, _i, sessions_1, session, entry, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.attendanceSession.findMany({
                        where: { subjectId: subjectId },
                        include: {
                            entries: {
                                where: { usn: usn }
                            }
                        }
                    })];
            case 1:
                sessions = _a.sent();
                if (sessions.length === 0) {
                    return [2 /*return*/, 0]; // No sessions recorded yet
                }
                totalPeriods = 0;
                presentPeriods = 0;
                for (_i = 0, sessions_1 = sessions; _i < sessions_1.length; _i++) {
                    session = sessions_1[_i];
                    totalPeriods += session.duration;
                    entry = session.entries.find(function (e) { return e.usn === usn; });
                    if (entry && entry.status === 'Present') {
                        presentPeriods += session.duration;
                    }
                }
                return [2 /*return*/, totalPeriods > 0 ? (presentPeriods / totalPeriods) * 100 : 0];
            case 2:
                error_4 = _a.sent();
                console.error('Calculate attendance percentage error:', error_4);
                return [2 /*return*/, 0];
            case 3: return [2 /*return*/];
        }
    });
}); };
/**
 * View results for a specific subject
 */
var viewSubjectResults = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var subject_id, subjectId, subject, results, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                subject_id = req.params.subject_id;
                subjectId = parseInt(subject_id);
                if (isNaN(subjectId)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid subject ID'
                        })];
                }
                return [4 /*yield*/, prisma.subject.findUnique({
                        where: { id: subjectId },
                        include: {
                            examComponents: true
                        }
                    })];
            case 1:
                subject = _a.sent();
                if (!subject) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                return [4 /*yield*/, getAllSubjectResults(subjectId)];
            case 2:
                results = _a.sent();
                res.json({
                    success: true,
                    data: {
                        subject: {
                            id: subject.id,
                            code: subject.code,
                            name: subject.name
                        },
                        components: subject.examComponents.map(function (comp) { return ({
                            id: comp.id,
                            name: comp.name,
                            type: comp.componentType,
                            maxMarks: comp.maxMarks
                        }); }),
                        results: results
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                console.error('View subject results error:', error_5);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.viewSubjectResults = viewSubjectResults;
/**
 * Helper function to calculate results for all students in a subject
 */
var getAllSubjectResults = function (subjectId) { return __awaiter(void 0, void 0, void 0, function () {
    var subject, students, results, _i, students_2, student, result, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                return [4 /*yield*/, prisma.subject.findUnique({
                        where: { id: subjectId },
                        select: { semester: true, departmentId: true }
                    })];
            case 1:
                subject = _a.sent();
                if (!subject)
                    return [2 /*return*/, []];
                return [4 /*yield*/, prisma.student.findMany({
                        where: {
                            semester: subject.semester,
                            departmentId: subject.departmentId
                        }
                    })];
            case 2:
                students = _a.sent();
                results = [];
                _i = 0, students_2 = students;
                _a.label = 3;
            case 3:
                if (!(_i < students_2.length)) return [3 /*break*/, 6];
                student = students_2[_i];
                return [4 /*yield*/, (0, exports.calculateStudentSubjectResult)(student.usn, subjectId)];
            case 4:
                result = _a.sent();
                if (result) {
                    results.push(result);
                }
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6: return [2 /*return*/, results];
            case 7:
                error_6 = _a.sent();
                console.error('Calculate subject results error:', error_6);
                return [2 /*return*/, []];
            case 8: return [2 /*return*/];
        }
    });
}); };
/**
 * View results for a specific student
 */
var viewStudentResults = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var usn, student, subjects, results, _i, subjects_1, subject, result, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                usn = req.params.usn;
                return [4 /*yield*/, prisma.student.findUnique({
                        where: { usn: usn },
                        include: {
                            department: true
                        }
                    })];
            case 1:
                student = _a.sent();
                if (!student) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        })];
                }
                return [4 /*yield*/, prisma.subject.findMany({
                        where: {
                            semester: student.semester,
                            departmentId: student.departmentId
                        }
                    })];
            case 2:
                subjects = _a.sent();
                results = [];
                _i = 0, subjects_1 = subjects;
                _a.label = 3;
            case 3:
                if (!(_i < subjects_1.length)) return [3 /*break*/, 6];
                subject = subjects_1[_i];
                return [4 /*yield*/, (0, exports.calculateStudentSubjectResult)(usn, subject.id)];
            case 4:
                result = _a.sent();
                if (result) {
                    results.push({
                        subject: {
                            id: subject.id,
                            code: subject.code,
                            name: subject.name
                        },
                        result: result
                    });
                }
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6:
                res.json({
                    success: true,
                    data: {
                        student: {
                            usn: student.usn,
                            name: "".concat(student.firstName, " ").concat(student.lastName),
                            section: student.section,
                            semester: student.semester,
                            department: student.department.name
                        },
                        results: results
                    }
                });
                return [3 /*break*/, 8];
            case 7:
                error_7 = _a.sent();
                console.error('View student results error:', error_7);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.viewStudentResults = viewStudentResults;

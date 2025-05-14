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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadMarksTemplate = exports.getComponentMarks = exports.getStudentMarks = exports.bulkUploadMarks = exports.addStudentComponentMark = exports.getExamComponentById = exports.getExamComponents = exports.createExamComponent = void 0;
var index_1 = require("../index");
var zod_1 = require("zod");
var ExcelJS = require("exceljs");
/**
 * Create a new exam component
 */
var createExamComponent = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, subjectId, name_1, componentType, maxMarks, weightagePercent, subject, existingComponent, examComponent, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, subjectId = _a.subjectId, name_1 = _a.name, componentType = _a.componentType, maxMarks = _a.maxMarks, weightagePercent = _a.weightagePercent;
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
                return [4 /*yield*/, index_1.prisma.examComponent.findFirst({
                        where: {
                            subjectId: subjectId,
                            name: name_1
                        }
                    })];
            case 2:
                existingComponent = _b.sent();
                if (existingComponent) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'An exam component with this name already exists for this subject'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.examComponent.create({
                        data: {
                            subjectId: subjectId,
                            name: name_1,
                            componentType: componentType,
                            maxMarks: maxMarks,
                            weightagePercent: weightagePercent
                        },
                        include: {
                            subject: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            }
                        }
                    })];
            case 3:
                examComponent = _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'Exam component created successfully',
                    data: examComponent
                });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                console.error('Create exam component error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.createExamComponent = createExamComponent;
/**
 * Get all exam components with filters
 */
var getExamComponents = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, subjectId, componentType, _b, page, _c, limit, pageNumber, limitNumber, filterConditions, total, examComponents, error_2;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                _a = req.query, subjectId = _a.subjectId, componentType = _a.componentType, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c;
                pageNumber = parseInt(page);
                limitNumber = parseInt(limit);
                filterConditions = {};
                if (subjectId) {
                    filterConditions.subjectId = parseInt(subjectId);
                }
                if (componentType) {
                    filterConditions.componentType = componentType;
                }
                return [4 /*yield*/, index_1.prisma.examComponent.count({
                        where: filterConditions
                    })];
            case 1:
                total = _d.sent();
                return [4 /*yield*/, index_1.prisma.examComponent.findMany({
                        where: filterConditions,
                        include: {
                            subject: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    semester: true,
                                    department: {
                                        select: {
                                            id: true,
                                            name: true,
                                            code: true
                                        }
                                    }
                                }
                            },
                            _count: {
                                select: {
                                    studentMarks: true
                                }
                            }
                        },
                        skip: (pageNumber - 1) * limitNumber,
                        take: limitNumber,
                        orderBy: [
                            { subject: { name: 'asc' } },
                            { name: 'asc' }
                        ]
                    })];
            case 2:
                examComponents = _d.sent();
                res.json({
                    success: true,
                    data: {
                        examComponents: examComponents,
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
                console.error('Get exam components error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getExamComponents = getExamComponents;
/**
 * Get a specific exam component by ID
 */
var getExamComponentById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, examComponent, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, index_1.prisma.examComponent.findUnique({
                        where: { id: parseInt(id) },
                        include: {
                            subject: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    semester: true,
                                    department: {
                                        select: {
                                            id: true,
                                            name: true,
                                            code: true
                                        }
                                    }
                                }
                            },
                            studentMarks: {
                                include: {
                                    student: {
                                        select: {
                                            usn: true,
                                            firstName: true,
                                            middleName: true,
                                            lastName: true,
                                            section: true,
                                            semester: true
                                        }
                                    }
                                },
                                orderBy: {
                                    student: {
                                        firstName: 'asc'
                                    }
                                }
                            }
                        }
                    })];
            case 1:
                examComponent = _a.sent();
                if (!examComponent) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Exam component not found'
                        })];
                }
                res.json({
                    success: true,
                    data: examComponent
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Get exam component by ID error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getExamComponentById = getExamComponentById;
/**
 * Add a student component mark
 */
var addStudentComponentMark = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, usn, componentId, marksObtained, component, student, existingMark, updatedMark, studentMark, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                _a = req.body, usn = _a.usn, componentId = _a.componentId, marksObtained = _a.marksObtained;
                return [4 /*yield*/, index_1.prisma.examComponent.findUnique({
                        where: { id: componentId }
                    })];
            case 1:
                component = _b.sent();
                if (!component) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Exam component not found'
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
                // Validate marks are within range
                if (marksObtained > component.maxMarks) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Marks cannot exceed maximum marks (".concat(component.maxMarks, ")")
                        })];
                }
                return [4 /*yield*/, index_1.prisma.studentComponentMark.findFirst({
                        where: {
                            componentId: componentId,
                            usn: usn
                        }
                    })];
            case 3:
                existingMark = _b.sent();
                if (!existingMark) return [3 /*break*/, 5];
                return [4 /*yield*/, index_1.prisma.studentComponentMark.update({
                        where: {
                            id: existingMark.id
                        },
                        data: {
                            marksObtained: marksObtained
                        }
                    })];
            case 4:
                updatedMark = _b.sent();
                return [2 /*return*/, res.json({
                        success: true,
                        message: 'Marks updated successfully',
                        data: updatedMark
                    })];
            case 5: return [4 /*yield*/, index_1.prisma.studentComponentMark.create({
                    data: {
                        usn: usn,
                        componentId: componentId,
                        marksObtained: marksObtained
                    }
                })];
            case 6:
                studentMark = _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'Marks added successfully',
                    data: studentMark
                });
                return [3 /*break*/, 8];
            case 7:
                error_4 = _b.sent();
                console.error('Add student component mark error:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.addStudentComponentMark = addStudentComponentMark;
/**
 * Bulk upload marks for a component
 */
var bulkUploadMarks = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, componentId_1, marks, component_1, markSchema, validationResult, invalidMarks, usns, students, foundUsns_1, missingUsns, processedMarks, existingMarks_1, existingUsns_1, updates, inserts, result, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, componentId_1 = _a.componentId, marks = _a.marks;
                return [4 /*yield*/, index_1.prisma.examComponent.findUnique({
                        where: { id: componentId_1 }
                    })];
            case 1:
                component_1 = _b.sent();
                if (!component_1) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Exam component not found'
                        })];
                }
                if (!Array.isArray(marks) || marks.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Marks must be a non-empty array'
                        })];
                }
                markSchema = zod_1.z.object({
                    usn: zod_1.z.string(),
                    marksObtained: zod_1.z.number().min(0)
                });
                validationResult = zod_1.z.array(markSchema).safeParse(marks);
                if (!validationResult.success) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid marks format',
                            errors: validationResult.error.errors
                        })];
                }
                invalidMarks = marks.filter(function (mark) { return mark.marksObtained > component_1.maxMarks; });
                if (invalidMarks.length > 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Marks cannot exceed maximum marks (".concat(component_1.maxMarks, ")"),
                            data: {
                                invalidMarks: invalidMarks
                            }
                        })];
                }
                usns = marks.map(function (mark) { return mark.usn; });
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
                processedMarks = [];
                return [4 /*yield*/, index_1.prisma.studentComponentMark.findMany({
                        where: {
                            componentId: componentId_1,
                            usn: {
                                in: usns
                            }
                        }
                    })];
            case 3:
                existingMarks_1 = _b.sent();
                existingUsns_1 = existingMarks_1.map(function (mark) { return mark.usn; });
                updates = marks.filter(function (mark) { return existingUsns_1.includes(mark.usn); })
                    .map(function (mark) {
                    var existingMark = existingMarks_1.find(function (em) { return em.usn === mark.usn; });
                    return index_1.prisma.studentComponentMark.update({
                        where: { id: existingMark.id },
                        data: { marksObtained: mark.marksObtained }
                    });
                });
                inserts = marks.filter(function (mark) { return !existingUsns_1.includes(mark.usn); })
                    .map(function (mark) {
                    return index_1.prisma.studentComponentMark.create({
                        data: {
                            usn: mark.usn,
                            componentId: componentId_1,
                            marksObtained: mark.marksObtained
                        }
                    });
                });
                return [4 /*yield*/, index_1.prisma.$transaction(__spreadArray(__spreadArray([], updates, true), inserts, true))];
            case 4:
                result = _b.sent();
                res.json({
                    success: true,
                    message: "Successfully processed ".concat(result.length, " marks (").concat(updates.length, " updated, ").concat(inserts.length, " inserted)"),
                    data: {
                        componentId: componentId_1,
                        updatedCount: updates.length,
                        insertedCount: inserts.length,
                        totalCount: result.length
                    }
                });
                return [3 /*break*/, 6];
            case 5:
                error_5 = _b.sent();
                console.error('Bulk upload marks error:', error_5);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.bulkUploadMarks = bulkUploadMarks;
/**
 * Get marks for a student
 */
var getStudentMarks = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var usn, _a, subjectId, academicYear, semester, student, subjectFilterConditions, subjects, marksData, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                usn = req.params.usn;
                _a = req.query, subjectId = _a.subjectId, academicYear = _a.academicYear, semester = _a.semester;
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
                                }
                            }
                        }
                    })];
            case 1:
                student = _b.sent();
                if (!student) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        })];
                }
                subjectFilterConditions = {};
                if (subjectId) {
                    subjectFilterConditions.id = parseInt(subjectId);
                }
                if (semester) {
                    subjectFilterConditions.semester = parseInt(semester);
                }
                return [4 /*yield*/, index_1.prisma.subject.findMany({
                        where: __assign(__assign({}, subjectFilterConditions), { departmentId: student.departmentId }),
                        include: {
                            examComponents: {
                                include: {
                                    studentMarks: {
                                        where: {
                                            usn: student.usn
                                        }
                                    }
                                }
                            }
                        }
                    })];
            case 2:
                subjects = _b.sent();
                marksData = subjects.map(function (subject) {
                    // Calculate total and percentage for each subject
                    var totalMarksObtained = 0;
                    var totalMaxMarks = 0;
                    var componentMarks = subject.examComponents.map(function (component) {
                        var studentMark = component.studentMarks[0] || null;
                        var marksObtained = studentMark ? studentMark.marksObtained : 0;
                        totalMarksObtained += marksObtained;
                        totalMaxMarks += component.maxMarks;
                        return {
                            component: {
                                id: component.id,
                                name: component.name,
                                type: component.componentType,
                                maxMarks: component.maxMarks
                            },
                            mark: studentMark ? {
                                id: studentMark.id,
                                marksObtained: studentMark.marksObtained,
                                percentage: (studentMark.marksObtained / component.maxMarks) * 100
                            } : null
                        };
                    });
                    var percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
                    return {
                        subject: {
                            id: subject.id,
                            code: subject.code,
                            name: subject.name,
                            semester: subject.semester
                        },
                        components: componentMarks,
                        summary: {
                            totalObtained: totalMarksObtained,
                            totalMaxMarks: totalMaxMarks,
                            percentage: parseFloat(percentage.toFixed(2))
                        }
                    };
                });
                res.json({
                    success: true,
                    data: {
                        student: {
                            usn: student.usn,
                            name: "".concat(student.firstName, " ").concat(student.middleName ? student.middleName + ' ' : '').concat(student.lastName),
                            department: student.department,
                            semester: student.semester,
                            section: student.section,
                            batch: student.batch
                        },
                        marks: marksData
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                console.error('Get student marks error:', error_6);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getStudentMarks = getStudentMarks;
// New function to get all marks for a specific component
var getComponentMarks = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var componentId, componentIdNum, component, marks, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                componentId = req.params.componentId;
                componentIdNum = parseInt(componentId);
                if (isNaN(componentIdNum)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid component ID'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.examComponent.findUnique({
                        where: { id: componentIdNum }
                    })];
            case 1:
                component = _a.sent();
                if (!component) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Exam component not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.studentComponentMark.findMany({
                        where: { componentId: componentIdNum },
                        include: {
                            student: {
                                select: {
                                    usn: true,
                                    firstName: true,
                                    lastName: true,
                                    section: true
                                }
                            }
                        },
                        orderBy: {
                            student: {
                                usn: 'asc' // Order by USN
                            }
                        }
                    })];
            case 2:
                marks = _a.sent();
                res.json({
                    success: true,
                    data: marks
                });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                console.error('Get component marks error:', error_7);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getComponentMarks = getComponentMarks;
/**
 * Generate and download an Excel template for marks entry
 */
var downloadMarksTemplate = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var componentId, componentIdNum, component, students, workbook, worksheet_1, columns_1, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                componentId = req.params.componentId;
                componentIdNum = parseInt(componentId);
                if (isNaN(componentIdNum)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid component ID'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.examComponent.findUnique({
                        where: { id: componentIdNum },
                        include: {
                            subject: {
                                select: {
                                    id: true,
                                    semester: true,
                                    departmentId: true,
                                    // Need section info, maybe from faculty mapping?
                                    // For now, get all students in the semester/dept
                                }
                            },
                            iaConfigs: true // Fetch IA configs if they exist
                        }
                    })];
            case 1:
                component = _a.sent();
                if (!component) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Exam component not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.student.findMany({
                        where: {
                            semester: component.subject.semester,
                            departmentId: component.subject.departmentId
                            // section: component.subject.section // Add section if available
                        },
                        select: {
                            usn: true,
                            firstName: true,
                            lastName: true
                        },
                        orderBy: { usn: 'asc' }
                    })];
            case 2:
                students = _a.sent();
                workbook = new ExcelJS.Workbook();
                worksheet_1 = workbook.addWorksheet('Marks Entry');
                columns_1 = [
                    { header: 'USN', key: 'usn', width: 15 },
                    { header: 'Name', key: 'name', width: 30 },
                ];
                // Add component-specific columns
                if (component.componentType === 'CIE' && component.iaConfigs.length > 0) {
                    // Sort configs for consistent column order
                    component.iaConfigs.sort(function (a, b) {
                        if (a.questionNumber !== b.questionNumber) {
                            return a.questionNumber - b.questionNumber;
                        }
                        return (a.subpart || '').localeCompare(b.subpart || '');
                    });
                    component.iaConfigs.forEach(function (config) {
                        var header = "Q".concat(config.questionNumber).concat(config.subpart || '', " (Max: ").concat(config.maxMarks, ")");
                        var key = "q".concat(config.questionNumber).concat(config.subpart || '');
                        columns_1.push({ header: header, key: key, width: 15 });
                    });
                }
                // TODO: Handle Assignment components if they have specific structures?
                // else if (component.componentType === 'Assignment') { ... }
                else {
                    // Simple component: just one marks column
                    columns_1.push({ header: "Marks (Max: ".concat(component.maxMarks, ")"), key: 'marks', width: 20 });
                }
                worksheet_1.columns = columns_1;
                // Add student rows
                students.forEach(function (student) {
                    worksheet_1.addRow({
                        usn: student.usn,
                        name: "".concat(student.firstName, " ").concat(student.lastName || '').trim(),
                        // Initialize marks columns as empty
                    });
                });
                // Style header row
                worksheet_1.getRow(1).font = { bold: true };
                worksheet_1.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
                worksheet_1.getRow(1).eachCell(function (cell) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' } // Light grey background
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
                // Set response headers for Excel download
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', "attachment; filename=Marks_Template_".concat(component.subject.code, "_").concat(component.name, ".xlsx"));
                // Write workbook to response stream
                return [4 /*yield*/, workbook.xlsx.write(res)];
            case 3:
                // Write workbook to response stream
                _a.sent();
                res.end();
                return [3 /*break*/, 5];
            case 4:
                error_8 = _a.sent();
                console.error('Download marks template error:', error_8);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error while generating template'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.downloadMarksTemplate = downloadMarksTemplate;

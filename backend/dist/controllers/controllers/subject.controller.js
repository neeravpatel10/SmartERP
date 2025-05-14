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
exports.getStudentsBySubject = exports.updateSubjectStatus = exports.deleteSubject = exports.checkFacultySubjectAccess = exports.approveRejectFacultyMapping = exports.updateFacultySubjectMapping = exports.deleteFacultySubjectMapping = exports.getFacultySubjectMappings = exports.createFacultySubjectMapping = exports.getSubjectById = exports.getSubjects = exports.updateSubject = exports.createSubject = void 0;
var index_1 = require("../index");
var createSubject = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, code, name_1, semester, credits, isLab, departmentId, categoryId, existingSubject, department, category, subject, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, code = _a.code, name_1 = _a.name, semester = _a.semester, credits = _a.credits, isLab = _a.isLab, departmentId = _a.departmentId, categoryId = _a.categoryId;
                return [4 /*yield*/, index_1.prisma.subject.findUnique({
                        where: { code: code }
                    })];
            case 1:
                existingSubject = _b.sent();
                if (existingSubject) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Subject code already exists'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.department.findUnique({
                        where: { id: departmentId }
                    })];
            case 2:
                department = _b.sent();
                if (!department) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Department not found'
                        })];
                }
                if (!categoryId) return [3 /*break*/, 4];
                return [4 /*yield*/, index_1.prisma.subjectCategory.findUnique({
                        where: { id: categoryId }
                    })];
            case 3:
                category = _b.sent();
                if (!category) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Subject category not found'
                        })];
                }
                _b.label = 4;
            case 4: return [4 /*yield*/, index_1.prisma.subject.create({
                    data: {
                        code: code,
                        name: name_1,
                        semester: semester,
                        credits: credits,
                        isLab: isLab || false,
                        departmentId: departmentId,
                        categoryId: categoryId
                    },
                    include: {
                        department: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        },
                        category: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                })];
            case 5:
                subject = _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'Subject created successfully',
                    data: subject
                });
                return [3 /*break*/, 7];
            case 6:
                error_1 = _b.sent();
                console.error('Create subject error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.createSubject = createSubject;
var updateSubject = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, code, name_2, semester, credits, isLab, departmentId, categoryId, existingSubject, duplicateSubject, department, category, updatedSubject, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 9, , 10]);
                id = req.params.id;
                _a = req.body, code = _a.code, name_2 = _a.name, semester = _a.semester, credits = _a.credits, isLab = _a.isLab, departmentId = _a.departmentId, categoryId = _a.categoryId;
                return [4 /*yield*/, index_1.prisma.subject.findUnique({
                        where: { id: parseInt(id) }
                    })];
            case 1:
                existingSubject = _b.sent();
                if (!existingSubject) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                if (!(code && code !== existingSubject.code)) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.prisma.subject.findUnique({
                        where: { code: code }
                    })];
            case 2:
                duplicateSubject = _b.sent();
                if (duplicateSubject) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Subject code already exists'
                        })];
                }
                _b.label = 3;
            case 3:
                if (!departmentId) return [3 /*break*/, 5];
                return [4 /*yield*/, index_1.prisma.department.findUnique({
                        where: { id: departmentId }
                    })];
            case 4:
                department = _b.sent();
                if (!department) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Department not found'
                        })];
                }
                _b.label = 5;
            case 5:
                if (!(categoryId && categoryId !== null)) return [3 /*break*/, 7];
                return [4 /*yield*/, index_1.prisma.subjectCategory.findUnique({
                        where: { id: categoryId }
                    })];
            case 6:
                category = _b.sent();
                if (!category) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Subject category not found'
                        })];
                }
                _b.label = 7;
            case 7: return [4 /*yield*/, index_1.prisma.subject.update({
                    where: { id: parseInt(id) },
                    data: {
                        code: code,
                        name: name_2,
                        semester: semester,
                        credits: credits,
                        isLab: isLab,
                        departmentId: departmentId,
                        categoryId: categoryId
                    },
                    include: {
                        department: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        },
                        category: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                })];
            case 8:
                updatedSubject = _b.sent();
                res.json({
                    success: true,
                    message: 'Subject updated successfully',
                    data: updatedSubject
                });
                return [3 /*break*/, 10];
            case 9:
                error_2 = _b.sent();
                console.error('Update subject error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.updateSubject = updateSubject;
var getSubjects = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, page, _c, limit, _d, search, departmentId, semester, pageNumber, limitNumber, filterConditions, searchCondition, whereCondition, total, subjects, error_3;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c, _d = _a.search, search = _d === void 0 ? '' : _d, departmentId = _a.departmentId, semester = _a.semester;
                pageNumber = parseInt(page);
                limitNumber = parseInt(limit);
                filterConditions = {};
                if (departmentId) {
                    filterConditions.departmentId = parseInt(departmentId);
                }
                if (semester) {
                    filterConditions.semester = parseInt(semester);
                }
                searchCondition = search ? {
                    OR: [
                        { name: { contains: search } },
                        { code: { contains: search } }
                    ]
                } : {};
                whereCondition = __assign(__assign({}, filterConditions), searchCondition);
                return [4 /*yield*/, index_1.prisma.subject.count({
                        where: whereCondition
                    })];
            case 1:
                total = _e.sent();
                return [4 /*yield*/, index_1.prisma.subject.findMany({
                        where: whereCondition,
                        include: {
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            },
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            },
                            attendancesession: true,
                            examcomponent: true,
                            facultysubjectmapping: true,
                            mark: true,
                            subjectstatuslog: true,
                            _count: true
                        },
                        skip: (pageNumber - 1) * limitNumber,
                        take: limitNumber,
                        orderBy: {
                            name: 'asc'
                        }
                    })];
            case 2:
                subjects = _e.sent();
                res.json({
                    success: true,
                    data: {
                        subjects: subjects,
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
                error_3 = _e.sent();
                console.error('Get subjects error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getSubjects = getSubjects;
var getSubjectById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, subjectId, subject, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                subjectId = parseInt(id);
                // Validate if id is a valid number
                if (isNaN(subjectId)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid subject ID'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.subject.findUnique({
                        where: {
                            id: subjectId
                        },
                        include: {
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            },
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            },
                            facultyMappings: {
                                include: {
                                    faculty: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                            designation: true
                                        }
                                    },
                                    batch: {
                                        select: {
                                            id: true,
                                            name: true,
                                            startYear: true,
                                            endYear: true
                                        }
                                    }
                                }
                            }
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
                res.json({
                    success: true,
                    data: subject
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Get subject by ID error:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getSubjectById = getSubjectById;
// Faculty-Subject Mapping operations
var createFacultySubjectMapping = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, facultyId, subjectId, section, semester, batchId, academicYear, componentScope, isPrimary, active, userId, userRole, faculty, subject, batch, status_1, approvedBy, approvedAt, user, existingMapping, updatedMapping, mapping, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 14, , 15]);
                _a = req.body, facultyId = _a.facultyId, subjectId = _a.subjectId, section = _a.section, semester = _a.semester, batchId = _a.batchId, academicYear = _a.academicYear, componentScope = _a.componentScope, isPrimary = _a.isPrimary, active = _a.active;
                userId = req.user.id;
                userRole = req.user.loginType;
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: facultyId },
                        include: {
                            department: true
                        }
                    })];
            case 1:
                faculty = _b.sent();
                if (!faculty) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Faculty not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.subject.findUnique({
                        where: { id: subjectId },
                        include: {
                            department: true
                        }
                    })];
            case 2:
                subject = _b.sent();
                if (!subject) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.batch.findUnique({
                        where: { id: batchId }
                    })];
            case 3:
                batch = _b.sent();
                if (!batch) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Batch not found'
                        })];
                }
                status_1 = 'pending';
                approvedBy = null;
                approvedAt = null;
                if (!(userRole === 1)) return [3 /*break*/, 4];
                status_1 = 'approved';
                approvedBy = userId;
                approvedAt = new Date();
                return [3 /*break*/, 6];
            case 4:
                if (!(userRole === 3)) return [3 /*break*/, 6];
                return [4 /*yield*/, index_1.prisma.user.findUnique({
                        where: { id: userId },
                        include: { faculty: true }
                    })];
            case 5:
                user = _b.sent();
                if ((user === null || user === void 0 ? void 0 : user.faculty) && user.faculty.departmentId === faculty.departmentId &&
                    faculty.departmentId === subject.departmentId) {
                    status_1 = 'approved';
                    approvedBy = userId;
                    approvedAt = new Date();
                }
                _b.label = 6;
            case 6: return [4 /*yield*/, index_1.prisma.facultySubjectMapping.findFirst({
                    where: {
                        facultyId: facultyId,
                        subjectId: subjectId,
                        section: section,
                        academicYear: academicYear
                    }
                })];
            case 7:
                existingMapping = _b.sent();
                if (!existingMapping) return [3 /*break*/, 10];
                if (!(existingMapping.active === false)) return [3 /*break*/, 9];
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.update({
                        where: { id: existingMapping.id },
                        data: {
                            componentScope: componentScope || 'theory',
                            isPrimary: isPrimary !== undefined ? isPrimary : true,
                            active: true,
                            status: status_1,
                            approvedBy: approvedBy,
                            approvedAt: approvedAt
                        },
                        include: {
                            faculty: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    department: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            },
                            subject: {
                                select: {
                                    id: true,
                                    code: true,
                                    name: true
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
            case 8:
                updatedMapping = _b.sent();
                return [2 /*return*/, res.json({
                        success: true,
                        message: 'Faculty-subject mapping reactivated successfully',
                        data: updatedMapping
                    })];
            case 9: return [2 /*return*/, res.status(400).json({
                    success: false,
                    message: 'Faculty-subject mapping already exists'
                })];
            case 10:
                if (!(isPrimary === true)) return [3 /*break*/, 12];
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.updateMany({
                        where: {
                            subjectId: subjectId,
                            section: section,
                            academicYear: academicYear,
                            componentScope: componentScope || 'theory'
                        },
                        data: {
                            isPrimary: false
                        }
                    })];
            case 11:
                _b.sent();
                _b.label = 12;
            case 12: return [4 /*yield*/, index_1.prisma.facultySubjectMapping.create({
                    data: {
                        facultyId: facultyId,
                        subjectId: subjectId,
                        section: section,
                        semester: semester,
                        batchId: batchId,
                        academicYear: academicYear,
                        componentScope: componentScope || 'theory',
                        isPrimary: isPrimary !== undefined ? isPrimary : true,
                        active: active !== undefined ? active : true,
                        status: status_1,
                        approvedBy: approvedBy,
                        approvedAt: approvedAt
                    },
                    include: {
                        faculty: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        },
                        subject: {
                            select: {
                                id: true,
                                code: true,
                                name: true
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
            case 13:
                mapping = _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'Faculty-subject mapping created successfully',
                    data: mapping
                });
                return [3 /*break*/, 15];
            case 14:
                error_5 = _b.sent();
                console.error('Create faculty-subject mapping error:', error_5);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 15];
            case 15: return [2 /*return*/];
        }
    });
}); };
exports.createFacultySubjectMapping = createFacultySubjectMapping;
var getFacultySubjectMappings = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, facultyId, subjectId, semester, section, batchId, academicYear, componentScope, _b, active, filterConditions, mappings, error_6;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.query, facultyId = _a.facultyId, subjectId = _a.subjectId, semester = _a.semester, section = _a.section, batchId = _a.batchId, academicYear = _a.academicYear, componentScope = _a.componentScope, _b = _a.active, active = _b === void 0 ? 'true' : _b;
                filterConditions = {};
                if (facultyId) {
                    filterConditions.facultyId = parseInt(facultyId);
                }
                if (subjectId) {
                    filterConditions.subjectId = parseInt(subjectId);
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
                if (academicYear) {
                    filterConditions.academicYear = academicYear;
                }
                if (componentScope) {
                    filterConditions.componentScope = componentScope;
                }
                // Handle active status filtering
                if (active !== undefined) {
                    filterConditions.active = active === 'true';
                }
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.findMany({
                        where: filterConditions,
                        include: {
                            faculty: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    department: {
                                        select: {
                                            id: true,
                                            name: true,
                                            code: true
                                        }
                                    }
                                }
                            },
                            subject: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    semester: true,
                                    credits: true,
                                    isLab: true,
                                    category: {
                                        select: {
                                            id: true,
                                            name: true,
                                            code: true
                                        }
                                    }
                                }
                            },
                            batch: {
                                select: {
                                    id: true,
                                    name: true,
                                    startYear: true,
                                    endYear: true
                                }
                            }
                        },
                        orderBy: [
                            { subjectId: 'asc' },
                            { facultyId: 'asc' }
                        ]
                    })];
            case 1:
                mappings = _c.sent();
                res.json({
                    success: true,
                    count: mappings.length,
                    data: mappings
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _c.sent();
                console.error('Get faculty-subject mappings error:', error_6);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getFacultySubjectMappings = getFacultySubjectMappings;
var deleteFacultySubjectMapping = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, mapping, deactivatedMapping, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.findUnique({
                        where: { id: parseInt(id) }
                    })];
            case 1:
                mapping = _a.sent();
                if (!mapping) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Faculty-subject mapping not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.update({
                        where: { id: parseInt(id) },
                        data: { active: false }
                    })];
            case 2:
                deactivatedMapping = _a.sent();
                res.json({
                    success: true,
                    message: 'Faculty-subject mapping deactivated successfully',
                    data: deactivatedMapping
                });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                console.error('Delete faculty-subject mapping error:', error_7);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteFacultySubjectMapping = deleteFacultySubjectMapping;
// Update faculty-subject mapping
var updateFacultySubjectMapping = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, componentScope, isPrimary, active, mapping, updatedMapping, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                id = req.params.id;
                _a = req.body, componentScope = _a.componentScope, isPrimary = _a.isPrimary, active = _a.active;
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.findUnique({
                        where: { id: parseInt(id) }
                    })];
            case 1:
                mapping = _b.sent();
                if (!mapping) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Faculty-subject mapping not found'
                        })];
                }
                if (!(isPrimary === true)) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.updateMany({
                        where: {
                            subjectId: mapping.subjectId,
                            section: mapping.section,
                            academicYear: mapping.academicYear,
                            componentScope: componentScope || mapping.componentScope,
                            id: { not: parseInt(id) }
                        },
                        data: {
                            isPrimary: false
                        }
                    })];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3: return [4 /*yield*/, index_1.prisma.facultySubjectMapping.update({
                    where: { id: parseInt(id) },
                    data: {
                        componentScope: componentScope,
                        isPrimary: isPrimary,
                        active: active,
                        // When updated, reset to pending status unless it's by an admin
                        status: 'pending',
                        approvedBy: null,
                        approvedAt: null
                    },
                    include: {
                        faculty: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        subject: {
                            select: {
                                id: true,
                                code: true,
                                name: true
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
            case 4:
                updatedMapping = _b.sent();
                res.json({
                    success: true,
                    message: 'Faculty-subject mapping updated successfully',
                    data: updatedMapping
                });
                return [3 /*break*/, 6];
            case 5:
                error_8 = _b.sent();
                console.error('Update faculty-subject mapping error:', error_8);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.updateFacultySubjectMapping = updateFacultySubjectMapping;
/**
 * Approve or reject a faculty-subject mapping
 */
var approveRejectFacultyMapping = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, status_2, rejectionReason, userId, userRole, mapping, user, updatedMapping, error_9;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                id = req.params.id;
                _a = req.body, status_2 = _a.status, rejectionReason = _a.rejectionReason;
                userId = req.user.id;
                userRole = req.user.loginType;
                // Ensure only Dept Admin (3) or Super Admin (1) can approve/reject
                if (userRole !== 1 && userRole !== 3) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Unauthorized. Only department admins or super admins can approve mappings.'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.findUnique({
                        where: { id: parseInt(id) },
                        include: {
                            faculty: {
                                include: {
                                    department: true
                                }
                            },
                            subject: {
                                include: {
                                    department: true
                                }
                            }
                        }
                    })];
            case 1:
                mapping = _b.sent();
                if (!mapping) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Faculty-subject mapping not found'
                        })];
                }
                if (!(userRole === 3)) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.prisma.user.findUnique({
                        where: { id: userId },
                        include: { faculty: true }
                    })];
            case 2:
                user = _b.sent();
                if (!(user === null || user === void 0 ? void 0 : user.faculty) || user.faculty.departmentId !== mapping.faculty.departmentId) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Unauthorized. You can only approve mappings in your department.'
                        })];
                }
                _b.label = 3;
            case 3:
                // Validate status
                if (status_2 !== 'approved' && status_2 !== 'rejected') {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Status must be either "approved" or "rejected"'
                        })];
                }
                // If rejecting, ensure reason is provided
                if (status_2 === 'rejected' && !rejectionReason) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Rejection reason is required when rejecting a mapping'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.update({
                        where: { id: parseInt(id) },
                        data: {
                            status: status_2,
                            approvedBy: userId,
                            approvedAt: new Date(),
                            rejectionReason: status_2 === 'rejected' ? rejectionReason : null
                        },
                        include: {
                            faculty: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    department: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            },
                            subject: {
                                select: {
                                    id: true,
                                    code: true,
                                    name: true
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
            case 4:
                updatedMapping = _b.sent();
                res.json({
                    success: true,
                    message: "Faculty-subject mapping ".concat(status_2 === 'approved' ? 'approved' : 'rejected', " successfully"),
                    data: updatedMapping
                });
                return [3 /*break*/, 6];
            case 5:
                error_9 = _b.sent();
                console.error('Approve/reject faculty-subject mapping error:', error_9);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.approveRejectFacultyMapping = approveRejectFacultyMapping;
var checkFacultySubjectAccess = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, facultyId, subjectId, componentScope, section, academicYear, mapping, error_10;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, facultyId = _a.facultyId, subjectId = _a.subjectId, componentScope = _a.componentScope, section = _a.section, academicYear = _a.academicYear;
                // Validate required fields
                if (!facultyId || !subjectId || !componentScope) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Faculty ID, Subject ID, and Component Scope are required'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.findFirst({
                        where: {
                            facultyId: parseInt(facultyId),
                            subjectId: parseInt(subjectId),
                            section: section,
                            academicYear: academicYear,
                            active: true,
                            OR: [
                                { componentScope: componentScope },
                                { componentScope: 'both' }
                            ]
                        }
                    })];
            case 1:
                mapping = _b.sent();
                if (!mapping) {
                    return [2 /*return*/, res.json({
                            success: true,
                            hasAccess: false,
                            message: 'Faculty does not have access to this subject component'
                        })];
                }
                // Faculty has access
                return [2 /*return*/, res.json({
                        success: true,
                        hasAccess: true,
                        isPrimary: mapping.isPrimary,
                        message: 'Faculty has access to this subject component',
                        data: mapping
                    })];
            case 2:
                error_10 = _b.sent();
                console.error('Check faculty-subject access error:', error_10);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.checkFacultySubjectAccess = checkFacultySubjectAccess;
// Add deleteSubject function
var deleteSubject = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, subjectId, existingSubject, updatedSubject, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                subjectId = parseInt(id);
                return [4 /*yield*/, index_1.prisma.subject.findUnique({
                        where: { id: subjectId },
                    })];
            case 1:
                existingSubject = _a.sent();
                if (!existingSubject) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found',
                        })];
                }
                return [4 /*yield*/, index_1.prisma.subject.update({
                        where: { id: subjectId },
                        data: { active: false }, // Assuming an 'active' field exists
                    })];
            case 2:
                updatedSubject = _a.sent();
                res.json({
                    success: true,
                    message: 'Subject deactivated successfully', // Changed message
                    data: updatedSubject // Optionally return the updated subject
                });
                return [3 /*break*/, 4];
            case 3:
                error_11 = _a.sent();
                // Error handling can be simplified as foreign key constraints 
                // are less likely with soft delete, unless the relation itself requires an active subject.
                console.error('Deactivate subject error:', error_11);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteSubject = deleteSubject;
// Add updateSubjectStatus function
var updateSubjectStatus = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, status_3, updatedSubject, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                status_3 = req.body.status;
                // Validate status value if necessary (e.g., only 'active'/'inactive')
                if (typeof status_3 !== 'boolean') { // Example validation
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid status value provided.',
                        })];
                }
                return [4 /*yield*/, index_1.prisma.subject.update({
                        where: { id: parseInt(id) },
                        data: {
                            // Assuming a boolean 'active' field exists in the schema
                            active: status_3
                        },
                        include: {
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            },
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            }
                        }
                    })];
            case 1:
                updatedSubject = _a.sent();
                res.json({
                    success: true,
                    message: 'Subject status updated successfully',
                    data: updatedSubject
                });
                return [3 /*break*/, 3];
            case 2:
                error_12 = _a.sent();
                console.error('Update subject status error:', error_12);
                // Handle Prisma record not found error
                if (error_12.code === 'P2025') {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Subject not found' })];
                }
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateSubjectStatus = updateSubjectStatus;
// Add getStudentsBySubject function
var getStudentsBySubject = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, subjectId, subject, mappings, studentQueryConditions, students, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                id = req.params.id;
                subjectId = parseInt(id);
                return [4 /*yield*/, index_1.prisma.subject.findUnique({ where: { id: subjectId } })];
            case 1:
                subject = _a.sent();
                if (!subject) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Subject not found' })];
                }
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.findMany({
                        where: {
                            subjectId: subjectId,
                            active: true,
                            // Optionally filter by current academic year if available/needed
                            // academicYear: getCurrentAcademicYear(), 
                        },
                        select: {
                            batchId: true,
                            section: true,
                        },
                        distinct: ['batchId', 'section'] // Get unique batch/section combinations
                    })];
            case 2:
                mappings = _a.sent();
                if (mappings.length === 0) {
                    // No active mappings found for this subject
                    return [2 /*return*/, res.json({ success: true, data: [] })];
                }
                studentQueryConditions = mappings.map(function (mapping) { return ({
                    batchId: mapping.batchId,
                    section: mapping.section,
                    // Assuming student model has batchId and section
                }); });
                return [4 /*yield*/, index_1.prisma.student.findMany({
                        where: {
                            OR: studentQueryConditions,
                            // Add other relevant filters if needed (e.g., student status)
                            // isActive: true, 
                        },
                        select: {
                            id: true,
                            usn: true,
                            firstName: true,
                            lastName: true,
                            section: true, // Include section and batch for clarity
                            batch: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        },
                        orderBy: [
                            { batchId: 'asc' },
                            { section: 'asc' },
                            { usn: 'asc' }
                        ]
                    })];
            case 3:
                students = _a.sent();
                res.json({
                    success: true,
                    data: students
                });
                return [3 /*break*/, 5];
            case 4:
                error_13 = _a.sent();
                console.error('Get students by subject error:', error_13);
                res.status(500).json({ success: false, message: 'Internal server error' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getStudentsBySubject = getStudentsBySubject;

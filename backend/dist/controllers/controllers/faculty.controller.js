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
exports.bulkUploadFaculty = exports.getFacultySubjects = exports.getFacultyById = exports.getFaculty = exports.updateFaculty = exports.createFaculty = void 0;
var index_1 = require("../index");
var bcrypt_1 = require("bcrypt");
var createFaculty = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, prefix, email, phone, designation, gender, dateOfBirth, qualification, departmentId, teachingExperience, industryExperience, yearOfJoining, permanentAddress, presentAddress, aicteId, existingFacultyEmail, department, facultyCount, facultyId, faculty, username, defaultPassword, hashedPassword, user, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                _a = req.body, name_1 = _a.name, prefix = _a.prefix, email = _a.email, phone = _a.phone, designation = _a.designation, gender = _a.gender, dateOfBirth = _a.dateOfBirth, qualification = _a.qualification, departmentId = _a.departmentId, teachingExperience = _a.teachingExperience, industryExperience = _a.industryExperience, yearOfJoining = _a.yearOfJoining, permanentAddress = _a.permanentAddress, presentAddress = _a.presentAddress, aicteId = _a.aicteId;
                return [4 /*yield*/, index_1.prisma.faculty.findFirst({
                        where: { email: email }
                    })];
            case 1:
                existingFacultyEmail = _b.sent();
                if (existingFacultyEmail) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Faculty with this email already exists'
                        })];
                }
                if (!departmentId) return [3 /*break*/, 3];
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
                _b.label = 3;
            case 3: return [4 /*yield*/, index_1.prisma.faculty.count()];
            case 4:
                facultyCount = _b.sent();
                facultyId = "FAC".concat(String(facultyCount + 1).padStart(4, '0'));
                return [4 /*yield*/, index_1.prisma.faculty.create({
                        data: {
                            id: facultyId,
                            email: email,
                            phone: phone,
                            designation: designation,
                            gender: gender,
                            dateOfBirth: dateOfBirth,
                            qualification: qualification,
                            teachingExperience: teachingExperience,
                            industryExperience: industryExperience,
                            yearOfJoining: yearOfJoining,
                            permanentAddress: permanentAddress,
                            presentAddress: presentAddress,
                            aicteId: aicteId,
                            name: name_1,
                            prefix: prefix,
                            departmentId: departmentId,
                            isActive: true
                        },
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
            case 5:
                faculty = _b.sent();
                username = email.split('@')[0].toLowerCase();
                defaultPassword = "".concat(name_1 ? name_1.toLowerCase().replace(/\s+/g, '') : 'faculty').concat(departmentId || '', "@faculty");
                return [4 /*yield*/, bcrypt_1.default.hash(defaultPassword, 10)];
            case 6:
                hashedPassword = _b.sent();
                return [4 /*yield*/, index_1.prisma.user.create({
                        data: {
                            username: username,
                            email: email,
                            passwordHash: hashedPassword,
                            loginType: 2, // Faculty login type
                            departmentId: departmentId,
                            isActive: true,
                            firstLogin: true,
                            facultyAccount: {
                                connect: {
                                    id: faculty.id
                                }
                            }
                        },
                        select: {
                            id: true,
                            username: true,
                            loginType: true,
                            isActive: true,
                            firstLogin: true
                        }
                    })];
            case 7:
                user = _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'Faculty created successfully',
                    data: {
                        faculty: faculty,
                        user: user,
                        defaultPassword: defaultPassword
                    }
                });
                return [3 /*break*/, 9];
            case 8:
                error_1 = _b.sent();
                console.error('Create faculty error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.createFaculty = createFaculty;
var updateFaculty = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, name_2, prefix, email, phone, designation, gender, dateOfBirth, qualification, departmentId, teachingExperience, industryExperience, yearOfJoining, permanentAddress, presentAddress, aicteId, isActive, existingFaculty, duplicateEmail, department, updatedFaculty, user, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 10, , 11]);
                id = req.params.id;
                _a = req.body, name_2 = _a.name, prefix = _a.prefix, email = _a.email, phone = _a.phone, designation = _a.designation, gender = _a.gender, dateOfBirth = _a.dateOfBirth, qualification = _a.qualification, departmentId = _a.departmentId, teachingExperience = _a.teachingExperience, industryExperience = _a.industryExperience, yearOfJoining = _a.yearOfJoining, permanentAddress = _a.permanentAddress, presentAddress = _a.presentAddress, aicteId = _a.aicteId, isActive = _a.isActive;
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: id }
                    })];
            case 1:
                existingFaculty = _b.sent();
                if (!existingFaculty) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Faculty not found'
                        })];
                }
                if (!(email && email !== existingFaculty.email)) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.prisma.faculty.findFirst({
                        where: {
                            email: email,
                            id: { not: id }
                        }
                    })];
            case 2:
                duplicateEmail = _b.sent();
                if (duplicateEmail) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Email already in use by another faculty'
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
            case 5: return [4 /*yield*/, index_1.prisma.faculty.update({
                    where: { id: id },
                    data: {
                        name: name_2,
                        prefix: prefix,
                        email: email,
                        phone: phone,
                        designation: designation,
                        gender: gender,
                        dateOfBirth: dateOfBirth,
                        qualification: qualification,
                        teachingExperience: teachingExperience,
                        industryExperience: industryExperience,
                        yearOfJoining: yearOfJoining,
                        permanentAddress: permanentAddress,
                        presentAddress: presentAddress,
                        aicteId: aicteId,
                        departmentId: departmentId,
                        isActive: isActive !== undefined ? isActive : existingFaculty.isActive
                    },
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
            case 6:
                updatedFaculty = _b.sent();
                if (!(email && email !== existingFaculty.email)) return [3 /*break*/, 9];
                return [4 /*yield*/, index_1.prisma.user.findFirst({
                        where: {
                            OR: [
                                { username: existingFaculty.email.split('@')[0] },
                                { email: existingFaculty.email }
                            ]
                        }
                    })];
            case 7:
                user = _b.sent();
                if (!user) return [3 /*break*/, 9];
                return [4 /*yield*/, index_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            email: email,
                            username: email.split('@')[0]
                        }
                    })];
            case 8:
                _b.sent();
                _b.label = 9;
            case 9:
                res.json({
                    success: true,
                    message: 'Faculty updated successfully',
                    data: updatedFaculty
                });
                return [3 /*break*/, 11];
            case 10:
                error_2 = _b.sent();
                console.error('Update faculty error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.updateFaculty = updateFaculty;
var getFaculty = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, page, _c, limit, _d, search, departmentId, pageNumber, limitNumber, whereCondition, faculty_1, facultyList_1, total, faculty, facultyList, error_3;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 5, , 6]);
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c, _d = _a.search, search = _d === void 0 ? '' : _d, departmentId = _a.departmentId;
                pageNumber = parseInt(page);
                limitNumber = parseInt(limit);
                whereCondition = {};
                if (search) {
                    whereCondition.OR = [
                        { name: { contains: search } },
                        { email: { contains: search } },
                        { phone: { contains: search } },
                        { designation: { contains: search } }
                    ];
                }
                if (!departmentId) return [3 /*break*/, 2];
                whereCondition.departmentId = parseInt(departmentId);
                return [4 /*yield*/, index_1.prisma.faculty.findMany({
                        where: whereCondition,
                        include: {
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            }
                        },
                        orderBy: {
                            name: 'asc'
                        }
                    })];
            case 1:
                faculty_1 = _e.sent();
                facultyList_1 = faculty_1.map(function (f) {
                    var _a = (f.name || '').split(' '), firstName = _a[0], rest = _a.slice(1);
                    var lastName = rest.join(' ');
                    return __assign(__assign({}, f), { firstName: firstName, lastName: lastName });
                });
                return [2 /*return*/, res.json({
                        success: true,
                        data: {
                            faculty: facultyList_1,
                            pagination: {
                                total: faculty_1.length,
                                page: 1,
                                limit: faculty_1.length,
                                totalPages: 1
                            }
                        }
                    })];
            case 2: return [4 /*yield*/, index_1.prisma.faculty.count({
                    where: whereCondition
                })];
            case 3:
                total = _e.sent();
                return [4 /*yield*/, index_1.prisma.faculty.findMany({
                        where: whereCondition,
                        include: {
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            }
                        },
                        skip: (pageNumber - 1) * limitNumber,
                        take: limitNumber,
                        orderBy: {
                            name: 'asc'
                        }
                    })];
            case 4:
                faculty = _e.sent();
                facultyList = faculty.map(function (f) {
                    var _a = (f.name || '').split(' '), firstName = _a[0], rest = _a.slice(1);
                    var lastName = rest.join(' ');
                    return __assign(__assign({}, f), { firstName: firstName, lastName: lastName });
                });
                res.json({
                    success: true,
                    data: {
                        faculty: facultyList,
                        pagination: {
                            total: total,
                            page: pageNumber,
                            limit: limitNumber,
                            totalPages: Math.ceil(total / limitNumber)
                        }
                    }
                });
                return [3 /*break*/, 6];
            case 5:
                error_3 = _e.sent();
                console.error('Get faculty error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getFaculty = getFaculty;
var getFacultyById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, faculty, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: id },
                        include: {
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            },
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                    isActive: true,
                                    loginType: true
                                }
                            },
                            subjectMappings: {
                                include: {
                                    subject: true,
                                    batch: true
                                }
                            }
                        }
                    })];
            case 1:
                faculty = _a.sent();
                if (!faculty) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Faculty not found'
                        })];
                }
                res.json({
                    success: true,
                    data: faculty
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Get faculty by ID error:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getFacultyById = getFacultyById;
var getFacultySubjects = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, faculty, subjectMappings, groupedByYear_1, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: id },
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    })];
            case 1:
                faculty = _a.sent();
                if (!faculty) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Faculty not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.findMany({
                        where: {
                            facultyId: id,
                            active: true
                        },
                        include: {
                            subject: {
                                select: {
                                    id: true,
                                    code: true,
                                    name: true,
                                    semester: true,
                                    credits: true,
                                    isLab: true
                                }
                            },
                            batch: {
                                select: {
                                    id: true,
                                    name: true,
                                    academicYear: true,
                                    currentSemester: true
                                }
                            }
                        },
                        orderBy: [
                            { academicYear: 'desc' },
                            { subject: { name: 'asc' } }
                        ]
                    })];
            case 2:
                subjectMappings = _a.sent();
                groupedByYear_1 = {};
                subjectMappings.forEach(function (mapping) {
                    if (!groupedByYear_1[mapping.academicYear]) {
                        groupedByYear_1[mapping.academicYear] = [];
                    }
                    groupedByYear_1[mapping.academicYear].push({
                        id: mapping.id,
                        subject: mapping.subject,
                        batch: mapping.batch,
                        section: mapping.section,
                        semester: mapping.semester,
                        isPrimary: mapping.isPrimary
                    });
                });
                res.json({
                    success: true,
                    data: {
                        faculty: faculty,
                        subjectsByYear: groupedByYear_1
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                console.error('Get faculty subjects error:', error_5);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getFacultySubjects = getFacultySubjects;
var bulkUploadFaculty = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var facultyData, results, _i, facultyData_1, faculty, name_3, email, phone, designation, departmentCode, qualification, department, existingFaculty, facultyCount, id, createdFaculty, username, defaultPassword, hashedPassword, error_6, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 12, , 13]);
                facultyData = req.body.facultyData;
                if (!Array.isArray(facultyData) || facultyData.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'No faculty data provided or invalid format'
                        })];
                }
                results = {
                    success: [],
                    errors: []
                };
                _i = 0, facultyData_1 = facultyData;
                _a.label = 1;
            case 1:
                if (!(_i < facultyData_1.length)) return [3 /*break*/, 11];
                faculty = facultyData_1[_i];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 9, , 10]);
                name_3 = faculty.name, email = faculty.email, phone = faculty.phone, designation = faculty.designation, departmentCode = faculty.departmentCode, qualification = faculty.qualification;
                // Validate required fields
                if (!email || !departmentCode) {
                    results.errors.push({
                        email: email || 'Unknown',
                        error: 'Missing required fields: email or departmentCode'
                    });
                    return [3 /*break*/, 10];
                }
                return [4 /*yield*/, index_1.prisma.department.findUnique({
                        where: { code: departmentCode }
                    })];
            case 3:
                department = _a.sent();
                if (!department) {
                    results.errors.push({
                        email: email,
                        error: "Department with code ".concat(departmentCode, " not found")
                    });
                    return [3 /*break*/, 10];
                }
                return [4 /*yield*/, index_1.prisma.faculty.findFirst({
                        where: { email: email }
                    })];
            case 4:
                existingFaculty = _a.sent();
                if (existingFaculty) {
                    results.errors.push({
                        email: email,
                        error: 'Faculty with this email already exists'
                    });
                    return [3 /*break*/, 10];
                }
                return [4 /*yield*/, index_1.prisma.faculty.count()];
            case 5:
                facultyCount = _a.sent();
                id = "FAC".concat(String(facultyCount + 1).padStart(4, '0'));
                return [4 /*yield*/, index_1.prisma.faculty.create({
                        data: {
                            id: id,
                            email: email,
                            phone: phone,
                            designation: designation,
                            qualification: qualification,
                            name: name_3,
                            departmentId: department.id,
                            isActive: true
                        }
                    })];
            case 6:
                createdFaculty = _a.sent();
                username = email.split('@')[0].toLowerCase();
                defaultPassword = "".concat(name_3 ? name_3.toLowerCase().replace(/\s+/g, '') : 'faculty').concat(department.id, "@faculty");
                return [4 /*yield*/, bcrypt_1.default.hash(defaultPassword, 10)];
            case 7:
                hashedPassword = _a.sent();
                return [4 /*yield*/, index_1.prisma.user.create({
                        data: {
                            username: username,
                            email: email,
                            passwordHash: hashedPassword,
                            loginType: 2, // Faculty login type
                            departmentId: department.id,
                            isActive: true,
                            firstLogin: true,
                            facultyAccount: {
                                connect: {
                                    id: createdFaculty.id
                                }
                            }
                        }
                    })];
            case 8:
                _a.sent();
                results.success.push({
                    id: createdFaculty.id,
                    name: name_3,
                    email: email,
                    defaultPassword: defaultPassword
                });
                return [3 /*break*/, 10];
            case 9:
                error_6 = _a.sent();
                console.error('Error creating faculty:', error_6);
                results.errors.push({
                    email: faculty.email || 'Unknown',
                    error: 'Internal error creating faculty'
                });
                return [3 /*break*/, 10];
            case 10:
                _i++;
                return [3 /*break*/, 1];
            case 11:
                res.status(200).json({
                    success: true,
                    message: "Successfully created ".concat(results.success.length, " faculty entries with ").concat(results.errors.length, " errors"),
                    data: results
                });
                return [3 /*break*/, 13];
            case 12:
                error_7 = _a.sent();
                console.error('Bulk upload faculty error:', error_7);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 13];
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.bulkUploadFaculty = bulkUploadFaculty;

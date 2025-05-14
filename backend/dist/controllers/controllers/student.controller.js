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
exports.deleteStudent = exports.exportStudentsToExcel = exports.importStudentsFromExcel = exports.bulkUploadStudents = exports.getStudentByUSN = exports.getStudents = exports.updateStudent = exports.getStudentsWithoutLogins = exports.createMultipleStudentLogins = exports.createStudentLogin = exports.createStudent = void 0;
var index_1 = require("../index");
var bcrypt_1 = require("bcrypt");
var exceljs_1 = require("exceljs");
var errors_1 = require("../utils/errors");
var validation_1 = require("../utils/validation");
var createStudent = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, usn, firstName, middleName, lastName, email, phone, dob, gender, address, batchId, departmentId, semester, section, admissionYear, fatherName, motherName, guardianName, guardianContact, existingStudentUSN, existingStudentEmail, batch, department, student, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, usn = _a.usn, firstName = _a.firstName, middleName = _a.middleName, lastName = _a.lastName, email = _a.email, phone = _a.phone, dob = _a.dob, gender = _a.gender, address = _a.address, batchId = _a.batchId, departmentId = _a.departmentId, semester = _a.semester, section = _a.section, admissionYear = _a.admissionYear, fatherName = _a.fatherName, motherName = _a.motherName, guardianName = _a.guardianName, guardianContact = _a.guardianContact;
                return [4 /*yield*/, index_1.prisma.student.findUnique({
                        where: { usn: usn }
                    })];
            case 1:
                existingStudentUSN = _b.sent();
                if (existingStudentUSN) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Student with this USN already exists'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.student.findFirst({
                        where: { email: email }
                    })];
            case 2:
                existingStudentEmail = _b.sent();
                if (existingStudentEmail) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Student with this email already exists'
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
                return [4 /*yield*/, index_1.prisma.student.create({
                        data: {
                            usn: usn,
                            firstName: firstName,
                            middleName: middleName,
                            lastName: lastName,
                            email: email,
                            phone: phone,
                            dob: dob ? new Date(dob) : undefined,
                            gender: gender,
                            address: address,
                            batchId: batchId,
                            departmentId: departmentId,
                            semester: semester,
                            section: section,
                            admissionYear: admissionYear,
                            fatherName: fatherName,
                            motherName: motherName,
                            guardianName: guardianName,
                            guardianContact: guardianContact
                        },
                        include: {
                            batch: {
                                select: {
                                    id: true,
                                    name: true,
                                    academicYear: true
                                }
                            },
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
                student = _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'Student created successfully',
                    data: {
                        student: student
                    }
                });
                return [3 /*break*/, 7];
            case 6:
                error_1 = _b.sent();
                console.error('Create student error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.createStudent = createStudent;
// New function to create login for a single student
var createStudentLogin = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var usn, student, existingUser, username, defaultPassword, hashedPassword, user, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                usn = req.params.usn;
                return [4 /*yield*/, index_1.prisma.student.findUnique({
                        where: { usn: usn }
                    })];
            case 1:
                student = _a.sent();
                if (!student) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        })];
                }
                // Check if student already has a user account
                if (student.userId) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Student already has a user account'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.user.findFirst({
                        where: { username: usn.toLowerCase() }
                    })];
            case 2:
                existingUser = _a.sent();
                if (existingUser) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Username already exists'
                        })];
                }
                username = usn.toLowerCase();
                defaultPassword = usn;
                return [4 /*yield*/, bcrypt_1.default.hash(defaultPassword, 10)];
            case 3:
                hashedPassword = _a.sent();
                return [4 /*yield*/, index_1.prisma.user.create({
                        data: {
                            username: username,
                            email: student.email || "".concat(username, "@placeholder.edu"),
                            passwordHash: hashedPassword,
                            loginType: -1, // Student login type
                            departmentId: student.departmentId,
                            isActive: true,
                            firstLogin: true,
                            student: {
                                connect: {
                                    usn: usn
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
            case 4:
                user = _a.sent();
                res.status(201).json({
                    success: true,
                    message: 'Student login created successfully',
                    data: {
                        user: user,
                        defaultPassword: defaultPassword // Include default password in the response
                    }
                });
                return [3 /*break*/, 6];
            case 5:
                error_2 = _a.sent();
                console.error('Create student login error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.createStudentLogin = createStudentLogin;
// New function to create multiple student logins at once
var createMultipleStudentLogins = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var studentIds, results, _i, studentIds_1, usn, student, existingUser, username, defaultPassword, hashedPassword, user, error_3, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                studentIds = req.body.studentIds;
                if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Please provide an array of student USNs'
                        })];
                }
                results = {
                    success: [],
                    failed: []
                };
                _i = 0, studentIds_1 = studentIds;
                _a.label = 1;
            case 1:
                if (!(_i < studentIds_1.length)) return [3 /*break*/, 9];
                usn = studentIds_1[_i];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 7, , 8]);
                return [4 /*yield*/, index_1.prisma.student.findUnique({
                        where: { usn: usn }
                    })];
            case 3:
                student = _a.sent();
                if (!student) {
                    results.failed.push({ usn: usn, reason: 'Student not found' });
                    return [3 /*break*/, 8];
                }
                // Check if student already has a user account
                if (student.userId) {
                    results.failed.push({ usn: usn, reason: 'Student already has a user account' });
                    return [3 /*break*/, 8];
                }
                return [4 /*yield*/, index_1.prisma.user.findFirst({
                        where: { username: usn.toLowerCase() }
                    })];
            case 4:
                existingUser = _a.sent();
                if (existingUser) {
                    results.failed.push({ usn: usn, reason: 'Username already exists' });
                    return [3 /*break*/, 8];
                }
                username = usn.toLowerCase();
                defaultPassword = usn;
                return [4 /*yield*/, bcrypt_1.default.hash(defaultPassword, 10)];
            case 5:
                hashedPassword = _a.sent();
                return [4 /*yield*/, index_1.prisma.user.create({
                        data: {
                            username: username,
                            email: student.email || "".concat(username, "@placeholder.edu"), // Fallback if email is missing
                            passwordHash: hashedPassword,
                            loginType: -1, // Student login type
                            departmentId: student.departmentId,
                            isActive: true,
                            firstLogin: true,
                            student: {
                                connect: {
                                    usn: usn
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
            case 6:
                user = _a.sent();
                results.success.push({
                    usn: usn,
                    userId: user.id,
                    username: user.username,
                    defaultPassword: defaultPassword
                });
                return [3 /*break*/, 8];
            case 7:
                error_3 = _a.sent();
                console.error("Error creating login for student ".concat(usn, ":"), error_3);
                results.failed.push({
                    usn: usn,
                    reason: error_3.message || 'Internal error'
                });
                return [3 /*break*/, 8];
            case 8:
                _i++;
                return [3 /*break*/, 1];
            case 9:
                res.status(200).json({
                    success: true,
                    message: "Created ".concat(results.success.length, " student logins, ").concat(results.failed.length, " failed"),
                    data: results
                });
                return [3 /*break*/, 11];
            case 10:
                error_4 = _a.sent();
                console.error('Create student logins error:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.createMultipleStudentLogins = createMultipleStudentLogins;
// New function to get students without logins
var getStudentsWithoutLogins = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, departmentId, batchId, search, whereClause, students, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, departmentId = _a.departmentId, batchId = _a.batchId, search = _a.search;
                whereClause = {
                    userId: null // Only fetch students without user accounts
                };
                // Add optional filters
                if (departmentId) {
                    whereClause.departmentId = parseInt(departmentId);
                }
                if (batchId) {
                    whereClause.batchId = batchId;
                }
                if (search) {
                    whereClause.OR = [
                        { usn: { contains: search } },
                        { firstName: { contains: search } },
                        { lastName: { contains: search } },
                        { email: { contains: search } }
                    ];
                }
                return [4 /*yield*/, index_1.prisma.student.findMany({
                        where: whereClause,
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
                                    name: true,
                                    academicYear: true
                                }
                            }
                        },
                        orderBy: { usn: 'asc' }
                    })];
            case 1:
                students = _b.sent();
                res.json({
                    success: true,
                    data: {
                        students: students,
                        count: students.length
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _b.sent();
                console.error('Error fetching students without logins:', error_5);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getStudentsWithoutLogins = getStudentsWithoutLogins;
var updateStudent = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var usn, _a, firstName, middleName, lastName, email, phone, dob, gender, address, batchId, departmentId, semester, section, fatherName, motherName, guardianName, guardianContact, existingStudent, duplicateEmail, batch, department, updatedStudent, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 13, , 14]);
                // Remove dob from req.body if missing, empty, or invalid
                if ('dob' in req.body && (!req.body.dob || isNaN(new Date(req.body.dob).getTime()))) {
                    delete req.body.dob;
                }
                console.log('REQ.BODY BEFORE PRISMA:', req.body);
                usn = req.params.usn;
                _a = req.body, firstName = _a.firstName, middleName = _a.middleName, lastName = _a.lastName, email = _a.email, phone = _a.phone, dob = _a.dob, gender = _a.gender, address = _a.address, batchId = _a.batchId, departmentId = _a.departmentId, semester = _a.semester, section = _a.section, fatherName = _a.fatherName, motherName = _a.motherName, guardianName = _a.guardianName, guardianContact = _a.guardianContact;
                return [4 /*yield*/, index_1.prisma.student.findUnique({
                        where: { usn: usn }
                    })];
            case 1:
                existingStudent = _b.sent();
                if (!existingStudent) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        })];
                }
                if (!(email && email !== existingStudent.email)) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.prisma.student.findFirst({
                        where: {
                            email: email,
                            usn: { not: usn }
                        }
                    })];
            case 2:
                duplicateEmail = _b.sent();
                if (duplicateEmail) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Email already in use by another student'
                        })];
                }
                _b.label = 3;
            case 3:
                if (!batchId) return [3 /*break*/, 5];
                return [4 /*yield*/, index_1.prisma.batch.findUnique({
                        where: { id: batchId }
                    })];
            case 4:
                batch = _b.sent();
                if (!batch) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Batch not found'
                        })];
                }
                _b.label = 5;
            case 5:
                if (!departmentId) return [3 /*break*/, 7];
                return [4 /*yield*/, index_1.prisma.department.findUnique({
                        where: { id: departmentId }
                    })];
            case 6:
                department = _b.sent();
                if (!department) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Department not found'
                        })];
                }
                _b.label = 7;
            case 7: return [4 /*yield*/, index_1.prisma.student.update({
                    where: { usn: usn },
                    data: {
                        firstName: firstName,
                        middleName: middleName,
                        lastName: lastName,
                        email: email,
                        phone: phone,
                        dob: dob && !isNaN(new Date(dob).getTime()) ? new Date(dob) : undefined,
                        gender: gender,
                        address: address,
                        batchId: batchId,
                        departmentId: departmentId,
                        semester: semester,
                        section: section,
                        fatherName: fatherName,
                        motherName: motherName,
                        guardianName: guardianName,
                        guardianContact: guardianContact
                    },
                    include: {
                        batch: {
                            select: {
                                id: true,
                                name: true,
                                academicYear: true
                            }
                        },
                        department: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                })];
            case 8:
                updatedStudent = _b.sent();
                if (!(email && email !== existingStudent.email)) return [3 /*break*/, 10];
                return [4 /*yield*/, index_1.prisma.user.updateMany({
                        where: {
                            student: {
                                usn: usn
                            }
                        },
                        data: {
                            email: email
                        }
                    })];
            case 9:
                _b.sent();
                _b.label = 10;
            case 10:
                if (!(departmentId && departmentId !== existingStudent.departmentId)) return [3 /*break*/, 12];
                return [4 /*yield*/, index_1.prisma.user.updateMany({
                        where: {
                            student: {
                                usn: usn
                            }
                        },
                        data: {
                            departmentId: departmentId
                        }
                    })];
            case 11:
                _b.sent();
                _b.label = 12;
            case 12:
                res.json({
                    success: true,
                    message: 'Student updated successfully',
                    data: updatedStudent
                });
                return [3 /*break*/, 14];
            case 13:
                error_6 = _b.sent();
                console.error('Update student error:', error_6);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 14];
            case 14: return [2 /*return*/];
        }
    });
}); };
exports.updateStudent = updateStudent;
var getStudents = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, page, _c, limit, _d, search, departmentId, batchId, semester, section, pageNumber, limitNumber, filterConditions, searchCondition, whereCondition, total, students, formattedStudents, error_7;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c, _d = _a.search, search = _d === void 0 ? '' : _d, departmentId = _a.departmentId, batchId = _a.batchId, semester = _a.semester, section = _a.section;
                pageNumber = parseInt(page);
                limitNumber = parseInt(limit);
                // Ensure pageNumber and limitNumber are valid positive integers
                if (isNaN(pageNumber) || pageNumber < 1) {
                    pageNumber = 1;
                }
                if (isNaN(limitNumber) || limitNumber < 1) {
                    limitNumber = 10; // Or a reasonable default limit
                }
                filterConditions = {};
                if (departmentId) {
                    filterConditions.departmentId = parseInt(departmentId);
                }
                if (batchId) {
                    filterConditions.batchId = batchId;
                }
                if (semester) {
                    filterConditions.semester = parseInt(semester);
                }
                if (section) {
                    filterConditions.section = section;
                }
                searchCondition = search ? {
                    OR: [
                        { firstName: { contains: search } },
                        { lastName: { contains: search } },
                        { usn: { contains: search } },
                        { email: { contains: search } }
                    ]
                } : {};
                whereCondition = __assign(__assign({}, filterConditions), searchCondition);
                return [4 /*yield*/, index_1.prisma.student.count({
                        where: whereCondition
                    })];
            case 1:
                total = _e.sent();
                return [4 /*yield*/, index_1.prisma.student.findMany({
                        where: whereCondition,
                        select: {
                            usn: true,
                            firstName: true,
                            middleName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            semester: true,
                            section: true,
                            batch: {
                                select: {
                                    id: true,
                                    name: true,
                                    academicYear: true
                                }
                            },
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
                                    isActive: true,
                                    lastLogin: true
                                }
                            },
                            addresses: {
                                select: {
                                    type: true,
                                    state: true,
                                    district: true,
                                    houseName: true,
                                    village: true,
                                    pincode: true
                                }
                            },
                            guardians: {
                                select: {
                                    type: true,
                                    name: true,
                                    contact: true,
                                    aadhar: true,
                                    panCard: true,
                                    occupation: true
                                }
                            }
                        },
                        skip: (pageNumber - 1) * limitNumber,
                        take: limitNumber,
                        orderBy: [
                            { semester: 'asc' },
                            { section: 'asc' },
                            { firstName: 'asc' }
                        ]
                    })];
            case 2:
                students = _e.sent();
                formattedStudents = students.map(function (student) {
                    var _a, _b, _c, _d, _e;
                    return (__assign(__assign({}, student), { fullName: "".concat(student.firstName, " ").concat(student.middleName ? student.middleName + ' ' : '').concat(student.lastName).trim(), address: ((_a = student.addresses) === null || _a === void 0 ? void 0 : _a.find(function (addr) { return addr.type === 'present'; })) || null, permanentAddress: ((_b = student.addresses) === null || _b === void 0 ? void 0 : _b.find(function (addr) { return addr.type === 'permanent'; })) || null, guardian: ((_c = student.guardians) === null || _c === void 0 ? void 0 : _c.find(function (g) { return g.type === 'guardian'; })) || null, father: ((_d = student.guardians) === null || _d === void 0 ? void 0 : _d.find(function (g) { return g.type === 'father'; })) || null, mother: ((_e = student.guardians) === null || _e === void 0 ? void 0 : _e.find(function (g) { return g.type === 'mother'; })) || null }));
                });
                res.json({
                    success: true,
                    data: {
                        students: formattedStudents,
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
                error_7 = _e.sent();
                console.error('Get students error:', error_7);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getStudents = getStudents;
var getStudentByUSN = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var usn, student, formattedStudent, error_8;
    var _a, _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _h.trys.push([0, 2, , 3]);
                usn = req.params.usn;
                return [4 /*yield*/, index_1.prisma.student.findUnique({
                        where: { usn: usn },
                        select: {
                            usn: true,
                            firstName: true,
                            middleName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            semester: true,
                            section: true,
                            admissionYear: true,
                            departmentId: true,
                            batchId: true,
                            batch: {
                                select: {
                                    id: true,
                                    name: true,
                                    academicYear: true
                                }
                            },
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            },
                            addresses: {
                                select: {
                                    type: true,
                                    state: true,
                                    district: true,
                                    houseName: true,
                                    village: true,
                                    pincode: true
                                }
                            },
                            guardians: {
                                select: {
                                    type: true,
                                    name: true,
                                    contact: true,
                                    aadhar: true,
                                    panCard: true,
                                    occupation: true
                                }
                            },
                            entranceExams: {
                                select: {
                                    kcetRank: true,
                                    comedkRank: true,
                                    jeeRank: true
                                }
                            },
                            pucRecord: {
                                select: {
                                    school: true,
                                    boardUniversity: true,
                                    regNo: true,
                                    year: true,
                                    maxMarks: true,
                                    obtainedMarks: true,
                                    percentage: true,
                                    subTotalMarks: true,
                                    physicsMax: true,
                                    physicsObtained: true,
                                    mathsMax: true,
                                    mathsObtained: true,
                                    chemMax: true,
                                    chemObtained: true,
                                    electiveMax: true,
                                    electiveObtained: true,
                                    englishMax: true,
                                    englishObtained: true
                                }
                            },
                            sslcRecord: {
                                select: {
                                    school: true,
                                    boardUniversity: true,
                                    regNo: true,
                                    year: true,
                                    maxMarks: true,
                                    obtainedMarks: true,
                                    percentage: true
                                }
                            }
                        }
                    })];
            case 1:
                student = _h.sent();
                if (!student) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        })];
                }
                formattedStudent = __assign(__assign({}, student), { fullName: "".concat(student.firstName, " ").concat(student.middleName ? student.middleName + ' ' : '').concat(student.lastName).trim(), address: ((_a = student.addresses) === null || _a === void 0 ? void 0 : _a.find(function (addr) { return addr.type === 'present'; })) || null, permanentAddress: ((_b = student.addresses) === null || _b === void 0 ? void 0 : _b.find(function (addr) { return addr.type === 'permanent'; })) || null, guardian: ((_c = student.guardians) === null || _c === void 0 ? void 0 : _c.find(function (g) { return g.type === 'guardian'; })) || null, father: ((_d = student.guardians) === null || _d === void 0 ? void 0 : _d.find(function (g) { return g.type === 'father'; })) || null, mother: ((_e = student.guardians) === null || _e === void 0 ? void 0 : _e.find(function (g) { return g.type === 'mother'; })) || null, pucDetails: ((_f = student.pucRecord) === null || _f === void 0 ? void 0 : _f[0]) || null, sslcDetails: ((_g = student.sslcRecord) === null || _g === void 0 ? void 0 : _g[0]) || null // Get the first SSLC record if exists
                 });
                res.json({
                    success: true,
                    data: formattedStudent
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _h.sent();
                console.error('Get student by USN error:', error_8);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getStudentByUSN = getStudentByUSN;
var bulkUploadStudents = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var allBatches, allDepartments, batchNameToId_1, departmentNameToId_1, fileBuffer, studentsData, parsingErrors, workbook, worksheet, rawData, invalidEntries, formattedErrors, parseError_1, validStudents_1, usns, emails, usnCounts, emailCounts, duplicateUsnsInFile, duplicateEmailsInFile, existingStudents, existingUSNs_1, existingEmails_1, conflictingEntries, createdStudentsCount_1, creationErrors_1, transactionError_1, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 12, , 13]);
                // Check if file was uploaded
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'No file uploaded'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.batch.findMany({ select: { id: true, name: true } })];
            case 1:
                allBatches = _a.sent();
                return [4 /*yield*/, index_1.prisma.department.findMany({ select: { id: true, name: true, code: true } })];
            case 2:
                allDepartments = _a.sent();
                batchNameToId_1 = new Map(allBatches.map(function (b) { return [b.name.toLowerCase(), b.id]; }));
                departmentNameToId_1 = new Map();
                allDepartments.forEach(function (d) {
                    departmentNameToId_1.set(d.name.toLowerCase(), d.id);
                    if (d.code) {
                        departmentNameToId_1.set(d.code.toLowerCase(), d.id);
                    }
                });
                fileBuffer = req.file.buffer;
                studentsData = [];
                parsingErrors = [];
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                workbook = new exceljs_1.default.Workbook();
                return [4 /*yield*/, workbook.xlsx.load(fileBuffer)];
            case 4:
                _a.sent();
                worksheet = workbook.getWorksheet(1);
                rawData = worksheet.getRows(2, worksheet.actualRowCount).map(function (row) {
                    var rowIndex = row.number;
                    // Flexible header matching (case-insensitive, common variations)
                    var getRowValue = function (keys) {
                        var _loop_1 = function (key) {
                            var lowerKey = key.toLowerCase();
                            var matchingHeader = Object.keys(row).find(function (header) { return header.toLowerCase() === lowerKey; });
                            if (matchingHeader && row[matchingHeader] !== '') {
                                return { value: String(row[matchingHeader]).trim() };
                            }
                        };
                        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                            var key = keys_1[_i];
                            var state_1 = _loop_1(key);
                            if (typeof state_1 === "object")
                                return state_1.value;
                        }
                        return ''; // Return empty string if no key matches or value is empty
                    };
                    var batchName = getRowValue(['batch', 'batch_name']);
                    var departmentNameOrCode = getRowValue(['dept_name', 'branch', 'dept', 'department']);
                    var admissionYearStr = getRowValue(['reg_year', 'admissionyear', 'admission_year', 'admission year']);
                    var semesterStr = getRowValue(['semester', 'sem']);
                    var dobValue = getRowValue(['dob', 'date of birth']);
                    var batchId = batchNameToId_1.get(batchName.toLowerCase());
                    var departmentId = departmentNameToId_1.get(departmentNameOrCode.toLowerCase());
                    // --- Basic Data Cleaning and Parsing ---
                    var semester = parseInt(semesterStr, 10);
                    if (isNaN(semester))
                        semester = null;
                    var admissionYear = parseInt(admissionYearStr, 10);
                    if (isNaN(admissionYear))
                        admissionYear = null;
                    var dob = undefined;
                    if (dobValue) {
                        // Try parsing common date formats or if ExcelJS parsed it already
                        var parsedDate = new Date(dobValue);
                        if (!isNaN(parsedDate.getTime())) {
                            // Check if it's a reasonable date (e.g., not epoch 0 if original string was not '0')
                            if (parsedDate.getTime() !== 0 || dobValue === '0') {
                                dob = parsedDate;
                            }
                        }
                        // Add more robust date parsing if needed for specific Excel formats
                    }
                    var usn = getRowValue(['usn', 'usn number']);
                    var email = getRowValue(['email', 'email_id', 'email id']);
                    var phone = getRowValue(['phone', 'mob_no', 'mobile', 'contact']);
                    // Collect potential issues for this row
                    var rowIssues = [];
                    if (!usn)
                        rowIssues.push("Missing USN");
                    if (!email)
                        rowIssues.push("Missing Email");
                    if (!getRowValue(['fname', 'firstname', 'first name']))
                        rowIssues.push("Missing First Name");
                    if (!getRowValue(['lname', 'lastname', 'last name']))
                        rowIssues.push("Missing Last Name");
                    if (batchName && !batchId)
                        rowIssues.push("Batch '".concat(batchName, "' not found"));
                    if (departmentNameOrCode && !departmentId)
                        rowIssues.push("Department '".concat(departmentNameOrCode, "' not found"));
                    if (!batchId)
                        rowIssues.push("Missing valid Batch");
                    if (!departmentId)
                        rowIssues.push("Missing valid Department");
                    if (semesterStr && semester === null)
                        rowIssues.push("Invalid Semester value");
                    if (!semester)
                        rowIssues.push("Missing Semester"); // Make semester required?
                    if (admissionYearStr && admissionYear === null)
                        rowIssues.push("Invalid Admission Year value");
                    if (!admissionYear)
                        rowIssues.push("Missing Admission Year"); // Make admission year required
                    return {
                        originalRowIndex: rowIndex, // Keep track for error reporting
                        usn: usn,
                        firstName: getRowValue(['fname', 'firstname', 'first name']),
                        middleName: getRowValue(['mname', 'middlename', 'middle name']),
                        lastName: getRowValue(['lname', 'lastname', 'last name']),
                        email: email,
                        phone: phone,
                        dob: dob,
                        gender: getRowValue(['gender']),
                        address: getRowValue(['address', 'addr']),
                        batchId: batchId, // Looked-up ID
                        departmentId: departmentId, // Looked-up ID
                        semester: semester,
                        section: getRowValue(['section', 'sec']),
                        admissionYear: admissionYear, // Parsed from reg_year
                        fatherName: getRowValue(['fathername', 'father name', 'ffname']),
                        motherName: getRowValue(['mothername', 'mother name', 'mfname']),
                        guardianName: getRowValue(['guardianname', 'guardian name', 'gfname']),
                        guardianContact: getRowValue(['guardiancontact', 'guardian phone', 'gphone']),
                        _issues: rowIssues, // Store issues for validation
                        _batchName: batchName, // Store original names for error reporting
                        _departmentNameOrCode: departmentNameOrCode
                    };
                });
                if (!Array.isArray(studentsData) || studentsData.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'No valid student data found in the file'
                        })];
                }
                invalidEntries = studentsData.filter(function (student) { return student._issues.length > 0; });
                if (invalidEntries.length > 0) {
                    formattedErrors = invalidEntries.map(function (entry) { return ({
                        row: entry.originalRowIndex,
                        usn: entry.usn || 'N/A',
                        batchAttempted: entry._batchName,
                        deptAttempted: entry._departmentNameOrCode,
                        issues: entry._issues
                    }); });
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Found ".concat(invalidEntries.length, " invalid entries in the file. Please correct them and re-upload."),
                            errors: formattedErrors
                        })];
                }
                return [3 /*break*/, 6];
            case 5:
                parseError_1 = _a.sent();
                console.error('File parsing or data transformation error:', parseError_1);
                return [2 /*return*/, res.status(400).json({
                        success: false,
                        message: "Failed to parse file or process data: ".concat(parseError_1.message)
                    })];
            case 6:
                validStudents_1 = studentsData.filter(function (student) { return student._issues.length === 0; });
                if (validStudents_1.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'No valid student records to process after validation.'
                        })];
                }
                usns = validStudents_1.map(function (student) { return student.usn; });
                emails = validStudents_1.map(function (student) { return student.email; });
                usnCounts = usns.reduce(function (acc, usn) {
                    var _a;
                    return (__assign(__assign({}, acc), (_a = {}, _a[usn] = (acc[usn] || 0) + 1, _a)));
                }, {});
                emailCounts = emails.reduce(function (acc, email) {
                    var _a;
                    return (__assign(__assign({}, acc), (_a = {}, _a[email] = (acc[email] || 0) + 1, _a)));
                }, {});
                duplicateUsnsInFile = Object.entries(usnCounts).filter(function (_a) {
                    var _ = _a[0], count = _a[1];
                    return count > 1;
                }).map(function (_a) {
                    var usn = _a[0], _ = _a[1];
                    return usn;
                });
                duplicateEmailsInFile = Object.entries(emailCounts).filter(function (_a) {
                    var _ = _a[0], count = _a[1];
                    return count > 1;
                }).map(function (_a) {
                    var email = _a[0], _ = _a[1];
                    return email;
                });
                if (duplicateUsnsInFile.length > 0 || duplicateEmailsInFile.length > 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Duplicate USNs or Emails found within the uploaded file.',
                            data: {
                                duplicateUsnsInFile: duplicateUsnsInFile,
                                duplicateEmailsInFile: duplicateEmailsInFile
                            }
                        })];
                }
                return [4 /*yield*/, index_1.prisma.student.findMany({
                        where: {
                            OR: [
                                { usn: { in: usns } },
                                { email: { in: emails } }
                            ]
                        },
                        select: {
                            usn: true,
                            email: true
                        }
                    })];
            case 7:
                existingStudents = _a.sent();
                if (existingStudents.length > 0) {
                    existingUSNs_1 = existingStudents.map(function (s) { return s.usn; });
                    existingEmails_1 = existingStudents.map(function (s) { return s.email; });
                    conflictingEntries = validStudents_1.filter(function (s) { return existingUSNs_1.includes(s.usn) || existingEmails_1.includes(s.email); })
                        .map(function (s) { return ({
                        row: s.originalRowIndex,
                        usn: s.usn,
                        email: s.email,
                        conflict: existingUSNs_1.includes(s.usn) ? 'USN exists' : 'Email exists'
                    }); });
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Found ".concat(existingStudents.length, " students with conflicting USN or Email already in the database."),
                            errors: conflictingEntries
                        })];
                }
                createdStudentsCount_1 = 0;
                creationErrors_1 = [];
                _a.label = 8;
            case 8:
                _a.trys.push([8, 10, , 11]);
                return [4 /*yield*/, index_1.prisma.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var _i, validStudents_2, student, createdStudent, studentError_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _i = 0, validStudents_2 = validStudents_1;
                                    _a.label = 1;
                                case 1:
                                    if (!(_i < validStudents_2.length)) return [3 /*break*/, 6];
                                    student = validStudents_2[_i];
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, tx.student.create({
                                            data: {
                                                usn: student.usn,
                                                firstName: student.firstName,
                                                middleName: student.middleName,
                                                lastName: student.lastName,
                                                email: student.email,
                                                phone: student.phone,
                                                dob: student.dob,
                                                gender: student.gender,
                                                address: student.address,
                                                batchId: student.batchId, // Assert non-null as validation passed
                                                departmentId: student.departmentId, // Assert non-null
                                                semester: student.semester, // Assert non-null
                                                section: student.section,
                                                admissionYear: student.admissionYear, // Assert non-null
                                                fatherName: student.fatherName,
                                                motherName: student.motherName,
                                                guardianName: student.guardianName,
                                                guardianContact: student.guardianContact
                                            }
                                        })];
                                case 3:
                                    createdStudent = _a.sent();
                                    // Remove automatic user account creation
                                    createdStudentsCount_1++;
                                    return [3 /*break*/, 5];
                                case 4:
                                    studentError_1 = _a.sent();
                                    // Log individual creation error and add to list
                                    console.error("Error creating student USN ".concat(student.usn, " (Row ").concat(student.originalRowIndex, "):"), studentError_1);
                                    creationErrors_1.push({
                                        row: student.originalRowIndex,
                                        usn: student.usn,
                                        error: studentError_1.message || 'Failed to create student'
                                    });
                                    // Important: Re-throw the error to abort the transaction
                                    throw studentError_1;
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); })];
            case 9:
                _a.sent(); // End transaction
                // If transaction succeeded without re-throwing error
                res.status(201).json({
                    success: true,
                    message: "Successfully added ".concat(createdStudentsCount_1, " students. You can now create logins for them."),
                    data: {
                        count: createdStudentsCount_1
                    }
                });
                return [3 /*break*/, 11];
            case 10:
                transactionError_1 = _a.sent();
                // Transaction was rolled back
                console.error('Bulk upload transaction error:', transactionError_1);
                res.status(500).json({
                    success: false,
                    message: 'Bulk upload failed due to an error during database insertion. Transaction rolled back.',
                    // Provide specific errors if available and safe to expose
                    errors: creationErrors_1.length > 0 ? creationErrors_1 : [{ error: transactionError_1.message || 'Transaction failed' }]
                });
                return [3 /*break*/, 11];
            case 11: return [3 /*break*/, 13];
            case 12:
                error_9 = _a.sent();
                // Catch-all for unexpected errors (e.g., initial DB fetch failure)
                console.error('Unexpected bulk upload students error:', error_9);
                res.status(500).json({
                    success: false,
                    message: "Internal server error: ".concat(error_9.message)
                });
                return [3 /*break*/, 13];
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.bulkUploadStudents = bulkUploadStudents;
// Function to handle Excel file upload and student data import
var importStudentsFromExcel = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var workbook, worksheet, students_1, result, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                if (!req.file) {
                    throw new errors_1.BadRequestError('No file uploaded');
                }
                workbook = new exceljs_1.default.Workbook();
                return [4 /*yield*/, workbook.xlsx.load(req.file.buffer)];
            case 1:
                _a.sent();
                worksheet = workbook.getWorksheet(1);
                if (!worksheet) {
                    throw new errors_1.BadRequestError('Excel file is empty or invalid');
                }
                students_1 = [];
                worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                    if (rowNumber === 1)
                        return; // Skip header row
                    var student = {
                        usn: ((_a = row.getCell(1).value) === null || _a === void 0 ? void 0 : _a.toString()) || '',
                        firstName: ((_b = row.getCell(2).value) === null || _b === void 0 ? void 0 : _b.toString()) || '',
                        lastName: ((_c = row.getCell(3).value) === null || _c === void 0 ? void 0 : _c.toString()) || '',
                        email: ((_d = row.getCell(4).value) === null || _d === void 0 ? void 0 : _d.toString()) || '',
                        phone: ((_e = row.getCell(5).value) === null || _e === void 0 ? void 0 : _e.toString()) || '',
                        departmentId: parseInt(((_f = row.getCell(6).value) === null || _f === void 0 ? void 0 : _f.toString()) || '0'),
                        semester: parseInt(((_g = row.getCell(7).value) === null || _g === void 0 ? void 0 : _g.toString()) || '1'),
                        section: ((_h = row.getCell(8).value) === null || _h === void 0 ? void 0 : _h.toString()) || '',
                        admissionYear: parseInt(((_j = row.getCell(9).value) === null || _j === void 0 ? void 0 : _j.toString()) || '0'),
                    };
                    // Validate student data
                    var validationResult = (0, validation_1.validateStudent)(student);
                    if (!validationResult.success) {
                        throw new errors_1.BadRequestError("Invalid data in row ".concat(rowNumber, ": ").concat(validationResult.error));
                    }
                    students_1.push(student);
                });
                return [4 /*yield*/, index_1.prisma.student.createMany({
                        data: students_1,
                        skipDuplicates: true,
                    })];
            case 2:
                result = _a.sent();
                res.json({
                    success: true,
                    message: "Successfully imported ".concat(result.count, " students"),
                    data: result
                });
                return [3 /*break*/, 4];
            case 3:
                error_10 = _a.sent();
                if (error_10 instanceof errors_1.ApiError) {
                    throw error_10;
                }
                throw new errors_1.BadRequestError('Failed to process Excel file: ' + error_10.message);
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.importStudentsFromExcel = importStudentsFromExcel;
// Function to export student data to Excel
var exportStudentsToExcel = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var students, workbook, worksheet_1, buffer, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, index_1.prisma.student.findMany({
                        include: {
                            department: true,
                        }
                    })];
            case 1:
                students = _a.sent();
                workbook = new exceljs_1.default.Workbook();
                worksheet_1 = workbook.addWorksheet('Students');
                // Add headers
                worksheet_1.columns = [
                    { header: 'USN', key: 'usn', width: 15 },
                    { header: 'First Name', key: 'firstName', width: 20 },
                    { header: 'Last Name', key: 'lastName', width: 20 },
                    { header: 'Email', key: 'email', width: 30 },
                    { header: 'Phone', key: 'phone', width: 15 },
                    { header: 'Department', key: 'department', width: 20 },
                    { header: 'Semester', key: 'semester', width: 10 },
                    { header: 'Section', key: 'section', width: 10 },
                    { header: 'Admission Year', key: 'admissionYear', width: 15 }
                ];
                // Add data
                students.forEach(function (student) {
                    var _a;
                    worksheet_1.addRow({
                        usn: student.usn,
                        firstName: student.firstName,
                        lastName: student.lastName,
                        email: student.email,
                        phone: student.phone,
                        department: ((_a = student.department) === null || _a === void 0 ? void 0 : _a.name) || 'N/A',
                        semester: student.semester,
                        section: student.section,
                        admissionYear: student.admissionYear
                    });
                });
                // Style the header row
                worksheet_1.getRow(1).font = { bold: true };
                worksheet_1.getRow(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE0E0E0' }
                };
                return [4 /*yield*/, workbook.xlsx.writeBuffer()];
            case 2:
                buffer = _a.sent();
                // Set response headers
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
                res.send(buffer);
                return [3 /*break*/, 4];
            case 3:
                error_11 = _a.sent();
                throw new errors_1.BadRequestError('Failed to export students: ' + error_11.message);
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.exportStudentsToExcel = exportStudentsToExcel;
// Delete student
var deleteStudent = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id_1, student_1, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id_1 = req.params.id;
                return [4 /*yield*/, index_1.prisma.student.findUnique({
                        where: {
                            usn: id_1
                        },
                        include: {
                            user: {
                                include: {
                                    auditlog: true,
                                    displaypic: true,
                                    studentcomponentmark: true
                                }
                            },
                            studentcomponentmark: true,
                            mark: true,
                            attendanceentry: true,
                            addresses: true,
                            guardians: true,
                            entranceExams: true,
                            pucRecord: true,
                            sslcRecord: true
                        }
                    })];
            case 1:
                student_1 = _a.sent();
                if (!student_1) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        })];
                }
                // Delete student and associated records using a transaction
                return [4 /*yield*/, index_1.prisma.$transaction(function (prisma) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!student_1.user) return [3 /*break*/, 6];
                                    if (!(student_1.user.auditlog.length > 0)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, prisma.auditlog.deleteMany({
                                            where: { userId: student_1.user.id }
                                        })];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2:
                                    if (!student_1.user.displaypic) return [3 /*break*/, 4];
                                    return [4 /*yield*/, prisma.displaypic.delete({
                                            where: { userId: student_1.user.id }
                                        })];
                                case 3:
                                    _a.sent();
                                    _a.label = 4;
                                case 4:
                                    if (!(student_1.user.studentcomponentmark.length > 0)) return [3 /*break*/, 6];
                                    return [4 /*yield*/, prisma.studentcomponentmark.updateMany({
                                            where: { recordedBy: student_1.user.id },
                                            data: { recordedBy: null }
                                        })];
                                case 5:
                                    _a.sent();
                                    _a.label = 6;
                                case 6:
                                    if (!(student_1.studentcomponentmark.length > 0)) return [3 /*break*/, 8];
                                    return [4 /*yield*/, prisma.studentcomponentmark.deleteMany({
                                            where: { usn: id_1 }
                                        })];
                                case 7:
                                    _a.sent();
                                    _a.label = 8;
                                case 8:
                                    if (!(student_1.mark.length > 0)) return [3 /*break*/, 10];
                                    return [4 /*yield*/, prisma.mark.deleteMany({
                                            where: { usn: id_1 }
                                        })];
                                case 9:
                                    _a.sent();
                                    _a.label = 10;
                                case 10:
                                    if (!(student_1.attendanceentry.length > 0)) return [3 /*break*/, 12];
                                    return [4 /*yield*/, prisma.attendanceentry.deleteMany({
                                            where: { usn: id_1 }
                                        })];
                                case 11:
                                    _a.sent();
                                    _a.label = 12;
                                case 12:
                                    if (!(student_1.addresses.length > 0)) return [3 /*break*/, 14];
                                    return [4 /*yield*/, prisma.studentAddress.deleteMany({
                                            where: { usn: id_1 }
                                        })];
                                case 13:
                                    _a.sent();
                                    _a.label = 14;
                                case 14:
                                    if (!(student_1.guardians.length > 0)) return [3 /*break*/, 16];
                                    return [4 /*yield*/, prisma.studentGuardian.deleteMany({
                                            where: { usn: id_1 }
                                        })];
                                case 15:
                                    _a.sent();
                                    _a.label = 16;
                                case 16:
                                    if (!(student_1.entranceExams.length > 0)) return [3 /*break*/, 18];
                                    return [4 /*yield*/, prisma.studentEntranceExam.deleteMany({
                                            where: { usn: id_1 }
                                        })];
                                case 17:
                                    _a.sent();
                                    _a.label = 18;
                                case 18:
                                    if (!(student_1.pucRecord.length > 0)) return [3 /*break*/, 20];
                                    return [4 /*yield*/, prisma.studentPucRecord.deleteMany({
                                            where: { usn: id_1 }
                                        })];
                                case 19:
                                    _a.sent();
                                    _a.label = 20;
                                case 20:
                                    if (!(student_1.sslcRecord.length > 0)) return [3 /*break*/, 22];
                                    return [4 /*yield*/, prisma.studentSslcRecord.deleteMany({
                                            where: { usn: id_1 }
                                        })];
                                case 21:
                                    _a.sent();
                                    _a.label = 22;
                                case 22: 
                                // Delete the student record
                                return [4 /*yield*/, prisma.student.delete({
                                        where: { usn: id_1 }
                                    })];
                                case 23:
                                    // Delete the student record
                                    _a.sent();
                                    if (!student_1.user) return [3 /*break*/, 25];
                                    return [4 /*yield*/, prisma.user.delete({
                                            where: { id: student_1.user.id }
                                        })];
                                case 24:
                                    _a.sent();
                                    _a.label = 25;
                                case 25: return [2 /*return*/];
                            }
                        });
                    }); })];
            case 2:
                // Delete student and associated records using a transaction
                _a.sent();
                res.json({
                    success: true,
                    message: 'Student deleted successfully'
                });
                return [3 /*break*/, 4];
            case 3:
                error_12 = _a.sent();
                console.error('Delete student error:', error_12);
                // Handle specific Prisma errors
                if (error_12.code === 'P2003') {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Cannot delete student because it is referenced by other records'
                        })];
                }
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete student'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteStudent = deleteStudent;

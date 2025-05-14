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
exports.deleteDepartment = exports.getDepartmentById = exports.getDepartments = exports.updateDepartment = exports.createDepartment = void 0;
var index_1 = require("../index");
var createDepartment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, code, description, hodId, existingDepartment, faculty, department, head, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                _a = req.body, name_1 = _a.name, code = _a.code, description = _a.description, hodId = _a.hodId;
                return [4 /*yield*/, index_1.prisma.department.findUnique({
                        where: { code: code }
                    })];
            case 1:
                existingDepartment = _b.sent();
                if (existingDepartment) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Department code already exists'
                        })];
                }
                if (!hodId) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: hodId }
                    })];
            case 2:
                faculty = _b.sent();
                if (!faculty) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Faculty head not found'
                        })];
                }
                _b.label = 3;
            case 3: return [4 /*yield*/, index_1.prisma.department.create({
                    data: {
                        name: name_1,
                        code: code,
                        hodId: hodId
                    }
                })];
            case 4:
                department = _b.sent();
                head = null;
                if (!hodId) return [3 /*break*/, 6];
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: hodId },
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    })];
            case 5:
                head = _b.sent();
                _b.label = 6;
            case 6:
                res.status(201).json({
                    success: true,
                    message: 'Department created successfully',
                    data: __assign(__assign({}, department), { head: head })
                });
                return [3 /*break*/, 8];
            case 7:
                error_1 = _b.sent();
                console.error('Create department error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.createDepartment = createDepartment;
var updateDepartment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, name_2, code, description, hodId, existingDepartment, duplicateDepartment, faculty, updatedDepartment, head, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 9, , 10]);
                id = req.params.id;
                _a = req.body, name_2 = _a.name, code = _a.code, description = _a.description, hodId = _a.hodId;
                return [4 /*yield*/, index_1.prisma.department.findUnique({
                        where: { id: parseInt(id) }
                    })];
            case 1:
                existingDepartment = _b.sent();
                if (!existingDepartment) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Department not found'
                        })];
                }
                if (!(code && code !== existingDepartment.code)) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.prisma.department.findUnique({
                        where: { code: code }
                    })];
            case 2:
                duplicateDepartment = _b.sent();
                if (duplicateDepartment) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Department code already exists'
                        })];
                }
                _b.label = 3;
            case 3:
                if (!hodId) return [3 /*break*/, 5];
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: hodId }
                    })];
            case 4:
                faculty = _b.sent();
                if (!faculty) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Faculty head not found'
                        })];
                }
                _b.label = 5;
            case 5: return [4 /*yield*/, index_1.prisma.department.update({
                    where: { id: parseInt(id) },
                    data: {
                        name: name_2,
                        code: code,
                        hodId: hodId
                    }
                })];
            case 6:
                updatedDepartment = _b.sent();
                head = null;
                if (!updatedDepartment.hodId) return [3 /*break*/, 8];
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: updatedDepartment.hodId },
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    })];
            case 7:
                head = _b.sent();
                _b.label = 8;
            case 8:
                res.json({
                    success: true,
                    message: 'Department updated successfully',
                    data: __assign(__assign({}, updatedDepartment), { head: head })
                });
                return [3 /*break*/, 10];
            case 9:
                error_2 = _b.sent();
                console.error('Update department error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.updateDepartment = updateDepartment;
var getDepartments = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, page, _c, limit, _d, search, pageNumber, limitNumber, searchCondition, total, departments, departmentsWithHeads, error_3;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 4, , 5]);
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c, _d = _a.search, search = _d === void 0 ? '' : _d;
                pageNumber = parseInt(page);
                limitNumber = parseInt(limit);
                searchCondition = search ? {
                    OR: [
                        { name: { contains: search } },
                        { code: { contains: search } }
                    ]
                } : {};
                return [4 /*yield*/, index_1.prisma.department.count({
                        where: searchCondition
                    })];
            case 1:
                total = _e.sent();
                return [4 /*yield*/, index_1.prisma.department.findMany({
                        where: searchCondition,
                        skip: (pageNumber - 1) * limitNumber,
                        take: limitNumber,
                        orderBy: {
                            name: 'asc'
                        }
                    })];
            case 2:
                departments = _e.sent();
                return [4 /*yield*/, Promise.all(departments.map(function (dept) { return __awaiter(void 0, void 0, void 0, function () {
                        var head;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    head = null;
                                    if (!dept.hodId) return [3 /*break*/, 2];
                                    return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                                            where: { id: dept.hodId },
                                            select: {
                                                id: true,
                                                name: true,
                                                email: true
                                            }
                                        })];
                                case 1:
                                    head = _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/, __assign(__assign({}, dept), { head: head })];
                            }
                        });
                    }); }))];
            case 3:
                departmentsWithHeads = _e.sent();
                res.json({
                    success: true,
                    data: {
                        departments: departmentsWithHeads,
                        pagination: {
                            total: total,
                            page: pageNumber,
                            limit: limitNumber,
                            totalPages: Math.ceil(total / limitNumber)
                        }
                    }
                });
                return [3 /*break*/, 5];
            case 4:
                error_3 = _e.sent();
                console.error('Get departments error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getDepartments = getDepartments;
var getDepartmentById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, department, head, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                id = req.params.id;
                return [4 /*yield*/, index_1.prisma.department.findUnique({
                        where: { id: parseInt(id) },
                        include: {
                            faculty: true
                        }
                    })];
            case 1:
                department = _a.sent();
                if (!department) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Department not found'
                        })];
                }
                head = null;
                if (!department.hodId) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.prisma.faculty.findUnique({
                        where: { id: department.hodId },
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    })];
            case 2:
                head = _a.sent();
                _a.label = 3;
            case 3:
                res.json({
                    success: true,
                    data: __assign(__assign({}, department), { head: head })
                });
                return [3 /*break*/, 5];
            case 4:
                error_4 = _a.sent();
                console.error('Get department by ID error:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getDepartmentById = getDepartmentById;
var deleteDepartment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, department, facultyCount, studentCount, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                id = req.params.id;
                return [4 /*yield*/, index_1.prisma.department.findUnique({
                        where: { id: parseInt(id) }
                    })];
            case 1:
                department = _a.sent();
                if (!department) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Department not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.faculty.count({
                        where: { departmentId: parseInt(id) }
                    })];
            case 2:
                facultyCount = _a.sent();
                if (facultyCount > 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Cannot delete department with assigned faculty'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.student.count({
                        where: { departmentId: parseInt(id) }
                    })];
            case 3:
                studentCount = _a.sent();
                if (studentCount > 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Cannot delete department with assigned students'
                        })];
                }
                // Delete department
                return [4 /*yield*/, index_1.prisma.department.delete({
                        where: { id: parseInt(id) }
                    })];
            case 4:
                // Delete department
                _a.sent();
                res.json({
                    success: true,
                    message: 'Department deleted successfully'
                });
                return [3 /*break*/, 6];
            case 5:
                error_5 = _a.sent();
                console.error('Delete department error:', error_5);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.deleteDepartment = deleteDepartment;

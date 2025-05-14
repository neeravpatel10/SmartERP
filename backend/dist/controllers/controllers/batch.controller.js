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
exports.rolloverBatch = exports.deleteBatch = exports.getBatchStudents = exports.getBatchById = exports.getBatches = exports.updateBatch = exports.createBatch = void 0;
var index_1 = require("../index");
var createBatch = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, departmentId, currentSemester, autoRollover, archived, academicYear, year, batchId, name_1, department, existingBatch, batch, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, departmentId = _a.departmentId, currentSemester = _a.currentSemester, autoRollover = _a.autoRollover, archived = _a.archived, academicYear = _a.academicYear;
                // Validate academicYear format
                if (!academicYear || !/^[0-9]{4}-[0-9]{4}$/.test(academicYear)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Academic year must be in format YYYY-YYYY'
                        })];
                }
                year = academicYear.split('-')[0];
                batchId = year;
                name_1 = "".concat(year, " Batch");
                return [4 /*yield*/, index_1.prisma.department.findUnique({
                        where: { id: departmentId }
                    })];
            case 1:
                department = _b.sent();
                if (!department) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Department not found'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.batch.findFirst({
                        where: {
                            id: batchId,
                            departmentId: departmentId,
                            academicYear: academicYear
                        }
                    })];
            case 2:
                existingBatch = _b.sent();
                if (existingBatch) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Batch for this year and department already exists'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.batch.create({
                        data: {
                            id: batchId,
                            name: name_1,
                            departmentId: departmentId,
                            currentSemester: currentSemester !== null && currentSemester !== void 0 ? currentSemester : 1,
                            autoRollover: autoRollover !== null && autoRollover !== void 0 ? autoRollover : false,
                            archived: archived !== null && archived !== void 0 ? archived : false,
                            academicYear: academicYear
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
            case 3:
                batch = _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'Batch created successfully',
                    data: batch
                });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                console.error('Create batch error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.createBatch = createBatch;
var updateBatch = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, batchId, _a, name_2, departmentId, currentSemester, autoRollover, archived, academicYear, existingBatch, department, duplicateBatch, activeStudentsCount, activeMappingsCount, updateData, updatedBatch, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 10, , 11]);
                id = req.params.id;
                batchId = id;
                _a = req.body, name_2 = _a.name, departmentId = _a.departmentId, currentSemester = _a.currentSemester, autoRollover = _a.autoRollover, archived = _a.archived, academicYear = _a.academicYear;
                return [4 /*yield*/, index_1.prisma.batch.findUnique({
                        where: { id: batchId }
                    })];
            case 1:
                existingBatch = _b.sent();
                if (!existingBatch) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Batch not found'
                        })];
                }
                // Validate academicYear format if provided
                if (academicYear && !/^\d{4}-\d{4}$/.test(academicYear)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Academic year must be in format YYYY-YYYY'
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
            case 3:
                if (!((name_2 && name_2 !== existingBatch.name) || (academicYear && academicYear !== existingBatch.academicYear))) return [3 /*break*/, 5];
                return [4 /*yield*/, index_1.prisma.batch.findFirst({
                        where: {
                            name: name_2 || existingBatch.name,
                            departmentId: departmentId || existingBatch.departmentId,
                            academicYear: academicYear || existingBatch.academicYear,
                            id: { not: batchId }
                        }
                    })];
            case 4:
                duplicateBatch = _b.sent();
                if (duplicateBatch) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Batch with this name and academic year already exists for this department'
                        })];
                }
                _b.label = 5;
            case 5:
                if (!(archived === true && existingBatch.archived === false)) return [3 /*break*/, 8];
                return [4 /*yield*/, index_1.prisma.student.count({
                        where: { batchId: batchId }
                    })];
            case 6:
                activeStudentsCount = _b.sent();
                if (activeStudentsCount > 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Cannot archive batch with ".concat(activeStudentsCount, " associated students. Please reassign students first.")
                        })];
                }
                return [4 /*yield*/, index_1.prisma.facultySubjectMapping.count({
                        where: { batchId: batchId, active: true }
                    })];
            case 7:
                activeMappingsCount = _b.sent();
                if (activeMappingsCount > 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Cannot archive batch with ".concat(activeMappingsCount, " active faculty mappings.")
                        })];
                }
                _b.label = 8;
            case 8:
                updateData = {};
                if (name_2 !== undefined)
                    updateData.name = name_2;
                if (departmentId !== undefined)
                    updateData.departmentId = departmentId;
                if (currentSemester !== undefined)
                    updateData.currentSemester = currentSemester;
                if (autoRollover !== undefined)
                    updateData.autoRollover = autoRollover;
                if (academicYear !== undefined)
                    updateData.academicYear = academicYear;
                if (archived !== undefined) {
                    updateData.archived = archived;
                    // If archiving, also deactivate
                    // if (archived === true) {
                    //   updateData.isActive = false;
                    // }
                }
                return [4 /*yield*/, index_1.prisma.batch.update({
                        where: { id: batchId },
                        data: updateData,
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
            case 9:
                updatedBatch = _b.sent();
                res.json({
                    success: true,
                    message: 'Batch updated successfully',
                    data: updatedBatch
                });
                return [3 /*break*/, 11];
            case 10:
                error_2 = _b.sent();
                console.error('Update batch error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.updateBatch = updateBatch;
var getBatches = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, page, _c, limit, _d, search, departmentId, isActive, pageNumber, limitNumber, filterConditions, searchCondition, whereCondition, total, batches, error_3;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c, _d = _a.search, search = _d === void 0 ? '' : _d, departmentId = _a.departmentId, isActive = _a.isActive;
                pageNumber = parseInt(page);
                limitNumber = parseInt(limit);
                filterConditions = {};
                if (departmentId) {
                    filterConditions.departmentId = parseInt(departmentId);
                }
                if (isActive !== undefined) {
                    filterConditions.isActive = isActive === 'true';
                }
                searchCondition = search ? {
                    OR: [
                        { name: { contains: search } }
                    ]
                } : {};
                whereCondition = __assign(__assign({}, filterConditions), searchCondition);
                return [4 /*yield*/, index_1.prisma.batch.count({
                        where: whereCondition
                    })];
            case 1:
                total = _e.sent();
                return [4 /*yield*/, index_1.prisma.batch.findMany({
                        where: whereCondition,
                        include: {
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            },
                            _count: {
                                select: {
                                    students: true
                                }
                            }
                        },
                        skip: (pageNumber - 1) * limitNumber,
                        take: limitNumber,
                        orderBy: [
                            { academicYear: 'desc' },
                            { name: 'asc' }
                        ]
                    })];
            case 2:
                batches = _e.sent();
                res.json({
                    success: true,
                    data: {
                        batches: batches,
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
                console.error('Get batches error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getBatches = getBatches;
var getBatchById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, batch, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, index_1.prisma.batch.findUnique({
                        where: { id: parseInt(id) },
                        include: {
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            },
                            _count: {
                                select: {
                                    students: true,
                                    facultyMappings: true
                                }
                            }
                        }
                    })];
            case 1:
                batch = _a.sent();
                if (!batch) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Batch not found'
                        })];
                }
                res.json({
                    success: true,
                    data: batch
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Get batch by ID error:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getBatchById = getBatchById;
var getBatchStudents = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, _b, page, _c, limit, _d, search, pageNumber, limitNumber, batchExists, searchCondition, whereCondition, total, students, error_5;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 4, , 5]);
                id = req.params.id;
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c, _d = _a.search, search = _d === void 0 ? '' : _d;
                pageNumber = parseInt(page);
                limitNumber = parseInt(limit);
                return [4 /*yield*/, index_1.prisma.batch.findUnique({
                        where: { id: parseInt(id) }
                    })];
            case 1:
                batchExists = _e.sent();
                if (!batchExists) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Batch not found'
                        })];
                }
                searchCondition = search ? {
                    OR: [
                        { firstName: { contains: search } },
                        { lastName: { contains: search } },
                        { usn: { contains: search } },
                        { email: { contains: search } },
                    ]
                } : {};
                whereCondition = __assign({ batchId: parseInt(id) }, searchCondition);
                return [4 /*yield*/, index_1.prisma.student.count({
                        where: whereCondition
                    })];
            case 2:
                total = _e.sent();
                return [4 /*yield*/, index_1.prisma.student.findMany({
                        where: whereCondition,
                        select: {
                            usn: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            section: true,
                            semester: true,
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
                            firstName: 'asc'
                        }
                    })];
            case 3:
                students = _e.sent();
                res.json({
                    success: true,
                    data: {
                        students: students,
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
                error_5 = _e.sent();
                console.error('Get batch students error:', error_5);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getBatchStudents = getBatchStudents;
var deleteBatch = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, batchId, studentsCount, existingBatch, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                id = req.params.id;
                batchId = parseInt(id);
                return [4 /*yield*/, index_1.prisma.student.count({
                        where: { batchId: batchId }
                    })];
            case 1:
                studentsCount = _a.sent();
                if (studentsCount > 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Cannot delete batch with associated students'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.batch.findUnique({
                        where: { id: batchId }
                    })];
            case 2:
                existingBatch = _a.sent();
                if (!existingBatch) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Batch not found'
                        })];
                }
                // Delete the batch
                return [4 /*yield*/, index_1.prisma.batch.delete({
                        where: { id: batchId }
                    })];
            case 3:
                // Delete the batch
                _a.sent();
                res.json({
                    success: true,
                    message: 'Batch deleted successfully'
                });
                return [3 /*break*/, 5];
            case 4:
                error_6 = _a.sent();
                console.error('Delete batch error:', error_6);
                // Handle specific Prisma errors
                if (error_6.code === 'P2003') {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Cannot delete batch because it is referenced by other records'
                        })];
                }
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.deleteBatch = deleteBatch;
// New function for semester rollover
var rolloverBatch = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, batchId, userId, batch, MAX_SEMESTER, nextSemester, updatedBatch, error_7;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                batchId = parseInt(id);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return [4 /*yield*/, index_1.prisma.batch.findUnique({
                        where: { id: batchId }
                    })];
            case 1:
                batch = _b.sent();
                if (!batch) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Batch not found'
                        })];
                }
                // Check if batch is archived
                if (batch.archived) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Cannot rollover semester for an archived batch'
                        })];
                }
                MAX_SEMESTER = 8;
                if (batch.currentSemester >= MAX_SEMESTER) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Batch is already in the final semester (".concat(MAX_SEMESTER, ")")
                        })];
                }
                nextSemester = batch.currentSemester + 1;
                return [4 /*yield*/, index_1.prisma.batch.update({
                        where: { id: batchId },
                        data: {
                            currentSemester: nextSemester
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
            case 2:
                updatedBatch = _b.sent();
                // TODO: Optionally, update student semesters in this batch
                // await prisma.student.updateMany({
                //   where: { batchId: batchId },
                //   data: { semester: nextSemester }
                // });
                // Add rollover info to audit context for logging
                if (req.auditContext) {
                    req.auditContext.newValue = __assign(__assign({}, req.auditContext.oldValue), { currentSemester: nextSemester, previousSemester: batch.currentSemester });
                }
                res.json({
                    success: true,
                    message: "Batch semester rolled over successfully to Semester ".concat(nextSemester),
                    data: updatedBatch
                });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _b.sent();
                console.error('Rollover batch error:', error_7);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error during semester rollover'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.rolloverBatch = rolloverBatch;

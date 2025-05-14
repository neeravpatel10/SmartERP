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
exports.validateStatusTransition = exports.getSubjectStatusHistory = exports.archiveSubject = exports.unlockSubject = exports.lockSubject = exports.activateSubject = void 0;
var client_1 = require("@prisma/client");
var examComponentService_1 = require("./examComponentService");
var prisma = new client_1.PrismaClient();
/**
 * Transition a subject from draft to active state
 * Validates that necessary conditions are met before activation
 */
var activateSubject = function (subjectId, userId) { return __awaiter(void 0, void 0, void 0, function () {
    var subject;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.subject.findUnique({
                    where: { id: subjectId },
                    include: {
                        facultyMappings: true,
                        examComponents: true,
                        category: true
                    }
                })];
            case 1:
                subject = _a.sent();
                if (!subject) {
                    throw new Error('Subject not found');
                }
                // Verify subject is in draft state
                if (subject.status !== 'draft') {
                    throw new Error('Only subjects in draft state can be activated');
                }
                // Verify subject has a category assigned
                if (!subject.categoryId) {
                    throw new Error('Subject must have a category assigned before activation');
                }
                // Verify subject has at least one faculty mapping
                if (subject.facultyMappings.length === 0) {
                    throw new Error('Subject must be assigned to at least one faculty member before activation');
                }
                if (!(subject.examComponents.length === 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, examComponentService_1.getDefaultComponentsForSubject)(subjectId)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [4 /*yield*/, prisma.$transaction([
                    prisma.subject.update({
                        where: { id: subjectId },
                        data: { status: 'active' }
                    }),
                    prisma.subjectStatusLog.create({
                        data: {
                            subjectId: subjectId,
                            status: 'active',
                            changedBy: userId
                        }
                    })
                ])];
            case 4: 
            // Update subject status and create a log entry
            return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.activateSubject = activateSubject;
/**
 * Lock a subject, preventing further edits to marks and attendance
 * Validates that necessary conditions are met before locking
 */
var lockSubject = function (subjectId, userId) { return __awaiter(void 0, void 0, void 0, function () {
    var subject, hasComponents, hasMarks;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.subject.findUnique({
                    where: { id: subjectId },
                    include: {
                        examComponents: {
                            include: {
                                studentMarks: true
                            }
                        }
                    }
                })];
            case 1:
                subject = _a.sent();
                if (!subject) {
                    throw new Error('Subject not found');
                }
                // Verify subject is in active state
                if (subject.status !== 'active') {
                    throw new Error('Only active subjects can be locked');
                }
                hasComponents = subject.examComponents.length > 0;
                if (!hasComponents) {
                    throw new Error('Subject must have at least one exam component before locking');
                }
                hasMarks = subject.examComponents.some(function (component) { return component.studentMarks.length > 0; });
                if (!hasMarks) {
                    throw new Error('At least one component should have marks recorded before locking');
                }
                return [4 /*yield*/, prisma.$transaction([
                        prisma.subject.update({
                            where: { id: subjectId },
                            data: {
                                status: 'locked',
                                lockedAt: new Date()
                            }
                        }),
                        prisma.subjectStatusLog.create({
                            data: {
                                subjectId: subjectId,
                                status: 'locked',
                                changedBy: userId
                            }
                        })
                    ])];
            case 2: 
            // Update subject status, set locked timestamp, and create a log entry
            return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.lockSubject = lockSubject;
/**
 * Unlock a locked subject (Super Admin only)
 */
var unlockSubject = function (subjectId, userId) { return __awaiter(void 0, void 0, void 0, function () {
    var subject;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.subject.findUnique({
                    where: { id: subjectId }
                })];
            case 1:
                subject = _a.sent();
                if (!subject) {
                    throw new Error('Subject not found');
                }
                // Verify subject is in locked state
                if (subject.status !== 'locked') {
                    throw new Error('Only locked subjects can be unlocked');
                }
                return [4 /*yield*/, prisma.$transaction([
                        prisma.subject.update({
                            where: { id: subjectId },
                            data: {
                                status: 'active',
                                lockedAt: null
                            }
                        }),
                        prisma.subjectStatusLog.create({
                            data: {
                                subjectId: subjectId,
                                status: 'active',
                                changedBy: userId
                            }
                        })
                    ])];
            case 2: 
            // Update subject status, clear locked timestamp, and create a log entry
            return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.unlockSubject = unlockSubject;
/**
 * Archive a subject, making it read-only
 */
var archiveSubject = function (subjectId, userId) { return __awaiter(void 0, void 0, void 0, function () {
    var subject;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.subject.findUnique({
                    where: { id: subjectId }
                })];
            case 1:
                subject = _a.sent();
                if (!subject) {
                    throw new Error('Subject not found');
                }
                // Verify subject is in locked state
                if (subject.status !== 'locked') {
                    throw new Error('Only locked subjects can be archived');
                }
                return [4 /*yield*/, prisma.$transaction([
                        prisma.subject.update({
                            where: { id: subjectId },
                            data: {
                                status: 'archived',
                                archivedAt: new Date()
                            }
                        }),
                        prisma.subjectStatusLog.create({
                            data: {
                                subjectId: subjectId,
                                status: 'archived',
                                changedBy: userId
                            }
                        })
                    ])];
            case 2: 
            // Update subject status, set archived timestamp, and create a log entry
            return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.archiveSubject = archiveSubject;
/**
 * Get the status history of a subject
 */
var getSubjectStatusHistory = function (subjectId) { return __awaiter(void 0, void 0, void 0, function () {
    var subject;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.subject.findUnique({
                    where: { id: subjectId }
                })];
            case 1:
                subject = _a.sent();
                if (!subject) {
                    throw new Error('Subject not found');
                }
                return [4 /*yield*/, prisma.subjectStatusLog.findMany({
                        where: { subjectId: subjectId },
                        orderBy: { timestamp: 'desc' },
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
            case 2: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.getSubjectStatusHistory = getSubjectStatusHistory;
/**
 * Check if a subject can be transitioned to the given status
 * Returns an object with validation results
 */
var validateStatusTransition = function (subjectId, targetStatus) { return __awaiter(void 0, void 0, void 0, function () {
    var subject, hasCategory, hasFacultyMappings, hasComponents, hasMarks, hasAttendance;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.subject.findUnique({
                    where: { id: subjectId },
                    include: {
                        facultyMappings: true,
                        examComponents: {
                            include: {
                                studentMarks: true
                            }
                        },
                        attendanceSessions: true
                    }
                })];
            case 1:
                subject = _a.sent();
                if (!subject) {
                    throw new Error('Subject not found');
                }
                hasCategory = !!subject.categoryId;
                hasFacultyMappings = subject.facultyMappings.length > 0;
                hasComponents = subject.examComponents.length > 0;
                hasMarks = subject.examComponents.some(function (comp) { return comp.studentMarks.length > 0; });
                hasAttendance = subject.attendanceSessions.length > 0;
                switch (targetStatus) {
                    case 'active':
                        if (subject.status !== 'draft') {
                            return [2 /*return*/, {
                                    valid: false,
                                    message: 'Only subjects in draft state can be activated',
                                    checks: { hasCategory: hasCategory, hasFacultyMappings: hasFacultyMappings, hasComponents: hasComponents }
                                }];
                        }
                        return [2 /*return*/, {
                                valid: hasCategory && hasFacultyMappings,
                                message: hasCategory && hasFacultyMappings ?
                                    'Subject can be activated' :
                                    'Subject does not meet requirements for activation',
                                checks: { hasCategory: hasCategory, hasFacultyMappings: hasFacultyMappings, hasComponents: hasComponents }
                            }];
                    case 'locked':
                        if (subject.status !== 'active') {
                            return [2 /*return*/, {
                                    valid: false,
                                    message: 'Only active subjects can be locked',
                                    checks: { hasComponents: hasComponents, hasMarks: hasMarks, hasAttendance: hasAttendance }
                                }];
                        }
                        return [2 /*return*/, {
                                valid: hasComponents && hasMarks,
                                message: hasComponents && hasMarks ?
                                    'Subject can be locked' :
                                    'Subject does not meet requirements for locking',
                                checks: { hasComponents: hasComponents, hasMarks: hasMarks, hasAttendance: hasAttendance }
                            }];
                    case 'archived':
                        if (subject.status !== 'locked') {
                            return [2 /*return*/, {
                                    valid: false,
                                    message: 'Only locked subjects can be archived',
                                    checks: {}
                                }];
                        }
                        return [2 /*return*/, {
                                valid: true,
                                message: 'Subject can be archived',
                                checks: {}
                            }];
                    default:
                        return [2 /*return*/, {
                                valid: false,
                                message: 'Invalid target status',
                                checks: {}
                            }];
                }
                return [2 /*return*/];
        }
    });
}); };
exports.validateStatusTransition = validateStatusTransition;

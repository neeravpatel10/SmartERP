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
exports.archiveSubjectHandler = exports.unlockSubjectHandler = exports.lockSubjectHandler = exports.activateSubjectHandler = exports.validateTransition = exports.getStatusHistory = void 0;
var subjectLifecycleService_1 = require("../services/subjectLifecycleService");
var client_1 = require("@prisma/client");
/**
 * Get the status history of a subject
 */
var getStatusHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var subjectId, history_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                subjectId = req.params.subjectId;
                return [4 /*yield*/, (0, subjectLifecycleService_1.getSubjectStatusHistory)(parseInt(subjectId))];
            case 1:
                history_1 = _a.sent();
                res.json({
                    success: true,
                    data: history_1
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Get status history error:', error_1);
                if (error_1.message === 'Subject not found') {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getStatusHistory = getStatusHistory;
/**
 * Validate if a subject can transition to a specific status
 */
var validateTransition = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var subjectId, targetStatus, validation, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                subjectId = req.params.subjectId;
                targetStatus = req.body.targetStatus;
                if (!targetStatus || !Object.values(client_1.SubjectStatus).includes(targetStatus)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid target status'
                        })];
                }
                return [4 /*yield*/, (0, subjectLifecycleService_1.validateStatusTransition)(parseInt(subjectId), targetStatus)];
            case 1:
                validation = _a.sent();
                res.json({
                    success: true,
                    data: validation
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Validate transition error:', error_2);
                if (error_2.message === 'Subject not found') {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.validateTransition = validateTransition;
/**
 * Activate a subject (transition from draft to active)
 */
var activateSubjectHandler = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var subjectId, result, error_3, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                subjectId = req.params.subjectId;
                if (!req.user || !req.user.userId) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Unauthorized'
                        })];
                }
                // Restrict to dept admin (loginType=3) and super admin (loginType=1)
                if (req.user.loginType !== 1 && req.user.loginType !== 3) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'You do not have permission to activate subjects'
                        })];
                }
                return [4 /*yield*/, (0, subjectLifecycleService_1.activateSubject)(parseInt(subjectId), req.user.userId)];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    message: 'Subject activated successfully',
                    data: result[0] // Return the updated subject
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Activate subject error:', error_3);
                errorMessage = error_3.message;
                if (errorMessage === 'Subject not found') {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                else if (errorMessage.includes('Only subjects in draft state') ||
                    errorMessage.includes('Subject must have a category') ||
                    errorMessage.includes('Subject must be assigned to at least one faculty')) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: errorMessage
                        })];
                }
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.activateSubjectHandler = activateSubjectHandler;
/**
 * Lock a subject (transition from active to locked)
 */
var lockSubjectHandler = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var subjectId, result, error_4, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                subjectId = req.params.subjectId;
                if (!req.user || !req.user.userId) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Unauthorized'
                        })];
                }
                // Restrict to dept admin (loginType=3) and super admin (loginType=1)
                if (req.user.loginType !== 1 && req.user.loginType !== 3) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'You do not have permission to lock subjects'
                        })];
                }
                return [4 /*yield*/, (0, subjectLifecycleService_1.lockSubject)(parseInt(subjectId), req.user.userId)];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    message: 'Subject locked successfully',
                    data: result[0] // Return the updated subject
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Lock subject error:', error_4);
                errorMessage = error_4.message;
                if (errorMessage === 'Subject not found') {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                else if (errorMessage.includes('Only active subjects') ||
                    errorMessage.includes('Subject must have at least one exam component') ||
                    errorMessage.includes('At least one component should have marks recorded')) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: errorMessage
                        })];
                }
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.lockSubjectHandler = lockSubjectHandler;
/**
 * Unlock a subject (transition from locked to active)
 */
var unlockSubjectHandler = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var subjectId, result, error_5, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                subjectId = req.params.subjectId;
                if (!req.user || !req.user.userId) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Unauthorized'
                        })];
                }
                // Restrict to super admin only (loginType=1)
                if (req.user.loginType !== 1) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Only super admins can unlock subjects'
                        })];
                }
                return [4 /*yield*/, (0, subjectLifecycleService_1.unlockSubject)(parseInt(subjectId), req.user.userId)];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    message: 'Subject unlocked successfully',
                    data: result[0] // Return the updated subject
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Unlock subject error:', error_5);
                errorMessage = error_5.message;
                if (errorMessage === 'Subject not found') {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                else if (errorMessage.includes('Only locked subjects can be unlocked')) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: errorMessage
                        })];
                }
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.unlockSubjectHandler = unlockSubjectHandler;
/**
 * Archive a subject (transition from locked to archived)
 */
var archiveSubjectHandler = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var subjectId, result, error_6, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                subjectId = req.params.subjectId;
                if (!req.user || !req.user.userId) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Unauthorized'
                        })];
                }
                // Restrict to dept admin (loginType=3) and super admin (loginType=1)
                if (req.user.loginType !== 1 && req.user.loginType !== 3) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'You do not have permission to archive subjects'
                        })];
                }
                return [4 /*yield*/, (0, subjectLifecycleService_1.archiveSubject)(parseInt(subjectId), req.user.userId)];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    message: 'Subject archived successfully',
                    data: result[0] // Return the updated subject
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('Archive subject error:', error_6);
                errorMessage = error_6.message;
                if (errorMessage === 'Subject not found') {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Subject not found'
                        })];
                }
                else if (errorMessage.includes('Only locked subjects can be archived')) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: errorMessage
                        })];
                }
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.archiveSubjectHandler = archiveSubjectHandler;

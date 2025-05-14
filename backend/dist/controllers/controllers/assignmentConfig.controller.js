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
exports.removeAssignmentConfig = exports.saveAssignmentConfig = exports.getAssignmentConfig = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
/**
 * Get assignment configurations for a component
 */
var getAssignmentConfig = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var componentId, configs, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                componentId = req.params.componentId;
                return [4 /*yield*/, prisma.assignmentConfig.findMany({
                        where: { componentId: parseInt(componentId) },
                        orderBy: { name: 'asc' }
                    })];
            case 1:
                configs = _a.sent();
                res.json({
                    success: true,
                    data: configs
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Get assignment config error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAssignmentConfig = getAssignmentConfig;
/**
 * Create or update assignment configurations
 */
var saveAssignmentConfig = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var componentId_1, configurations, component, configResults, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                componentId_1 = req.params.componentId;
                configurations = req.body.configurations;
                if (!req.user || !req.user.userId) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Unauthorized'
                        })];
                }
                if (!configurations || !Array.isArray(configurations)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Configurations must be an array'
                        })];
                }
                return [4 /*yield*/, prisma.examComponent.findUnique({
                        where: { id: parseInt(componentId_1) }
                    })];
            case 1:
                component = _a.sent();
                if (!component) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Component not found'
                        })];
                }
                // Delete existing configurations
                return [4 /*yield*/, prisma.assignmentConfig.deleteMany({
                        where: { componentId: parseInt(componentId_1) }
                    })];
            case 2:
                // Delete existing configurations
                _a.sent();
                return [4 /*yield*/, prisma.$transaction(configurations.map(function (config) {
                        var _a;
                        return prisma.assignmentConfig.create({
                            data: {
                                componentId: parseInt(componentId_1),
                                name: config.name,
                                maxMarks: config.maxMarks,
                                weightage: config.weightage,
                                createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId
                            }
                        });
                    }))];
            case 3:
                configResults = _a.sent();
                res.json({
                    success: true,
                    message: 'Assignment configurations updated successfully',
                    data: configResults
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _a.sent();
                console.error('Save assignment config error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.saveAssignmentConfig = saveAssignmentConfig;
/**
 * Delete assignment configurations
 */
var removeAssignmentConfig = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var componentId, hasMarks, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                componentId = req.params.componentId;
                return [4 /*yield*/, prisma.studentComponentMark.findFirst({
                        where: { componentId: parseInt(componentId) }
                    })];
            case 1:
                hasMarks = _a.sent();
                if (hasMarks) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Cannot delete assignment configurations with recorded marks'
                        })];
                }
                return [4 /*yield*/, prisma.assignmentConfig.deleteMany({
                        where: { componentId: parseInt(componentId) }
                    })];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    message: 'Assignment configurations deleted successfully'
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error('Delete assignment config error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.removeAssignmentConfig = removeAssignmentConfig;

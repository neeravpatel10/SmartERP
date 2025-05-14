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
exports.exportAuditLogs = exports.getEntityAuditLogs = exports.getAuditLogs = exports.createAuditLog = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
/**
 * Creates an audit log entry for a user action
 */
var createAuditLog = function (userId, action, entityType, entityId, oldValue, newValue, req) { return __awaiter(void 0, void 0, void 0, function () {
    var ipAddress, userAgent, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                ipAddress = (req === null || req === void 0 ? void 0 : req.ip) || (req === null || req === void 0 ? void 0 : req.headers['x-forwarded-for']) || 'unknown';
                userAgent = (req === null || req === void 0 ? void 0 : req.headers['user-agent']) || 'unknown';
                return [4 /*yield*/, prisma.auditLog.create({
                        data: {
                            userId: userId,
                            action: action,
                            entityType: entityType,
                            entityId: entityId,
                            oldValue: oldValue ? JSON.stringify(oldValue) : null,
                            newValue: newValue ? JSON.stringify(newValue) : null,
                            ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
                            userAgent: userAgent
                        }
                    })];
            case 1: return [2 /*return*/, _a.sent()];
            case 2:
                error_1 = _a.sent();
                console.error('Error creating audit log:', error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createAuditLog = createAuditLog;
/**
 * Retrieves audit logs with filtering options
 */
var getAuditLogs = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (options) {
        var userId, action, entityType, entityId, startDate, endDate, _a, page, _b, limit, where, skip, _c, logs, total;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    userId = options.userId, action = options.action, entityType = options.entityType, entityId = options.entityId, startDate = options.startDate, endDate = options.endDate, _a = options.page, page = _a === void 0 ? 1 : _a, _b = options.limit, limit = _b === void 0 ? 50 : _b;
                    where = {};
                    if (userId)
                        where.userId = userId;
                    if (action)
                        where.action = action;
                    if (entityType)
                        where.entityType = entityType;
                    if (entityId)
                        where.entityId = entityId;
                    if (startDate || endDate) {
                        where.createdAt = {};
                        if (startDate)
                            where.createdAt.gte = startDate;
                        if (endDate)
                            where.createdAt.lte = endDate;
                    }
                    skip = (page - 1) * limit;
                    return [4 /*yield*/, Promise.all([
                            prisma.auditLog.findMany({
                                where: where,
                                include: {
                                    user: {
                                        select: {
                                            username: true,
                                            email: true,
                                            role: true
                                        }
                                    }
                                },
                                orderBy: {
                                    createdAt: 'desc'
                                },
                                skip: skip,
                                take: limit
                            }),
                            prisma.auditLog.count({ where: where })
                        ])];
                case 1:
                    _c = _d.sent(), logs = _c[0], total = _c[1];
                    return [2 /*return*/, {
                            logs: logs,
                            pagination: {
                                total: total,
                                page: page,
                                limit: limit,
                                totalPages: Math.ceil(total / limit)
                            }
                        }];
            }
        });
    });
};
exports.getAuditLogs = getAuditLogs;
/**
 * Retrieves recent audit logs for a specific entity
 */
var getEntityAuditLogs = function (entityType_1, entityId_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([entityType_1, entityId_1], args_1, true), void 0, function (entityType, entityId, limit) {
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma.auditLog.findMany({
                    where: {
                        entityType: entityType,
                        entityId: entityId
                    },
                    include: {
                        user: {
                            select: {
                                username: true,
                                email: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: limit
                })];
        });
    });
};
exports.getEntityAuditLogs = getEntityAuditLogs;
/**
 * Creates formatted data for export
 */
var exportAuditLogs = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (options) {
        var logs;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, exports.getAuditLogs)(__assign(__assign({}, options), { limit: 1000 // Limit export to 1000 records
                     }))];
                case 1:
                    logs = (_a.sent()).logs;
                    return [2 /*return*/, logs.map(function (log) { return ({
                            id: log.id,
                            timestamp: log.createdAt,
                            user: log.user.username,
                            email: log.user.email,
                            role: log.user.role,
                            action: log.action,
                            entityType: log.entityType,
                            entityId: log.entityId,
                            ipAddress: log.ipAddress,
                            userAgent: log.userAgent,
                            oldValue: log.oldValue ? JSON.stringify(log.oldValue) : null,
                            newValue: log.newValue ? JSON.stringify(log.newValue) : null
                        }); })];
            }
        });
    });
};
exports.exportAuditLogs = exportAuditLogs;

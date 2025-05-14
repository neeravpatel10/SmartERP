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
exports.auditLog = exports.captureResponseForAudit = exports.captureEntityState = exports.setAuditContext = exports.logAudit = void 0;
var auditLogService_1 = require("../services/auditLogService");
/**
 * Creates an audit log entry from the current request
 */
var logAudit = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, auditContext, action, entityType, _a, entityId, oldValue, newValue, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                user = req.user, auditContext = req.auditContext;
                // Skip if no user or audit context
                if (!user || !auditContext) {
                    return [2 /*return*/, next()];
                }
                action = auditContext.action, entityType = auditContext.entityType, _a = auditContext.entityId, entityId = _a === void 0 ? '' : _a, oldValue = auditContext.oldValue, newValue = auditContext.newValue;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, auditLogService_1.createAuditLog)(user.userId, action, entityType, entityId, oldValue, newValue, req)];
            case 2:
                _b.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.error('Error in audit logging middleware:', error_1);
                return [3 /*break*/, 4];
            case 4:
                next();
                return [2 /*return*/];
        }
    });
}); };
exports.logAudit = logAudit;
/**
 * Middleware to set audit context for a request
 */
var setAuditContext = function (action, entityType, getEntityId) {
    return function (req, res, next) {
        req.auditContext = {
            action: action,
            entityType: entityType,
            entityId: getEntityId ? getEntityId(req) : undefined
        };
        next();
    };
};
exports.setAuditContext = setAuditContext;
/**
 * Middleware to capture the original entity state before update
 */
var captureEntityState = function (entityType, getEntityId, fetchEntityFn) {
    return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var entityId, originalEntity, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    entityId = getEntityId(req);
                    return [4 /*yield*/, fetchEntityFn(entityId)];
                case 1:
                    originalEntity = _b.sent();
                    if (originalEntity) {
                        req.auditContext = __assign(__assign({}, req.auditContext), { action: ((_a = req.auditContext) === null || _a === void 0 ? void 0 : _a.action) || 'update', entityType: entityType, entityId: entityId, oldValue: originalEntity });
                    }
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _b.sent();
                    console.error('Error capturing entity state:', error_2);
                    next();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
};
exports.captureEntityState = captureEntityState;
/**
 * Captures response data for audit logging
 */
var captureResponseForAudit = function (action, entityType, getEntityIdFromResponse) {
    return function (req, res, next) {
        // Store the original send function
        var originalSend = res.send;
        // Override the send function
        res.send = function (body) {
            var _a;
            // Parse the response body if it's JSON
            try {
                var data = typeof body === 'string' ? JSON.parse(body) : body;
                // Only log successful responses
                if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
                    var entityId = getEntityIdFromResponse(data);
                    req.auditContext = {
                        action: action,
                        entityType: entityType,
                        entityId: entityId,
                        newValue: data
                    };
                    // Perform audit logging
                    if (req.user) {
                        (0, auditLogService_1.createAuditLog)(req.user.userId, action, entityType, entityId, (_a = req.auditContext) === null || _a === void 0 ? void 0 : _a.oldValue, data, req).catch(function (err) { return console.error('Error logging audit from response:', err); });
                    }
                }
            }
            catch (error) {
                console.error('Error in response capture middleware:', error);
            }
            // Call the original send function
            return originalSend.call(this, body);
        };
        next();
    };
};
exports.captureResponseForAudit = captureResponseForAudit;
// Simple audit logging middleware for GET requests or simple actions
var auditLog = function (actionDescription) {
    return function (req, res, next) {
        if (!req.auditContext) {
            req.auditContext = {};
        }
        req.auditContext.action = actionDescription;
        // No entity capture needed here, just log the action
        // The actual logging will happen in the `logAudit` middleware if used after this,
        // or needs to be called explicitly if this is the only audit middleware for the route.
        // For now, we assume logAudit will be used later or this is informational.
        console.log("Audit context set for action: ".concat(actionDescription));
        next();
    };
};
exports.auditLog = auditLog;

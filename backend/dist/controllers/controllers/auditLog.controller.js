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
exports.exportAuditLogEntries = exports.getEntityHistory = exports.getAuditLogEntries = void 0;
var auditLogService_1 = require("../services/auditLogService");
var ExcelJS = require("exceljs");
/**
 * Get paginated audit logs with filtering
 */
var getAuditLogEntries = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, action, entityType, entityId, startDate, endDate, _b, page, _c, limit, filters, endDateTime, result, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                _a = req.query, userId = _a.userId, action = _a.action, entityType = _a.entityType, entityId = _a.entityId, startDate = _a.startDate, endDate = _a.endDate, _b = _a.page, page = _b === void 0 ? '1' : _b, _c = _a.limit, limit = _c === void 0 ? '50' : _c;
                filters = {
                    page: parseInt(page),
                    limit: parseInt(limit)
                };
                if (userId)
                    filters.userId = parseInt(userId);
                if (action)
                    filters.action = action;
                if (entityType)
                    filters.entityType = entityType;
                if (entityId)
                    filters.entityId = entityId;
                if (startDate)
                    filters.startDate = new Date(startDate);
                if (endDate) {
                    endDateTime = new Date(endDate);
                    endDateTime.setHours(23, 59, 59, 999);
                    filters.endDate = endDateTime;
                }
                return [4 /*yield*/, (0, auditLogService_1.getAuditLogs)(filters)];
            case 1:
                result = _d.sent();
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: result.logs,
                        pagination: result.pagination
                    })];
            case 2:
                error_1 = _d.sent();
                console.error('Error fetching audit logs:', error_1);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to retrieve audit logs',
                        error: error_1.message
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAuditLogEntries = getAuditLogEntries;
/**
 * Get audit logs for a specific entity
 */
var getEntityHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, entityType, entityId, _b, limit, logs, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.params, entityType = _a.entityType, entityId = _a.entityId;
                _b = req.query.limit, limit = _b === void 0 ? '10' : _b;
                return [4 /*yield*/, (0, auditLogService_1.getEntityAuditLogs)(entityType, entityId, parseInt(limit))];
            case 1:
                logs = _c.sent();
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: logs
                    })];
            case 2:
                error_2 = _c.sent();
                console.error('Error fetching entity audit logs:', error_2);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to retrieve entity history',
                        error: error_2.message
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getEntityHistory = getEntityHistory;
/**
 * Export audit logs to Excel
 */
var exportAuditLogEntries = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, action, entityType, entityId, startDate, endDate, filters, endDateTime, logs, workbook, worksheet, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.query, userId = _a.userId, action = _a.action, entityType = _a.entityType, entityId = _a.entityId, startDate = _a.startDate, endDate = _a.endDate;
                filters = {};
                if (userId)
                    filters.userId = parseInt(userId);
                if (action)
                    filters.action = action;
                if (entityType)
                    filters.entityType = entityType;
                if (entityId)
                    filters.entityId = entityId;
                if (startDate)
                    filters.startDate = new Date(startDate);
                if (endDate) {
                    endDateTime = new Date(endDate);
                    endDateTime.setHours(23, 59, 59, 999);
                    filters.endDate = endDateTime;
                }
                return [4 /*yield*/, (0, auditLogService_1.exportAuditLogs)(filters)];
            case 1:
                logs = _b.sent();
                workbook = new ExcelJS.Workbook();
                worksheet = workbook.addWorksheet('Audit Logs');
                // Define columns
                worksheet.columns = [
                    { header: 'ID', key: 'id', width: 10 },
                    { header: 'Timestamp', key: 'timestamp', width: 20 },
                    { header: 'User', key: 'user', width: 20 },
                    { header: 'Email', key: 'email', width: 25 },
                    { header: 'Role', key: 'role', width: 15 },
                    { header: 'Action', key: 'action', width: 20 },
                    { header: 'Entity Type', key: 'entityType', width: 20 },
                    { header: 'Entity ID', key: 'entityId', width: 15 },
                    { header: 'IP Address', key: 'ipAddress', width: 15 },
                    { header: 'User Agent', key: 'userAgent', width: 30 },
                    { header: 'Old Value', key: 'oldValue', width: 40 },
                    { header: 'New Value', key: 'newValue', width: 40 }
                ];
                // Add rows
                worksheet.addRows(logs);
                // Format timestamp cells
                worksheet.getColumn('timestamp').numFmt = 'yyyy-mm-dd hh:mm:ss';
                // Set response headers
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', "attachment; filename=audit_logs_".concat(new Date().toISOString().split('T')[0], ".xlsx"));
                // Write to response
                return [4 /*yield*/, workbook.xlsx.write(res)];
            case 2:
                // Write to response
                _b.sent();
                res.end();
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                console.error('Error exporting audit logs:', error_3);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to export audit logs',
                        error: error_3.message
                    })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.exportAuditLogEntries = exportAuditLogEntries;

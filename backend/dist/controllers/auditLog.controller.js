"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAuditLogEntries = exports.getEntityHistory = exports.getAuditLogEntries = void 0;
const auditLogService_1 = require("../services/auditLogService");
const ExcelJS = __importStar(require("exceljs"));
/**
 * Get paginated audit logs with filtering
 */
const getAuditLogEntries = async (req, res) => {
    try {
        const { userId, action, entityType, entityId, startDate, endDate, page = '1', limit = '50' } = req.query;
        const filters = {
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
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            filters.endDate = endDateTime;
        }
        const result = await (0, auditLogService_1.getAuditLogs)(filters);
        return res.status(200).json({
            success: true,
            data: result.logs,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit logs',
            error: error.message
        });
    }
};
exports.getAuditLogEntries = getAuditLogEntries;
/**
 * Get audit logs for a specific entity
 */
const getEntityHistory = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const { limit = '10' } = req.query;
        const logs = await (0, auditLogService_1.getEntityAuditLogs)(entityType, entityId, parseInt(limit));
        return res.status(200).json({
            success: true,
            data: logs
        });
    }
    catch (error) {
        console.error('Error fetching entity audit logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve entity history',
            error: error.message
        });
    }
};
exports.getEntityHistory = getEntityHistory;
/**
 * Export audit logs to Excel
 */
const exportAuditLogEntries = async (req, res) => {
    try {
        const { userId, action, entityType, entityId, startDate, endDate } = req.query;
        const filters = {};
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
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            filters.endDate = endDateTime;
        }
        const logs = await (0, auditLogService_1.exportAuditLogs)(filters);
        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Audit Logs');
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
        res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error('Error exporting audit logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to export audit logs',
            error: error.message
        });
    }
};
exports.exportAuditLogEntries = exportAuditLogEntries;

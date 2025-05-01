import { Request, Response } from 'express';
import { getAuditLogs, exportAuditLogs, getEntityAuditLogs } from '../services/auditLogService';
import * as ExcelJS from 'exceljs';

/**
 * Get paginated audit logs with filtering
 */
export const getAuditLogEntries = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (userId) filters.userId = parseInt(userId as string);
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) {
      const endDateTime = new Date(endDate as string);
      endDateTime.setHours(23, 59, 59, 999);
      filters.endDate = endDateTime;
    }

    const result = await getAuditLogs(filters);

    return res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs',
      error: (error as Error).message
    });
  }
};

/**
 * Get audit logs for a specific entity
 */
export const getEntityHistory = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = '10' } = req.query;

    const logs = await getEntityAuditLogs(
      entityType,
      entityId,
      parseInt(limit as string)
    );

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching entity audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve entity history',
      error: (error as Error).message
    });
  }
};

/**
 * Export audit logs to Excel
 */
export const exportAuditLogEntries = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate
    } = req.query;

    const filters: any = {};

    if (userId) filters.userId = parseInt(userId as string);
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) {
      const endDateTime = new Date(endDate as string);
      endDateTime.setHours(23, 59, 59, 999);
      filters.endDate = endDateTime;
    }

    const logs = await exportAuditLogs(filters);

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
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: (error as Error).message
    });
  }
}; 
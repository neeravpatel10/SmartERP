import { Request, Response } from 'express';
import { getReportGridData, exportReportData, PASS_MARK_PERCENTAGE } from './report.service';
import { reportGridParamsSchema, reportExportParamsSchema } from './report.validation';

/**
 * Get marks report grid data with filtering based on user role
 */
export const getGridData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse and validate query parameters
    const params = reportGridParamsSchema.parse(req.query);
    
    // Extract user data from JWT token (set by auth middleware)
    const userId = req.user?.userId;
    const loginType = req.user?.loginType;
    
    if (!userId || loginType === undefined) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
        data: null
      });
      return;
    }
    
    // Get grid data with role-based filtering
    const gridData = await getReportGridData(params, userId, loginType);
    
    // Send the response
    res.status(200).json({
      success: true,
      message: 'Marks report data retrieved successfully',
      data: gridData
    });
  } catch (error: any) {
    console.error('Error fetching marks report data:', error);
    res.status(error.status || 400).json({
      success: false,
      message: error.message || 'Failed to retrieve marks report data',
      data: null
    });
  }
};

/**
 * Export marks report data in specified format (XLSX, CSV, PDF)
 */
export const exportData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse and validate query parameters
    const params = reportExportParamsSchema.parse(req.query);
    
    // Extract user data from JWT token (set by auth middleware)
    const userId = req.user?.userId;
    const loginType = req.user?.loginType;
    
    if (!userId || loginType === undefined) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
        data: null
      });
      return;
    }
    
    // Generate the export file
    const { buffer, filename, mimeType } = await exportReportData(params, userId, loginType);
    
    // Set response headers for file download
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Length', buffer.length);
    
    // Send the file buffer
    res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting marks report:', error);
    res.status(error.status || 400).json({
      success: false,
      message: error.message || 'Failed to export marks report',
      data: null
    });
  }
};

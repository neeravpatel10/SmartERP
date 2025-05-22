import { Request, Response, NextFunction } from 'express';
import { gridQuerySchema, entryPatchSchema, templateQuerySchema } from './validation';
import * as service from './components.service';
import { ApiError } from '../../../utils/errors';
import * as Excel from 'exceljs';

// Get the grid data with students and their marks
export async function grid(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = gridQuerySchema.safeParse(req.query);
    
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid request parameters', parsed.error.errors);
    }
    
    const result = await service.getComponentGrid(parsed.data);
    
    return res.json({
      success: true,
      message: 'Component grid data retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// Update a single mark entry
export async function patchEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = entryPatchSchema.safeParse(req.body);
    
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid request body', parsed.error.errors);
    }
    
    const result = await service.upsertComponentMark(parsed.data);
    
    return res.json({
      success: true,
      message: 'Marks updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// Generate and return an Excel template
export async function template(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = templateQuerySchema.safeParse(req.query);
    
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid request parameters', parsed.error.errors);
    }
    
    const workbook = await service.generateTemplate(parsed.data);
    
    // Set headers for Excel download
    const componentLabels: Record<string, string> = {
      'A1': 'Assignment1',
      'A2': 'Assignment2',
      'QZ': 'Quiz',
      'SM': 'Seminar',
    };
    
    const filename = `${componentLabels[parsed.data.component]}_Attempt${parsed.data.attemptNo}_Template.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    await workbook.xlsx.write(res);
  } catch (error) {
    next(error);
  }
}

// Process an uploaded Excel file
export async function uploadExcel(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }
    
    // Validate query parameters
    const { subjectId, component, attemptNo } = req.body;
    
    if (!subjectId || !component || !attemptNo) {
      throw new ApiError(400, 'Missing required parameters: subjectId, component, attemptNo');
    }
    
    // Process the uploaded file
    const result = await service.processUploadedExcel(
      parseInt(subjectId),
      component,
      parseInt(attemptNo),
      req.file.buffer
    );
    
    return res.json({
      success: true,
      message: `Processed ${result.totalProcessed} entries with ${result.successCount} successes and ${result.failureCount} failures`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

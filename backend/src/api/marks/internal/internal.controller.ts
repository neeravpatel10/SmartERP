import { Request, Response } from 'express';
import * as internalService from './internal.service';
import { ApiResponse } from '../../../types/api';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { 
  blueprintSchema, 
  singleMarkEntrySchema, 
  internalBlueprintParams
} from './internal.validation';

const prisma = new PrismaClient();

/**
 * Create a new internal exam blueprint
 */
export const createBlueprint = async (req: Request, res: Response): Promise<void> => {
  try {
    // Log the user object for debugging
    console.log('createBlueprint controller - user object:', req.user);
    
    const validatedData = blueprintSchema.parse(req.body);
    // Fix: use userId from JWT payload (not id)
    const userId = req.user?.userId;
    
    if (!userId) {
      console.error('User ID not found in request. User object:', req.user);
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
        data: null
      };
      res.status(401).json(response);
      return;
    }

    const result = await internalService.createBlueprint({
      ...validatedData,
      createdBy: userId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Blueprint created successfully',
      data: result
    };
    
    res.status(201).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Failed to create blueprint',
      data: null
    };
    res.status(400).json(response);
  }
};

/**
 * Get blueprint by subject ID and CIE number
 */
export const getBlueprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId, cieNo } = internalBlueprintParams.parse(req.query);
    
    const blueprint = await internalService.getBlueprint(
      Number(subjectId), 
      Number(cieNo)
    );
    
    if (!blueprint) {
      const response: ApiResponse = {
        success: false,
        message: 'Blueprint not found',
        data: null
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Blueprint retrieved successfully',
      data: blueprint
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Failed to retrieve blueprint',
      data: null
    };
    res.status(400).json(response);
  }
};

/**
 * Update an existing blueprint
 */
export const updateBlueprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const blueprintId = Number(req.params.id);
    const validatedData = blueprintSchema.parse(req.body);
    
    // Log the user object for debugging
    console.log('updateBlueprint controller - user object:', req.user);
    
    // Fix: use userId from JWT payload (not id)
    const userId = req.user?.userId;
    
    if (!userId) {
      console.error('User ID not found in request. User object:', req.user);
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
        data: null
      };
      res.status(401).json(response);
      return;
    }

    // Check if blueprint exists and was created by current user
    const existingBlueprint = await prisma.internalexamblueprint.findUnique({
      where: { id: blueprintId }
    });

    if (!existingBlueprint) {
      const response: ApiResponse = {
        success: false,
        message: 'Blueprint not found',
        data: null
      };
      res.status(404).json(response);
      return;
    }

    // Only check creator if user is faculty (loginType 2)
    // Skip this check for admins (loginType 1) and dept admins (loginType 3)
    if (req.user?.loginType === 2 && existingBlueprint.createdBy !== userId) {
      console.log('Permission check: blueprint.createdBy=', existingBlueprint.createdBy, 'userId=', userId);
      const response: ApiResponse = {
        success: false,
        message: 'You can only update blueprints created by you',
        data: null
      };
      res.status(403).json(response);
      return;
    }

    const updatedBlueprint = await internalService.updateBlueprint(
      blueprintId, 
      validatedData
    );

    const response: ApiResponse = {
      success: true,
      message: 'Blueprint updated successfully',
      data: updatedBlueprint
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Failed to update blueprint',
      data: null
    };
    res.status(400).json(response);
  }
};

/**
 * Get the grid data for a given subject and CIE
 */
export const getGridData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId, cieNo } = internalBlueprintParams.parse(req.query);
    
    const gridData = await internalService.getGridData(
      Number(subjectId), 
      Number(cieNo)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Grid data retrieved successfully',
      data: gridData
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Failed to retrieve grid data',
      data: null
    };
    res.status(400).json(response);
  }
};

/**
 * Save a single mark entry for a student's subquestion
 */
export const saveSingleMark = async (req: Request, res: Response): Promise<void> => {
  try {
    // Log the user object for debugging
    console.log('saveSingleMark controller - user object:', req.user);
    
    const validatedData = singleMarkEntrySchema.parse(req.body);
    
    // We could add permission checks here if needed
    // const userId = req.user?.userId;
    
    const result = await internalService.saveSingleMark(
      validatedData.subqId, 
      validatedData.studentUsn, 
      validatedData.marks
    );

    const response: ApiResponse = {
      success: true,
      message: 'Marks saved successfully',
      data: result
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error saving mark:', error);
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Failed to save marks',
      data: null
    };
    res.status(400).json(response);
  }
};

/**
 * Upload marks from an Excel file
 */
export const uploadMarks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        message: 'No file uploaded',
        data: null
      };
      res.status(400).json(response);
      return;
    }

    const { subjectId, cieNo } = internalBlueprintParams.parse(req.query);
    
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    const result = await internalService.processExcelUpload(
      workbook, 
      Number(subjectId), 
      Number(cieNo)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Marks uploaded successfully',
      data: result
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Failed to upload marks',
      data: null
    };
    res.status(400).json(response);
  }
};

/**
 * Generate and download an Excel template
 */
export const getExcelTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId, cieNo } = internalBlueprintParams.parse(req.query);
    
    const template = await internalService.generateExcelTemplate(
      Number(subjectId), 
      Number(cieNo)
    );

    if (!template) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to generate template',
        data: null
      };
      res.status(404).json(response);
      return;
    }

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=internal_marks_template_${subjectId}_${cieNo}.xlsx`);

    // Send the buffer
    res.send(template);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Failed to generate template',
      data: null
    };
    res.status(400).json(response);
  }
};

import { Request, Response } from 'express';
import * as subjectService from '../services/subjectService';
import { SubjectStatus } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all subjects
export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await subjectService.getAllSubjects();
    res.status(200).json({
      success: true,
      message: 'Subjects retrieved successfully',
      data: subjects
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// Get subject by ID
export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subject = await subjectService.getSubjectById(Number(id));
    
    if (!subject) {
      return res.status(404).json({ 
        success: false,
        message: 'Subject not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Subject retrieved successfully',
      data: subject
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Create new subject
export const createSubject = async (req: Request, res: Response) => {
  try {
    const subjectData = req.body;
    const userId = (req as any).user.id; // Get user ID from auth middleware
    
    const subject = await subjectService.createSubject(subjectData, userId);
    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update subject
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subjectData = req.body;
    
    const subject = await subjectService.updateSubject(Number(id), subjectData);
    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete subject
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await subjectService.deleteSubject(Number(id));
    res.status(200).json({ 
      success: true,
      message: 'Subject deleted successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update subject status
export const updateSubjectStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.id; // Get user ID from auth middleware
    
    // Validate status
    if (!Object.values(SubjectStatus).includes(status as SubjectStatus)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status' 
      });
    }
    
    // Get the current subject to check its status
    const currentSubject = await subjectService.getSubjectById(Number(id));
    if (!currentSubject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Transitioning from draft to active: validate that the subject has all required components
    if (currentSubject.status === SubjectStatus.draft && status === SubjectStatus.active) {
      // Check if the subject has at least one internal and one external component
      const examComponents = await prisma.examcomponent.findMany({
        where: { subjectId: Number(id) }
      });
      
      const hasInternalComponent = examComponents.some(c => c.componentType === 'internal');
      const hasExternalComponent = examComponents.some(c => c.componentType === 'external');
      
      if (!hasInternalComponent || !hasExternalComponent) {
        return res.status(400).json({
          success: false,
          message: 'Subject must have at least one internal and one external assessment component before it can be activated'
        });
      }
    }
    
    const subject = await subjectService.updateSubjectStatus(
      Number(id), 
      status as SubjectStatus,
      userId
    );
    
    res.status(200).json({
      success: true,
      message: `Subject status updated to ${status}`,
      data: subject
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get subject status history
export const getSubjectStatusHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const statusHistory = await subjectService.getSubjectStatusHistory(Number(id));
    res.status(200).json({
      success: true,
      message: 'Subject status history retrieved successfully',
      data: statusHistory
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get subjects by status
export const getSubjectsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    
    // Validate status
    if (!Object.values(SubjectStatus).includes(status as SubjectStatus)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status' 
      });
    }
    
    const subjects = await subjectService.getSubjectsByStatus(status as SubjectStatus);
    res.status(200).json({
      success: true,
      message: `Subjects with status '${status}' retrieved successfully`,
      data: subjects
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get subjects by department
export const getSubjectsByDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    
    const subjects = await subjectService.getSubjectsByDepartment(Number(departmentId));
    res.status(200).json({
      success: true,
      message: `Subjects for department ${departmentId} retrieved successfully`,
      data: subjects
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}; 
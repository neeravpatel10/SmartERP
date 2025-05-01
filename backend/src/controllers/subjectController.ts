import { Request, Response } from 'express';
import * as subjectService from '../services/subjectService';
import { SubjectStatus } from '@prisma/client';

// Get all subjects
export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await subjectService.getAllSubjects();
    res.status(200).json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get subject by ID
export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subject = await subjectService.getSubjectById(Number(id));
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.status(200).json(subject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Create new subject
export const createSubject = async (req: Request, res: Response) => {
  try {
    const subjectData = req.body;
    const userId = (req as any).user.id; // Get user ID from auth middleware
    
    const subject = await subjectService.createSubject(subjectData, userId);
    res.status(201).json(subject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update subject
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subjectData = req.body;
    
    const subject = await subjectService.updateSubject(Number(id), subjectData);
    res.status(200).json(subject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete subject
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await subjectService.deleteSubject(Number(id));
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const subject = await subjectService.updateSubjectStatus(
      Number(id), 
      status as SubjectStatus,
      userId
    );
    
    res.status(200).json(subject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get subject status history
export const getSubjectStatusHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const statusHistory = await subjectService.getSubjectStatusHistory(Number(id));
    res.status(200).json(statusHistory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get subjects by status
export const getSubjectsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    
    // Validate status
    if (!Object.values(SubjectStatus).includes(status as SubjectStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const subjects = await subjectService.getSubjectsByStatus(status as SubjectStatus);
    res.status(200).json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get subjects by department
export const getSubjectsByDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    
    const subjects = await subjectService.getSubjectsByDepartment(Number(departmentId));
    res.status(200).json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 
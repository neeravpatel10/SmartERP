import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to check if the faculty has access to the specified subject
 * based on their mappings
 */
export const facultySubjectCheck = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const subjectId = req.params.subjectId || req.body.subjectId;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - User not authenticated'
    });
  }

  // Validate subjectId format to prevent 400 errors as seen in memory
  if (!subjectId || isNaN(Number(subjectId))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subject ID format'
    });
  }
  
  // Super admin (login type 1) has access to all subjects
  if (user.loginType === 1) {
    return next();
  }
  
  // Department Admins (login type 3) should have automatic access to all subjects
  // as per memory about department admins having dual role
  if (user.loginType === 3) {
    // Department admin gets automatic access
    return next();
  }
  
  // Check if the user is a faculty member
  if (user.loginType !== 2) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Faculty access required'
    });
  }

  try {
    // Convert IDs to proper format to ensure consistent comparison
    const numericSubjectId = Number(subjectId);
    const facultyId = Number(user.id);
    
    // Check if the faculty is mapped to this subject
    const mapping = await prisma.faculty_subject_mapping.findFirst({
      where: {
        facultyId: facultyId,
        subjectId: numericSubjectId,
        active: true
      }
    });

    if (!mapping) {
      return res.status(403).json({
        success: false,
        message: 'You are not mapped to this subject'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking faculty subject access:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

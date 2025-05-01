import { Request, Response } from 'express';
import { 
  activateSubject,
  lockSubject,
  unlockSubject,
  archiveSubject,
  getSubjectStatusHistory,
  validateStatusTransition
} from '../services/subjectLifecycleService';
import { SubjectStatus } from '@prisma/client';

// Type for JWT payload in the auth middleware
interface JwtUserPayload {
  userId: number;
  username: string;
  loginType: number;
}

// Request with authenticated user
interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

/**
 * Get the status history of a subject
 */
export const getStatusHistory = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    
    const history = await getSubjectStatusHistory(parseInt(subjectId));
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get status history error:', error);
    
    if ((error as Error).message === 'Subject not found') {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Validate if a subject can transition to a specific status
 */
export const validateTransition = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const { targetStatus } = req.body;
    
    if (!targetStatus || !Object.values(SubjectStatus).includes(targetStatus as SubjectStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target status'
      });
    }
    
    const validation = await validateStatusTransition(
      parseInt(subjectId), 
      targetStatus as SubjectStatus
    );
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Validate transition error:', error);
    
    if ((error as Error).message === 'Subject not found') {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Activate a subject (transition from draft to active)
 */
export const activateSubjectHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId } = req.params;
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Restrict to dept admin (loginType=3) and super admin (loginType=1)
    if (req.user.loginType !== 1 && req.user.loginType !== 3) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to activate subjects'
      });
    }
    
    const result = await activateSubject(parseInt(subjectId), req.user.userId);
    
    res.json({
      success: true,
      message: 'Subject activated successfully',
      data: result[0] // Return the updated subject
    });
  } catch (error) {
    console.error('Activate subject error:', error);
    
    const errorMessage = (error as Error).message;
    
    if (errorMessage === 'Subject not found') {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    } else if (
      errorMessage.includes('Only subjects in draft state') ||
      errorMessage.includes('Subject must have a category') ||
      errorMessage.includes('Subject must be assigned to at least one faculty')
    ) {
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Lock a subject (transition from active to locked)
 */
export const lockSubjectHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId } = req.params;
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Restrict to dept admin (loginType=3) and super admin (loginType=1)
    if (req.user.loginType !== 1 && req.user.loginType !== 3) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to lock subjects'
      });
    }
    
    const result = await lockSubject(parseInt(subjectId), req.user.userId);
    
    res.json({
      success: true,
      message: 'Subject locked successfully',
      data: result[0] // Return the updated subject
    });
  } catch (error) {
    console.error('Lock subject error:', error);
    
    const errorMessage = (error as Error).message;
    
    if (errorMessage === 'Subject not found') {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    } else if (
      errorMessage.includes('Only active subjects') ||
      errorMessage.includes('Subject must have at least one exam component') ||
      errorMessage.includes('At least one component should have marks recorded')
    ) {
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Unlock a subject (transition from locked to active)
 */
export const unlockSubjectHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId } = req.params;
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Restrict to super admin only (loginType=1)
    if (req.user.loginType !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can unlock subjects'
      });
    }
    
    const result = await unlockSubject(parseInt(subjectId), req.user.userId);
    
    res.json({
      success: true,
      message: 'Subject unlocked successfully',
      data: result[0] // Return the updated subject
    });
  } catch (error) {
    console.error('Unlock subject error:', error);
    
    const errorMessage = (error as Error).message;
    
    if (errorMessage === 'Subject not found') {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    } else if (errorMessage.includes('Only locked subjects can be unlocked')) {
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Archive a subject (transition from locked to archived)
 */
export const archiveSubjectHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId } = req.params;
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Restrict to dept admin (loginType=3) and super admin (loginType=1)
    if (req.user.loginType !== 1 && req.user.loginType !== 3) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to archive subjects'
      });
    }
    
    const result = await archiveSubject(parseInt(subjectId), req.user.userId);
    
    res.json({
      success: true,
      message: 'Subject archived successfully',
      data: result[0] // Return the updated subject
    });
  } catch (error) {
    console.error('Archive subject error:', error);
    
    const errorMessage = (error as Error).message;
    
    if (errorMessage === 'Subject not found') {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    } else if (errorMessage.includes('Only locked subjects can be archived')) {
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 
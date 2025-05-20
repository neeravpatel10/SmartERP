import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the user has one of the allowed roles
 * @param allowedRoles Array of allowed role IDs
 */
export const checkRole = (allowedRoles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not authenticated'
      });
    }

    if (allowedRoles.includes(user.loginType)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden - Insufficient permissions'
    });
  };
};

/**
 * Middleware to check if the user is a faculty member or department admin
 * Following the ERP convention, loginType 2 = faculty, loginType 3 = department admin
 */
export const isFaculty = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - User not authenticated'
    });
  }
  
  // Check if user is faculty (includes department admins)
  // Department Admins (login type 3) should be considered as faculty members
  // in addition to their admin role
  const isFacultyMember = user.loginType === 2 || user.loginType === 3;

  if (isFacultyMember) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden - Faculty access required'
  });
};

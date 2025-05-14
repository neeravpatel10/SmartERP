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

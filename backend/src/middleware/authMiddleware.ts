import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define interfaces
interface AuthRequest extends Request {
  user?: any;
}

// Authenticate JWT token
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    // Add user to request with appropriate properties
    req.user = {
      userId: user.id,
      username: user.username,
      loginType: user.loginType,
      departmentId: user.departmentId
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Authorize by user role
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Map loginType to role name
    let userRole: string;
    
    switch (req.user.loginType) {
      case 1:
        userRole = 'super_admin';
        break;
      case 2:
        userRole = 'faculty';
        break;
      case 3:
        userRole = 'dept_admin';
        break;
      case -1:
        userRole = 'student';
        break;
      default:
        userRole = 'unknown';
    }
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to perform this action'
      });
    }
    
    next();
  };
}; 
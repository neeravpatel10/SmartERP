import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { loginSchema, changePasswordSchema, passwordResetRequestSchema, passwordResetConfirmSchema } from '../utils/validation';
import { randomBytes } from 'crypto';

// Interface to match with middleware/auth.ts
interface JwtPayload {
  userId: number;
  username: string;
  loginType: number;
  departmentId?: number;
}

// Maximum failed login attempts before account lockout
const MAX_FAILED_ATTEMPTS = 5;

// Lockout duration in milliseconds (30 minutes)
const LOCKOUT_DURATION = 30 * 60 * 1000;

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        student: true,
        faculty: true,
        department: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const timeRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${timeRemaining} minutes.`
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      
      // Determine if account should be locked
      const updateData: any = { failedLoginAttempts: failedAttempts };
      
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
      }
      
      // Update the user record with increased failed attempts and potential lock
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts)
      });
    }

    // Successful login: reset failed attempts counter and clear any lock
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    // Generate JWT
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      loginType: user.loginType
    };
    
    if (user.departmentId) payload.departmentId = user.departmentId;

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    // Use type assertion to bypass TypeScript error
    // @ts-ignore
    const token = jwt.sign(payload, jwtSecret, { expiresIn });

    // Prepare user data for response
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      loginType: user.loginType,
      department: user.department,
      firstLogin: user.firstLogin
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        firstLogin: false
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // First fetch the basic user data
    const baseUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true
      }
    });

    if (!baseUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare the response data
    let userData: any = {
      id: baseUser.id,
      username: baseUser.username,
      email: baseUser.email,
      loginType: baseUser.loginType,
      departmentId: baseUser.departmentId,
      firstLogin: baseUser.firstLogin,
      department: baseUser.department,
      createdAt: baseUser.createdAt,
      updatedAt: baseUser.updatedAt
    };

    // Fetch additional data based on user role
    if (baseUser.loginType === -1) {
      // Student - fetch student details
      const studentData = await prisma.student.findUnique({
        where: { userId: userId },
        include: {
          batch: true,
          semester: true,
          section: true
        }
      });

      if (studentData) {
        userData = {
          ...userData,
          student: studentData,
          name: studentData.name || baseUser.username,
          usn: studentData.usn,
          gender: studentData.gender,
          dateOfBirth: studentData.dateOfBirth,
          phone: studentData.phone,
          address: studentData.address,
          batchName: studentData?.batch?.name,
          semesterName: studentData?.semester?.name,
          sectionName: studentData?.section?.name
        };
      }
    } else if (baseUser.loginType === 2 || baseUser.loginType === 3) {
      // Faculty or Dept Admin - fetch faculty details
      const facultyData = await prisma.faculty.findUnique({
        where: { userId: userId }
      });

      if (facultyData) {
        userData = {
          ...userData,
          faculty: facultyData,
          name: facultyData.name || baseUser.username,
          gender: facultyData.gender,
          dateOfBirth: facultyData.dateOfBirth,
          phone: facultyData.phone,
          address: facultyData.address,
          designation: facultyData.designation,
          qualification: facultyData.qualification,
          joinDate: facultyData.joinDate,
          experience: facultyData.experience
        };
      }
    }

    console.log('Fetched user data:', userData);

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { email }
    });

    if (!user) {
      // For security reasons, don't reveal whether the email exists
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate a reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store the reset token in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // In a real application, send an email with the reset link
    // For this example, we'll just return the token in the response
    // In production, you would use an email service to send a link like:
    // https://yourdomain.com/reset-password?token=${resetToken}

    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
      // Only included for development/testing
      debug: {
        resetToken,
        resetUrl: `https://yourdomain.com/reset-password?token=${resetToken}`
      }
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const confirmPasswordReset = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with this reset token and ensure it's not expired
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        firstLogin: false
      }
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// New method to unlock account
export const unlockAccount = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Reset the failed attempts and remove lock
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    res.json({
      success: true,
      message: 'Account unlocked successfully'
    });
  } catch (error) {
    console.error('Unlock account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 
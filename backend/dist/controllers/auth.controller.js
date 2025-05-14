"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlockAccount = exports.confirmPasswordReset = exports.requestPasswordReset = exports.getCurrentUser = exports.changePassword = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const crypto_1 = require("crypto");
// Maximum failed login attempts before account lockout
const MAX_FAILED_ATTEMPTS = 5;
// Lockout duration in milliseconds (30 minutes)
const LOCKOUT_DURATION = 30 * 60 * 1000;
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await index_1.prisma.user.findUnique({
            where: { username },
            include: {
                student: true,
                facultyAccount: true,
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
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            // Increment failed attempts
            const failedAttempts = (user.failedLoginAttempts || 0) + 1;
            // Determine if account should be locked
            const updateData = { failedLoginAttempts: failedAttempts };
            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
            }
            // Update the user record with increased failed attempts and potential lock
            await index_1.prisma.user.update({
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
        await index_1.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
                failedLoginAttempts: 0,
                lockedUntil: null
            }
        });
        // Generate JWT
        const payload = {
            userId: user.id,
            username: user.username,
            loginType: user.loginType
        };
        if (user.departmentId)
            payload.departmentId = user.departmentId;
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
        // Use type assertion to bypass TypeScript error
        // @ts-ignore
        const token = jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.login = login;
const changePassword = async (req, res) => {
    var _a;
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await index_1.prisma.user.update({
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
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.changePassword = changePassword;
const getCurrentUser = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                loginType: true,
                departmentId: true,
                firstLogin: true,
                department: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getCurrentUser = getCurrentUser;
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        // Check if user exists
        const user = await index_1.prisma.user.findFirst({
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
        const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
        // Store the reset token in the database
        await index_1.prisma.user.update({
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
    }
    catch (error) {
        console.error('Request password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.requestPasswordReset = requestPasswordReset;
const confirmPasswordReset = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        // Find user with this reset token and ensure it's not expired
        const user = await index_1.prisma.user.findFirst({
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
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update user with new password and clear reset token
        await index_1.prisma.user.update({
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
    }
    catch (error) {
        console.error('Password reset confirmation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.confirmPasswordReset = confirmPasswordReset;
// New method to unlock account
const unlockAccount = async (req, res) => {
    try {
        const { username } = req.body;
        // Check if user exists
        const user = await index_1.prisma.user.findUnique({
            where: { username }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Reset the failed attempts and remove lock
        await index_1.prisma.user.update({
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
    }
    catch (error) {
        console.error('Unlock account error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.unlockAccount = unlockAccount;

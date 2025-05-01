"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
// Authorize by user role
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        // Map loginType to role name
        let userRole;
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
exports.authorizeRoles = authorizeRoles;

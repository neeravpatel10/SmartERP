"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStudent = exports.isDeptAdmin = exports.isFaculty = exports.isSuperAdmin = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // Verify user still exists in database
        const user = await index_1.prisma.user.findUnique({
            where: { id: decoded.userId }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }
        // Attach the user info to the request
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.authenticate = authenticate;
const authorize = (allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        if (!allowedRoles.includes(req.user.loginType)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        // For department-scoped access
        if (req.user.loginType === 3 && req.user.departmentId) {
            const resourceDepartmentId = req.params.departmentId || req.body.departmentId;
            if (resourceDepartmentId && resourceDepartmentId !== req.user.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to other departments'
                });
            }
        }
        next();
    };
};
exports.authorize = authorize;
// Role-specific middleware
exports.isSuperAdmin = (0, exports.authorize)([1]);
exports.isFaculty = (0, exports.authorize)([2]);
exports.isDeptAdmin = (0, exports.authorize)([3]);
exports.isStudent = (0, exports.authorize)([-1]);

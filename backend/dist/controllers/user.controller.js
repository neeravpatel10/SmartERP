"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.updateUser = exports.registerUser = void 0;
const index_1 = require("../index");
const bcrypt_1 = __importDefault(require("bcrypt"));
const registerUser = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        // Check if username or email already exists
        const existingUser = await index_1.prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create user
        const user = await index_1.prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                firstName,
                lastName
            },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true
            }
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: user
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.registerUser = registerUser;
const updateUser = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { email, firstName, lastName } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Check if email is being updated and if it already exists
        if (email) {
            const existingUser = await index_1.prisma.user.findFirst({
                where: {
                    email,
                    NOT: {
                        id: userId
                    }
                }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }
        // Update user
        const updatedUser = await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                email,
                firstName,
                lastName
            },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                updatedAt: true
            }
        });
        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateUser = updateUser;
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        // Build search condition
        const searchCondition = search ? {
            OR: [
                { username: { contains: search } },
                { email: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } }
            ]
        } : {};
        // Get total count for pagination
        const total = await index_1.prisma.user.count({
            where: searchCondition
        });
        // Get users with pagination and search
        const users = await index_1.prisma.user.findMany({
            where: searchCondition,
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true,
                updatedAt: true
            },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(total / limitNumber)
                }
            }
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getUsers = getUsers;

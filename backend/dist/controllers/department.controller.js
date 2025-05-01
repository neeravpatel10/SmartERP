"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepartmentById = exports.getDepartments = exports.updateDepartment = exports.createDepartment = void 0;
const index_1 = require("../index");
const createDepartment = async (req, res) => {
    try {
        const { name, code, description, headId } = req.body;
        // Check if department code already exists
        const existingDepartment = await index_1.prisma.department.findUnique({
            where: { code }
        });
        if (existingDepartment) {
            return res.status(400).json({
                success: false,
                message: 'Department code already exists'
            });
        }
        // If headId is provided, verify the faculty exists
        if (headId) {
            const faculty = await index_1.prisma.faculty.findUnique({
                where: { id: headId }
            });
            if (!faculty) {
                return res.status(400).json({
                    success: false,
                    message: 'Faculty head not found'
                });
            }
        }
        // Create department
        const department = await index_1.prisma.department.create({
            data: {
                name,
                code,
                description,
                headId
            },
            include: {
                head: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: department
        });
    }
    catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createDepartment = createDepartment;
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, description, headId } = req.body;
        // Check if department exists
        const existingDepartment = await index_1.prisma.department.findUnique({
            where: { id: parseInt(id) }
        });
        if (!existingDepartment) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        // If code is being updated, check for duplicates
        if (code && code !== existingDepartment.code) {
            const duplicateDepartment = await index_1.prisma.department.findUnique({
                where: { code }
            });
            if (duplicateDepartment) {
                return res.status(400).json({
                    success: false,
                    message: 'Department code already exists'
                });
            }
        }
        // If headId is provided, verify the faculty exists
        if (headId) {
            const faculty = await index_1.prisma.faculty.findUnique({
                where: { id: headId }
            });
            if (!faculty) {
                return res.status(400).json({
                    success: false,
                    message: 'Faculty head not found'
                });
            }
        }
        // Update department
        const updatedDepartment = await index_1.prisma.department.update({
            where: { id: parseInt(id) },
            data: {
                name,
                code,
                description,
                headId
            },
            include: {
                head: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        res.json({
            success: true,
            message: 'Department updated successfully',
            data: updatedDepartment
        });
    }
    catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateDepartment = updateDepartment;
const getDepartments = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        // Build search condition
        const searchCondition = search ? {
            OR: [
                { name: { contains: search } },
                { code: { contains: search } },
                { description: { contains: search } }
            ]
        } : {};
        // Get total count for pagination
        const total = await index_1.prisma.department.count({
            where: searchCondition
        });
        // Get departments with pagination and search
        const departments = await index_1.prisma.department.findMany({
            where: searchCondition,
            include: {
                head: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            orderBy: {
                name: 'asc'
            }
        });
        res.json({
            success: true,
            data: {
                departments,
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
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getDepartments = getDepartments;
const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await index_1.prisma.department.findUnique({
            where: { id: parseInt(id) },
            include: {
                head: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        designation: true
                    }
                }
            }
        });
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        res.json({
            success: true,
            data: department
        });
    }
    catch (error) {
        console.error('Get department by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getDepartmentById = getDepartmentById;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.getDepartmentById = exports.getDepartments = exports.updateDepartment = exports.createDepartment = void 0;
const index_1 = require("../index");
const createDepartment = async (req, res) => {
    try {
        const { name, code, description, hodId } = req.body;
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
        // If hodId is provided, verify the faculty exists
        if (hodId) {
            const faculty = await index_1.prisma.faculty.findUnique({
                where: { id: hodId }
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
                hodId
            }
        });
        // Get the head if it exists for the response
        let head = null;
        if (hodId) {
            head = await index_1.prisma.faculty.findUnique({
                where: { id: hodId },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });
        }
        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: {
                ...department,
                head
            }
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
        const { name, code, description, hodId } = req.body;
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
        // If hodId is provided, verify the faculty exists
        if (hodId) {
            const faculty = await index_1.prisma.faculty.findUnique({
                where: { id: hodId }
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
                hodId
            }
        });
        // Get the head if it exists for the response
        let head = null;
        if (updatedDepartment.hodId) {
            head = await index_1.prisma.faculty.findUnique({
                where: { id: updatedDepartment.hodId },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });
        }
        res.json({
            success: true,
            message: 'Department updated successfully',
            data: {
                ...updatedDepartment,
                head
            }
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
                { code: { contains: search } }
            ]
        } : {};
        // Get total count for pagination
        const total = await index_1.prisma.department.count({
            where: searchCondition
        });
        // Get departments with pagination and search
        const departments = await index_1.prisma.department.findMany({
            where: searchCondition,
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            orderBy: {
                name: 'asc'
            }
        });
        // Manually fetch department heads to ensure consistent structure
        const departmentsWithHeads = await Promise.all(departments.map(async (dept) => {
            let head = null;
            if (dept.hodId) {
                head = await index_1.prisma.faculty.findUnique({
                    where: { id: dept.hodId },
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                });
            }
            return {
                ...dept,
                head
            };
        }));
        res.json({
            success: true,
            data: {
                departments: departmentsWithHeads,
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
                faculty: true
            }
        });
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        // Get the head if it exists
        let head = null;
        if (department.hodId) {
            head = await index_1.prisma.faculty.findUnique({
                where: { id: department.hodId },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });
        }
        res.json({
            success: true,
            data: {
                ...department,
                head
            }
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
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if department exists
        const department = await index_1.prisma.department.findUnique({
            where: { id: parseInt(id) }
        });
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        // Check if the department has any associated faculty
        const facultyCount = await index_1.prisma.faculty.count({
            where: { departmentId: parseInt(id) }
        });
        if (facultyCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete department with assigned faculty'
            });
        }
        // Check if the department has any associated students
        const studentCount = await index_1.prisma.student.count({
            where: { departmentId: parseInt(id) }
        });
        if (studentCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete department with assigned students'
            });
        }
        // Delete department
        await index_1.prisma.department.delete({
            where: { id: parseInt(id) }
        });
        res.json({
            success: true,
            message: 'Department deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteDepartment = deleteDepartment;

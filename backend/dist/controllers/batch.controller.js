"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolloverBatch = exports.deleteBatch = exports.getBatchStudents = exports.getBatchById = exports.getBatches = exports.updateBatch = exports.createBatch = void 0;
const index_1 = require("../index");
const createBatch = async (req, res) => {
    try {
        const { name, departmentId, currentSemester, autoRollover, archived, academicYear } = req.body;
        // Validate academicYear format
        if (!academicYear || !/^\d{4}-\d{4}$/.test(academicYear)) {
            return res.status(400).json({
                success: false,
                message: 'Academic year must be in format YYYY-YYYY'
            });
        }
        // Check if department exists
        const department = await index_1.prisma.department.findUnique({
            where: { id: departmentId }
        });
        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Department not found'
            });
        }
        // Check if batch already exists for the department and academic year
        const existingBatch = await index_1.prisma.batch.findFirst({
            where: {
                name,
                departmentId,
                academicYear
            }
        });
        if (existingBatch) {
            return res.status(400).json({
                success: false,
                message: 'Batch with this name and academic year already exists for this department'
            });
        }
        // Create batch
        const batch = await index_1.prisma.batch.create({
            data: {
                name,
                departmentId,
                currentSemester: currentSemester !== null && currentSemester !== void 0 ? currentSemester : 1,
                autoRollover: autoRollover !== null && autoRollover !== void 0 ? autoRollover : false,
                archived: archived !== null && archived !== void 0 ? archived : false,
                academicYear
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: 'Batch created successfully',
            data: batch
        });
    }
    catch (error) {
        console.error('Create batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createBatch = createBatch;
const updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const batchId = id;
        const { name, departmentId, currentSemester, autoRollover, archived, academicYear } = req.body;
        // Check if batch exists
        const existingBatch = await index_1.prisma.batch.findUnique({
            where: { id: batchId }
        });
        if (!existingBatch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }
        // Validate academicYear format if provided
        if (academicYear && !/^\d{4}-\d{4}$/.test(academicYear)) {
            return res.status(400).json({
                success: false,
                message: 'Academic year must be in format YYYY-YYYY'
            });
        }
        // If departmentId is provided, check if department exists
        if (departmentId) {
            const department = await index_1.prisma.department.findUnique({
                where: { id: departmentId }
            });
            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: 'Department not found'
                });
            }
        }
        // If name or academicYear is being updated, check for duplicates
        if ((name && name !== existingBatch.name) || (academicYear && academicYear !== existingBatch.academicYear)) {
            const duplicateBatch = await index_1.prisma.batch.findFirst({
                where: {
                    name: name || existingBatch.name,
                    departmentId: departmentId || existingBatch.departmentId,
                    academicYear: academicYear || existingBatch.academicYear,
                    id: { not: batchId }
                }
            });
            if (duplicateBatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Batch with this name and academic year already exists for this department'
                });
            }
        }
        // Archiving specific validation
        if (archived === true && existingBatch.archived === false) {
            // Check if there are active students associated with this batch
            const activeStudentsCount = await index_1.prisma.student.count({
                where: { batchId: batchId }
            });
            if (activeStudentsCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot archive batch with ${activeStudentsCount} associated students. Please reassign students first.`
                });
            }
            // Potentially check for active faculty mappings too
            const activeMappingsCount = await index_1.prisma.facultySubjectMapping.count({
                where: { batchId: batchId, active: true }
            });
            if (activeMappingsCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot archive batch with ${activeMappingsCount} active faculty mappings.`
                });
            }
        }
        // Prepare data for update
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (departmentId !== undefined)
            updateData.departmentId = departmentId;
        if (currentSemester !== undefined)
            updateData.currentSemester = currentSemester;
        if (autoRollover !== undefined)
            updateData.autoRollover = autoRollover;
        if (academicYear !== undefined)
            updateData.academicYear = academicYear;
        if (archived !== undefined) {
            updateData.archived = archived;
            // If archiving, also deactivate
            // if (archived === true) {
            //   updateData.isActive = false;
            // }
        }
        // Update batch
        const updatedBatch = await index_1.prisma.batch.update({
            where: { id: batchId },
            data: updateData,
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
        res.json({
            success: true,
            message: 'Batch updated successfully',
            data: updatedBatch
        });
    }
    catch (error) {
        console.error('Update batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateBatch = updateBatch;
const getBatches = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', departmentId, isActive } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        // Build filter conditions
        const filterConditions = {};
        if (departmentId) {
            filterConditions.departmentId = parseInt(departmentId);
        }
        if (isActive !== undefined) {
            filterConditions.isActive = isActive === 'true';
        }
        // Build search condition
        const searchCondition = search ? {
            OR: [
                { name: { contains: search } }
            ]
        } : {};
        // Combine filter and search conditions
        const whereCondition = {
            ...filterConditions,
            ...searchCondition
        };
        // Get total count for pagination
        const total = await index_1.prisma.batch.count({
            where: whereCondition
        });
        // Get batches with pagination, filtering, and search
        const batches = await index_1.prisma.batch.findMany({
            where: whereCondition,
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                _count: {
                    select: {
                        students: true
                    }
                }
            },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            orderBy: [
                { academicYear: 'desc' },
                { name: 'asc' }
            ]
        });
        res.json({
            success: true,
            data: {
                batches,
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
        console.error('Get batches error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getBatches = getBatches;
const getBatchById = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await index_1.prisma.batch.findUnique({
            where: { id: parseInt(id) },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                _count: {
                    select: {
                        students: true,
                        facultyMappings: true
                    }
                }
            }
        });
        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }
        res.json({
            success: true,
            data: batch
        });
    }
    catch (error) {
        console.error('Get batch by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getBatchById = getBatchById;
const getBatchStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10, search = '' } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        // Check if batch exists
        const batchExists = await index_1.prisma.batch.findUnique({
            where: { id: parseInt(id) }
        });
        if (!batchExists) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }
        // Build search condition
        const searchCondition = search ? {
            OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { usn: { contains: search } },
                { email: { contains: search } },
            ]
        } : {};
        // Combine batch ID and search conditions
        const whereCondition = {
            batchId: parseInt(id),
            ...searchCondition
        };
        // Get total count for pagination
        const total = await index_1.prisma.student.count({
            where: whereCondition
        });
        // Get students for the batch with pagination and search
        const students = await index_1.prisma.student.findMany({
            where: whereCondition,
            select: {
                usn: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                section: true,
                semester: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            orderBy: {
                firstName: 'asc'
            }
        });
        res.json({
            success: true,
            data: {
                students,
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
        console.error('Get batch students error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getBatchStudents = getBatchStudents;
const deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const batchId = parseInt(id);
        // Check if batch exists and if it has students
        const studentsCount = await index_1.prisma.student.count({
            where: { batchId }
        });
        if (studentsCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete batch with associated students'
            });
        }
        // Check if batch exists
        const existingBatch = await index_1.prisma.batch.findUnique({
            where: { id: batchId }
        });
        if (!existingBatch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }
        // Delete the batch
        await index_1.prisma.batch.delete({
            where: { id: batchId }
        });
        res.json({
            success: true,
            message: 'Batch deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete batch error:', error);
        // Handle specific Prisma errors
        if (error.code === 'P2003') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete batch because it is referenced by other records'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteBatch = deleteBatch;
// New function for semester rollover
const rolloverBatch = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const batchId = parseInt(id);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get user ID from auth middleware
        // Check if batch exists
        const batch = await index_1.prisma.batch.findUnique({
            where: { id: batchId }
        });
        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }
        // Check if batch is archived
        if (batch.archived) {
            return res.status(400).json({
                success: false,
                message: 'Cannot rollover semester for an archived batch'
            });
        }
        // Check if semester is already at max (e.g., 8)
        const MAX_SEMESTER = 8;
        if (batch.currentSemester >= MAX_SEMESTER) {
            return res.status(400).json({
                success: false,
                message: `Batch is already in the final semester (${MAX_SEMESTER})`
            });
        }
        // Increment the semester
        const nextSemester = batch.currentSemester + 1;
        // Update the batch's current semester
        const updatedBatch = await index_1.prisma.batch.update({
            where: { id: batchId },
            data: {
                currentSemester: nextSemester
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
        // TODO: Optionally, update student semesters in this batch
        // await prisma.student.updateMany({
        //   where: { batchId: batchId },
        //   data: { semester: nextSemester }
        // });
        // Add rollover info to audit context for logging
        if (req.auditContext) {
            req.auditContext.newValue = {
                ...req.auditContext.oldValue,
                currentSemester: nextSemester,
                previousSemester: batch.currentSemester
            };
        }
        res.json({
            success: true,
            message: `Batch semester rolled over successfully to Semester ${nextSemester}`,
            data: updatedBatch
        });
    }
    catch (error) {
        console.error('Rollover batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during semester rollover'
        });
    }
};
exports.rolloverBatch = rolloverBatch;

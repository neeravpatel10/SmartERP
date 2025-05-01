"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentsBySubject = exports.updateSubjectStatus = exports.deleteSubject = exports.checkFacultySubjectAccess = exports.approveRejectFacultyMapping = exports.updateFacultySubjectMapping = exports.deleteFacultySubjectMapping = exports.getFacultySubjectMappings = exports.createFacultySubjectMapping = exports.getSubjectById = exports.getSubjects = exports.updateSubject = exports.createSubject = void 0;
const index_1 = require("../index");
const createSubject = async (req, res) => {
    try {
        const { code, name, semester, credits, isLab, departmentId, categoryId } = req.body;
        // Check if subject code already exists
        const existingSubject = await index_1.prisma.subject.findUnique({
            where: { code }
        });
        if (existingSubject) {
            return res.status(400).json({
                success: false,
                message: 'Subject code already exists'
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
        // If categoryId is provided, check if it exists
        if (categoryId) {
            const category = await index_1.prisma.subjectCategory.findUnique({
                where: { id: categoryId }
            });
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: 'Subject category not found'
                });
            }
        }
        // Create subject
        const subject = await index_1.prisma.subject.create({
            data: {
                code,
                name,
                semester,
                credits,
                isLab: isLab || false,
                departmentId,
                categoryId
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                category: {
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
            message: 'Subject created successfully',
            data: subject
        });
    }
    catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createSubject = createSubject;
const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, semester, credits, isLab, departmentId, categoryId } = req.body;
        // Check if subject exists
        const existingSubject = await index_1.prisma.subject.findUnique({
            where: { id: parseInt(id) }
        });
        if (!existingSubject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // If code is being updated, check for duplicates
        if (code && code !== existingSubject.code) {
            const duplicateSubject = await index_1.prisma.subject.findUnique({
                where: { code }
            });
            if (duplicateSubject) {
                return res.status(400).json({
                    success: false,
                    message: 'Subject code already exists'
                });
            }
        }
        // If departmentId is provided, check if it exists
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
        // If categoryId is provided, check if it exists
        if (categoryId && categoryId !== null) {
            const category = await index_1.prisma.subjectCategory.findUnique({
                where: { id: categoryId }
            });
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: 'Subject category not found'
                });
            }
        }
        // Update subject
        const updatedSubject = await index_1.prisma.subject.update({
            where: { id: parseInt(id) },
            data: {
                code,
                name,
                semester,
                credits,
                isLab,
                departmentId,
                categoryId
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                category: {
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
            message: 'Subject updated successfully',
            data: updatedSubject
        });
    }
    catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateSubject = updateSubject;
const getSubjects = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', departmentId, semester } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        // Build filter conditions
        const filterConditions = {};
        if (departmentId) {
            filterConditions.departmentId = parseInt(departmentId);
        }
        if (semester) {
            filterConditions.semester = parseInt(semester);
        }
        // Build search condition
        const searchCondition = search ? {
            OR: [
                { name: { contains: search } },
                { code: { contains: search } }
            ]
        } : {};
        // Combine filter and search conditions
        const whereCondition = {
            ...filterConditions,
            ...searchCondition
        };
        // Get total count for pagination
        const total = await index_1.prisma.subject.count({
            where: whereCondition
        });
        // Get subjects with pagination, filtering, and search
        const subjects = await index_1.prisma.subject.findMany({
            where: whereCondition,
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                category: {
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
                name: 'asc'
            }
        });
        res.json({
            success: true,
            data: {
                subjects,
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
        console.error('Get subjects error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getSubjects = getSubjects;
const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await index_1.prisma.subject.findUnique({
            where: { id: parseInt(id) },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                facultyMappings: {
                    include: {
                        faculty: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                designation: true
                            }
                        },
                        batch: {
                            select: {
                                id: true,
                                name: true,
                                startYear: true,
                                endYear: true
                            }
                        }
                    }
                }
            }
        });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        res.json({
            success: true,
            data: subject
        });
    }
    catch (error) {
        console.error('Get subject by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getSubjectById = getSubjectById;
// Faculty-Subject Mapping operations
const createFacultySubjectMapping = async (req, res) => {
    try {
        const { facultyId, subjectId, section, semester, batchId, academicYear, componentScope, isPrimary, active } = req.body;
        // Get the user making the request
        const userId = req.user.id;
        const userRole = req.user.loginType;
        // Check if faculty exists
        const faculty = await index_1.prisma.faculty.findUnique({
            where: { id: facultyId },
            include: {
                department: true
            }
        });
        if (!faculty) {
            return res.status(400).json({
                success: false,
                message: 'Faculty not found'
            });
        }
        // Check if subject exists
        const subject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                department: true
            }
        });
        if (!subject) {
            return res.status(400).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // Check if batch exists
        const batch = await index_1.prisma.batch.findUnique({
            where: { id: batchId }
        });
        if (!batch) {
            return res.status(400).json({
                success: false,
                message: 'Batch not found'
            });
        }
        // Determine if the mapping should be auto-approved
        // Super Admin's mappings are auto-approved, Dept Admins' mappings for their department are auto-approved
        let status = 'pending';
        let approvedBy = null;
        let approvedAt = null;
        // Super Admin (role 1) can auto-approve any mapping
        if (userRole === 1) {
            status = 'approved';
            approvedBy = userId;
            approvedAt = new Date();
        }
        // Dept Admin (role 3) can auto-approve mappings within their department
        else if (userRole === 3) {
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId },
                include: { faculty: true }
            });
            if ((user === null || user === void 0 ? void 0 : user.faculty) && user.faculty.departmentId === faculty.departmentId &&
                faculty.departmentId === subject.departmentId) {
                status = 'approved';
                approvedBy = userId;
                approvedAt = new Date();
            }
        }
        // Check for existing mapping
        const existingMapping = await index_1.prisma.facultySubjectMapping.findFirst({
            where: {
                facultyId,
                subjectId,
                section,
                academicYear
            }
        });
        if (existingMapping) {
            // If mapping exists and is inactive, we can reactivate it
            if (existingMapping.active === false) {
                const updatedMapping = await index_1.prisma.facultySubjectMapping.update({
                    where: { id: existingMapping.id },
                    data: {
                        componentScope: componentScope || 'theory',
                        isPrimary: isPrimary !== undefined ? isPrimary : true,
                        active: true,
                        status: status,
                        approvedBy: approvedBy,
                        approvedAt: approvedAt
                    },
                    include: {
                        faculty: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        },
                        subject: {
                            select: {
                                id: true,
                                code: true,
                                name: true
                            }
                        },
                        batch: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                });
                return res.json({
                    success: true,
                    message: 'Faculty-subject mapping reactivated successfully',
                    data: updatedMapping
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Faculty-subject mapping already exists'
            });
        }
        // If this is set as primary, set other mappings for the same subject, section, and component scope to non-primary
        if (isPrimary === true) {
            await index_1.prisma.facultySubjectMapping.updateMany({
                where: {
                    subjectId,
                    section,
                    academicYear,
                    componentScope: componentScope || 'theory'
                },
                data: {
                    isPrimary: false
                }
            });
        }
        // Create faculty-subject mapping
        const mapping = await index_1.prisma.facultySubjectMapping.create({
            data: {
                facultyId,
                subjectId,
                section,
                semester,
                batchId,
                academicYear,
                componentScope: componentScope || 'theory',
                isPrimary: isPrimary !== undefined ? isPrimary : true,
                active: active !== undefined ? active : true,
                status: status,
                approvedBy: approvedBy,
                approvedAt: approvedAt
            },
            include: {
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                subject: {
                    select: {
                        id: true,
                        code: true,
                        name: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: 'Faculty-subject mapping created successfully',
            data: mapping
        });
    }
    catch (error) {
        console.error('Create faculty-subject mapping error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createFacultySubjectMapping = createFacultySubjectMapping;
const getFacultySubjectMappings = async (req, res) => {
    try {
        const { facultyId, subjectId, semester, section, batchId, academicYear, componentScope, active = 'true' } = req.query;
        // Build filter conditions
        const filterConditions = {};
        if (facultyId) {
            filterConditions.facultyId = parseInt(facultyId);
        }
        if (subjectId) {
            filterConditions.subjectId = parseInt(subjectId);
        }
        if (semester) {
            filterConditions.semester = parseInt(semester);
        }
        if (section) {
            filterConditions.section = section;
        }
        if (batchId) {
            filterConditions.batchId = parseInt(batchId);
        }
        if (academicYear) {
            filterConditions.academicYear = academicYear;
        }
        if (componentScope) {
            filterConditions.componentScope = componentScope;
        }
        // Handle active status filtering
        if (active !== undefined) {
            filterConditions.active = active === 'true';
        }
        // Get mappings
        const mappings = await index_1.prisma.facultySubjectMapping.findMany({
            where: filterConditions,
            include: {
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        department: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        semester: true,
                        credits: true,
                        isLab: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true,
                        startYear: true,
                        endYear: true
                    }
                }
            },
            orderBy: [
                { subjectId: 'asc' },
                { facultyId: 'asc' }
            ]
        });
        res.json({
            success: true,
            count: mappings.length,
            data: mappings
        });
    }
    catch (error) {
        console.error('Get faculty-subject mappings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFacultySubjectMappings = getFacultySubjectMappings;
const deleteFacultySubjectMapping = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if mapping exists
        const mapping = await index_1.prisma.facultySubjectMapping.findUnique({
            where: { id: parseInt(id) }
        });
        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: 'Faculty-subject mapping not found'
            });
        }
        // Check if there are attendance or marks entries associated with this mapping
        // Assuming we have a way to associate attendance and marks with specific faculty mappings
        // This would need to be implemented based on the actual database schema
        // For now, instead of deleting, just set active to false (soft delete)
        const deactivatedMapping = await index_1.prisma.facultySubjectMapping.update({
            where: { id: parseInt(id) },
            data: { active: false }
        });
        res.json({
            success: true,
            message: 'Faculty-subject mapping deactivated successfully',
            data: deactivatedMapping
        });
    }
    catch (error) {
        console.error('Delete faculty-subject mapping error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteFacultySubjectMapping = deleteFacultySubjectMapping;
// Update faculty-subject mapping
const updateFacultySubjectMapping = async (req, res) => {
    try {
        const { id } = req.params;
        const { componentScope, isPrimary, active } = req.body;
        // Check if mapping exists
        const mapping = await index_1.prisma.facultySubjectMapping.findUnique({
            where: { id: parseInt(id) }
        });
        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: 'Faculty-subject mapping not found'
            });
        }
        // If setting as primary, set other mappings for the same subject to non-primary
        if (isPrimary === true) {
            await index_1.prisma.facultySubjectMapping.updateMany({
                where: {
                    subjectId: mapping.subjectId,
                    section: mapping.section,
                    academicYear: mapping.academicYear,
                    componentScope: componentScope || mapping.componentScope,
                    id: { not: parseInt(id) }
                },
                data: {
                    isPrimary: false
                }
            });
        }
        // Update mapping
        const updatedMapping = await index_1.prisma.facultySubjectMapping.update({
            where: { id: parseInt(id) },
            data: {
                componentScope,
                isPrimary,
                active,
                // When updated, reset to pending status unless it's by an admin
                status: 'pending',
                approvedBy: null,
                approvedAt: null
            },
            include: {
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                subject: {
                    select: {
                        id: true,
                        code: true,
                        name: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.json({
            success: true,
            message: 'Faculty-subject mapping updated successfully',
            data: updatedMapping
        });
    }
    catch (error) {
        console.error('Update faculty-subject mapping error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateFacultySubjectMapping = updateFacultySubjectMapping;
/**
 * Approve or reject a faculty-subject mapping
 */
const approveRejectFacultyMapping = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        // Get the user making the request
        const userId = req.user.id;
        const userRole = req.user.loginType;
        // Ensure only Dept Admin (3) or Super Admin (1) can approve/reject
        if (userRole !== 1 && userRole !== 3) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized. Only department admins or super admins can approve mappings.'
            });
        }
        // Check if mapping exists
        const mapping = await index_1.prisma.facultySubjectMapping.findUnique({
            where: { id: parseInt(id) },
            include: {
                faculty: {
                    include: {
                        department: true
                    }
                },
                subject: {
                    include: {
                        department: true
                    }
                }
            }
        });
        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: 'Faculty-subject mapping not found'
            });
        }
        // For Dept Admins, ensure they can only approve/reject mappings in their department
        if (userRole === 3) {
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId },
                include: { faculty: true }
            });
            if (!(user === null || user === void 0 ? void 0 : user.faculty) || user.faculty.departmentId !== mapping.faculty.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized. You can only approve mappings in your department.'
                });
            }
        }
        // Validate status
        if (status !== 'approved' && status !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "approved" or "rejected"'
            });
        }
        // If rejecting, ensure reason is provided
        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required when rejecting a mapping'
            });
        }
        // Update mapping status
        const updatedMapping = await index_1.prisma.facultySubjectMapping.update({
            where: { id: parseInt(id) },
            data: {
                status: status,
                approvedBy: userId,
                approvedAt: new Date(),
                rejectionReason: status === 'rejected' ? rejectionReason : null
            },
            include: {
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                subject: {
                    select: {
                        id: true,
                        code: true,
                        name: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.json({
            success: true,
            message: `Faculty-subject mapping ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
            data: updatedMapping
        });
    }
    catch (error) {
        console.error('Approve/reject faculty-subject mapping error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.approveRejectFacultyMapping = approveRejectFacultyMapping;
const checkFacultySubjectAccess = async (req, res) => {
    try {
        const { facultyId, subjectId, componentScope, section, academicYear } = req.body;
        // Validate required fields
        if (!facultyId || !subjectId || !componentScope) {
            return res.status(400).json({
                success: false,
                message: 'Faculty ID, Subject ID, and Component Scope are required'
            });
        }
        // Check mapping
        const mapping = await index_1.prisma.facultySubjectMapping.findFirst({
            where: {
                facultyId: parseInt(facultyId),
                subjectId: parseInt(subjectId),
                section: section,
                academicYear: academicYear,
                active: true,
                OR: [
                    { componentScope: componentScope },
                    { componentScope: 'both' }
                ]
            }
        });
        if (!mapping) {
            return res.json({
                success: true,
                hasAccess: false,
                message: 'Faculty does not have access to this subject component'
            });
        }
        // Faculty has access
        return res.json({
            success: true,
            hasAccess: true,
            isPrimary: mapping.isPrimary,
            message: 'Faculty has access to this subject component',
            data: mapping
        });
    }
    catch (error) {
        console.error('Check faculty-subject access error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.checkFacultySubjectAccess = checkFacultySubjectAccess;
// Add deleteSubject function
const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subjectId = parseInt(id);
        // Check if subject exists
        const existingSubject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId },
        });
        if (!existingSubject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found',
            });
        }
        // Perform soft delete by setting active to false
        // Also consider deactivating related FacultySubjectMappings?
        const updatedSubject = await index_1.prisma.subject.update({
            where: { id: subjectId },
            data: { active: false }, // Assuming an 'active' field exists
        });
        res.json({
            success: true,
            message: 'Subject deactivated successfully', // Changed message
            data: updatedSubject // Optionally return the updated subject
        });
    }
    catch (error) {
        // Error handling can be simplified as foreign key constraints 
        // are less likely with soft delete, unless the relation itself requires an active subject.
        console.error('Deactivate subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.deleteSubject = deleteSubject;
// Add updateSubjectStatus function
const updateSubjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Assuming status is a boolean or specific string
        // Validate status value if necessary (e.g., only 'active'/'inactive')
        if (typeof status !== 'boolean') { // Example validation
            return res.status(400).json({
                success: false,
                message: 'Invalid status value provided.',
            });
        }
        const updatedSubject = await index_1.prisma.subject.update({
            where: { id: parseInt(id) },
            data: {
                // Assuming a boolean 'active' field exists in the schema
                active: status
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                category: {
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
            message: 'Subject status updated successfully',
            data: updatedSubject
        });
    }
    catch (error) {
        console.error('Update subject status error:', error);
        // Handle Prisma record not found error
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.updateSubjectStatus = updateSubjectStatus;
// Add getStudentsBySubject function
const getStudentsBySubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subjectId = parseInt(id);
        // Check if subject exists
        const subject = await index_1.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        // Find active faculty subject mappings for this subject
        const mappings = await index_1.prisma.facultySubjectMapping.findMany({
            where: {
                subjectId: subjectId,
                active: true,
                // Optionally filter by current academic year if available/needed
                // academicYear: getCurrentAcademicYear(), 
            },
            select: {
                batchId: true,
                section: true,
            },
            distinct: ['batchId', 'section'] // Get unique batch/section combinations
        });
        if (mappings.length === 0) {
            // No active mappings found for this subject
            return res.json({ success: true, data: [] });
        }
        // Prepare OR conditions for student query based on mappings
        const studentQueryConditions = mappings.map(mapping => ({
            batchId: mapping.batchId,
            section: mapping.section,
            // Assuming student model has batchId and section
        }));
        // Find students belonging to these batch/section combinations
        const students = await index_1.prisma.student.findMany({
            where: {
                OR: studentQueryConditions,
                // Add other relevant filters if needed (e.g., student status)
                // isActive: true, 
            },
            select: {
                id: true,
                usn: true,
                firstName: true,
                lastName: true,
                section: true, // Include section and batch for clarity
                batch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { batchId: 'asc' },
                { section: 'asc' },
                { usn: 'asc' }
            ]
        });
        res.json({
            success: true,
            data: students
        });
    }
    catch (error) {
        console.error('Get students by subject error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getStudentsBySubject = getStudentsBySubject;

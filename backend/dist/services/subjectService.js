"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubject = exports.getSubjectsByDepartment = exports.getSubjectsByStatus = exports.updateSubject = exports.getSubjectStatusHistory = exports.updateSubjectStatus = exports.createSubject = exports.getSubjectById = exports.getAllSubjects = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all subjects with status info
const getAllSubjects = async () => {
    return await prisma.subject.findMany({
        include: {
            department: true,
            category: true,
            facultyMappings: {
                include: {
                    faculty: true,
                },
            },
        },
    });
};
exports.getAllSubjects = getAllSubjects;
// Get subject by ID with status info
const getSubjectById = async (id) => {
    return await prisma.subject.findUnique({
        where: { id },
        include: {
            department: true,
            category: true,
            facultyMappings: {
                include: {
                    faculty: true,
                },
            },
            statusLogs: {
                orderBy: {
                    timestamp: 'desc',
                },
                take: 10,
            },
        },
    });
};
exports.getSubjectById = getSubjectById;
// Create new subject (starts in draft status)
const createSubject = async (subjectData, userId) => {
    // Start a transaction to create both subject and exam components
    return await prisma.$transaction(async (tx) => {
        // Create the subject first
        const subject = await tx.subject.create({
            data: {
                code: subjectData.code,
                name: subjectData.name,
                semester: subjectData.semester,
                credits: subjectData.credits,
                isLab: subjectData.isLab || false,
                departmentId: subjectData.departmentId,
                categoryId: subjectData.categoryId,
                schemeYear: subjectData.schemeYear,
                status: client_1.SubjectStatus.draft,
                section: subjectData.section || null,
            },
        });
        // Log initial status
        await tx.subjectstatuslog.create({
            data: {
                subjectId: subject.id,
                status: client_1.SubjectStatus.draft,
                changedBy: userId,
            },
        });
        // If category is specified, fetch its marking schema and create exam components
        if (subjectData.categoryId) {
            const category = await tx.subjectcategory.findUnique({
                where: { id: subjectData.categoryId },
            });
            if (category && category.markingSchema) {
                try {
                    const markingSchema = JSON.parse(category.markingSchema);
                    if (Array.isArray(markingSchema)) {
                        // Create exam components based on the marking schema
                        for (const component of markingSchema) {
                            await tx.examcomponent.create({
                                data: {
                                    subjectId: subject.id,
                                    name: component.name,
                                    componentType: component.name.toLowerCase().includes('external') ? 'external' : 'internal',
                                    maxMarks: component.max_marks,
                                    weightagePercent: (component.max_marks / 100) * 100, // Calculate weightage based on max marks
                                },
                            });
                        }
                    }
                }
                catch (error) {
                    console.error('Error parsing marking schema:', error);
                    // Continue without creating components if schema is invalid
                }
            }
        }
        return subject;
    });
};
exports.createSubject = createSubject;
// Update subject status
const updateSubjectStatus = async (id, newStatus, userId) => {
    const subject = await prisma.subject.findUnique({
        where: { id },
    });
    if (!subject) {
        throw new Error('Subject not found');
    }
    // Validate status transition
    validateStatusTransition(subject.status, newStatus);
    // Update timestamps based on the new status
    const updateData = { status: newStatus };
    if (newStatus === client_1.SubjectStatus.locked) {
        updateData.lockedAt = new Date();
    }
    if (newStatus === client_1.SubjectStatus.archived) {
        updateData.archivedAt = new Date();
    }
    // Update subject status
    const updatedSubject = await prisma.subject.update({
        where: { id },
        data: updateData,
    });
    // Create status log entry
    await prisma.subjectStatusLog.create({
        data: {
            subjectId: id,
            status: newStatus,
            changedBy: userId,
        },
    });
    return updatedSubject;
};
exports.updateSubjectStatus = updateSubjectStatus;
// Get subject status history
const getSubjectStatusHistory = async (id) => {
    return await prisma.subjectStatusLog.findMany({
        where: { subjectId: id },
        orderBy: { timestamp: 'desc' },
        include: {
            subject: true,
        },
    });
};
exports.getSubjectStatusHistory = getSubjectStatusHistory;
// Helper to validate status transitions
const validateStatusTransition = (currentStatus, newStatus) => {
    const allowedTransitions = {
        [client_1.SubjectStatus.draft]: [client_1.SubjectStatus.active],
        [client_1.SubjectStatus.active]: [client_1.SubjectStatus.locked],
        [client_1.SubjectStatus.locked]: [client_1.SubjectStatus.active, client_1.SubjectStatus.archived],
        [client_1.SubjectStatus.archived]: [],
    };
    if (!allowedTransitions[currentStatus].includes(newStatus)) {
        throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
};
// Update subject details
const updateSubject = async (id, subjectData) => {
    // First, check if the subject is in draft status
    const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
            examcomponent: true,
        },
    });
    if (!subject) {
        throw new Error('Subject not found');
    }
    if (subject.status !== client_1.SubjectStatus.draft) {
        throw new Error('Only subjects in draft status can be updated');
    }
    return await prisma.$transaction(async (tx) => {
        // Update the subject basic details
        const updatedSubject = await tx.subject.update({
            where: { id },
            data: {
                code: subjectData.code,
                name: subjectData.name,
                semester: subjectData.semester,
                credits: subjectData.credits,
                isLab: subjectData.isLab,
                departmentId: subjectData.departmentId,
                section: subjectData.section || null,
                schemeYear: subjectData.schemeYear,
            },
        });
        // If category ID is changing, we need to replace all exam components
        if (subjectData.categoryId && subjectData.categoryId !== subject.categoryId) {
            // Update subject category ID
            await tx.subject.update({
                where: { id },
                data: {
                    categoryId: subjectData.categoryId,
                },
            });
            // Delete existing exam components
            await tx.examcomponent.deleteMany({
                where: {
                    subjectId: id,
                    isCustom: false, // Only delete non-custom components
                },
            });
            // Fetch new category marking schema
            const category = await tx.subjectcategory.findUnique({
                where: { id: subjectData.categoryId },
            });
            if (category && category.markingSchema) {
                try {
                    const markingSchema = JSON.parse(category.markingSchema);
                    if (Array.isArray(markingSchema)) {
                        // Create new exam components based on the marking schema
                        for (const component of markingSchema) {
                            await tx.examcomponent.create({
                                data: {
                                    subjectId: id,
                                    name: component.name,
                                    componentType: component.name.toLowerCase().includes('external') ? 'external' : 'internal',
                                    maxMarks: component.max_marks,
                                    weightagePercent: (component.max_marks / 100) * 100, // Calculate weightage based on max marks
                                },
                            });
                        }
                    }
                }
                catch (error) {
                    console.error('Error parsing marking schema:', error);
                    // Continue without creating components if schema is invalid
                }
            }
        }
        return updatedSubject;
    });
};
exports.updateSubject = updateSubject;
// Get subjects filtered by status
const getSubjectsByStatus = async (status) => {
    return await prisma.subject.findMany({
        where: { status },
        include: {
            department: true,
            category: true,
            facultyMappings: {
                include: {
                    faculty: true,
                },
            },
        },
    });
};
exports.getSubjectsByStatus = getSubjectsByStatus;
// Get subjects by department
const getSubjectsByDepartment = async (departmentId) => {
    return await prisma.subject.findMany({
        where: { departmentId },
        include: {
            category: true,
            facultyMappings: {
                include: {
                    faculty: true,
                },
            },
        },
    });
};
exports.getSubjectsByDepartment = getSubjectsByDepartment;
// Delete subject
const deleteSubject = async (id) => {
    // Check if subject is in draft status
    const subject = await prisma.subject.findUnique({
        where: { id },
    });
    if (!subject) {
        throw new Error('Subject not found');
    }
    if (subject.status !== client_1.SubjectStatus.draft) {
        throw new Error('Only subjects in draft status can be deleted');
    }
    return await prisma.subject.delete({
        where: { id },
    });
};
exports.deleteSubject = deleteSubject;

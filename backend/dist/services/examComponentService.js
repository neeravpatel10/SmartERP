"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComponent = exports.updateComponent = exports.createCustomComponent = exports.getComponentById = exports.getComponentsForSubject = exports.getDefaultComponentsForSubject = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get default components for a subject based on its category
const getDefaultComponentsForSubject = async (subjectId) => {
    try {
        // Get the subject with its category
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: { category: true },
        });
        if (!subject) {
            throw new Error('Subject not found');
        }
        if (!subject.category) {
            throw new Error('Subject does not have a category assigned');
        }
        // Get or create components based on category
        return await generateDefaultComponents(subject.id, subject.category.code);
    }
    catch (error) {
        throw error;
    }
};
exports.getDefaultComponentsForSubject = getDefaultComponentsForSubject;
// Helper function to generate default components based on subject category
const generateDefaultComponents = async (subjectId, categoryCode) => {
    // Check if components already exist for this subject
    const existingComponents = await prisma.examComponent.findMany({
        where: { subjectId },
    });
    if (existingComponents.length > 0) {
        return existingComponents;
    }
    // Define default components based on category
    const componentTemplates = getComponentTemplatesByCategory(categoryCode, subjectId);
    // Create all components in a transaction
    const components = await prisma.$transaction(componentTemplates.map(template => prisma.examComponent.create({
        data: template
    })));
    return components;
};
// Define component templates based on subject category
const getComponentTemplatesByCategory = (categoryCode, subjectId) => {
    const templates = [];
    switch (categoryCode) {
        case 'IPCC':
            templates.push({
                subjectId,
                name: 'CIE I',
                componentType: 'CIE',
                maxMarks: 15,
                weightagePercent: 20,
            }, {
                subjectId,
                name: 'CIE II',
                componentType: 'CIE',
                maxMarks: 15,
                weightagePercent: 20,
            }, {
                subjectId,
                name: 'Assignment',
                componentType: 'Assignment',
                maxMarks: 10,
                weightagePercent: 15,
            }, {
                subjectId,
                name: 'Lab Record',
                componentType: 'Lab',
                maxMarks: 15,
                weightagePercent: 25,
            }, {
                subjectId,
                name: 'Lab CIE',
                componentType: 'Lab',
                maxMarks: 10,
                weightagePercent: 20,
            });
            break;
        case 'PCC':
        case 'ESC':
        case 'UHV':
            templates.push({
                subjectId,
                name: 'CIE I',
                componentType: 'CIE',
                maxMarks: 25,
                weightagePercent: 40,
            }, {
                subjectId,
                name: 'Assignment 1',
                componentType: 'Assignment',
                maxMarks: 15,
                weightagePercent: 30,
            }, {
                subjectId,
                name: 'Assignment 2',
                componentType: 'Assignment',
                maxMarks: 10,
                weightagePercent: 30,
            });
            break;
        case 'PCCL':
        case 'AEC':
            templates.push({
                subjectId,
                name: 'Lab Record',
                componentType: 'Lab',
                maxMarks: 30,
                weightagePercent: 60,
            }, {
                subjectId,
                name: 'Lab CIE',
                componentType: 'Lab',
                maxMarks: 20,
                weightagePercent: 40,
            });
            break;
        case 'PROJ':
            templates.push({
                subjectId,
                name: 'Presentation',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId,
                name: 'Requirement Analysis',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId,
                name: 'Report',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId,
                name: 'IEEE Paper',
                componentType: 'Project',
                maxMarks: 40,
                weightagePercent: 40,
            });
            break;
        case 'MINI':
            templates.push({
                subjectId,
                name: 'Objective of Mini Project',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId,
                name: 'Work Undertaken',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId,
                name: 'Technical Knowledge',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId,
                name: 'Viva Voce',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId,
                name: 'Final Report',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            });
            break;
        default:
            // Generic components for unknown categories
            templates.push({
                subjectId,
                name: 'CIE I',
                componentType: 'CIE',
                maxMarks: 20,
                weightagePercent: 50,
            }, {
                subjectId,
                name: 'Assignment',
                componentType: 'Assignment',
                maxMarks: 20,
                weightagePercent: 50,
            });
    }
    return templates;
};
// Get all components for a subject
const getComponentsForSubject = async (subjectId) => {
    return await prisma.examComponent.findMany({
        where: { subjectId },
        orderBy: { name: 'asc' },
    });
};
exports.getComponentsForSubject = getComponentsForSubject;
// Get a specific component by ID
const getComponentById = async (id) => {
    return await prisma.examComponent.findUnique({
        where: { id },
    });
};
exports.getComponentById = getComponentById;
// Create a custom component
const createCustomComponent = async (data) => {
    return await prisma.examComponent.create({
        data: {
            ...data,
            isCustom: true,
        },
    });
};
exports.createCustomComponent = createCustomComponent;
// Update a component
const updateComponent = async (id, data) => {
    return await prisma.examComponent.update({
        where: { id },
        data,
    });
};
exports.updateComponent = updateComponent;
// Delete a component
const deleteComponent = async (id) => {
    // Check if there are any marks recorded for this component
    const hasMarks = await prisma.studentComponentMark.findFirst({
        where: { componentId: id },
    });
    if (hasMarks) {
        throw new Error('Cannot delete component with recorded marks');
    }
    return await prisma.examComponent.delete({
        where: { id },
    });
};
exports.deleteComponent = deleteComponent;

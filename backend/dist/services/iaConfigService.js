"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIAConfig = exports.getIAConfigStructure = exports.createOrUpdateIAConfig = exports.getIAConfigForComponent = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get IA config for a component
const getIAConfigForComponent = async (componentId) => {
    return await prisma.iAQuestionConfig.findMany({
        where: { componentId },
        orderBy: [
            { questionNumber: 'asc' }
        ]
    });
};
exports.getIAConfigForComponent = getIAConfigForComponent;
// Create or update IA config
const createOrUpdateIAConfig = async (componentId, configData) => {
    try {
        // Verify the component exists
        const component = await prisma.examComponent.findUnique({
            where: { id: componentId }
        });
        if (!component) {
            throw new Error('Component not found');
        }
        // Delete existing config for this component
        await prisma.iAQuestionConfig.deleteMany({
            where: { componentId },
        });
        // Create new configs
        const configEntries = await prisma.$transaction(configData.map(config => prisma.iAQuestionConfig.create({
            data: {
                componentId,
                questionNumber: config.questionNumber,
                maxMarks: config.maxMarks,
                questionType: config.questionType || null,
            }
        })));
        return { success: true, data: configEntries };
    }
    catch (error) {
        console.error('Error creating/updating IA config:', error);
        return { success: false, error: 'Failed to create/update IA configuration' };
    }
};
exports.createOrUpdateIAConfig = createOrUpdateIAConfig;
// Get IA config structure
const getIAConfigStructure = async (componentId) => {
    const configs = await prisma.iAQuestionConfig.findMany({
        where: { componentId },
        orderBy: [
            { questionNumber: 'asc' }
        ]
    });
    // Process the config data to create a structure
    const structure = {
        totalMarks: configs.reduce((sum, q) => sum + q.maxMarks, 0),
        questionCount: configs.length,
        questions: configs
    };
    return structure;
};
exports.getIAConfigStructure = getIAConfigStructure;
// Delete IA config for a component
const deleteIAConfig = async (componentId) => {
    try {
        // Check if component exists - use examComponent if that's the correct model
        const component = await prisma.examComponent.findUnique({
            where: { id: componentId }
        });
        if (!component) {
            return { success: false, error: 'Component not found' };
        }
        await prisma.iAQuestionConfig.deleteMany({
            where: { componentId },
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting IA config:', error);
        return { success: false, error: 'Failed to delete IA configuration' };
    }
};
exports.deleteIAConfig = deleteIAConfig;

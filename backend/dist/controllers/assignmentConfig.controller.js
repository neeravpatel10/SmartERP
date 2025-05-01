"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAssignmentConfig = exports.saveAssignmentConfig = exports.getAssignmentConfig = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Get assignment configurations for a component
 */
const getAssignmentConfig = async (req, res) => {
    try {
        const { componentId } = req.params;
        const configs = await prisma.assignmentConfig.findMany({
            where: { componentId: parseInt(componentId) },
            orderBy: { name: 'asc' }
        });
        res.json({
            success: true,
            data: configs
        });
    }
    catch (error) {
        console.error('Get assignment config error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAssignmentConfig = getAssignmentConfig;
/**
 * Create or update assignment configurations
 */
const saveAssignmentConfig = async (req, res) => {
    try {
        const { componentId } = req.params;
        const { configurations } = req.body;
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        if (!configurations || !Array.isArray(configurations)) {
            return res.status(400).json({
                success: false,
                message: 'Configurations must be an array'
            });
        }
        // Get component to verify it exists
        const component = await prisma.examComponent.findUnique({
            where: { id: parseInt(componentId) }
        });
        if (!component) {
            return res.status(404).json({
                success: false,
                message: 'Component not found'
            });
        }
        // Delete existing configurations
        await prisma.assignmentConfig.deleteMany({
            where: { componentId: parseInt(componentId) }
        });
        // Create new configurations
        const configResults = await prisma.$transaction(configurations.map(config => {
            var _a;
            return prisma.assignmentConfig.create({
                data: {
                    componentId: parseInt(componentId),
                    name: config.name,
                    maxMarks: config.maxMarks,
                    weightage: config.weightage,
                    createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId
                }
            });
        }));
        res.json({
            success: true,
            message: 'Assignment configurations updated successfully',
            data: configResults
        });
    }
    catch (error) {
        console.error('Save assignment config error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.saveAssignmentConfig = saveAssignmentConfig;
/**
 * Delete assignment configurations
 */
const removeAssignmentConfig = async (req, res) => {
    try {
        const { componentId } = req.params;
        // Check if there are marks recorded
        const hasMarks = await prisma.studentComponentMark.findFirst({
            where: { componentId: parseInt(componentId) }
        });
        if (hasMarks) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete assignment configurations with recorded marks'
            });
        }
        await prisma.assignmentConfig.deleteMany({
            where: { componentId: parseInt(componentId) }
        });
        res.json({
            success: true,
            message: 'Assignment configurations deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete assignment config error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.removeAssignmentConfig = removeAssignmentConfig;

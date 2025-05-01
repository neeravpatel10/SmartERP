"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeIAConfig = exports.saveIAConfig = exports.getStructuredIAConfig = exports.getIAConfig = void 0;
const iaConfigService_1 = require("../services/iaConfigService");
/**
 * Get IA configuration for a component
 */
const getIAConfig = async (req, res) => {
    try {
        const { componentId } = req.params;
        const config = await (0, iaConfigService_1.getIAConfigForComponent)(parseInt(componentId));
        res.json({
            success: true,
            data: config
        });
    }
    catch (error) {
        console.error('Get IA config error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getIAConfig = getIAConfig;
/**
 * Get structured IA configuration for a component
 */
const getStructuredIAConfig = async (req, res) => {
    try {
        const { componentId } = req.params;
        const structure = await (0, iaConfigService_1.getIAConfigStructure)(parseInt(componentId));
        res.json({
            success: true,
            data: structure
        });
    }
    catch (error) {
        console.error('Get structured IA config error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStructuredIAConfig = getStructuredIAConfig;
/**
 * Create or update IA configuration
 */
const saveIAConfig = async (req, res) => {
    try {
        const { componentId } = req.params;
        const configData = req.body.configData;
        // Ensure user is authenticated
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        if (!configData || !Array.isArray(configData)) {
            return res.status(400).json({
                success: false,
                message: 'Config data must be an array'
            });
        }
        // Check service implementation to determine parameter count
        const result = await (0, iaConfigService_1.createOrUpdateIAConfig)(parseInt(componentId), configData);
        res.json({
            success: true,
            message: 'IA configuration updated successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Save IA config error:', error);
        if (error.message === 'Component not found') {
            return res.status(404).json({
                success: false,
                message: 'Component not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.saveIAConfig = saveIAConfig;
/**
 * Delete IA configuration
 */
const removeIAConfig = async (req, res) => {
    try {
        const { componentId } = req.params;
        await (0, iaConfigService_1.deleteIAConfig)(parseInt(componentId));
        res.json({
            success: true,
            message: 'IA configuration deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete IA config error:', error);
        if (error.message === 'Cannot delete IA configuration with recorded marks') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete IA configuration with recorded marks'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.removeIAConfig = removeIAConfig;

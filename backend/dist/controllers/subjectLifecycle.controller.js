"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveSubjectHandler = exports.unlockSubjectHandler = exports.lockSubjectHandler = exports.activateSubjectHandler = exports.validateTransition = exports.getStatusHistory = void 0;
const subjectLifecycleService_1 = require("../services/subjectLifecycleService");
const client_1 = require("@prisma/client");
/**
 * Get the status history of a subject
 */
const getStatusHistory = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const history = await (0, subjectLifecycleService_1.getSubjectStatusHistory)(parseInt(subjectId));
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        console.error('Get status history error:', error);
        if (error.message === 'Subject not found') {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStatusHistory = getStatusHistory;
/**
 * Validate if a subject can transition to a specific status
 */
const validateTransition = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { targetStatus } = req.body;
        if (!targetStatus || !Object.values(client_1.SubjectStatus).includes(targetStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid target status'
            });
        }
        const validation = await (0, subjectLifecycleService_1.validateStatusTransition)(parseInt(subjectId), targetStatus);
        res.json({
            success: true,
            data: validation
        });
    }
    catch (error) {
        console.error('Validate transition error:', error);
        if (error.message === 'Subject not found') {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.validateTransition = validateTransition;
/**
 * Activate a subject (transition from draft to active)
 */
const activateSubjectHandler = async (req, res) => {
    try {
        const { subjectId } = req.params;
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Restrict to dept admin (loginType=3) and super admin (loginType=1)
        if (req.user.loginType !== 1 && req.user.loginType !== 3) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to activate subjects'
            });
        }
        const result = await (0, subjectLifecycleService_1.activateSubject)(parseInt(subjectId), req.user.userId);
        res.json({
            success: true,
            message: 'Subject activated successfully',
            data: result[0] // Return the updated subject
        });
    }
    catch (error) {
        console.error('Activate subject error:', error);
        const errorMessage = error.message;
        if (errorMessage === 'Subject not found') {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        else if (errorMessage.includes('Only subjects in draft state') ||
            errorMessage.includes('Subject must have a category') ||
            errorMessage.includes('Subject must be assigned to at least one faculty')) {
            return res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.activateSubjectHandler = activateSubjectHandler;
/**
 * Lock a subject (transition from active to locked)
 */
const lockSubjectHandler = async (req, res) => {
    try {
        const { subjectId } = req.params;
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Restrict to dept admin (loginType=3) and super admin (loginType=1)
        if (req.user.loginType !== 1 && req.user.loginType !== 3) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to lock subjects'
            });
        }
        const result = await (0, subjectLifecycleService_1.lockSubject)(parseInt(subjectId), req.user.userId);
        res.json({
            success: true,
            message: 'Subject locked successfully',
            data: result[0] // Return the updated subject
        });
    }
    catch (error) {
        console.error('Lock subject error:', error);
        const errorMessage = error.message;
        if (errorMessage === 'Subject not found') {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        else if (errorMessage.includes('Only active subjects') ||
            errorMessage.includes('Subject must have at least one exam component') ||
            errorMessage.includes('At least one component should have marks recorded')) {
            return res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.lockSubjectHandler = lockSubjectHandler;
/**
 * Unlock a subject (transition from locked to active)
 */
const unlockSubjectHandler = async (req, res) => {
    try {
        const { subjectId } = req.params;
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Restrict to super admin only (loginType=1)
        if (req.user.loginType !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Only super admins can unlock subjects'
            });
        }
        const result = await (0, subjectLifecycleService_1.unlockSubject)(parseInt(subjectId), req.user.userId);
        res.json({
            success: true,
            message: 'Subject unlocked successfully',
            data: result[0] // Return the updated subject
        });
    }
    catch (error) {
        console.error('Unlock subject error:', error);
        const errorMessage = error.message;
        if (errorMessage === 'Subject not found') {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        else if (errorMessage.includes('Only locked subjects can be unlocked')) {
            return res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.unlockSubjectHandler = unlockSubjectHandler;
/**
 * Archive a subject (transition from locked to archived)
 */
const archiveSubjectHandler = async (req, res) => {
    try {
        const { subjectId } = req.params;
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Restrict to dept admin (loginType=3) and super admin (loginType=1)
        if (req.user.loginType !== 1 && req.user.loginType !== 3) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to archive subjects'
            });
        }
        const result = await (0, subjectLifecycleService_1.archiveSubject)(parseInt(subjectId), req.user.userId);
        res.json({
            success: true,
            message: 'Subject archived successfully',
            data: result[0] // Return the updated subject
        });
    }
    catch (error) {
        console.error('Archive subject error:', error);
        const errorMessage = error.message;
        if (errorMessage === 'Subject not found') {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        else if (errorMessage.includes('Only locked subjects can be archived')) {
            return res.status(400).json({
                success: false,
                message: errorMessage
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.archiveSubjectHandler = archiveSubjectHandler;

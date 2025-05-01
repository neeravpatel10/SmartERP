"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = exports.captureResponseForAudit = exports.captureEntityState = exports.setAuditContext = exports.logAudit = void 0;
const auditLogService_1 = require("../services/auditLogService");
/**
 * Creates an audit log entry from the current request
 */
const logAudit = async (req, res, next) => {
    const { user, auditContext } = req;
    // Skip if no user or audit context
    if (!user || !auditContext) {
        return next();
    }
    const { action, entityType, entityId = '', oldValue, newValue } = auditContext;
    try {
        await (0, auditLogService_1.createAuditLog)(user.userId, action, entityType, entityId, oldValue, newValue, req);
    }
    catch (error) {
        console.error('Error in audit logging middleware:', error);
        // Continue processing even if audit logging fails
    }
    next();
};
exports.logAudit = logAudit;
/**
 * Middleware to set audit context for a request
 */
const setAuditContext = (action, entityType, getEntityId) => {
    return (req, res, next) => {
        req.auditContext = {
            action,
            entityType,
            entityId: getEntityId ? getEntityId(req) : undefined
        };
        next();
    };
};
exports.setAuditContext = setAuditContext;
/**
 * Middleware to capture the original entity state before update
 */
const captureEntityState = (entityType, getEntityId, fetchEntityFn) => {
    return async (req, res, next) => {
        var _a;
        try {
            const entityId = getEntityId(req);
            const originalEntity = await fetchEntityFn(entityId);
            if (originalEntity) {
                req.auditContext = {
                    ...req.auditContext,
                    action: ((_a = req.auditContext) === null || _a === void 0 ? void 0 : _a.action) || 'update',
                    entityType,
                    entityId,
                    oldValue: originalEntity
                };
            }
            next();
        }
        catch (error) {
            console.error('Error capturing entity state:', error);
            next();
        }
    };
};
exports.captureEntityState = captureEntityState;
/**
 * Captures response data for audit logging
 */
const captureResponseForAudit = (action, entityType, getEntityIdFromResponse) => {
    return (req, res, next) => {
        // Store the original send function
        const originalSend = res.send;
        // Override the send function
        res.send = function (body) {
            var _a;
            // Parse the response body if it's JSON
            try {
                const data = typeof body === 'string' ? JSON.parse(body) : body;
                // Only log successful responses
                if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
                    const entityId = getEntityIdFromResponse(data);
                    req.auditContext = {
                        action,
                        entityType,
                        entityId,
                        newValue: data
                    };
                    // Perform audit logging
                    if (req.user) {
                        (0, auditLogService_1.createAuditLog)(req.user.userId, action, entityType, entityId, (_a = req.auditContext) === null || _a === void 0 ? void 0 : _a.oldValue, data, req).catch(err => console.error('Error logging audit from response:', err));
                    }
                }
            }
            catch (error) {
                console.error('Error in response capture middleware:', error);
            }
            // Call the original send function
            return originalSend.call(this, body);
        };
        next();
    };
};
exports.captureResponseForAudit = captureResponseForAudit;
// Simple audit logging middleware for GET requests or simple actions
const auditLog = (actionDescription) => {
    return (req, res, next) => {
        if (!req.auditContext) {
            req.auditContext = {};
        }
        req.auditContext.action = actionDescription;
        // No entity capture needed here, just log the action
        // The actual logging will happen in the `logAudit` middleware if used after this,
        // or needs to be called explicitly if this is the only audit middleware for the route.
        // For now, we assume logAudit will be used later or this is informational.
        console.log(`Audit context set for action: ${actionDescription}`);
        next();
    };
};
exports.auditLog = auditLog;

import { Request, Response, NextFunction } from 'express';
import { createAuditLog } from '../services/auditLogService';

// Extend Express Request to include audit context
declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        action: string;
        entityType: string;
        entityId?: string;
        oldValue?: any;
        newValue?: any;
      };
    }
  }
}

/**
 * Creates an audit log entry from the current request
 */
export const logAudit = async (req: Request, res: Response, next: NextFunction) => {
  const { user, auditContext } = req;

  // Skip if no user or audit context
  if (!user || !auditContext) {
    return next();
  }

  const { action, entityType, entityId = '', oldValue, newValue } = auditContext;

  try {
    await createAuditLog(
      user.userId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      req
    );
  } catch (error) {
    console.error('Error in audit logging middleware:', error);
    // Continue processing even if audit logging fails
  }

  next();
};

/**
 * Middleware to set audit context for a request
 */
export const setAuditContext = (
  action: string,
  entityType: string,
  getEntityId?: (req: Request) => string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.auditContext = {
      action,
      entityType,
      entityId: getEntityId ? getEntityId(req) : undefined
    };
    next();
  };
};

/**
 * Middleware to capture the original entity state before update
 */
export const captureEntityState = (
  entityType: string,
  getEntityId: (req: Request) => string,
  fetchEntityFn: (entityId: string) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityId = getEntityId(req);
      const originalEntity = await fetchEntityFn(entityId);
      
      if (originalEntity) {
        req.auditContext = {
          ...req.auditContext,
          action: req.auditContext?.action || 'update',
          entityType,
          entityId,
          oldValue: originalEntity
        };
      }
      next();
    } catch (error) {
      console.error('Error capturing entity state:', error);
      next();
    }
  };
};

/**
 * Captures response data for audit logging
 */
export const captureResponseForAudit = (
  action: string,
  entityType: string,
  getEntityIdFromResponse: (data: any) => string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store the original send function
    const originalSend = res.send;

    // Override the send function
    res.send = function(body): Response {
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
            createAuditLog(
              req.user.userId,
              action,
              entityType,
              entityId,
              req.auditContext?.oldValue,
              data,
              req
            ).catch(err => console.error('Error logging audit from response:', err));
          }
        }
      } catch (error) {
        console.error('Error in response capture middleware:', error);
      }
      
      // Call the original send function
      return originalSend.call(this, body);
    };
    
    next();
  };
};

// Simple audit logging middleware for GET requests or simple actions
export const auditLog = (actionDescription: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).auditContext) {
      (req as any).auditContext = {};
    }
    (req as any).auditContext.action = actionDescription;
    // No entity capture needed here, just log the action
    // The actual logging will happen in the `logAudit` middleware if used after this,
    // or needs to be called explicitly if this is the only audit middleware for the route.
    // For now, we assume logAudit will be used later or this is informational.
    console.log(`Audit context set for action: ${actionDescription}`);
    next();
  };
}; 
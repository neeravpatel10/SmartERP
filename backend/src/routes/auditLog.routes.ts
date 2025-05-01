import express from 'express';
import { authenticate } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/auth';
import { 
  getAuditLogEntries, 
  getEntityHistory,
  exportAuditLogEntries 
} from '../controllers/auditLog.controller';

const router = express.Router();

// All audit log routes require authentication and super admin privileges
router.use(authenticate);
router.use(isSuperAdmin);

// Get paginated audit logs with filtering
router.get('/', getAuditLogEntries);

// Get audit history for a specific entity
router.get('/entity/:entityType/:entityId', getEntityHistory);

// Export audit logs to Excel
router.get('/export', exportAuditLogEntries);

export default router; 
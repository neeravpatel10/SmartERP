import express from 'express';
import { authenticate } from '../middleware/auth';
import { isSuperAdmin, isDeptAdmin, authorize } from '../middleware/auth';
import { 
  getBatches, 
  getBatchById, 
  createBatch, 
  updateBatch, 
  deleteBatch, 
  rolloverBatch
} from '../controllers/batch.controller';
import { 
  setAuditContext, 
  captureEntityState, 
  logAudit 
} from '../middleware/auditMiddleware';
import { prisma } from '../index';
import { batchSchema, updateBatchSchema, validate } from '../utils/validation';

const router = express.Router();

// All batch routes require authentication
router.use(authenticate);

// Get all batches - no audit needed for read operations
router.get('/', getBatches);

// Get batch by ID - no audit needed for read operations
router.get('/:id', getBatchById);

// Create new batch - audit this action
router.post(
  '/', 
  isSuperAdmin, 
  validate(batchSchema),
  setAuditContext('create', 'batch'),
  createBatch,
  logAudit
);

// Update batch - audit this action with before/after state
router.put(
  '/:id', 
  isSuperAdmin, 
  validate(updateBatchSchema),
  captureEntityState(
    'batch', 
    (req) => req.params.id,
    async (id: string) => {
      if (!id) return null;
      return await prisma.batch.findUnique({ where: { id } });
    }
  ),
  setAuditContext('update', 'batch', (req) => req.params.id),
  updateBatch,
  logAudit
);

// Delete batch - audit this action
router.delete(
  '/:id', 
  isSuperAdmin, 
  captureEntityState(
    'batch', 
    (req) => req.params.id,
    async (id: string) => {
      if (!id) return null;
      return await prisma.batch.findUnique({ where: { id } });
    }
  ),
  setAuditContext('delete', 'batch', (req) => req.params.id),
  deleteBatch,
  logAudit
);

// Rollover batch semester - audit this action
router.put(
  '/:id/rollover',
  authorize([1, 3]), // Allow Super Admin (1) and Dept Admin (3)
  captureEntityState(
    'batch',
    (req) => req.params.id,
    async (id: string) => {
      if (!id) return null;
      return await prisma.batch.findUnique({ where: { id } });
    }
  ),
  setAuditContext('rollover', 'batch', (req) => req.params.id),
  rolloverBatch, // <-- Use new controller function
  logAudit
);

export default router; 
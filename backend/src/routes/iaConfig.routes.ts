import { Router } from 'express';
import { 
  getIAConfig, 
  getStructuredIAConfig, 
  saveIAConfig, 
  removeIAConfig 
} from '../controllers/iaConfig.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { iaConfigSchema } from '../utils/validation';
import { 
  setAuditContext, 
  captureEntityState, 
  logAudit 
} from '../middleware/auditMiddleware';
import { prisma } from '../index';

const router = Router();

// IA Configuration routes
router.get('/components/:componentId/config', authenticate, getIAConfig);
router.get('/components/:componentId/structure', authenticate, getStructuredIAConfig);
router.post(
  '/components/:componentId/config', 
  authenticate, 
  validate(iaConfigSchema),
  captureEntityState(
    'iaConfig',
    (req) => req.params.componentId,
    async (id) => await prisma.iAQuestionConfig.findMany({ 
      where: { componentId: parseInt(id) }
    })
  ),
  setAuditContext('configure', 'iaConfig', (req) => req.params.componentId),
  saveIAConfig,
  logAudit
);
router.delete(
  '/components/:componentId/config', 
  authenticate,
  captureEntityState(
    'iaConfig',
    (req) => req.params.componentId,
    async (id) => await prisma.iAQuestionConfig.findMany({ 
      where: { componentId: parseInt(id) }
    })
  ),
  setAuditContext('delete', 'iaConfig', (req) => req.params.componentId),
  removeIAConfig,
  logAudit
);

export default router; 
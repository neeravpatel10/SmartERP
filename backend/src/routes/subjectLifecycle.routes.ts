import { Router } from 'express';
import { 
  getStatusHistory,
  validateTransition,
  activateSubjectHandler,
  lockSubjectHandler,
  unlockSubjectHandler,
  archiveSubjectHandler
} from '../controllers/subjectLifecycle.controller';
import { authenticate, isSuperAdmin } from '../middleware/auth';
import { 
  setAuditContext, 
  captureEntityState, 
  logAudit 
} from '../middleware/auditMiddleware';
import { prisma } from '../index';

const router = Router();

// Read-only routes - no audit needed
router.get('/subjects/:subjectId/status-history', authenticate, getStatusHistory);
router.post('/subjects/:subjectId/validate-transition', authenticate, validateTransition);

// Status transition routes - all should be audited
router.put(
  '/subjects/:subjectId/activate', 
  authenticate, 
  captureEntityState(
    'subject',
    (req) => req.params.subjectId,
    async (id) => await prisma.subject.findUnique({ 
      where: { id: parseInt(id) },
      include: { category: true }
    })
  ),
  setAuditContext('status_change', 'subject', (req) => req.params.subjectId),
  activateSubjectHandler,
  logAudit
);

router.put(
  '/subjects/:subjectId/lock', 
  authenticate, 
  captureEntityState(
    'subject',
    (req) => req.params.subjectId,
    async (id) => await prisma.subject.findUnique({ 
      where: { id: parseInt(id) },
      include: { category: true }
    })
  ),
  setAuditContext('status_change', 'subject', (req) => req.params.subjectId),
  lockSubjectHandler,
  logAudit
);

router.put(
  '/subjects/:subjectId/unlock', 
  authenticate,
  isSuperAdmin, 
  captureEntityState(
    'subject',
    (req) => req.params.subjectId,
    async (id) => await prisma.subject.findUnique({ 
      where: { id: parseInt(id) },
      include: { category: true }
    })
  ),
  setAuditContext('status_change', 'subject', (req) => req.params.subjectId),
  unlockSubjectHandler,
  logAudit
);

router.put(
  '/subjects/:subjectId/archive', 
  authenticate, 
  captureEntityState(
    'subject',
    (req) => req.params.subjectId,
    async (id) => await prisma.subject.findUnique({ 
      where: { id: parseInt(id) },
      include: { category: true }
    })
  ),
  setAuditContext('status_change', 'subject', (req) => req.params.subjectId),
  archiveSubjectHandler,
  logAudit
);

export default router; 
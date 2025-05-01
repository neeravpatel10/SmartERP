import express from 'express';
import { authenticate, isSuperAdmin, isDeptAdmin } from '../middleware/auth';
import { validate } from '../utils/validation';
import { facultySchema, updateFacultySchema } from '../utils/validation';
import { 
  createFaculty, 
  updateFaculty, 
  getFaculty, 
  getFacultyById,
  bulkUploadFaculty,
  getFacultySubjects
} from '../controllers/faculty.controller';
import { 
  setAuditContext, 
  captureEntityState, 
  logAudit 
} from '../middleware/auditMiddleware';
import { prisma } from '../index';

const router = express.Router();

// Read-only routes - no audit needed
router.get('/', authenticate, getFaculty);
router.get('/:id', authenticate, getFacultyById);
router.get('/:id/subjects', authenticate, getFacultySubjects);

// Create faculty - audit this action
router.post(
  '/', 
  authenticate, 
  validate(facultySchema), 
  setAuditContext('create', 'faculty'),
  createFaculty,
  logAudit
);

// Update faculty - audit this action
router.put(
  '/:id', 
  authenticate, 
  validate(updateFacultySchema),
  captureEntityState(
    'faculty',
    (req) => req.params.id,
    async (id) => await prisma.faculty.findUnique({ 
      where: { id: parseInt(id) },
      include: { department: true }
    })
  ),
  setAuditContext('update', 'faculty', (req) => req.params.id),
  updateFaculty,
  logAudit
);

// Bulk upload faculty - audit this action
router.post(
  '/bulk-upload', 
  authenticate, 
  setAuditContext('bulk_create', 'faculty'),
  bulkUploadFaculty,
  logAudit
);

export default router; 
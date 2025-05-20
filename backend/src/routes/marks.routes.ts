import { Router } from 'express';
import { 
  examComponentSchema, 
  studentComponentMarkSchema, 
  bulkMarksSchema, 
  validate 
} from '../utils/validation';
import internalMarksRoutes from '../api/marks/internal/internal.routes';
import { 
  createExamComponent, 
  getExamComponents, 
  getExamComponentById, 
  addStudentComponentMark,
  bulkUploadMarks,
  getStudentMarks,
  getComponentMarks,
  downloadMarksTemplate
} from '../controllers/marks.controller';
import { authenticate } from '../middleware/auth';
import { 
  setAuditContext, 
  captureEntityState, 
  logAudit 
} from '../middleware/auditMiddleware';
import { prisma } from '../index';

const router = Router();

// Read-only routes - no audit needed
router.get('/exam-components', authenticate, getExamComponents);
router.get('/exam-components/:id', authenticate, getExamComponentById);
router.get('/student/:usn', authenticate, getStudentMarks);

// Add route to get marks for a specific component
router.get('/components/:componentId/marks', authenticate, getComponentMarks);

// Add route to download marks template
router.get('/components/:componentId/template', authenticate, downloadMarksTemplate);

// Create exam component - audit this action
router.post(
  '/exam-components', 
  authenticate, 
  validate(examComponentSchema), 
  setAuditContext('create', 'examComponent'),
  createExamComponent,
  logAudit
);

// Add student marks - audit this action (critical for academic integrity)
router.post(
  '/student-marks', 
  authenticate, 
  validate(studentComponentMarkSchema),
  captureEntityState(
    'studentMark',
    (req) => `${req.body.componentId}-${req.body.usn}`,
    async (id) => {
      const [componentId, usn] = id.split('-');
      return await prisma.studentComponentMark.findFirst({ 
        where: { 
          componentId: parseInt(componentId),
          student: {
            usn: usn
          }
        }
      });
    }
  ),
  setAuditContext('grade', 'studentMark', (req) => `${req.body.componentId}-${req.body.usn}`),
  addStudentComponentMark,
  logAudit
);

// Bulk upload marks - audit this action (critical for academic integrity)
router.post(
  '/upload', 
  authenticate, 
  validate(bulkMarksSchema),
  setAuditContext('bulk_grade', 'studentMarks', (req) => req.body.componentId.toString()),
  bulkUploadMarks,
  logAudit
);

// Mount internal marks routes
router.use('/internal', internalMarksRoutes);

export default router; 
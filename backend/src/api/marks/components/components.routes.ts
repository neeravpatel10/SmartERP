import { Router } from 'express';
import * as ctrl from './components.controller';
import * as totalsCtrl from './totals.controller';
import { authorize } from '../../../middleware/auth';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const router = Router();

// Components routes
router.get('/grid', authorize([2, 3, 1, -1]), ctrl.grid);
router.patch('/entry', authorize([2, 3]), ctrl.patchEntry); // no student access
router.post('/upload', authorize([2, 3]), upload.single('file'), ctrl.uploadExcel);
router.get('/template', authorize([2, 3]), ctrl.template);

// Totals routes (will be implemented in totals.controller.ts)
router.get('/totals/grid', authorize([2, 3, 1, -1]), totalsCtrl.grid);
router.get('/totals/export', authorize([2, 3, 1]), totalsCtrl.exportData); // students no-export

export default router;

import { Router } from 'express';
import { getGridData, exportData } from './report.controller';
import { authenticate } from '../../../middleware/auth';
import { validateRequest } from './custom-validation';
import { reportGridParamsSchema, reportExportParamsSchema } from './report.validation';

const router = Router();

// Get marks report grid data with filtering
router.get(
  '/grid',
  authenticate,
  validateRequest(reportGridParamsSchema, 'query'),
  getGridData
);

// Export marks report in specified format (XLSX, CSV, PDF)
router.get(
  '/export',
  authenticate,
  validateRequest(reportExportParamsSchema, 'query'),
  exportData
);

export default router;

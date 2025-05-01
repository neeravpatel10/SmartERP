import express from 'express';
import { getFacultySubjectReport } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';

// Define roles as numeric constants based on the auth middleware
const ADMIN_ROLE = 1; // Super Admin
const FACULTY_ROLE = 2; // Faculty

const router = express.Router();

/**
 * @route GET /api/reports/faculty/:facultyId/subject/:subjectId
 * @desc Get faculty subject report
 * @access Private (Admin, Faculty)
 */
router.get(
  '/faculty/:facultyId/subject/:subjectId',
  authenticate,
  authorize([ADMIN_ROLE, FACULTY_ROLE]),
  getFacultySubjectReport
);

export default router; 
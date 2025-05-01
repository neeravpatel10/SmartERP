import express from 'express';
import * as subjectController from '../controllers/subjectController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = express.Router();

// Authentication middleware for all routes
router.use(authenticateToken);

// Get all subjects
router.get('/', subjectController.getAllSubjects);

// Get subject by ID
router.get('/:id', subjectController.getSubjectById);

// Create subject (Admin and Super Admin only)
router.post(
  '/',
  authorizeRoles(['super_admin', 'dept_admin']),
  subjectController.createSubject
);

// Update subject (Admin and Super Admin only)
router.put(
  '/:id',
  authorizeRoles(['super_admin', 'dept_admin']),
  subjectController.updateSubject
);

// Delete subject (Admin and Super Admin only)
router.delete(
  '/:id',
  authorizeRoles(['super_admin', 'dept_admin']),
  subjectController.deleteSubject
);

// Update subject status (Admin and Super Admin only)
router.put(
  '/:id/status',
  authorizeRoles(['super_admin', 'dept_admin']),
  subjectController.updateSubjectStatus
);

// Get subject status history
router.get(
  '/:id/status-history',
  subjectController.getSubjectStatusHistory
);

// Get subjects by status
router.get(
  '/status/:status',
  subjectController.getSubjectsByStatus
);

// Get subjects by department
router.get(
  '/department/:departmentId',
  subjectController.getSubjectsByDepartment
);

export default router; 
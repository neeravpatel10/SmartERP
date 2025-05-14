import express from 'express';
import * as facultySubjectMappingController from '../controllers/facultySubjectMappingController';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/roleCheck';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all mappings (role-based filtering applied in controller)
router.get('/', facultySubjectMappingController.getAllMappings);

// Get mapping by ID
router.get('/:id', facultySubjectMappingController.getMappingById);

// Create new mapping (only for Super Admin and Department Admin)
router.post('/', checkRole([1, 3]), facultySubjectMappingController.createMapping);

// Update mapping status (active/inactive) (only for Super Admin and Department Admin)
router.put('/status/:id', checkRole([1, 3]), facultySubjectMappingController.updateMappingStatus);

// Get students for a subject mapping
router.get('/:id/students', facultySubjectMappingController.getStudentsForMapping);

// Delete mapping (hard delete - only for unused mappings) (only for Super Admin and Department Admin)
router.delete('/:id', checkRole([1, 3]), facultySubjectMappingController.deleteMapping);

export default router;

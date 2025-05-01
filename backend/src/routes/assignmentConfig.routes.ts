import { Router } from 'express';
import { 
  getAssignmentConfig, 
  saveAssignmentConfig, 
  removeAssignmentConfig 
} from '../controllers/assignmentConfig.controller';
import { authenticate } from '../middleware/auth';
import { validate, assignmentConfigSchema } from '../utils/validation';

// Create assignment config validation schema
const router = Router();

// Assignment Configuration routes
router.get('/components/:componentId/assignment-config', authenticate, getAssignmentConfig);
router.post('/components/:componentId/assignment-config', authenticate, validate(assignmentConfigSchema), saveAssignmentConfig);
router.delete('/components/:componentId/assignment-config', authenticate, removeAssignmentConfig);

export default router; 
import { Router } from 'express';
import { 
  calculateSubjectResults,
  calculateStudentResult,
  viewSubjectResults,
  viewStudentResults
} from '../controllers/results.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Results calculation routes
router.post('/calculate/:subject_id', authenticate, calculateSubjectResults);
router.post('/calculate/:subject_id/:usn', authenticate, calculateStudentResult);

// Results view routes
router.get('/view/:subject_id', authenticate, viewSubjectResults);
router.get('/student/:usn', authenticate, viewStudentResults);

export default router; 
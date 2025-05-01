import { Router } from 'express';
import { 
  getStudentProfile,
  downloadStudentProfile,
  getStudentSemesterData
} from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Student profile routes
router.get('/:usn', authenticate, getStudentProfile);
router.get('/:usn/download', authenticate, downloadStudentProfile);
router.get('/:usn/semesters/:sem_number', authenticate, getStudentSemesterData);

export default router; 
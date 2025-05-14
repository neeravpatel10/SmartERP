import { Router } from 'express';
import { getSections, getSectionById } from '../controllers/section.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Section routes
router.get('/', authenticate, getSections);
router.get('/:id', authenticate, getSectionById);

export default router; 
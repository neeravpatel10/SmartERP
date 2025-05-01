import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get integrated dashboard data
router.get('/', authenticate as any, getDashboardData as any);

export default router; 
import { Router } from 'express';
import { 
  loginSchema, 
  changePasswordSchema, 
  passwordResetRequestSchema, 
  passwordResetConfirmSchema,
  unlockAccountSchema,
  validate 
} from '../utils/validation';
import { 
  login, 
  changePassword, 
  getCurrentUser,
  requestPasswordReset,
  confirmPasswordReset,
  unlockAccount
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(passwordResetRequestSchema), requestPasswordReset);
router.post('/reset-password', validate(passwordResetConfirmSchema), confirmPasswordReset);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

// Admin routes
router.post('/unlock-account', authenticate, validate(unlockAccountSchema), unlockAccount);

export default router; 
import { Router } from 'express';
import { registerSchema, updateUserSchema, validate } from '../utils/validation';
import { registerUser, updateUser, getUsers } from '../controllers/user.controller';
import { authenticate, isSuperAdmin } from '../middleware/auth';
import { 
  setAuditContext, 
  captureEntityState, 
  logAudit 
} from '../middleware/auditMiddleware';
import { prisma } from '../index';

const router = Router();

// Public routes - Admin registration should be audited
router.post(
  '/register', 
  validate(registerSchema), 
  setAuditContext('create', 'user'),
  registerUser,
  logAudit
);

// Protected routes
router.get('/', authenticate, getUsers);

// Update user profile - audit this action
router.put(
  '/profile', 
  authenticate, 
  validate(updateUserSchema),
  captureEntityState(
    'user',
    (req) => req.user.userId.toString(),
    async (id) => await prisma.user.findUnique({ 
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        departmentId: true,
        lastLogin: true
      }
    })
  ),
  setAuditContext('update', 'user', (req) => req.user.userId.toString()),
  updateUser,
  logAudit
);

export default router; 
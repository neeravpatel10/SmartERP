import { Router } from 'express';
import { departmentSchema, updateDepartmentSchema, validate } from '../utils/validation';
import { createDepartment, updateDepartment, getDepartments, getDepartmentById, deleteDepartment } from '../controllers/department.controller';
import { authenticate, isSuperAdmin } from '../middleware/auth';
import { 
  setAuditContext, 
  captureEntityState, 
  logAudit 
} from '../middleware/auditMiddleware';
import { prisma } from '../index';

const router = Router();

// Remove the first, simpler definitions for POST / and PUT /:id
// router.post('/', authenticate, validate(departmentSchema), createDepartment);
// router.put('/:id', authenticate, validate(updateDepartmentSchema), updateDepartment);

// Keep the GET routes
router.get('/', authenticate, getDepartments);
router.get('/:id', authenticate, getDepartmentById);

// Keep the detailed definitions for POST and PUT including authorization and auditing
router.post(
  '/', 
  authenticate, 
  isSuperAdmin,
  validate(departmentSchema), 
  setAuditContext('create', 'department'),
  createDepartment,
  logAudit
);

// Update department - audit this action (super admin only)
router.put(
  '/:id', 
  authenticate,
  isSuperAdmin,
  validate(updateDepartmentSchema),
  captureEntityState(
    'department',
    (req) => req.params.id,
    async (id) => await prisma.department.findUnique({ 
      where: { id: parseInt(id) }
    })
  ),
  setAuditContext('update', 'department', (req) => req.params.id),
  updateDepartment,
  logAudit
);

// Delete department - audit this action (super admin only)
router.delete(
  '/:id',
  authenticate,
  isSuperAdmin,
  captureEntityState(
    'department',
    (req) => req.params.id,
    async (id) => await prisma.department.findUnique({ 
      where: { id: parseInt(id) }
    })
  ),
  setAuditContext('delete', 'department', (req) => req.params.id),
  deleteDepartment,
  logAudit
);

export default router; 
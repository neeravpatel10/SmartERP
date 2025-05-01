"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../utils/validation");
const department_controller_1 = require("../controllers/department.controller");
const auth_1 = require("../middleware/auth");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const index_1 = require("../index");
const router = (0, express_1.Router)();
// Remove the first, simpler definitions for POST / and PUT /:id
// router.post('/', authenticate, validate(departmentSchema), createDepartment);
// router.put('/:id', authenticate, validate(updateDepartmentSchema), updateDepartment);
// Keep the GET routes
router.get('/', auth_1.authenticate, department_controller_1.getDepartments);
router.get('/:id', auth_1.authenticate, department_controller_1.getDepartmentById);
// Keep the detailed definitions for POST and PUT including authorization and auditing
router.post('/', auth_1.authenticate, auth_1.isSuperAdmin, (0, validation_1.validate)(validation_1.departmentSchema), (0, auditMiddleware_1.setAuditContext)('create', 'department'), department_controller_1.createDepartment, auditMiddleware_1.logAudit);
// Update department - audit this action (super admin only)
router.put('/:id', auth_1.authenticate, auth_1.isSuperAdmin, (0, validation_1.validate)(validation_1.updateDepartmentSchema), (0, auditMiddleware_1.captureEntityState)('department', (req) => req.params.id, async (id) => await index_1.prisma.department.findUnique({
    where: { id: parseInt(id) }
})), (0, auditMiddleware_1.setAuditContext)('update', 'department', (req) => req.params.id), department_controller_1.updateDepartment, auditMiddleware_1.logAudit);
exports.default = router;

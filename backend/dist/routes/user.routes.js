"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../utils/validation");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const index_1 = require("../index");
const router = (0, express_1.Router)();
// Public routes - Admin registration should be audited
router.post('/register', (0, validation_1.validate)(validation_1.registerSchema), (0, auditMiddleware_1.setAuditContext)('create', 'user'), user_controller_1.registerUser, auditMiddleware_1.logAudit);
// Protected routes
router.get('/', auth_1.authenticate, user_controller_1.getUsers);
// Update user profile - audit this action
router.put('/profile', auth_1.authenticate, (0, validation_1.validate)(validation_1.updateUserSchema), (0, auditMiddleware_1.captureEntityState)('user', (req) => req.user.userId.toString(), async (id) => await index_1.prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
        id: true,
        username: true,
        email: true,
        role: true,
        departmentId: true,
        lastLogin: true
    }
})), (0, auditMiddleware_1.setAuditContext)('update', 'user', (req) => req.user.userId.toString()), user_controller_1.updateUser, auditMiddleware_1.logAudit);
exports.default = router;

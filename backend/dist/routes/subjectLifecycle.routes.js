"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subjectLifecycle_controller_1 = require("../controllers/subjectLifecycle.controller");
const auth_1 = require("../middleware/auth");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const index_1 = require("../index");
const router = (0, express_1.Router)();
// Read-only routes - no audit needed
router.get('/subjects/:subjectId/status-history', auth_1.authenticate, subjectLifecycle_controller_1.getStatusHistory);
router.post('/subjects/:subjectId/validate-transition', auth_1.authenticate, subjectLifecycle_controller_1.validateTransition);
// Status transition routes - all should be audited
router.put('/subjects/:subjectId/activate', auth_1.authenticate, (0, auditMiddleware_1.captureEntityState)('subject', (req) => req.params.subjectId, async (id) => await index_1.prisma.subject.findUnique({
    where: { id: parseInt(id) },
    include: { category: true }
})), (0, auditMiddleware_1.setAuditContext)('status_change', 'subject', (req) => req.params.subjectId), subjectLifecycle_controller_1.activateSubjectHandler, auditMiddleware_1.logAudit);
router.put('/subjects/:subjectId/lock', auth_1.authenticate, (0, auditMiddleware_1.captureEntityState)('subject', (req) => req.params.subjectId, async (id) => await index_1.prisma.subject.findUnique({
    where: { id: parseInt(id) },
    include: { category: true }
})), (0, auditMiddleware_1.setAuditContext)('status_change', 'subject', (req) => req.params.subjectId), subjectLifecycle_controller_1.lockSubjectHandler, auditMiddleware_1.logAudit);
router.put('/subjects/:subjectId/unlock', auth_1.authenticate, auth_1.isSuperAdmin, (0, auditMiddleware_1.captureEntityState)('subject', (req) => req.params.subjectId, async (id) => await index_1.prisma.subject.findUnique({
    where: { id: parseInt(id) },
    include: { category: true }
})), (0, auditMiddleware_1.setAuditContext)('status_change', 'subject', (req) => req.params.subjectId), subjectLifecycle_controller_1.unlockSubjectHandler, auditMiddleware_1.logAudit);
router.put('/subjects/:subjectId/archive', auth_1.authenticate, (0, auditMiddleware_1.captureEntityState)('subject', (req) => req.params.subjectId, async (id) => await index_1.prisma.subject.findUnique({
    where: { id: parseInt(id) },
    include: { category: true }
})), (0, auditMiddleware_1.setAuditContext)('status_change', 'subject', (req) => req.params.subjectId), subjectLifecycle_controller_1.archiveSubjectHandler, auditMiddleware_1.logAudit);
exports.default = router;

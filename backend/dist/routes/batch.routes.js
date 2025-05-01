"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const batch_controller_1 = require("../controllers/batch.controller");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const index_1 = require("../index");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
// All batch routes require authentication
router.use(auth_1.authenticate);
// Get all batches - no audit needed for read operations
router.get('/', batch_controller_1.getBatches);
// Get batch by ID - no audit needed for read operations
router.get('/:id', batch_controller_1.getBatchById);
// Create new batch - audit this action
router.post('/', auth_2.isSuperAdmin, (0, validation_1.validate)(validation_1.batchSchema), (0, auditMiddleware_1.setAuditContext)('create', 'batch'), batch_controller_1.createBatch, auditMiddleware_1.logAudit);
// Update batch - audit this action with before/after state
router.put('/:id', auth_2.isSuperAdmin, (0, validation_1.validate)(validation_1.updateBatchSchema), (0, auditMiddleware_1.captureEntityState)('batch', (req) => req.params.id, async (id) => {
    if (!id)
        return null;
    return await index_1.prisma.batch.findUnique({ where: { id } });
}), (0, auditMiddleware_1.setAuditContext)('update', 'batch', (req) => req.params.id), batch_controller_1.updateBatch, auditMiddleware_1.logAudit);
// Delete batch - audit this action
router.delete('/:id', auth_2.isSuperAdmin, (0, auditMiddleware_1.captureEntityState)('batch', (req) => req.params.id, async (id) => {
    if (!id)
        return null;
    return await index_1.prisma.batch.findUnique({ where: { id } });
}), (0, auditMiddleware_1.setAuditContext)('delete', 'batch', (req) => req.params.id), batch_controller_1.deleteBatch, auditMiddleware_1.logAudit);
// Rollover batch semester - audit this action
router.put('/:id/rollover', (0, auth_2.authorize)([1, 3]), // Allow Super Admin (1) and Dept Admin (3)
(0, auditMiddleware_1.captureEntityState)('batch', (req) => req.params.id, async (id) => {
    if (!id)
        return null;
    return await index_1.prisma.batch.findUnique({ where: { id } });
}), (0, auditMiddleware_1.setAuditContext)('rollover', 'batch', (req) => req.params.id), batch_controller_1.rolloverBatch, // <-- Use new controller function
auditMiddleware_1.logAudit);
exports.default = router;

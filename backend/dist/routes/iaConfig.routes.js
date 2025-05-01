"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const iaConfig_controller_1 = require("../controllers/iaConfig.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const index_1 = require("../index");
const router = (0, express_1.Router)();
// IA Configuration routes
router.get('/components/:componentId/config', auth_1.authenticate, iaConfig_controller_1.getIAConfig);
router.get('/components/:componentId/structure', auth_1.authenticate, iaConfig_controller_1.getStructuredIAConfig);
router.post('/components/:componentId/config', auth_1.authenticate, (0, validation_1.validate)(validation_2.iaConfigSchema), (0, auditMiddleware_1.captureEntityState)('iaConfig', (req) => req.params.componentId, async (id) => await index_1.prisma.iAQuestionConfig.findMany({
    where: { componentId: parseInt(id) }
})), (0, auditMiddleware_1.setAuditContext)('configure', 'iaConfig', (req) => req.params.componentId), iaConfig_controller_1.saveIAConfig, auditMiddleware_1.logAudit);
router.delete('/components/:componentId/config', auth_1.authenticate, (0, auditMiddleware_1.captureEntityState)('iaConfig', (req) => req.params.componentId, async (id) => await index_1.prisma.iAQuestionConfig.findMany({
    where: { componentId: parseInt(id) }
})), (0, auditMiddleware_1.setAuditContext)('delete', 'iaConfig', (req) => req.params.componentId), iaConfig_controller_1.removeIAConfig, auditMiddleware_1.logAudit);
exports.default = router;

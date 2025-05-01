"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const auditLog_controller_1 = require("../controllers/auditLog.controller");
const router = express_1.default.Router();
// All audit log routes require authentication and super admin privileges
router.use(auth_1.authenticate);
router.use(auth_2.isSuperAdmin);
// Get paginated audit logs with filtering
router.get('/', auditLog_controller_1.getAuditLogEntries);
// Get audit history for a specific entity
router.get('/entity/:entityType/:entityId', auditLog_controller_1.getEntityHistory);
// Export audit logs to Excel
router.get('/export', auditLog_controller_1.exportAuditLogEntries);
exports.default = router;

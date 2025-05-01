"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const faculty_controller_1 = require("../controllers/faculty.controller");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const index_1 = require("../index");
const router = express_1.default.Router();
// Read-only routes - no audit needed
router.get('/', auth_1.authenticate, faculty_controller_1.getFaculty);
router.get('/:id', auth_1.authenticate, faculty_controller_1.getFacultyById);
router.get('/:id/subjects', auth_1.authenticate, faculty_controller_1.getFacultySubjects);
// Create faculty - audit this action
router.post('/', auth_1.authenticate, (0, validation_1.validate)(validation_2.facultySchema), (0, auditMiddleware_1.setAuditContext)('create', 'faculty'), faculty_controller_1.createFaculty, auditMiddleware_1.logAudit);
// Update faculty - audit this action
router.put('/:id', auth_1.authenticate, (0, validation_1.validate)(validation_2.updateFacultySchema), (0, auditMiddleware_1.captureEntityState)('faculty', (req) => req.params.id, async (id) => await index_1.prisma.faculty.findUnique({
    where: { id: parseInt(id) },
    include: { department: true }
})), (0, auditMiddleware_1.setAuditContext)('update', 'faculty', (req) => req.params.id), faculty_controller_1.updateFaculty, auditMiddleware_1.logAudit);
// Bulk upload faculty - audit this action
router.post('/bulk-upload', auth_1.authenticate, (0, auditMiddleware_1.setAuditContext)('bulk_create', 'faculty'), faculty_controller_1.bulkUploadFaculty, auditMiddleware_1.logAudit);
exports.default = router;

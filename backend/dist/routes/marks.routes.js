"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../utils/validation");
const marks_controller_1 = require("../controllers/marks.controller");
const auth_1 = require("../middleware/auth");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const index_1 = require("../index");
const router = (0, express_1.Router)();
// Read-only routes - no audit needed
router.get('/exam-components', auth_1.authenticate, marks_controller_1.getExamComponents);
router.get('/exam-components/:id', auth_1.authenticate, marks_controller_1.getExamComponentById);
router.get('/student/:usn', auth_1.authenticate, marks_controller_1.getStudentMarks);
// Add route to get marks for a specific component
router.get('/components/:componentId/marks', auth_1.authenticate, marks_controller_1.getComponentMarks);
// Add route to download marks template
router.get('/components/:componentId/template', auth_1.authenticate, marks_controller_1.downloadMarksTemplate);
// Create exam component - audit this action
router.post('/exam-components', auth_1.authenticate, (0, validation_1.validate)(validation_1.examComponentSchema), (0, auditMiddleware_1.setAuditContext)('create', 'examComponent'), marks_controller_1.createExamComponent, auditMiddleware_1.logAudit);
// Add student marks - audit this action (critical for academic integrity)
router.post('/student-marks', auth_1.authenticate, (0, validation_1.validate)(validation_1.studentComponentMarkSchema), (0, auditMiddleware_1.captureEntityState)('studentMark', (req) => `${req.body.componentId}-${req.body.usn}`, async (id) => {
    const [componentId, usn] = id.split('-');
    return await index_1.prisma.studentComponentMark.findFirst({
        where: {
            componentId: parseInt(componentId),
            student: {
                usn: usn
            }
        }
    });
}), (0, auditMiddleware_1.setAuditContext)('grade', 'studentMark', (req) => `${req.body.componentId}-${req.body.usn}`), marks_controller_1.addStudentComponentMark, auditMiddleware_1.logAudit);
// Bulk upload marks - audit this action (critical for academic integrity)
router.post('/upload', auth_1.authenticate, (0, validation_1.validate)(validation_1.bulkMarksSchema), (0, auditMiddleware_1.setAuditContext)('bulk_grade', 'studentMarks', (req) => req.body.componentId.toString()), marks_controller_1.bulkUploadMarks, auditMiddleware_1.logAudit);
exports.default = router;

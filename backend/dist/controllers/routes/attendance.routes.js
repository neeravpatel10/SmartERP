"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var validation_1 = require("../utils/validation");
var attendance_controller_1 = require("../controllers/attendance.controller");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Session routes
router.post('/sessions', auth_1.authenticate, (0, validation_1.validate)(validation_1.attendanceSessionSchema), attendance_controller_1.createAttendanceSession);
router.get('/sessions', auth_1.authenticate, attendance_controller_1.getAttendanceSessions);
router.get('/sessions/:id', auth_1.authenticate, attendance_controller_1.getAttendanceSessionById);
// Batch operations
router.post('/sessions/batch', auth_1.authenticate, (0, validation_1.validate)(validation_1.batchAttendanceSessionSchema), attendance_controller_1.createBatchAttendanceSessions);
router.put('/sessions/batch-edit', auth_1.authenticate, (0, validation_1.validate)(validation_1.batchEditAttendanceSchema), attendance_controller_1.batchEditAttendance);
// Attendance entries routes
router.post('/entries', auth_1.authenticate, (0, validation_1.validate)(validation_1.attendanceEntrySchema), attendance_controller_1.addAttendanceEntry);
router.post('/upload', auth_1.authenticate, (0, validation_1.validate)(validation_1.bulkAttendanceSchema), attendance_controller_1.bulkUploadAttendance);
// Student attendance summary
router.get('/student/:usn', auth_1.authenticate, attendance_controller_1.getStudentAttendanceSummary);
// Faculty dashboard alert
router.get('/alerts/threshold', auth_1.authenticate, attendance_controller_1.getStudentsBelowThreshold);
exports.default = router;

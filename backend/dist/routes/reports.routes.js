"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("../controllers/reports.controller");
// console.log('[reports.routes.ts] Imported getAttendanceReport:', getAttendanceReport);
// console.log('[reports.routes.ts] Imported getDepartmentReport:', getDepartmentReport);
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const auth_1 = require("../middleware/auth");
// import { Permission } from '../models/permission'; // Keep commented for now
const router = (0, express_1.Router)();
// Student reports - Uncomment
router.get('/student/:usn/semester/:semester', auth_1.authenticate, (0, auditMiddleware_1.auditLog)('Accessed Student Semester Report'), reports_controller_1.getStudentSemesterReport);
// Faculty reports - Working
router.get('/faculty/:facultyId/subject/:subjectId', auth_1.authenticate, (0, auditMiddleware_1.auditLog)('Accessed Faculty Subject Report'), reports_controller_1.getFacultySubjectReport);
// Attendance reports
router.get('/attendance/subject/:subjectId', auth_1.authenticate, (0, auditMiddleware_1.auditLog)('Accessed Attendance Report'), reports_controller_1.getAttendanceReport);
// Department reports
router.get('/department/:departmentId', auth_1.authenticate, (0, auditMiddleware_1.auditLog)('Accessed Department Report'), reports_controller_1.getDepartmentReport);
// // Add the new export route (Commented out - Not implemented)
// router.get('/student/:usn/semester/:semester/export', authenticate, auditLog('Exported Student Semester Report'), exportStudentSemesterReport);
// // (Commented out - Not implemented)
// router.get('/faculty/:facultyId/semester/:semester', authenticate, auditLog('Accessed Faculty Semester Report'), getFacultySemesterReport);
// // Add routes for Course Analysis and Course Plan Adherence if they don't exist (Commented out - Not implemented)
// // Assuming these need similar protection and logging
// router.get(
//   '/course-analysis/:subjectId/semester/:semester',
//   authenticate,
//   auditLog('Accessed Course Analysis Report'),
//   getCourseAnalysisReport
// );
// router.get(
//   '/course-plan-adherence/:subjectId/semester/:semester',
//   authenticate,
//   auditLog('Accessed Course Plan Adherence Report'),
//   getCoursePlanAdherenceReport
// );
exports.default = router;

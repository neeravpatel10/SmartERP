import { Router } from 'express';
import {
  getStudentSemesterReport,
  getFacultySubjectReport,
  getAttendanceReport,
  getDepartmentReport,
  // exportStudentSemesterReport, // Not implemented
  // getFacultySemesterReport, // Not implemented
  // getCourseAnalysisReport, // Not implemented
  // getCoursePlanAdherenceReport // Not implemented
} from '../controllers/reports.controller';

// console.log('[reports.routes.ts] Imported getAttendanceReport:', getAttendanceReport);
// console.log('[reports.routes.ts] Imported getDepartmentReport:', getDepartmentReport);

import { auditLog } from '../middleware/auditMiddleware';
import { authenticate } from '../middleware/auth';
// import { Permission } from '../models/permission'; // Keep commented for now

const router = Router();

// Student reports - Uncomment
router.get('/student/:usn/semester/:semester', authenticate, auditLog('Accessed Student Semester Report'), getStudentSemesterReport);

// Faculty reports - Working
router.get('/faculty/:facultyId/subject/:subjectId',
  authenticate,
  auditLog('Accessed Faculty Subject Report'),
  getFacultySubjectReport
);

// Attendance reports
router.get('/attendance/subject/:subjectId', authenticate, auditLog('Accessed Attendance Report'), getAttendanceReport);

// Department reports
router.get('/department/:departmentId', authenticate, auditLog('Accessed Department Report'), getDepartmentReport);

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

export default router; 
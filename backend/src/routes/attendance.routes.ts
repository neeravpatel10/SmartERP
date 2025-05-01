import { Router } from 'express';
import { 
  attendanceSessionSchema, 
  attendanceEntrySchema, 
  bulkAttendanceSchema,
  batchAttendanceSessionSchema,
  batchEditAttendanceSchema,
  validate 
} from '../utils/validation';
import { 
  createAttendanceSession, 
  getAttendanceSessions, 
  getAttendanceSessionById, 
  addAttendanceEntry,
  bulkUploadAttendance,
  getStudentAttendanceSummary,
  createBatchAttendanceSessions,
  batchEditAttendance,
  getStudentsBelowThreshold
} from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Session routes
router.post('/sessions', authenticate, validate(attendanceSessionSchema), createAttendanceSession);
router.get('/sessions', authenticate, getAttendanceSessions);
router.get('/sessions/:id', authenticate, getAttendanceSessionById);

// Batch operations
router.post('/sessions/batch', authenticate, validate(batchAttendanceSessionSchema), createBatchAttendanceSessions);
router.put('/sessions/batch-edit', authenticate, validate(batchEditAttendanceSchema), batchEditAttendance);

// Attendance entries routes
router.post('/entries', authenticate, validate(attendanceEntrySchema), addAttendanceEntry);
router.post('/upload', authenticate, validate(bulkAttendanceSchema), bulkUploadAttendance);

// Student attendance summary
router.get('/student/:usn', authenticate, getStudentAttendanceSummary);

// Faculty dashboard alert
router.get('/alerts/threshold', authenticate, getStudentsBelowThreshold);

export default router; 
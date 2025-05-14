import express from 'express';
import multer from 'multer';
import { authenticate, isSuperAdmin, isDeptAdmin } from '../middleware/auth';
import {
  createStudent,
  getStudents,
  getStudentByUSN,
  updateStudent,
  deleteStudent,
  importStudentsFromExcel,
  exportStudentsToExcel,
  createStudentLogin,
  createMultipleStudentLogins,
  getStudentsWithoutLogins
} from '../controllers/student.controller';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Protected routes - all routes require authentication
router.use(authenticate);

// CRUD routes
router.post('/', createStudent);
router.get('/', getStudents);
router.get('/:usn', getStudentByUSN);
router.put('/:usn', updateStudent);
router.delete('/:usn', deleteStudent);

// Excel import/export routes
router.post('/import', upload.single('file'), importStudentsFromExcel);
router.get('/export', exportStudentsToExcel);

// Login management routes - require admin privileges
router.get('/management/without-logins', isDeptAdmin, getStudentsWithoutLogins);
router.post('/:usn/create-login', isDeptAdmin, createStudentLogin);
router.post('/create-multiple-logins', isDeptAdmin, createMultipleStudentLogins);

export default router; 
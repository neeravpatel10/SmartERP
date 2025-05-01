import { Router } from 'express';
import { studentSchema, updateStudentSchema, validate } from '../utils/validation';
import { 
  createStudent, 
  updateStudent, 
  getStudents, 
  getStudentByUSN,
  bulkUploadStudents
} from '../controllers/student.controller';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import * as XLSX from 'xlsx';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    // Accept only Excel and CSV files
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' || 
      file.mimetype === 'text/csv'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed') as any, false);
    }
  }
});

// Student routes
router.post('/', authenticate, validate(studentSchema), createStudent);
router.put('/:usn', authenticate, validate(updateStudentSchema), updateStudent);
router.get('/', authenticate, getStudents);
router.post('/bulk-upload', authenticate, upload.single('file'), bulkUploadStudents);
router.get('/template', authenticate, (req, res) => {
  try {
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet([{
      USN: 'USN123',
      'First Name': 'John',
      'Middle Name': '',
      'Last Name': 'Doe',
      Email: 'john.doe@example.com',
      Phone: '1234567890',
      'Date of Birth': '2000-01-01',
      Gender: 'Male',
      Address: '123 Main St',
      'Batch ID': 'batch-id-here',
      'Department ID': 'dept-id-here',
      Semester: 1,
      Section: 'A',
      'Admission Year': 2023,
      'Father Name': 'James Doe',
      'Mother Name': 'Jane Doe',
      'Guardian Name': '',
      'Guardian Contact': ''
    }]);

    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Disposition', 'attachment; filename=students_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template'
    });
  }
});
router.get('/:usn', authenticate, getStudentByUSN);

export default router; 
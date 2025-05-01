import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Login validation schema
export const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' })
});

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' })
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Valid email address is required'),
});

// Password reset confirmation schema
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// Account unlock schema (for admin use)
export const unlockAccountSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

// User registration schema
export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters'),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
});

// User update schema
export const updateUserSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters')
    .optional(),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .optional()
});

// Department schema
export const departmentSchema = z.object({
  name: z.string()
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name must be less than 100 characters'),
  code: z.string()
    .min(2, 'Department code must be at least 2 characters')
    .max(10, 'Department code must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Department code must contain only uppercase letters and numbers'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  headId: z.number()
    .int('Head ID must be an integer')
    .positive('Head ID must be positive')
    .optional()
});

// Department update schema
export const updateDepartmentSchema = z.object({
  name: z.string()
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name must be less than 100 characters')
    .optional(),
  code: z.string()
    .min(2, 'Department code must be at least 2 characters')
    .max(10, 'Department code must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Department code must contain only uppercase letters and numbers')
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  headId: z.number()
    .int('Head ID must be an integer')
    .positive('Head ID must be positive')
    .optional()
});

// Subject schema
export const subjectSchema = z.object({
  code: z.string()
    .min(2, 'Subject code must be at least 2 characters')
    .max(10, 'Subject code must be less than 10 characters'),
  name: z.string()
    .min(3, 'Subject name must be at least 3 characters')
    .max(100, 'Subject name must be less than 100 characters'),
  semester: z.number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester must be at most 8'),
  credits: z.number()
    .int('Credits must be an integer')
    .min(1, 'Credits must be at least 1')
    .max(5, 'Credits must be at most 5'),
  isLab: z.boolean().optional(),
  departmentId: z.number()
    .int('Department ID must be an integer')
    .positive('Department ID must be positive'),
  categoryId: z.number()
    .int('Category ID must be an integer')
    .positive('Category ID must be positive')
    .optional()
});

// Subject update schema
export const updateSubjectSchema = z.object({
  code: z.string()
    .min(2, 'Subject code must be at least 2 characters')
    .max(10, 'Subject code must be less than 10 characters')
    .optional(),
  name: z.string()
    .min(3, 'Subject name must be at least 3 characters')
    .max(100, 'Subject name must be less than 100 characters')
    .optional(),
  semester: z.number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester must be at most 8')
    .optional(),
  credits: z.number()
    .int('Credits must be an integer')
    .min(1, 'Credits must be at least 1')
    .max(5, 'Credits must be at most 5')
    .optional(),
  isLab: z.boolean().optional(),
  departmentId: z.number()
    .int('Department ID must be an integer')
    .positive('Department ID must be positive')
    .optional(),
  categoryId: z.number()
    .int('Category ID must be an integer')
    .positive('Category ID must be positive')
    .optional().nullable()
});

// Faculty-Subject Mapping schema
export const facultySubjectMappingSchema = z.object({
  facultyId: z.number()
    .int('Faculty ID must be an integer')
    .positive('Faculty ID must be positive'),
  subjectId: z.number()
    .int('Subject ID must be an integer')
    .positive('Subject ID must be positive'),
  section: z.string()
    .max(10, 'Section must be less than 10 characters')
    .optional(),
  semester: z.number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester must be at most 8'),
  batchId: z.number()
    .int('Batch ID must be an integer')
    .positive('Batch ID must be positive'),
  academicYear: z.string()
    .regex(/^\d{4}-\d{4}$/, 'Academic year must be in the format YYYY-YYYY'),
  componentScope: z.enum(['theory', 'lab', 'both'], {
    errorMap: () => ({ message: 'Component scope must be one of: theory, lab, both' })
  }).default('theory'),
  isPrimary: z.boolean().default(true),
  active: z.boolean().default(true),
  status: z.enum(['pending', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be one of: pending, approved, rejected' })
  }).default('pending')
});

// Faculty-Subject Mapping update schema
export const updateFacultySubjectMappingSchema = z.object({
  componentScope: z.enum(['theory', 'lab', 'both'], {
    errorMap: () => ({ message: 'Component scope must be one of: theory, lab, both' })
  }).optional(),
  isPrimary: z.boolean().optional(),
  active: z.boolean().optional(),
  status: z.enum(['pending', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be one of: pending, approved, rejected' })
  }).optional(),
  rejectionReason: z.string().max(500, 'Rejection reason must be less than 500 characters').optional()
});

// Batch schema
export const batchSchema = z.object({
  name: z.string()
    .min(2, 'Batch name must be at least 2 characters')
    .max(50, 'Batch name must be less than 50 characters'),
  academicYear: z.string()
    .regex(/^\d{4}-\d{4}$/, 'Academic year must be in the format YYYY-YYYY'),
  departmentId: z.number()
    .int('Department ID must be an integer')
    .positive('Department ID must be positive'),
  currentSemester: z.number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester must be at most 8')
    .optional(),
  autoRollover: z.boolean().optional(),
  archived: z.boolean().optional(),
});

// Batch update schema
export const updateBatchSchema = z.object({
  name: z.string()
    .min(2, 'Batch name must be at least 2 characters')
    .max(50, 'Batch name must be less than 50 characters')
    .optional(),
  academicYear: z.string()
    .regex(/^\d{4}-\d{4}$/, 'Academic year must be in the format YYYY-YYYY')
    .optional(),
  departmentId: z.number()
    .int('Department ID must be an integer')
    .positive('Department ID must be positive')
    .optional(),
  currentSemester: z.number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester must be at most 8')
    .optional(),
  autoRollover: z.boolean().optional(),
  archived: z.boolean().optional(),
});

// Student schema
export const studentSchema = z.object({
  usn: z.string()
    .min(3, 'USN must be at least 3 characters')
    .max(20, 'USN must be less than 20 characters'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  middleName: z.string()
    .max(50, 'Middle name must be less than 50 characters')
    .optional(),
  lastName: z.string()
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must be less than 15 characters'),
  dob: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in the format YYYY-MM-DD')
    .optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  batchId: z.number()
    .int('Batch ID must be an integer')
    .positive('Batch ID must be positive'),
  departmentId: z.number()
    .int('Department ID must be an integer')
    .positive('Department ID must be positive'),
  semester: z.number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester must be at most 8'),
  section: z.string()
    .min(1, 'Section is required')
    .max(10, 'Section must be less than 10 characters'),
  admissionYear: z.number()
    .int('Admission year must be an integer')
    .min(2000, 'Admission year must be at least 2000')
    .max(2100, 'Admission year must be at most 2100'),
  fatherName: z.string()
    .max(100, 'Father name must be less than 100 characters')
    .optional(),
  motherName: z.string()
    .max(100, 'Mother name must be less than 100 characters')
    .optional(),
  guardianName: z.string()
    .max(100, 'Guardian name must be less than 100 characters')
    .optional(),
  guardianContact: z.string()
    .max(15, 'Guardian contact must be less than 15 characters')
    .optional()
});

// Student update schema
export const updateStudentSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  middleName: z.string()
    .max(50, 'Middle name must be less than 50 characters')
    .optional(),
  lastName: z.string()
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters')
    .optional(),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must be less than 15 characters')
    .optional(),
  dob: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in the format YYYY-MM-DD')
    .optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  batchId: z.number()
    .int('Batch ID must be an integer')
    .positive('Batch ID must be positive')
    .optional(),
  departmentId: z.number()
    .int('Department ID must be an integer')
    .positive('Department ID must be positive')
    .optional(),
  semester: z.number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester must be at most 8')
    .optional(),
  section: z.string()
    .min(1, 'Section is required')
    .max(10, 'Section must be less than 10 characters')
    .optional(),
  fatherName: z.string()
    .max(100, 'Father name must be less than 100 characters')
    .optional(),
  motherName: z.string()
    .max(100, 'Mother name must be less than 100 characters')
    .optional(),
  guardianName: z.string()
    .max(100, 'Guardian name must be less than 100 characters')
    .optional(),
  guardianContact: z.string()
    .max(15, 'Guardian contact must be less than 15 characters')
    .optional()
});

// Faculty schema
export const facultySchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  middleName: z.string()
    .max(50, 'Middle name must be less than 50 characters')
    .optional(),
  lastName: z.string()
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must be less than 15 characters'),
  designation: z.string()
    .min(1, 'Designation is required')
    .max(50, 'Designation must be less than 50 characters'),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dob: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in the format YYYY-MM-DD')
    .optional(),
  qualification: z.string()
    .max(100, 'Qualification must be less than 100 characters')
    .optional(),
  experienceYears: z.number()
    .min(0, 'Experience must be at least 0 years')
    .max(50, 'Experience must be less than 50 years')
    .optional(),
  departmentId: z.number()
    .int('Department ID must be an integer')
    .positive('Department ID must be positive')
});

// Faculty update schema
export const updateFacultySchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  middleName: z.string()
    .max(50, 'Middle name must be less than 50 characters')
    .optional(),
  lastName: z.string()
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters')
    .optional(),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must be less than 15 characters')
    .optional(),
  designation: z.string()
    .min(1, 'Designation is required')
    .max(50, 'Designation must be less than 50 characters')
    .optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dob: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in the format YYYY-MM-DD')
    .optional(),
  qualification: z.string()
    .max(100, 'Qualification must be less than 100 characters')
    .optional(),
  experienceYears: z.number()
    .min(0, 'Experience must be at least 0 years')
    .max(50, 'Experience must be less than 50 years')
    .optional(),
  departmentId: z.number()
    .int('Department ID must be an integer')
    .positive('Department ID must be positive')
    .optional()
});

// Attendance session schema
export const attendanceSessionSchema = z.object({
  subjectId: z.number()
    .int('Subject ID must be an integer')
    .positive('Subject ID must be positive'),
  facultyId: z.number()
    .int('Faculty ID must be an integer')
    .positive('Faculty ID must be positive')
    .optional(),
  attendanceDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in the format YYYY-MM-DD'),
  sessionSlot: z.number()
    .int('Session slot must be an integer')
    .min(1, 'Session slot must be at least 1'),
  duration: z.number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1')
    .max(5, 'Duration must be at most 5')
    .optional(),
  academicYear: z.string()
    .regex(/^\d{4}-\d{4}$/, 'Academic year must be in the format YYYY-YYYY'),
  semester: z.number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester must be at most 8'),
  section: z.string()
    .max(10, 'Section must be less than 10 characters')
    .optional(),
  batchId: z.number()
    .int('Batch ID must be an integer')
    .positive('Batch ID must be positive')
    .optional()
});

// Attendance entry schema
export const attendanceEntrySchema = z.object({
  sessionId: z.number()
    .int('Session ID must be an integer')
    .positive('Session ID must be positive'),
  usn: z.string()
    .min(1, 'USN is required'),
  status: z.enum(['Present', 'Absent', 'OD', 'Leave'], {
    errorMap: () => ({ message: 'Status must be one of: Present, Absent, OD, Leave' })
  })
});

// Bulk attendance upload schema
export const bulkAttendanceSchema = z.object({
  sessionId: z.number()
    .int('Session ID must be an integer')
    .positive('Session ID must be positive'),
  entries: z.array(
    z.object({
      usn: z.string().min(1, 'USN is required'),
      status: z.enum(['Present', 'Absent', 'OD', 'Leave'], {
        errorMap: () => ({ message: 'Status must be one of: Present, Absent, OD, Leave' })
      })
    })
  ).min(1, 'At least one entry is required')
});

// Exam component schema
export const examComponentSchema = z.object({
  subjectId: z.number()
    .int('Subject ID must be an integer')
    .positive('Subject ID must be positive'),
  name: z.string()
    .min(1, 'Component name is required')
    .max(50, 'Component name must be less than 50 characters'),
  componentType: z.enum(['CIE', 'Assignment', 'Lab', 'Project', 'Viva', 'Other'], {
    errorMap: () => ({ message: 'Component type must be one of: CIE, Assignment, Lab, Project, Viva, Other' })
  }),
  maxMarks: z.number()
    .positive('Maximum marks must be positive'),
  weightagePercent: z.number()
    .min(0, 'Weightage percentage must be at least 0')
    .max(100, 'Weightage percentage must be at most 100')
    .optional()
});

// Student component mark schema
export const studentComponentMarkSchema = z.object({
  usn: z.string()
    .min(1, 'USN is required'),
  componentId: z.number()
    .int('Component ID must be an integer')
    .positive('Component ID must be positive'),
  marksObtained: z.number()
    .min(0, 'Marks must be at least 0')
});

// Bulk marks upload schema
export const bulkMarksSchema = z.object({
  componentId: z.number()
    .int('Component ID must be an integer')
    .positive('Component ID must be positive'),
  marks: z.array(
    z.object({
      usn: z.string().min(1, 'USN is required'),
      marksObtained: z.number().min(0, 'Marks must be at least 0')
    })
  ).min(1, 'At least one entry is required')
});

// IA Question Configuration schema
export const iaConfigSchema = z.object({
  configData: z.array(
    z.object({
      questionNumber: z.number()
        .int('Question number must be an integer')
        .positive('Question number must be positive'),
      subpart: z.string()
        .max(10, 'Subpart must be less than 10 characters')
        .optional()
        .nullable(),
      part: z.string()
        .max(10, 'Part must be less than 10 characters')
        .optional()
        .nullable(),
      maxMarks: z.number()
        .positive('Maximum marks must be positive')
    })
  ).min(1, 'At least one question configuration is required')
});

// Assignment Configuration schema
export const assignmentConfigSchema = z.object({
  configurations: z.array(
    z.object({
      name: z.string()
        .min(1, 'Assignment name is required')
        .max(100, 'Assignment name must be less than 100 characters'),
      maxMarks: z.number()
        .positive('Maximum marks must be positive'),
      weightage: z.number()
        .min(0, 'Weightage must be at least 0')
        .max(100, 'Weightage must be at most 100')
        .optional()
        .nullable()
    })
  ).min(1, 'At least one assignment configuration is required')
});

// Batch attendance session creation schema
export const batchAttendanceSessionSchema = z.object({
  subjectId: z.number()
    .int('Subject ID must be an integer')
    .positive('Subject ID must be positive'),
  facultyId: z.number()
    .int('Faculty ID must be an integer')
    .positive('Faculty ID must be positive')
    .optional(),
  dateRange: z.object({
    startDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in the format YYYY-MM-DD'),
    endDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in the format YYYY-MM-DD')
  }),
  sessionSlot: z.number()
    .int('Session slot must be an integer')
    .min(1, 'Session slot must be at least 1'),
  sessionType: z.enum(['theory', 'lab'], {
    errorMap: () => ({ message: 'Session type must be either theory or lab' })
  }),
  duration: z.number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1')
    .max(5, 'Duration must be at most 5')
    .optional(),
  academicYear: z.string()
    .regex(/^\d{4}-\d{4}$/, 'Academic year must be in the format YYYY-YYYY'),
  semester: z.number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester must be at most 8'),
  section: z.string()
    .max(10, 'Section must be less than 10 characters')
    .optional(),
  batchId: z.number()
    .int('Batch ID must be an integer')
    .positive('Batch ID must be positive')
    .optional()
});

// Batch edit attendance schema
export const batchEditAttendanceSchema = z.object({
  sessionIds: z.array(
    z.number()
      .int('Session ID must be an integer')
      .positive('Session ID must be positive')
  ).min(1, 'At least one session ID is required'),
  entries: z.array(
    z.object({
      usn: z.string().min(1, 'USN is required'),
      status: z.enum(['Present', 'Absent', 'OD', 'Leave'], {
        errorMap: () => ({ message: 'Status must be one of: Present, Absent, OD, Leave' })
      })
    })
  ).min(1, 'At least one entry is required')
});

// Validation middleware
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation'
      });
    }
  };
}; 
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.batchEditAttendanceSchema = exports.batchAttendanceSessionSchema = exports.assignmentConfigSchema = exports.iaConfigSchema = exports.bulkMarksSchema = exports.studentComponentMarkSchema = exports.examComponentSchema = exports.bulkAttendanceSchema = exports.attendanceEntrySchema = exports.attendanceSessionSchema = exports.updateFacultySchema = exports.facultySchema = exports.updateStudentSchema = exports.studentSchema = exports.updateBatchSchema = exports.batchSchema = exports.updateFacultySubjectMappingSchema = exports.facultySubjectMappingSchema = exports.updateSubjectSchema = exports.subjectSchema = exports.updateDepartmentSchema = exports.departmentSchema = exports.updateUserSchema = exports.registerSchema = exports.unlockAccountSchema = exports.passwordResetConfirmSchema = exports.passwordResetRequestSchema = exports.changePasswordSchema = exports.loginSchema = void 0;
var zod_1 = require("zod");
// Login validation schema
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, { message: 'Username is required' }),
    password: zod_1.z.string().min(1, { message: 'Password is required' })
});
// Change password validation schema
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, { message: 'Current password is required' }),
    newPassword: zod_1.z
        .string()
        .min(8, { message: 'Password must be at least 8 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number' })
        .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' })
});
// Password reset request schema
exports.passwordResetRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email address is required'),
});
// Password reset confirmation schema
exports.passwordResetConfirmSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    newPassword: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
// Account unlock schema (for admin use)
exports.unlockAccountSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'Username is required'),
});
// User registration schema
exports.registerSchema = zod_1.z.object({
    username: zod_1.z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters'),
    email: zod_1.z.string()
        .email('Invalid email address')
        .max(100, 'Email must be less than 100 characters'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    firstName: zod_1.z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters'),
    lastName: zod_1.z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
});
// User update schema
exports.updateUserSchema = zod_1.z.object({
    email: zod_1.z.string()
        .email('Invalid email address')
        .max(100, 'Email must be less than 100 characters')
        .optional(),
    firstName: zod_1.z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .optional(),
    lastName: zod_1.z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
        .optional()
});
// Department schema
exports.departmentSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, 'Department name must be at least 2 characters')
        .max(100, 'Department name must be less than 100 characters'),
    code: zod_1.z.string()
        .min(2, 'Department code must be at least 2 characters')
        .max(10, 'Department code must be less than 10 characters')
        .regex(/^[A-Z0-9]+$/, 'Department code must contain only uppercase letters and numbers'),
    description: zod_1.z.string()
        .max(500, 'Description must be less than 500 characters')
        .optional(),
    headId: zod_1.z.number()
        .int('Head ID must be an integer')
        .positive('Head ID must be positive')
        .optional()
});
// Department update schema
exports.updateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, 'Department name must be at least 2 characters')
        .max(100, 'Department name must be less than 100 characters')
        .optional(),
    code: zod_1.z.string()
        .min(2, 'Department code must be at least 2 characters')
        .max(10, 'Department code must be less than 10 characters')
        .regex(/^[A-Z0-9]+$/, 'Department code must contain only uppercase letters and numbers')
        .optional(),
    description: zod_1.z.string()
        .max(500, 'Description must be less than 500 characters')
        .optional(),
    headId: zod_1.z.number()
        .int('Head ID must be an integer')
        .positive('Head ID must be positive')
        .optional()
});
// Subject schema
exports.subjectSchema = zod_1.z.object({
    code: zod_1.z.string()
        .min(2, 'Subject code must be at least 2 characters')
        .max(10, 'Subject code must be less than 10 characters'),
    name: zod_1.z.string()
        .min(3, 'Subject name must be at least 3 characters')
        .max(100, 'Subject name must be less than 100 characters'),
    semester: zod_1.z.number()
        .int('Semester must be an integer')
        .min(1, 'Semester must be at least 1')
        .max(8, 'Semester must be at most 8'),
    credits: zod_1.z.number()
        .int('Credits must be an integer')
        .min(1, 'Credits must be at least 1')
        .max(5, 'Credits must be at most 5'),
    isLab: zod_1.z.boolean().optional(),
    departmentId: zod_1.z.number()
        .int('Department ID must be an integer')
        .positive('Department ID must be positive'),
    categoryId: zod_1.z.number()
        .int('Category ID must be an integer')
        .positive('Category ID must be positive')
        .optional()
});
// Subject update schema
exports.updateSubjectSchema = zod_1.z.object({
    code: zod_1.z.string()
        .min(2, 'Subject code must be at least 2 characters')
        .max(10, 'Subject code must be less than 10 characters')
        .optional(),
    name: zod_1.z.string()
        .min(3, 'Subject name must be at least 3 characters')
        .max(100, 'Subject name must be less than 100 characters')
        .optional(),
    semester: zod_1.z.number()
        .int('Semester must be an integer')
        .min(1, 'Semester must be at least 1')
        .max(8, 'Semester must be at most 8')
        .optional(),
    credits: zod_1.z.number()
        .int('Credits must be an integer')
        .min(1, 'Credits must be at least 1')
        .max(5, 'Credits must be at most 5')
        .optional(),
    isLab: zod_1.z.boolean().optional(),
    departmentId: zod_1.z.number()
        .int('Department ID must be an integer')
        .positive('Department ID must be positive')
        .optional(),
    categoryId: zod_1.z.number()
        .int('Category ID must be an integer')
        .positive('Category ID must be positive')
        .optional().nullable()
});
// Faculty-Subject Mapping schema
exports.facultySubjectMappingSchema = zod_1.z.object({
    facultyId: zod_1.z.number()
        .int('Faculty ID must be an integer')
        .positive('Faculty ID must be positive'),
    subjectId: zod_1.z.number()
        .int('Subject ID must be an integer')
        .positive('Subject ID must be positive'),
    section: zod_1.z.string()
        .max(10, 'Section must be less than 10 characters')
        .optional(),
    semester: zod_1.z.number()
        .int('Semester must be an integer')
        .min(1, 'Semester must be at least 1')
        .max(8, 'Semester must be at most 8'),
    batchId: zod_1.z.number()
        .int('Batch ID must be an integer')
        .positive('Batch ID must be positive'),
    academicYear: zod_1.z.string()
        .regex(/^\d{4}-\d{4}$/, 'Academic year must be in the format YYYY-YYYY'),
    componentScope: zod_1.z.enum(['theory', 'lab', 'both'], {
        errorMap: function () { return ({ message: 'Component scope must be one of: theory, lab, both' }); }
    }).default('theory'),
    isPrimary: zod_1.z.boolean().default(true),
    active: zod_1.z.boolean().default(true),
    status: zod_1.z.enum(['pending', 'approved', 'rejected'], {
        errorMap: function () { return ({ message: 'Status must be one of: pending, approved, rejected' }); }
    }).default('pending')
});
// Faculty-Subject Mapping update schema
exports.updateFacultySubjectMappingSchema = zod_1.z.object({
    componentScope: zod_1.z.enum(['theory', 'lab', 'both'], {
        errorMap: function () { return ({ message: 'Component scope must be one of: theory, lab, both' }); }
    }).optional(),
    isPrimary: zod_1.z.boolean().optional(),
    active: zod_1.z.boolean().optional(),
    status: zod_1.z.enum(['pending', 'approved', 'rejected'], {
        errorMap: function () { return ({ message: 'Status must be one of: pending, approved, rejected' }); }
    }).optional(),
    rejectionReason: zod_1.z.string().max(500, 'Rejection reason must be less than 500 characters').optional()
});
// Batch schema
exports.batchSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, 'Batch name must be at least 2 characters')
        .max(50, 'Batch name must be less than 50 characters'),
    academicYear: zod_1.z.string()
        .regex(/^\d{4}-\d{4}$/, 'Academic year must be in the format YYYY-YYYY'),
    departmentId: zod_1.z.number()
        .int('Department ID must be an integer')
        .positive('Department ID must be positive'),
    currentSemester: zod_1.z.number()
        .int('Semester must be an integer')
        .min(1, 'Semester must be at least 1')
        .max(8, 'Semester must be at most 8')
        .optional(),
    autoRollover: zod_1.z.boolean().optional(),
    archived: zod_1.z.boolean().optional(),
});
// Batch update schema
exports.updateBatchSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, 'Batch name must be at least 2 characters')
        .max(50, 'Batch name must be less than 50 characters')
        .optional(),
    academicYear: zod_1.z.string()
        .regex(/^\d{4}-\d{4}$/, 'Academic year must be in the format YYYY-YYYY')
        .optional(),
    departmentId: zod_1.z.number()
        .int('Department ID must be an integer')
        .positive('Department ID must be positive')
        .optional(),
    currentSemester: zod_1.z.number()
        .int('Semester must be an integer')
        .min(1, 'Semester must be at least 1')
        .max(8, 'Semester must be at most 8')
        .optional(),
    autoRollover: zod_1.z.boolean().optional(),
    archived: zod_1.z.boolean().optional(),
});
// Student schema
exports.studentSchema = zod_1.z.object({
    usn: zod_1.z.string()
        .min(3, 'USN must be at least 3 characters')
        .max(20, 'USN must be less than 20 characters'),
    firstName: zod_1.z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters'),
    middleName: zod_1.z.string()
        .max(50, 'Middle name must be less than 50 characters')
        .optional(),
    lastName: zod_1.z.string()
        .max(50, 'Last name must be less than 50 characters')
        .optional(),
    email: zod_1.z.string()
        .email('Invalid email address')
        .max(100, 'Email must be less than 100 characters'),
    phone: zod_1.z.string()
        .min(10, 'Phone number must be at least 10 characters')
        .max(15, 'Phone number must be less than 15 characters'),
    dob: zod_1.z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in the format YYYY-MM-DD')
        .optional(),
    gender: zod_1.z.enum(['Male', 'Female', 'Other']).optional(),
    address: zod_1.z.string()
        .max(500, 'Address must be less than 500 characters')
        .optional(),
    batchId: zod_1.z.number()
        .int('Batch ID must be an integer')
        .positive('Batch ID must be positive'),
    departmentId: zod_1.z.number()
        .int('Department ID must be an integer')
        .positive('Department ID must be positive'),
    semester: zod_1.z.number()
        .int('Semester must be an integer')
        .min(1, 'Semester must be at least 1')
        .max(8, 'Semester must be at most 8'),
    section: zod_1.z.string()
        .min(1, 'Section is required')
        .max(10, 'Section must be less than 10 characters'),
    admissionYear: zod_1.z.number()
        .int('Admission year must be an integer')
        .min(2000, 'Admission year must be at least 2000')
        .max(2100, 'Admission year must be at most 2100'),
    fatherName: zod_1.z.string()
        .max(100, 'Father name must be less than 100 characters')
        .optional(),
    motherName: zod_1.z.string()
        .max(100, 'Mother name must be less than 100 characters')
        .optional(),
    guardianName: zod_1.z.string()
        .max(100, 'Guardian name must be less than 100 characters')
        .optional(),
    guardianContact: zod_1.z.string()
        .max(15, 'Guardian contact must be less than 15 characters')
        .optional()
});
// Student update schema
exports.updateStudentSchema = zod_1.z.object({
    firstName: zod_1.z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .optional(),
    middleName: zod_1.z.string()
        .max(50, 'Middle name must be less than 50 characters')
        .optional(),
    lastName: zod_1.z.string()
        .max(50, 'Last name must be less than 50 characters')
        .optional(),
    email: zod_1.z.string()
        .email('Invalid email address')
        .max(100, 'Email must be less than 100 characters')
        .optional(),
    phone: zod_1.z.string()
        .min(10, 'Phone number must be at least 10 characters')
        .max(15, 'Phone number must be less than 15 characters')
        .optional(),
    dob: zod_1.z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in the format YYYY-MM-DD')
        .optional(),
    gender: zod_1.z.enum(['Male', 'Female', 'Other']).optional(),
    address: zod_1.z.string()
        .max(500, 'Address must be less than 500 characters')
        .optional(),
    batchId: zod_1.z.number()
        .int('Batch ID must be an integer')
        .positive('Batch ID must be positive')
        .optional(),
    departmentId: zod_1.z.number()
        .int('Department ID must be an integer')
        .positive('Department ID must be positive')
        .optional(),
    semester: zod_1.z.number()
        .int('Semester must be an integer')
        .min(1, 'Semester must be at least 1')
        .max(8, 'Semester must be at most 8')
        .optional(),
    section: zod_1.z.string()
        .min(1, 'Section is required')
        .max(10, 'Section must be less than 10 characters')
        .optional(),
    fatherName: zod_1.z.string()
        .max(100, 'Father name must be less than 100 characters')
        .optional(),
    motherName: zod_1.z.string()
        .max(100, 'Mother name must be less than 100 characters')
        .optional(),
    guardianName: zod_1.z.string()
        .max(100, 'Guardian name must be less than 100 characters')
        .optional(),
    guardianContact: zod_1.z.string()
        .max(15, 'Guardian contact must be less than 15 characters')
        .optional()
});
// Faculty schema
exports.facultySchema = zod_1.z.object({
    firstName: zod_1.z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters'),
    middleName: zod_1.z.string()
        .max(50, 'Middle name must be less than 50 characters')
        .optional(),
    lastName: zod_1.z.string()
        .max(50, 'Last name must be less than 50 characters')
        .optional(),
    email: zod_1.z.string()
        .email('Invalid email address')
        .max(100, 'Email must be less than 100 characters'),
    phone: zod_1.z.string()
        .min(10, 'Phone number must be at least 10 characters')
        .max(15, 'Phone number must be less than 15 characters'),
    designation: zod_1.z.string()
        .min(1, 'Designation is required')
        .max(50, 'Designation must be less than 50 characters'),
    gender: zod_1.z.enum(['Male', 'Female', 'Other']).optional(),
    dob: zod_1.z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in the format YYYY-MM-DD')
        .optional(),
    qualification: zod_1.z.string()
        .max(100, 'Qualification must be less than 100 characters')
        .optional(),
    experienceYears: zod_1.z.number()
        .min(0, 'Experience must be at least 0 years')
        .max(50, 'Experience must be less than 50 years')
        .optional(),
    departmentId: zod_1.z.number()
        .int('Department ID must be an integer')
        .positive('Department ID must be positive')
});
// Faculty update schema
exports.updateFacultySchema = zod_1.z.object({
    firstName: zod_1.z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .optional(),
    middleName: zod_1.z.string()
        .max(50, 'Middle name must be less than 50 characters')
        .optional(),
    lastName: zod_1.z.string()
        .max(50, 'Last name must be less than 50 characters')
        .optional(),
    email: zod_1.z.string()
        .email('Invalid email address')
        .max(100, 'Email must be less than 100 characters')
        .optional(),
    phone: zod_1.z.string()
        .min(10, 'Phone number must be at least 10 characters')
        .max(15, 'Phone number must be less than 15 characters')
        .optional(),
    designation: zod_1.z.string()
        .min(1, 'Designation is required')
        .max(50, 'Designation must be less than 50 characters')
        .optional(),
    gender: zod_1.z.enum(['Male', 'Female', 'Other']).optional(),
    dob: zod_1.z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in the format YYYY-MM-DD')
        .optional(),
    qualification: zod_1.z.string()
        .max(100, 'Qualification must be less than 100 characters')
        .optional(),
    experienceYears: zod_1.z.number()
        .min(0, 'Experience must be at least 0 years')
        .max(50, 'Experience must be less than 50 years')
        .optional(),
    departmentId: zod_1.z.number()
        .int('Department ID must be an integer')
        .positive('Department ID must be positive')
        .optional()
});
// Attendance session schema
exports.attendanceSessionSchema = zod_1.z.object({
    subjectId: zod_1.z.number()
        .int('Subject ID must be an integer')
        .positive('Subject ID must be positive'),
    facultyId: zod_1.z.number()
        .int('Faculty ID must be an integer')
        .positive('Faculty ID must be positive')
        .optional(),
    attendanceDate: zod_1.z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in the format YYYY-MM-DD'),
    sessionSlot: zod_1.z.number()
        .int('Session slot must be an integer')
        .min(1, 'Session slot must be at least 1'),
    duration: zod_1.z.number()
        .int('Duration must be an integer')
        .min(1, 'Duration must be at least 1')
        .max(5, 'Duration must be at most 5')
        .optional(),
    academicYear: zod_1.z.string()
        .regex(/^\d{4}-\d{4}$/, 'Academic year must be in the format YYYY-YYYY'),
    semester: zod_1.z.number()
        .int('Semester must be an integer')
        .min(1, 'Semester must be at least 1')
        .max(8, 'Semester must be at most 8'),
    section: zod_1.z.string()
        .max(10, 'Section must be less than 10 characters')
        .optional(),
    batchId: zod_1.z.number()
        .int('Batch ID must be an integer')
        .positive('Batch ID must be positive')
        .optional()
});
// Attendance entry schema
exports.attendanceEntrySchema = zod_1.z.object({
    sessionId: zod_1.z.number()
        .int('Session ID must be an integer')
        .positive('Session ID must be positive'),
    usn: zod_1.z.string()
        .min(1, 'USN is required'),
    status: zod_1.z.enum(['Present', 'Absent', 'OD', 'Leave'], {
        errorMap: function () { return ({ message: 'Status must be one of: Present, Absent, OD, Leave' }); }
    })
});
// Bulk attendance upload schema
exports.bulkAttendanceSchema = zod_1.z.object({
    sessionId: zod_1.z.number()
        .int('Session ID must be an integer')
        .positive('Session ID must be positive'),
    entries: zod_1.z.array(zod_1.z.object({
        usn: zod_1.z.string().min(1, 'USN is required'),
        status: zod_1.z.enum(['Present', 'Absent', 'OD', 'Leave'], {
            errorMap: function () { return ({ message: 'Status must be one of: Present, Absent, OD, Leave' }); }
        })
    })).min(1, 'At least one entry is required')
});
// Exam component schema
exports.examComponentSchema = zod_1.z.object({
    subjectId: zod_1.z.number()
        .int('Subject ID must be an integer')
        .positive('Subject ID must be positive'),
    name: zod_1.z.string()
        .min(1, 'Component name is required')
        .max(50, 'Component name must be less than 50 characters'),
    componentType: zod_1.z.enum(['CIE', 'Assignment', 'Lab', 'Project', 'Viva', 'Other'], {
        errorMap: function () { return ({ message: 'Component type must be one of: CIE, Assignment, Lab, Project, Viva, Other' }); }
    }),
    maxMarks: zod_1.z.number()
        .positive('Maximum marks must be positive'),
    weightagePercent: zod_1.z.number()
        .min(0, 'Weightage percentage must be at least 0')
        .max(100, 'Weightage percentage must be at most 100')
        .optional()
});
// Student component mark schema
exports.studentComponentMarkSchema = zod_1.z.object({
    usn: zod_1.z.string()
        .min(1, 'USN is required'),
    componentId: zod_1.z.number()
        .int('Component ID must be an integer')
        .positive('Component ID must be positive'),
    marksObtained: zod_1.z.number()
        .min(0, 'Marks must be at least 0')
});
// Bulk marks upload schema
exports.bulkMarksSchema = zod_1.z.object({
    componentId: zod_1.z.number()
        .int('Component ID must be an integer')
        .positive('Component ID must be positive'),
    marks: zod_1.z.array(zod_1.z.object({
        usn: zod_1.z.string().min(1, 'USN is required'),
        marksObtained: zod_1.z.number().min(0, 'Marks must be at least 0')
    })).min(1, 'At least one entry is required')
});
// IA Question Configuration schema
exports.iaConfigSchema = zod_1.z.object({
    configData: zod_1.z.array(zod_1.z.object({
        questionNumber: zod_1.z.number()
            .int('Question number must be an integer')
            .positive('Question number must be positive'),
        subpart: zod_1.z.string()
            .max(10, 'Subpart must be less than 10 characters')
            .optional()
            .nullable(),
        part: zod_1.z.string()
            .max(10, 'Part must be less than 10 characters')
            .optional()
            .nullable(),
        maxMarks: zod_1.z.number()
            .positive('Maximum marks must be positive')
    })).min(1, 'At least one question configuration is required')
});
// Assignment Configuration schema
exports.assignmentConfigSchema = zod_1.z.object({
    configurations: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string()
            .min(1, 'Assignment name is required')
            .max(100, 'Assignment name must be less than 100 characters'),
        maxMarks: zod_1.z.number()
            .positive('Maximum marks must be positive'),
        weightage: zod_1.z.number()
            .min(0, 'Weightage must be at least 0')
            .max(100, 'Weightage must be at most 100')
            .optional()
            .nullable()
    })).min(1, 'At least one assignment configuration is required')
});
// Batch attendance session creation schema
exports.batchAttendanceSessionSchema = zod_1.z.object({
    subjectId: zod_1.z.number()
        .int('Subject ID must be an integer')
        .positive('Subject ID must be positive'),
    facultyId: zod_1.z.number()
        .int('Faculty ID must be an integer')
        .positive('Faculty ID must be positive')
        .optional(),
    dateRange: zod_1.z.object({
        startDate: zod_1.z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in the format YYYY-MM-DD'),
        endDate: zod_1.z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in the format YYYY-MM-DD')
    }),
    sessionSlot: zod_1.z.number()
        .int('Session slot must be an integer')
        .min(1, 'Session slot must be at least 1'),
    sessionType: zod_1.z.enum(['theory', 'lab'], {
        errorMap: function () { return ({ message: 'Session type must be either theory or lab' }); }
    }),
    duration: zod_1.z.number()
        .int('Duration must be an integer')
        .min(1, 'Duration must be at least 1')
        .max(5, 'Duration must be at most 5')
        .optional(),
    academicYear: zod_1.z.string()
        .regex(/^\d{4}-\d{4}$/, 'Academic year must be in the format YYYY-YYYY'),
    semester: zod_1.z.number()
        .int('Semester must be an integer')
        .min(1, 'Semester must be at least 1')
        .max(8, 'Semester must be at most 8'),
    section: zod_1.z.string()
        .max(10, 'Section must be less than 10 characters')
        .optional(),
    batchId: zod_1.z.number()
        .int('Batch ID must be an integer')
        .positive('Batch ID must be positive')
        .optional()
});
// Batch edit attendance schema
exports.batchEditAttendanceSchema = zod_1.z.object({
    sessionIds: zod_1.z.array(zod_1.z.number()
        .int('Session ID must be an integer')
        .positive('Session ID must be positive')).min(1, 'At least one session ID is required'),
    entries: zod_1.z.array(zod_1.z.object({
        usn: zod_1.z.string().min(1, 'USN is required'),
        status: zod_1.z.enum(['Present', 'Absent', 'OD', 'Leave'], {
            errorMap: function () { return ({ message: 'Status must be one of: Present, Absent, OD, Leave' }); }
        })
    })).min(1, 'At least one entry is required')
});
// Validation middleware
var validate = function (schema) {
    return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, schema.parseAsync(req.body)];
                case 1:
                    _a.sent();
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    if (error_1 instanceof zod_1.z.ZodError) {
                        return [2 /*return*/, res.status(400).json({
                                success: false,
                                message: 'Validation failed',
                                errors: error_1.errors.map(function (err) { return ({
                                    field: err.path.join('.'),
                                    message: err.message
                                }); })
                            })];
                    }
                    return [2 /*return*/, res.status(500).json({
                            success: false,
                            message: 'Internal server error during validation'
                        })];
                case 3: return [2 /*return*/];
            }
        });
    }); };
};
exports.validate = validate;

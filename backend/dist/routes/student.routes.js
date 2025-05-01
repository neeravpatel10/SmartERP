"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../utils/validation");
const student_controller_1 = require("../controllers/student.controller");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const XLSX = __importStar(require("xlsx"));
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (_req, file, cb) => {
        // Accept only Excel and CSV files
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'text/csv') {
            cb(null, true);
        }
        else {
            cb(new Error('Only Excel and CSV files are allowed'), false);
        }
    }
});
// Student routes
router.post('/', auth_1.authenticate, (0, validation_1.validate)(validation_1.studentSchema), student_controller_1.createStudent);
router.put('/:usn', auth_1.authenticate, (0, validation_1.validate)(validation_1.updateStudentSchema), student_controller_1.updateStudent);
router.get('/', auth_1.authenticate, student_controller_1.getStudents);
router.post('/bulk-upload', auth_1.authenticate, upload.single('file'), student_controller_1.bulkUploadStudents);
router.get('/template', auth_1.authenticate, (req, res) => {
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
    }
    catch (error) {
        console.error('Template generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate template'
        });
    }
});
router.get('/:usn', auth_1.authenticate, student_controller_1.getStudentByUSN);
exports.default = router;

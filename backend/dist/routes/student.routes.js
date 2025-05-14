"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const student_controller_1 = require("../controllers/student.controller");
const router = express_1.default.Router();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
// Protected routes - all routes require authentication
router.use(auth_1.authenticate);
// CRUD routes
router.post('/', student_controller_1.createStudent);
router.get('/', student_controller_1.getStudents);
router.get('/:usn', student_controller_1.getStudentByUSN);
router.put('/:usn', student_controller_1.updateStudent);
router.delete('/:usn', student_controller_1.deleteStudent);
// Excel import/export routes
router.post('/import', upload.single('file'), student_controller_1.importStudentsFromExcel);
router.get('/export', student_controller_1.exportStudentsToExcel);
// Login management routes - require admin privileges
router.get('/management/without-logins', auth_1.isDeptAdmin, student_controller_1.getStudentsWithoutLogins);
router.post('/:usn/create-login', auth_1.isDeptAdmin, student_controller_1.createStudentLogin);
router.post('/create-multiple-logins', auth_1.isDeptAdmin, student_controller_1.createMultipleStudentLogins);
exports.default = router;

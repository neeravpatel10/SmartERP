"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const report_controller_1 = require("../controllers/report.controller");
const auth_1 = require("../middleware/auth");
// Define roles as numeric constants based on the auth middleware
const ADMIN_ROLE = 1; // Super Admin
const FACULTY_ROLE = 2; // Faculty
const router = express_1.default.Router();
/**
 * @route GET /api/reports/faculty/:facultyId/subject/:subjectId
 * @desc Get faculty subject report
 * @access Private (Admin, Faculty)
 */
router.get('/faculty/:facultyId/subject/:subjectId', auth_1.authenticate, (0, auth_1.authorize)([ADMIN_ROLE, FACULTY_ROLE]), report_controller_1.getFacultySubjectReport);
exports.default = router;

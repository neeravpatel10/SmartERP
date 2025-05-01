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
const express_1 = __importDefault(require("express"));
const subjectController = __importStar(require("../controllers/subjectController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Authentication middleware for all routes
router.use(authMiddleware_1.authenticateToken);
// Get all subjects
router.get('/', subjectController.getAllSubjects);
// Get subject by ID
router.get('/:id', subjectController.getSubjectById);
// Create subject (Admin and Super Admin only)
router.post('/', (0, authMiddleware_1.authorizeRoles)(['super_admin', 'dept_admin']), subjectController.createSubject);
// Update subject (Admin and Super Admin only)
router.put('/:id', (0, authMiddleware_1.authorizeRoles)(['super_admin', 'dept_admin']), subjectController.updateSubject);
// Delete subject (Admin and Super Admin only)
router.delete('/:id', (0, authMiddleware_1.authorizeRoles)(['super_admin', 'dept_admin']), subjectController.deleteSubject);
// Update subject status (Admin and Super Admin only)
router.put('/:id/status', (0, authMiddleware_1.authorizeRoles)(['super_admin', 'dept_admin']), subjectController.updateSubjectStatus);
// Get subject status history
router.get('/:id/status-history', subjectController.getSubjectStatusHistory);
// Get subjects by status
router.get('/status/:status', subjectController.getSubjectsByStatus);
// Get subjects by department
router.get('/department/:departmentId', subjectController.getSubjectsByDepartment);
exports.default = router;

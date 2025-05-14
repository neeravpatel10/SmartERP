"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../utils/validation");
const subject_controller_1 = require("../controllers/subject.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Subject routes
router.post('/', auth_1.authenticate, (0, validation_1.validate)(validation_1.subjectSchema), subject_controller_1.createSubject);
router.put('/:id', auth_1.authenticate, (0, validation_1.validate)(validation_1.updateSubjectSchema), subject_controller_1.updateSubject);
router.get('/', auth_1.authenticate, subject_controller_1.getSubjects);
// Subject Categories route - moved before :id route to fix precedence
router.get('/categories', auth_1.authenticate, subject_controller_1.getSubjectCategories);
router.post('/categories', auth_1.authenticate, subject_controller_1.createSubjectCategory);
router.get('/categories/:id', auth_1.authenticate, subject_controller_1.getSubjectCategoryById);
router.put('/categories/:id/marking-schema', auth_1.authenticate, subject_controller_1.updateCategoryMarkingSchema);
// Subject detail routes
router.get('/:id', auth_1.authenticate, subject_controller_1.getSubjectById);
router.delete('/:id', auth_1.authenticate, subject_controller_1.deleteSubject);
router.put('/:id/status', auth_1.authenticate, subject_controller_1.updateSubjectStatus);
router.get('/:id/students', auth_1.authenticate, subject_controller_1.getStudentsBySubject);
// Exam component routes
router.get('/:id/exam-components', auth_1.authenticate, subject_controller_1.getSubjectExamComponents);
router.post('/:id/exam-components', auth_1.authenticate, subject_controller_1.addCustomExamComponent);
router.delete('/:id/exam-components/:componentId', auth_1.authenticate, subject_controller_1.deleteExamComponent);
// Faculty-Subject Mapping routes
router.post('/faculty-mapping', auth_1.authenticate, (0, validation_1.validate)(validation_1.facultySubjectMappingSchema), subject_controller_1.createFacultySubjectMapping);
router.get('/faculty-mapping', auth_1.authenticate, subject_controller_1.getFacultySubjectMappings);
router.put('/faculty-mapping/:id', auth_1.authenticate, (0, validation_1.validate)(validation_1.updateFacultySubjectMappingSchema), subject_controller_1.updateFacultySubjectMapping);
router.delete('/faculty-mapping/:id', auth_1.authenticate, subject_controller_1.deleteFacultySubjectMapping);
router.post('/faculty-mapping/check-access', auth_1.authenticate, subject_controller_1.checkFacultySubjectAccess);
router.put('/faculty-mapping/:id/approval', auth_1.authenticate, subject_controller_1.approveRejectFacultyMapping);
exports.default = router;

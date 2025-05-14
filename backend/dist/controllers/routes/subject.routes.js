"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var validation_1 = require("../utils/validation");
var subject_controller_1 = require("../controllers/subject.controller");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Subject routes
router.post('/', auth_1.authenticate, (0, validation_1.validate)(validation_1.subjectSchema), subject_controller_1.createSubject);
router.put('/:id', auth_1.authenticate, (0, validation_1.validate)(validation_1.updateSubjectSchema), subject_controller_1.updateSubject);
router.get('/', auth_1.authenticate, subject_controller_1.getSubjects);
router.get('/:id', auth_1.authenticate, subject_controller_1.getSubjectById);
router.delete('/:id', auth_1.authenticate, subject_controller_1.deleteSubject);
router.put('/:id/status', auth_1.authenticate, subject_controller_1.updateSubjectStatus);
router.get('/:id/students', auth_1.authenticate, subject_controller_1.getStudentsBySubject);
// Faculty-Subject Mapping routes
router.post('/faculty-mapping', auth_1.authenticate, (0, validation_1.validate)(validation_1.facultySubjectMappingSchema), subject_controller_1.createFacultySubjectMapping);
router.get('/faculty-mapping', auth_1.authenticate, subject_controller_1.getFacultySubjectMappings);
router.put('/faculty-mapping/:id', auth_1.authenticate, (0, validation_1.validate)(validation_1.updateFacultySubjectMappingSchema), subject_controller_1.updateFacultySubjectMapping);
router.delete('/faculty-mapping/:id', auth_1.authenticate, subject_controller_1.deleteFacultySubjectMapping);
router.post('/faculty-mapping/check-access', auth_1.authenticate, subject_controller_1.checkFacultySubjectAccess);
router.put('/faculty-mapping/:id/approval', auth_1.authenticate, subject_controller_1.approveRejectFacultyMapping);
exports.default = router;

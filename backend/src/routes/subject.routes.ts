import { Router } from 'express';
import { subjectSchema, updateSubjectSchema, facultySubjectMappingSchema, updateFacultySubjectMappingSchema, validate } from '../utils/validation';
import { 
  createSubject, 
  updateSubject, 
  getSubjects, 
  getSubjectById,
  createFacultySubjectMapping,
  updateFacultySubjectMapping,
  getFacultySubjectMappings,
  deleteFacultySubjectMapping,
  checkFacultySubjectAccess,
  approveRejectFacultyMapping,
  deleteSubject,
  updateSubjectStatus,
  getStudentsBySubject,
  getSubjectCategories,
  createSubjectCategory,
  getSubjectCategoryById,
  updateCategoryMarkingSchema,
  getSubjectExamComponents,
  addCustomExamComponent,
  deleteExamComponent
} from '../controllers/subject.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Subject routes
router.post('/', authenticate, validate(subjectSchema), createSubject);
router.put('/:id', authenticate, validate(updateSubjectSchema), updateSubject);
router.get('/', authenticate, getSubjects);

// Subject Categories route - moved before :id route to fix precedence
router.get('/categories', authenticate, getSubjectCategories);
router.post('/categories', authenticate, createSubjectCategory);
router.get('/categories/:id', authenticate, getSubjectCategoryById);
router.put('/categories/:id/marking-schema', authenticate, updateCategoryMarkingSchema);

// Subject detail routes
router.get('/:id', authenticate, getSubjectById);
router.delete('/:id', authenticate, deleteSubject);
router.put('/:id/status', authenticate, updateSubjectStatus);
router.get('/:id/students', authenticate, getStudentsBySubject);

// Exam component routes
router.get('/:id/exam-components', authenticate, getSubjectExamComponents);
router.post('/:id/exam-components', authenticate, addCustomExamComponent);
router.delete('/:id/exam-components/:componentId', authenticate, deleteExamComponent);

// Faculty-Subject Mapping routes
router.post('/faculty-mapping', authenticate, validate(facultySubjectMappingSchema), createFacultySubjectMapping);
router.get('/faculty-mapping', authenticate, getFacultySubjectMappings);
router.put('/faculty-mapping/:id', authenticate, validate(updateFacultySubjectMappingSchema), updateFacultySubjectMapping);
router.delete('/faculty-mapping/:id', authenticate, deleteFacultySubjectMapping);
router.post('/faculty-mapping/check-access', authenticate, checkFacultySubjectAccess);
router.put('/faculty-mapping/:id/approval', authenticate, approveRejectFacultyMapping);

export default router; 
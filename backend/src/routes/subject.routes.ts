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
  getStudentsBySubject
} from '../controllers/subject.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Subject routes
router.post('/', authenticate, validate(subjectSchema), createSubject);
router.put('/:id', authenticate, validate(updateSubjectSchema), updateSubject);
router.get('/', authenticate, getSubjects);
router.get('/:id', authenticate, getSubjectById);
router.delete('/:id', authenticate, deleteSubject);
router.put('/:id/status', authenticate, updateSubjectStatus);
router.get('/:id/students', authenticate, getStudentsBySubject);

// Faculty-Subject Mapping routes
router.post('/faculty-mapping', authenticate, validate(facultySubjectMappingSchema), createFacultySubjectMapping);
router.get('/faculty-mapping', authenticate, getFacultySubjectMappings);
router.put('/faculty-mapping/:id', authenticate, validate(updateFacultySubjectMappingSchema), updateFacultySubjectMapping);
router.delete('/faculty-mapping/:id', authenticate, deleteFacultySubjectMapping);
router.post('/faculty-mapping/check-access', authenticate, checkFacultySubjectAccess);
router.put('/faculty-mapping/:id/approval', authenticate, approveRejectFacultyMapping);

export default router; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Batch {
  id: number;
  name: string;
}

interface Faculty {
  id: number;
  firstName: string;
  lastName?: string;
}

interface FormData {
  subjectId: string;
  facultyId: string;
  attendanceDate: string;
  sessionSlot: string;
  duration: string;
  academicYear: string;
  semester: string;
  section: string;
  batchId: string;
}

interface FormErrors {
  subjectId?: string;
  facultyId?: string;
  attendanceDate?: string;
  sessionSlot?: string;
  duration?: string;
  academicYear?: string;
  semester?: string;
  section?: string;
  batchId?: string;
  general?: string;
}

const CreateAttendanceSession: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Current date formatted as YYYY-MM-DD for default date value
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}-${currentYear + 1}`;
  
  const [formData, setFormData] = useState<FormData>({
    subjectId: '',
    facultyId: '',
    attendanceDate: today,
    sessionSlot: '1',
    duration: '1',
    academicYear: defaultAcademicYear,
    semester: '',
    section: '',
    batchId: '',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Fetch subjects, batches, and faculties
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsResponse, batchesResponse, facultiesResponse] = await Promise.all([
          api.get('/subjects'),
          api.get('/batches'),
          api.get('/faculty')
        ]);

        if (subjectsResponse.data.success) {
          setSubjects(subjectsResponse.data.data);
        }
        if (batchesResponse.data.success) {
          setBatches(batchesResponse.data.data);
        }
        if (facultiesResponse.data.success) {
          setFaculties(facultiesResponse.data.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data');
      }
    };

    fetchData();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field when user changes the value
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined,
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/attendance/sessions', formData);
      
      if (response.data.success) {
        navigate('/attendance');
      }
    } catch (err: any) {
      console.error('Error creating attendance session:', err);
      setError(err.response?.data?.message || 'Failed to create attendance session');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <div className="mb-6">
        <Typography variant="h1" component="h1" className="text-2xl font-bold text-gray-800">
          Create Attendance Session
        </Typography>
        <p className="text-gray-600">Fill in the details to create a new attendance session</p>
      </div>
      
      {/* Display fetch error */} 
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {formErrors.general && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
          <p>{formErrors.general}</p>
        </div>
      )}
      
      <Paper className="p-6">
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Subject */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="subject-label">Subject *</InputLabel>
                <Select
                  labelId="subject-label"
                  id="subjectId"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  label="Subject"
                  className={`w-full border ${
                    formErrors.subjectId ? 'border-red-300' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]`}
                >
                  <MenuItem value="">
                    <em>Select Subject</em>
                  </MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.subjectId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.subjectId}</p>
                )}
              </FormControl>
            </Grid>
            
            {/* Faculty */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="faculty-label">Faculty</InputLabel>
                <Select
                  labelId="faculty-label"
                  id="facultyId"
                  name="facultyId"
                  value={formData.facultyId}
                  onChange={handleChange}
                  label="Faculty"
                  className={`w-full border ${
                    formErrors.facultyId ? 'border-red-300' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]`}
                >
                  <MenuItem value="">
                    <em>Select Faculty</em>
                  </MenuItem>
                  {faculties.map((faculty) => (
                    <MenuItem key={faculty.id} value={faculty.id}>
                      {faculty.firstName} {faculty.lastName || ''}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.facultyId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.facultyId}</p>
                )}
              </FormControl>
            </Grid>
            
            {/* Date */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="date-label">Date *</InputLabel>
                <TextField
                  id="attendanceDate"
                  name="attendanceDate"
                  type="date"
                  value={formData.attendanceDate}
                  onChange={handleChange}
                  className={`w-full border ${
                    formErrors.attendanceDate ? 'border-red-300' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]`}
                />
                {formErrors.attendanceDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.attendanceDate}</p>
                )}
              </FormControl>
            </Grid>
            
            {/* Session Slot */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="session-slot-label">Session Slot *</InputLabel>
                <TextField
                  id="sessionSlot"
                  name="sessionSlot"
                  type="number"
                  value={formData.sessionSlot}
                  onChange={handleChange}
                  min="1"
                  className={`w-full border ${
                    formErrors.sessionSlot ? 'border-red-300' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]`}
                />
                {formErrors.sessionSlot && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.sessionSlot}</p>
                )}
              </FormControl>
            </Grid>
            
            {/* Duration */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="duration-label">Duration (hours) *</InputLabel>
                <TextField
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className={`w-full border ${
                    formErrors.duration ? 'border-red-300' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]`}
                />
                {formErrors.duration && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.duration}</p>
                )}
              </FormControl>
            </Grid>
            
            {/* Academic Year */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="academic-year-label">Academic Year *</InputLabel>
                <TextField
                  id="academicYear"
                  name="academicYear"
                  type="text"
                  value={formData.academicYear}
                  onChange={handleChange}
                  placeholder="YYYY-YYYY"
                  className={`w-full border ${
                    formErrors.academicYear ? 'border-red-300' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]`}
                />
                {formErrors.academicYear && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.academicYear}</p>
                )}
              </FormControl>
            </Grid>
            
            {/* Semester */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="semester-label">Semester *</InputLabel>
                <Select
                  labelId="semester-label"
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  label="Semester"
                  className={`w-full border ${
                    formErrors.semester ? 'border-red-300' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]`}
                >
                  <MenuItem value="">
                    <em>Select Semester</em>
                  </MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <MenuItem key={sem} value={sem}>
                      Semester {sem}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.semester && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.semester}</p>
                )}
              </FormControl>
            </Grid>
            
            {/* Section */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="section-label">Section</InputLabel>
                <TextField
                  id="section"
                  name="section"
                  type="text"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="e.g. A"
                  className={`w-full border ${
                    formErrors.section ? 'border-red-300' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]`}
                />
                {formErrors.section && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.section}</p>
                )}
              </FormControl>
            </Grid>
            
            {/* Batch */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="batch-label">Batch *</InputLabel>
                <Select
                  labelId="batch-label"
                  id="batchId"
                  name="batchId"
                  value={formData.batchId}
                  onChange={handleChange}
                  label="Batch"
                  className={`w-full border ${
                    formErrors.batchId ? 'border-red-300' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-[#b50900] focus:border-[#b50900]`}
                >
                  <MenuItem value="">
                    <em>Select Batch</em>
                  </MenuItem>
                  {batches.map((batch) => (
                    <MenuItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.batchId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.batchId}</p>
                )}
              </FormControl>
            </Grid>
          </Grid>
          
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={() => navigate('/attendance')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md shadow-sm mr-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#b50900] hover:bg-[#940800] text-white px-4 py-2 rounded-md shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Session'}
            </Button>
          </div>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateAttendanceSession; 
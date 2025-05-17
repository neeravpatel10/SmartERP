import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  Select,
  MenuItem,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import axios from 'axios';
import { getCurrentAcademicYear, getAcademicYearOptions } from '../../utils/academicUtils';
import { useAuth } from '../../contexts/AuthContext';

interface FacultySubjectMappingFormProps {
  departmentId?: number;
  onMappingCreated?: () => void;
}

interface FormData {
  departmentId: string;
  facultyId: string;
  subjectId: string;
  section: string;
  semester: string;
  batchId: string;
  academicYear: string;
  showAllFaculty: boolean;
  isPrimary: boolean;
  componentScope: string;
}

interface Subject {
  id: number;
  code: string;
  name: string;
  semester: number;
  departmentId: number;
  section?: string;
  batchId?: string;
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

interface Faculty {
  id: string;
  name: string;
  email?: string;
  designation?: string;
  departmentId?: number;
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Batch {
  id: string;
  name: string;
  academicYear?: string;
}

interface ExistingMapping {
  subjectId: number;
  section: string | null;
  academicYear: string;
}

const initialFormData: FormData = {
  departmentId: '',
  facultyId: '',
  subjectId: '',
  section: '',
  semester: '',
  batchId: '',
  academicYear: getCurrentAcademicYear(),
  showAllFaculty: false,
  isPrimary: true,
  componentScope: 'theory'
};

const FacultySubjectMappingForm = ({ 
  departmentId: propDepartmentId,
  onMappingCreated 
}: FacultySubjectMappingFormProps): React.ReactElement => {
  const { user } = useAuth();
  
  // Add detailed logging of user object to debug auth issues
  console.log('User object:', user);
  console.log('User login type:', user?.loginType);
  
  // Department logic: Auto-filled for Dept Admin, dropdown for Super Admin
  const isDeptAdmin = user?.loginType === 3;
  const isSuperAdmin = user?.loginType === 1;
  const userDeptId = user?.departmentId;
  
  console.log('isSuperAdmin:', isSuperAdmin);
  console.log('isDeptAdmin:', isDeptAdmin);
  console.log('userDeptId:', userDeptId);

  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    departmentId: isDeptAdmin && userDeptId ? userDeptId.toString() : ''
  });
  
  // Initialize all state arrays with empty arrays to avoid null/undefined issues
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [allFaculties, setAllFaculties] = useState<Faculty[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [existingMappings, setExistingMappings] = useState<ExistingMapping[]>([]);
  
  // We'll keep this state declaration but comment it out since it's not currently used
  // const [renderKey, setRenderKey] = useState<number>(Date.now());
  
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Use imported utility function to get academic year options
  const academicYearOptions = getAcademicYearOptions(1, 1);

  // Load departments data from API safely using direct API call to avoid configuration issues
  useEffect(() => {
    let isMounted = true;
    let isDone = false; // Guard against multiple callbacks
    
    const fetchDepartments = async (): Promise<void> => {
      if (!isMounted || isDone) return;
      console.log('Fetching departments...');
      
      setLoading(true);
      setError(null);
      
      try {
        // Use axios directly to avoid potential config nesting issues in the api wrapper
        // This was the solution that worked in the past for departments API
        const response = await axios.get('http://localhost:3000/api/departments', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Guard against race conditions
        if (!isMounted || isDone) return;
        isDone = true;
        
        console.log('Full department API response:', response);
        
        // Get the department data from specific path based on API structure - try multiple paths
        console.log('Full response structure:', JSON.stringify(response.data, null, 2));
        
        // Check multiple possible data paths based on API structure
        let departmentsData;
        
        if (response?.data?.data?.departments) {
          // Path 1: response.data.data.departments
          departmentsData = response.data.data.departments;
          console.log('Found departments in path: data.data.departments');
        } else if (response?.data?.departments) {
          // Path 2: response.data.departments
          departmentsData = response.data.departments;
          console.log('Found departments in path: data.departments');
        } else if (Array.isArray(response?.data?.data)) {
          // Path 3: response.data.data (directly an array)
          departmentsData = response.data.data;
          console.log('Found departments in path: data.data (array)');
        } else if (Array.isArray(response?.data)) {
          // Path 4: response.data (directly an array)
          departmentsData = response.data;
          console.log('Found departments in path: data (array)');
        } else {
          // No valid path found
          departmentsData = [];
          console.error('No departments found in any expected data path', response.data);
        }
        
        if (Array.isArray(departmentsData) && departmentsData.length > 0) {
          console.log('Found departments data:', departmentsData);
          
          // Make sure each department has all required fields according to the Department interface
          const processedDepartments = departmentsData.map(dept => ({
            id: dept.id,
            name: dept.name || 'Unknown Department',
            code: dept.code || 'UNK'
          }));
          
          console.log('Processed departments for state:', processedDepartments);
          setDepartments(processedDepartments);
          
          // No need to force re-render, React will handle it automatically
          // setRenderKey(Date.now()); // Removed since we commented out the state variable
        } else {
          console.error('Departments data is not a valid array or is empty', departmentsData);
          setError('Invalid departments data structure or no departments available');
          setDepartments([]); // Set empty array as fallback
        }
      } catch (err: any) {
        // Only process errors if component is still mounted
        if (!isMounted || isDone) return;
        isDone = true;
        
        console.error('Error fetching departments:', err);
        
        // More specific error logging to help debug issues
        if (err.response) {
          console.error('Error response:', err.response.status, err.response.data);
        } else if (err.request) {
          console.error('No response received:', err.request);
        } else {
          console.error('Error setting up request:', err.message);
        }
        
        setError('Failed to load departments: ' + (err?.message || 'Unknown error'));
        setDepartments([]); // Set empty array as fallback
      } finally {
        if (isMounted && !isDone) {
          setLoading(false);
        }
      }
    };

    fetchDepartments();
    
    // Clean up function that runs when the component unmounts
    return () => {
      isMounted = false;
    };
  }, []);
  // Fetch all faculties once for the "show all faculty" option using direct axios call
  useEffect(() => {
    let isMounted = true;
    let isDone = false;
    
    const fetchAllFaculties = async (): Promise<void> => {
      if (!isMounted || isDone) return;
      
      try {
        // Use direct axios call to avoid API utility wrapper issues
        const response = await axios.get('http://localhost:3000/api/faculty', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Guard against race conditions
        if (!isMounted || isDone) return;
        isDone = true;
        
        if (response.data && response.data.success) {
          // Ensure we're setting a valid array, adding explicit type check
          const facultyData = Array.isArray(response.data.data) ? response.data.data : [];
          setAllFaculties(facultyData);
        } else {
          // Set empty array as fallback
          setAllFaculties([]);
        }
      } catch (err: any) {
        // Only log errors if component is still mounted
        if (!isMounted || isDone) return;
        isDone = true;
        
        console.error('Error fetching all faculties:', err);
        // Just log errors for non-critical data
        setAllFaculties([]); // Set empty array as fallback
      } finally {
        if (isMounted && !isDone) {
          // Ensure we only update state once
          setLoading(false);
        }
      }
    };

    fetchAllFaculties();
    
    // Cleanup to avoid state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Fetch data based on selected department using direct axios calls for reliability
  const fetchDepartmentData = useCallback(async (deptId: string | number): Promise<void> => {
    if (!deptId) return;
    
    setLoading(true);
    setError(null);
    
    // Convert departmentId to string to ensure consistent types
    const departmentIdStr = String(deptId);
    const token = localStorage.getItem('token');
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    try {
      // Use individual calls to prevent one failure from affecting others
      let subjectsRes, facultyRes, batchesRes, mappingsRes;
      
      try {
        // Direct axios call for subjects with department filter
        subjectsRes = await axios.get(`http://localhost:3000/api/subjects?departmentId=${departmentIdStr}`, axiosConfig);
      } catch (err: any) {
        console.error('Error fetching subjects:', err);
        // Continue with other requests - don't block all data loading
      }
      
      try {
        // Direct axios call for faculty with department filter
        facultyRes = await axios.get(`http://localhost:3000/api/faculty?departmentId=${departmentIdStr}`, axiosConfig);
        console.log('Faculty data fetched for department:', departmentIdStr);
      } catch (err: any) {
        console.error('Error fetching faculty:', err);
      }
      
      try {
        // Direct axios call for batches with department filter
        batchesRes = await axios.get(`http://localhost:3000/api/batches?departmentId=${departmentIdStr}`, axiosConfig);
      } catch (err: any) {
        console.error('Error fetching batches:', err);
      }
      
      try {
        // Direct axios call for faculty-subject-mapping with department filter
        mappingsRes = await axios.get(`http://localhost:3000/api/faculty-subject-mapping?departmentId=${departmentIdStr}`, axiosConfig);
      } catch (err: any) {
        console.error('Error fetching existing mappings:', err);
      }

      // Process subjects (handle nested structure)
      if (subjectsRes?.data && subjectsRes.data.success) {
        // Check different paths where data might be based on API response structure
        let subjectsData;
        if (subjectsRes.data.data?.subjects) {
          subjectsData = subjectsRes.data.data.subjects; 
        } else if (Array.isArray(subjectsRes.data.data)) {
          subjectsData = subjectsRes.data.data;
        } else {
          subjectsData = [];
        }
        setAllSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        console.log('Subjects loaded:', Array.isArray(subjectsData) ? subjectsData.length : 0);
      } else {
        setAllSubjects([]);
      }
      
      // Process faculty with null check and ensure array type (handle nested structure like subjects)
      if (facultyRes?.data && facultyRes.data.success) {
        console.log('Raw faculty response:', facultyRes.data);
        
        // Check different paths where faculty data might be based on API response structure
        let facultyData;
        if (facultyRes.data.data?.faculty) {
          facultyData = facultyRes.data.data.faculty;
        } else if (facultyRes.data.faculty) {
          facultyData = facultyRes.data.faculty;
        } else if (Array.isArray(facultyRes.data.data)) {
          facultyData = facultyRes.data.data;
        } else {
          facultyData = [];
        }
        
        // Ensure we're setting a valid array and log for debugging
        const validFacultyData = Array.isArray(facultyData) ? facultyData : [];
        console.log('Faculty loaded for department:', departmentIdStr, validFacultyData.length);
        console.log('Sample faculty data:', validFacultyData.slice(0, 2));
        
        setFaculties(validFacultyData);
      } else {
        // Always set an empty array when data is missing or invalid
        console.log('No valid faculty data in response');
        setFaculties([]);
      }
      
      // Process batches with null check and type safety
      if (batchesRes?.data && batchesRes.data.success) {
        // Explicit check to ensure we're setting a valid array
        const batchesData = Array.isArray(batchesRes.data.data) ? batchesRes.data.data : [];
        setBatches(batchesData);
      } else {
        // Always set an empty array when data is missing or invalid
        setBatches([]);
      }
      
      // Process existing mappings with null check and type safety
      if (mappingsRes?.data && mappingsRes.data.success) {
        const existingData = Array.isArray(mappingsRes.data.data) ? mappingsRes.data.data : [];
        
        // Extract just the fields needed for filtering with type safety
        const existingMappingsList = existingData.map((mapping: any) => ({
          subjectId: mapping.subjectId,
          section: mapping.section,
          academicYear: mapping.academicYear
        }));
        
        setExistingMappings(existingMappingsList);
      } else {
        // Set empty array as fallback
        setExistingMappings([]);
      }
    } catch (err: any) {
      console.error('Error fetching department data:', err);
      setError('Failed to load department data: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Handle department change - wrap in useCallback to avoid re-creation on every render
  const handleDepartmentChange = useCallback((departmentId: string): void => {
    // Reset relevant form fields when department changes
    setFormData((prev) => ({
      ...prev,
      departmentId,
      facultyId: '',
      subjectId: '',
      semester: '',
      section: '',
      batchId: ''
    }));
    
    // Load data for the selected department
    if (departmentId) {
      fetchDepartmentData(departmentId);
    } else {
      // Reset data when no department is selected
      setAllSubjects([]);
      setFilteredSubjects([]);
      setFaculties([]);
      setBatches([]);
    }
    
    // Clear messages
    if (error) setError(null);
    if (success) setSuccess(null);
  }, [fetchDepartmentData, setError, setSuccess, error, success]);

  // When department changes or initial automatic department selection
  useEffect(() => {
    // Auto-select department for Dept Admin
    if (isDeptAdmin && userDeptId) {
      setFormData((prev) => ({ ...prev, departmentId: userDeptId.toString() }));
      fetchDepartmentData(userDeptId);
    }
    // Reset form when prop department changes for re-usability
    else if (propDepartmentId && propDepartmentId.toString() !== formData.departmentId) {
      setFormData((prev) => ({ ...prev, departmentId: propDepartmentId.toString() }));
      fetchDepartmentData(propDepartmentId);
    }
  }, [isDeptAdmin, userDeptId, propDepartmentId, fetchDepartmentData, formData.departmentId]);

  // Auto-select department for Super Admin if only one department is available
  useEffect(() => {
    if (isSuperAdmin && departments.length === 1 && !formData.departmentId) {
      console.log('Auto-selecting the only available department:', departments[0]);
      handleDepartmentChange(departments[0].id.toString());
    }
  }, [departments, isSuperAdmin, formData.departmentId, handleDepartmentChange]);
  
  // Filter subjects based on existing mappings
  useEffect(() => {
    if (!allSubjects || !Array.isArray(allSubjects) || allSubjects.length === 0) {
      setFilteredSubjects([]);
      return;
    }
    
    // Filter out subjects that are already mapped for this academic year & section
    const academicYear = formData.academicYear;
    const section = formData.section || null;
    
    const availableSubjects = allSubjects.filter((subject) => {
      // Skip if subject is already mapped for this academic year and section
      const isAlreadyMapped = Array.isArray(existingMappings) && existingMappings.some((mapping) => 
        mapping.subjectId === subject.id && 
        mapping.academicYear === academicYear &&
        mapping.section === section
      );
      
      return !isAlreadyMapped;
    });
    
    setFilteredSubjects(availableSubjects);
  }, [allSubjects, existingMappings, formData.academicYear, formData.section]);

  // Handle form input changes
  const handleChange = (field: keyof FormData, value: string | boolean): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // If there was an error or success message, clear it
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  // Fetch available sections based on departmentId and semester
  const fetchSections = useCallback(async (departmentId: string, semester: string): Promise<void> => {
    if (!departmentId || !semester) {
      setAvailableSections([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3000/api/sections?departmentId=${departmentId}&semester=${semester}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success) {
        // Handle different possible response structures
        let sectionsData;
        if (response.data.data?.sections) {
          sectionsData = response.data.data.sections;
        } else if (Array.isArray(response.data.data)) {
          sectionsData = response.data.data;
        } else {
          sectionsData = [];
        }

        // Extract section names/values
        const sectionValues = Array.isArray(sectionsData) 
          ? sectionsData.map((section: any) => section.name || section.value || section.code || section) 
          : [];
        
        console.log('Available sections fetched:', sectionValues);
        setAvailableSections(sectionValues);
      } else {
        setAvailableSections([]);
      }
    } catch (err: any) {
      console.error('Error fetching sections:', err);
      setAvailableSections([]);
    }
  }, []);

  // Handle subject selection to auto-populate semester, section, and batchId
  const handleSubjectSelect = (subjectId: string): void => {
    if (!subjectId) {
      // Reset fields if no subject selected
      setFormData((prev) => ({
        ...prev,
        subjectId: '',
        semester: '',
        section: '',
        batchId: ''
      }));
      setAvailableSections([]);
      return;
    }
    
    // Find selected subject
    const selectedSubject = Array.isArray(allSubjects) && allSubjects.find((subject) => 
      subject.id.toString() === subjectId
    );
    
    if (selectedSubject) {
      console.log('Selected subject:', selectedSubject);
      const semesterValue = selectedSubject.semester.toString();
      const sectionValue = selectedSubject.section || '';
      
      // Auto-fill fields from subject data
      setFormData((prev) => ({
        ...prev,
        subjectId,
        semester: semesterValue,
        section: sectionValue,
        batchId: selectedSubject.batchId || ''
      }));
      
      // Fetch available sections for this department and semester
      fetchSections(formData.departmentId, semesterValue);
    } else {
      // Reset if subject not found
      setFormData((prev) => ({
        ...prev,
        subjectId,
        semester: '',
        section: '',
        batchId: ''
      }));
      setAvailableSections([]);
    }
  };

  // Submit form to create mapping with proper validation and type handling
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!formData.facultyId) {
      setError('Please select a faculty');
      setSubmitting(false);
      return;
    }
    
    if (!formData.subjectId) {
      setError('Please select a subject');
      setSubmitting(false);
      return;
    }
    
    if (!formData.semester) {
      setError('Please select a semester');
      setSubmitting(false);
      return;
    }
    
    if (!formData.batchId) {
      setError('Please select a batch');
      setSubmitting(false);
      return;
    }
    
    if (!formData.academicYear) {
      setError('Please select an academic year');
      setSubmitting(false);
      return;
    }

    try {
      // Prepare data for submission with proper type handling
      const submissionData = {
        facultyId: String(formData.facultyId), // Ensure string type
        subjectId: Number(formData.subjectId), // Ensure number type
        section: formData.section || null,
        semester: Number(formData.semester), // Ensure number type
        batchId: String(formData.batchId), // Ensure string type
        academicYear: formData.academicYear,
        componentScope: formData.componentScope || 'theory', // Default value
        isPrimary: Boolean(formData.isPrimary) // Ensure boolean type
      };

      // Validate numeric conversions to prevent NaN
      if (isNaN(submissionData.subjectId)) {
        setError('Invalid subject ID format');
        setSubmitting(false);
        return;
      }
      
      if (isNaN(submissionData.semester)) {
        setError('Invalid semester format');
        setSubmitting(false);
        return;
      }

      // Make direct axios call to create mapping - bypassing api utility to avoid issues
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/faculty-subject-mapping', submissionData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        setSuccess('Faculty subject mapping created successfully');
        // Reset form while keeping department selected
        const currentDeptId = formData.departmentId;
        const showAll = formData.showAllFaculty;
        setFormData({
          ...initialFormData,
          departmentId: currentDeptId,
          showAllFaculty: showAll
        });
        
        // Update existing mappings to reflect new addition
        setExistingMappings((prev) => [
          ...prev, 
          {
            subjectId: submissionData.subjectId,
            section: submissionData.section,
            academicYear: submissionData.academicYear
          }
        ]);
        
        // Notify parent component if callback is provided
        if (onMappingCreated) onMappingCreated();
      } else {
        setError(response.data?.message || 'Unknown error occurred while creating mapping');
      }
    } catch (err: any) {
      console.error('Error creating mapping:', err);
      // Detailed error logging
      if (err.response) {
        console.error('Server error:', err.response.status, err.response.data);
        setError(err.response?.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        console.error('No response from server:', err.request);
        setError('No response received from server. Please try again.');
      } else {
        console.error('Request setup error:', err.message);
        setError(`Error sending request: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Get displayed faculty list based on showAllFaculty toggle with array safety
  const displayedFaculties = formData.showAllFaculty ?
    (Array.isArray(allFaculties) ? allFaculties : []) :
    (Array.isArray(faculties) ? faculties : []);
    
  // Log faculty data for debugging
  console.log('Displayed faculty count:', displayedFaculties.length);
  console.log('Current faculties state:', faculties);
  console.log('All faculties state:', allFaculties);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create Faculty-Subject Mapping
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>
      )}
      {loading && (
        <Box display="flex" justifyContent="center" sx={{ my: 3 }}>
          <CircularProgress />
        </Box>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Department Field */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Department *
              </Typography>
              {/* SuperAdmin can select any department - using radio buttons for maximum reliability */}
              {isSuperAdmin ? (
                <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Select a department:
                  </Typography>
                  
                  {departments.length === 0 ? (
                    <Alert severity="info">Loading departments... If none appear, please refresh the page.</Alert>
                  ) : (
                    <div>
                      {departments.map((dept) => (
                        <div key={dept.id} style={{ marginBottom: '8px' }}>
                          <label style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px',
                              cursor: 'pointer',
                              backgroundColor: formData.departmentId === dept.id.toString() ? '#e3f2fd' : 'transparent',
                              borderRadius: '4px',
                              border: formData.departmentId === dept.id.toString() ? '1px solid #2196f3' : '1px solid #eee'
                            }}>
                            <input
                              type="radio"
                              name="department"
                              value={dept.id.toString()}
                              checked={formData.departmentId === dept.id.toString()}
                              onChange={() => {
                                console.log('Department radio selected:', dept.id, dept.name);
                                handleDepartmentChange(dept.id.toString());
                              }}
                              style={{ marginRight: '8px' }}
                            />
                            <span>{dept.name}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Paper sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="body1">
                    {(Array.isArray(departments) && departments.find(d => d.id.toString() === formData.departmentId)?.name) || 'Loading your department...'}
                  </Typography>
                </Paper>
              )}
            </Box>
          </Grid>
          
          {/* Continue with the form only when a department is selected */}
          {formData.departmentId && (
            <>
              {/* Faculty Field - Appears first based on screenshot */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Faculty *
                  </Typography>
                  <FormControl fullWidth required>
                    <Select
                      value={formData.facultyId || ""}
                      onChange={(e: SelectChangeEvent) => handleChange('facultyId', e.target.value as string)}
                      displayEmpty
                      sx={{ height: '48px' }}
                      disabled={loading}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300
                          },
                        },
                      }}
                    >
                      <MenuItem value=""><em>Select Faculty</em></MenuItem>
                      {displayedFaculties.length === 0 ? (
                        // Show message when no faculty is available
                        <MenuItem disabled value="none">
                          <em>No faculty found for this department</em>
                        </MenuItem>
                      ) : (
                        // Debug each faculty with console.log
                        displayedFaculties.map((faculty, index) => {
                          // Debug log each faculty item
                          console.log(`Faculty ${index}:`, faculty);
                          
                          // Get a safe faculty ID value
                          const facultyId = faculty.id ? faculty.id.toString() : String(index);
                          
                          // Get a safe faculty name
                          const facultyName = faculty.name || `Faculty ${index}`;
                          
                          return (
                            <MenuItem key={`faculty-${facultyId}-${index}`} value={facultyId}>
                              {facultyName}
                              {faculty.department && formData.showAllFaculty && (
                                <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                  ({faculty.department.code || faculty.department.name || "?"})
                                </Typography>
                              )}
                            </MenuItem>
                          );
                        })
                      )}
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.showAllFaculty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('showAllFaculty', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Show faculty from all departments"
                    sx={{ mt: 1, display: 'block' }}
                  />
                </Box>
              </Grid>

              {/* Subject Field */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Subject *
                  </Typography>
                  <FormControl fullWidth required>
                    <Select
                      value={formData.subjectId}
                      onChange={(e: SelectChangeEvent) => handleSubjectSelect(e.target.value as string)}
                      displayEmpty
                      sx={{ height: '48px' }}
                      disabled={loading}
                    >
                      <MenuItem value=""><em>Select Subject</em></MenuItem>
                      {Array.isArray(filteredSubjects) && filteredSubjects.map((subject) => (
                        <MenuItem key={subject.id} value={subject.id.toString()}>
                          {subject.code} - {subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {(Array.isArray(filteredSubjects) && filteredSubjects.length === 0 && Array.isArray(allSubjects) && allSubjects.length > 0) && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      All subjects are already mapped for this academic year and section
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Batch Field */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Batch *
                  </Typography>
                  <FormControl fullWidth required>
                    <Select
                      value={formData.batchId || ""}
                      onChange={(e: SelectChangeEvent) => handleChange('batchId', e.target.value as string)}
                      displayEmpty
                      sx={{ height: '48px' }}
                      disabled={loading}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300
                          },
                        },
                      }}
                    >
                      <MenuItem value=""><em>Select Batch</em></MenuItem>
                      {Array.isArray(batches) && batches.map((batch) => (
                        <MenuItem key={batch.id} value={batch.id.toString()}>
                          {batch.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Section Field */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Section
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={formData.section || ""}
                      onChange={(e: SelectChangeEvent) => handleChange('section', e.target.value as string)}
                      displayEmpty
                      sx={{ height: '48px' }}
                      disabled={loading}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300
                          },
                        },
                      }}
                    >
                      <MenuItem value=""><em>Select Section</em></MenuItem>
                      {availableSections.length > 0 ? (
                        // Show available sections if fetched
                        availableSections.map((section) => (
                          <MenuItem key={section} value={section}>
                            {section}
                          </MenuItem>
                        ))
                      ) : (
                        // If no sections available, show manual input option
                        <MenuItem value="ALL">ALL</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Semester Field */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Semester *
                  </Typography>
                  <FormControl fullWidth required>
                    <Select
                      value={formData.departmentId || ""}
                      onChange={(e: SelectChangeEvent) => {
                        const selectedId = e.target.value;
                        console.log("Department selected:", selectedId);
                        const dept = departments.find((d) => d.id.toString() === selectedId);
                        console.log("Selected Dept Object:", dept);
                        handleDepartmentChange(selectedId);
                      }}
                      sx={{ height: '48px' }}
                      disabled={!!formData.subjectId || loading}
                    >
                      <MenuItem value=""><em>Select Semester</em></MenuItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <MenuItem key={sem} value={sem.toString()}>
                          {sem}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Academic Year Field */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Academic Year *
                  </Typography>
                  <FormControl fullWidth required>
                    <Select
                      value={formData.academicYear}
                      onChange={(e: SelectChangeEvent) => handleChange('academicYear', e.target.value as string)}
                      displayEmpty
                      sx={{ height: '48px' }}
                      disabled={loading}
                    >
                      <MenuItem value=""><em>Select Academic Year</em></MenuItem>
                      {Array.isArray(academicYearOptions) && academicYearOptions.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Component Scope Field */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Component Scope *
                  </Typography>
                  <FormControl fullWidth required>
                    <Select
                      value={formData.componentScope}
                      onChange={(e: SelectChangeEvent) => handleChange('componentScope', e.target.value as string)}
                      displayEmpty
                      sx={{ height: '48px' }}
                      disabled={loading}
                    >
                      <MenuItem value="theory">Theory</MenuItem>
                      <MenuItem value="lab">Lab</MenuItem>
                      <MenuItem value="both">Both (Theory & Lab)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Primary Faculty Checkbox */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isPrimary}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('isPrimary', e.target.checked)}
                      />
                    }
                    label="Is Primary Faculty"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                    Primary faculty is responsible for the overall subject coordination.
                  </Typography>
                </Box>
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting || loading || !formData.departmentId || !formData.facultyId || 
                    !formData.subjectId || !formData.semester || !formData.batchId || !formData.academicYear}
                  sx={{ mt: 2, py: 1 }}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Create Mapping'}
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </form>
    </Paper>
  );
};

export default FacultySubjectMappingForm;

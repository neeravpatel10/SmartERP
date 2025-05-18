import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextField,
  Autocomplete,
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
  sectionId?: number;
  sectionRelation?: {
    id: number;
    name: string;
    batchId?: string;
  };
  academicYear?: string;
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
  
  // Department logic: Auto-filled for Dept Admin, dropdown for Super Admin
  const isDeptAdmin = user?.loginType === 3;
  const isSuperAdmin = user?.loginType === 1;
  const userDeptId = user?.departmentId;

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
  // We only use the setter, not the value directly
  const [, setAvailableSections] = useState<string[]>([]);
  const [existingMappings, setExistingMappings] = useState<ExistingMapping[]>([]);
  const [isFacultyLoading, setIsFacultyLoading] = useState<boolean>(false);
  
  // We'll keep this state declaration but comment it out since it's not currently used
  // const [renderKey, setRenderKey] = useState<number>(Date.now());
  
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Use imported utility function to get academic year options
  // Initializing academicYear with current year, but not using options in the UI
  // We're keeping the function call for future reference
  getAcademicYearOptions(1, 1); // Generate options but not storing in a variable

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
  // Fetch all faculties with explicit pagination limit to get ALL faculties at once
  const fetchAllFaculties = useCallback(async (): Promise<void> => {
    setIsFacultyLoading(true);
    
    try {
      // Use direct axios call with explicit limit parameter to fetch all records
      const response = await axios.get('http://localhost:3000/api/faculty?limit=1000', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data && response.data.success) {
        // Extract faculty data from the response, handling possible nesting
        let facultyData;
        if (response.data.data?.faculty) {
          facultyData = response.data.data.faculty;
        } else if (Array.isArray(response.data.data)) {
          facultyData = response.data.data;
        } else {
          facultyData = [];
        }
        
        // Ensure we're setting a valid array
        const validFacultyData = Array.isArray(facultyData) ? facultyData : [];
        console.log('All faculties loaded:', validFacultyData.length);
        
        setAllFaculties(validFacultyData);
      } else {
        // Set empty array as fallback
        setAllFaculties([]);
        console.log('No faculty data found in response');
      }
    } catch (err: any) {
      console.error('Error fetching all faculties:', err);
      setAllFaculties([]); // Set empty array as fallback
    } finally {
      setIsFacultyLoading(false);
    }
  }, []);
  
  // Load all faculties once when component mounts
  useEffect(() => {
    fetchAllFaculties();
  }, [fetchAllFaculties]);
  
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
        // Direct axios call for subjects with department filter and include section relations
        subjectsRes = await axios.get(`http://localhost:3000/api/subjects?departmentId=${departmentIdStr}&includeRelations=true&includeSections=true`, axiosConfig);
        console.log('Subjects API request:', `http://localhost:3000/api/subjects?departmentId=${departmentIdStr}&includeRelations=true&includeSections=true`);
        console.log('Subjects API response:', subjectsRes?.data);
      } catch (err: any) {
        console.error('Error fetching subjects:', err);
        // Continue with other requests - don't block all data loading
      }
      
      try {
        // Direct axios call for faculty with department filter and maximum limit
        facultyRes = await axios.get(`http://localhost:3000/api/faculty?departmentId=${departmentIdStr}&limit=1000`, axiosConfig);
        console.log('Faculty data fetched for department:', departmentIdStr);
      } catch (err: any) {
        console.error('Error fetching faculty:', err);
      }
      
      try {
        // Direct axios call for batches with department filter and increased limit
        batchesRes = await axios.get(`http://localhost:3000/api/batches?departmentId=${departmentIdStr}&limit=100`, axiosConfig);
        console.log('Batch API request:', `http://localhost:3000/api/batches?departmentId=${departmentIdStr}&limit=100`);
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
        
        // Set department faculties in state
        setFaculties(validFacultyData);
        
        // Also ensure all faculties are loaded for cross-department selection
        if (allFaculties.length === 0) {
          void fetchAllFaculties(); 
        }
      } else {
        // Always set an empty array when data is missing or invalid
        console.log('No valid faculty data in response');
        setFaculties([]);
      }
      
      // Process batches with null check and type safety
      if (batchesRes?.data && batchesRes.data.success) {
        // Check different paths where batches data might be based on API response structure
        let batchesData;
        if (batchesRes.data.data?.batches) {
          batchesData = batchesRes.data.data.batches;
        } else if (Array.isArray(batchesRes.data.data)) {
          batchesData = batchesRes.data.data;
        } else {
          batchesData = [];
        }
        
        // Ensure it's an array and log for debugging
        const validBatchesData = Array.isArray(batchesData) ? batchesData : [];
        console.log('Batches loaded:', validBatchesData.length, validBatchesData);
        setBatches(validBatchesData);
      } else {
        console.log('No valid batch data in response:', batchesRes?.data);
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
  }, [allFaculties.length, fetchAllFaculties]);  // Added missing dependencies
  
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

  // Handle subject selection to auto-populate semester, section, and academicYear (metadata)
  const handleSubjectSelect = async (subjectId: string): Promise<void> => {
    if (!subjectId) {
      // Reset fields if no subject selected
      setFormData((prev) => ({
        ...prev,
        subjectId: '',
        semester: '',
        section: '',
        batchId: '',
        academicYear: getCurrentAcademicYear() // Reset to default academic year
      }));
      setAvailableSections([]);
      return;
    }
    
    // Find selected subject
    const selectedSubject = Array.isArray(allSubjects) && allSubjects.find((subject) => 
      subject.id.toString() === subjectId
    );
    
    if (selectedSubject) {
      // Log the full subject object for debugging
      console.log('Selected subject FULL DETAILS:', JSON.stringify(selectedSubject, null, 2));
      console.log('Subject ID:', selectedSubject.id);
      console.log('Subject Name:', selectedSubject.name);
      console.log('Subject Code:', selectedSubject.code);
      console.log('Subject Semester:', selectedSubject.semester);
      console.log('Subject Section:', selectedSubject.section);
      console.log('Subject SectionId:', selectedSubject.sectionId);
      console.log('Subject SectionRelation:', selectedSubject.sectionRelation);
      console.log('Subject DepartmentId:', selectedSubject.departmentId);
      console.log('Subject Academic Year:', selectedSubject.academicYear);
      console.log('Subject Batch ID:', selectedSubject.batchId);
      
      // Get semester from subject - ensure it's a valid numeric value
      let semesterValue = '';
      if (selectedSubject.semester !== undefined && selectedSubject.semester !== null) {
        semesterValue = selectedSubject.semester.toString();
        console.log('Using semester from subject:', semesterValue);
      }
      
      // Get section details from the section table if sectionId exists
      let sectionValue = '';
      let batchIdValue = '';
      
      // Try to get section directly from subject
      if (selectedSubject.section) {
        sectionValue = selectedSubject.section;
        console.log('Using direct section from subject:', sectionValue);
      }
      
      // Try to get section from sectionRelation if exists
      if (!sectionValue && selectedSubject.sectionRelation) {
        sectionValue = selectedSubject.sectionRelation.name || '';
        console.log('Using section from sectionRelation:', sectionValue);
      }
      
      // Try to get section from sectionId API call
      if (selectedSubject.sectionId) {
        try {
          console.log('Fetching section details for sectionId:', selectedSubject.sectionId);
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:3000/api/sections/${selectedSubject.sectionId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          console.log('Section API full response:', response.data);
          
          if (response.data && response.data.success) {
            const sectionData = response.data.data;
            console.log('Section data from API:', sectionData);
            // Override section value if API call successful
            if (sectionData && sectionData.name) {
              sectionValue = sectionData.name;
              console.log('Section value from API call:', sectionValue);
            }
            if (sectionData && sectionData.batchId) {
              batchIdValue = sectionData.batchId;
              console.log('Batch ID from API call:', batchIdValue);
            }
          }
        } catch (err) {
          console.error('Error fetching section details:', err);
        }
      } else {
        console.log('No sectionId available in subject, using fallbacks');
      }
      
      // Final fallback if all else fails
      if (!sectionValue) {
        // Try extracting section from code (e.g., "BCS401-A" -> "A")
        if (selectedSubject.code) {
          const codeParts = selectedSubject.code.split('-');
          if (codeParts.length > 1) {
            sectionValue = codeParts[codeParts.length - 1];
            console.log('Extracted section from code:', sectionValue);
          }
        }
      }
      
      // Get batchId if not already set
      if (!batchIdValue) {
        batchIdValue = selectedSubject.batchId || 
                     (selectedSubject.sectionRelation && selectedSubject.sectionRelation.batchId) || 
                     '';
        console.log('Using fallback batchId value:', batchIdValue);
        
        // If no batch ID is found in any source, try to use the first available batch from the department
        if (!batchIdValue && Array.isArray(batches) && batches.length > 0) {
          batchIdValue = batches[0].id;
          console.log('No batch ID found in subject, using first available batch:', batchIdValue);
        }
      }
      
      // Final section and batch values
      console.log('FINAL SECTION VALUE:', sectionValue);
      console.log('FINAL BATCH ID VALUE:', batchIdValue);
      
      // Get academic year from subject or use current academic year
      const academicYearValue = selectedSubject.academicYear || getCurrentAcademicYear();
      
      console.log('Auto-populating subject metadata:', {
        semester: semesterValue,
        section: sectionValue,
        batchId: batchIdValue,
        academicYear: academicYearValue
      });
      
      // Auto-fill fields from subject data - semester, section, and academicYear are read-only metadata
      // batchId is suggested but still editable
      const updatedFormData = {
        ...formData,
        subjectId,
        semester: semesterValue,
        section: sectionValue,
        batchId: batchIdValue, // This will still be editable
        academicYear: academicYearValue
      };
      
      console.log('FORM DATA BEING SET:', updatedFormData);
      console.log('Section value in form data:', updatedFormData.section);
      
      setFormData(updatedFormData);
      
      // Fetch available sections for reference only (field will be read-only)
      fetchSections(formData.departmentId, semesterValue);
    } else {
      // Reset if subject not found
      setFormData((prev) => ({
        ...prev,
        subjectId,
        semester: '',
        section: '',
        batchId: '',
        academicYear: getCurrentAcademicYear()
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
    
    try {
      // Validate required fields
      if (
        !formData.departmentId ||
        !formData.facultyId ||
        !formData.subjectId ||
        !formData.semester ||
        !formData.batchId ||
        !formData.academicYear
      ) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Get user ID from localStorage if available for approvedBy field
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || null;
      
      const submissionData = {
        facultyId: String(formData.facultyId),
        subjectId: Number(formData.subjectId),
        section: formData.section || null,
        semester: Number(formData.semester),
        batchId: String(formData.batchId),
        academicYear: formData.academicYear,
        componentScope: formData.componentScope || 'theory',
        isPrimary: Boolean(formData.isPrimary),
        active: true,
        status: 'approved',
        approvedAt: new Date(),
        // Add approvedBy field which is shown in the error message
        approvedBy: userId, 
        // Using an actual Date object for updatedAt - Prisma requires this
        updatedAt: new Date(),
        createdAt: new Date()
      };
      
      // Validate numeric conversions
      if (isNaN(submissionData.subjectId)) {
        setError('Invalid subject ID format');
        return;
      }
      
      if (isNaN(submissionData.semester)) {
        setError('Invalid semester format');
        return;
      }
      
      console.log('Submitting data to API:', submissionData);
      
      // Use standard endpoint but with complete data including updatedAt
      const token = localStorage.getItem('token');
      
      console.log('Using standard API with complete data including updatedAt');
      
      try {
        console.log('Submitting mapping data with updatedAt:', submissionData);
        
        const endpoint = 'http://localhost:3000/api/faculty-subject-mapping';
        console.log('Using standard endpoint:', endpoint);
        
        const response = await axios.post(
          endpoint,
          submissionData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        // Get data directly from axios response
        const data = response.data;
        console.log('API response:', data);
        
        // For axios, we need different error checking
        if (!data.success) {
          throw new Error(data.message || 'Server error');
        }
        
        if (data && data.success) {
          // Success! Reset form but keep department
          setSuccess('Faculty subject mapping created successfully');
          setFormData({
            ...initialFormData,
            departmentId: formData.departmentId
          });
          
          // Update existing mappings to reflect new addition
          if (typeof formData.subjectId === 'string') {
            const newMapping = {
              subjectId: Number(formData.subjectId),
              section: formData.section || null,
              academicYear: formData.academicYear
            };
            setExistingMappings(prev => [...prev, newMapping]);
          }
          
          // Notify parent component if callback is provided
          if (onMappingCreated) {
            onMappingCreated();
          }
        } else {
          // API returned success: false
          setError(data.message || 'Unknown error occurred while creating mapping');
        }
      } catch (err: any) {
        // Handle API errors
        console.error('Error creating mapping:', err);
        
        if (err instanceof TypeError || err instanceof SyntaxError) {
          console.error('Request error:', err.message);
          setError(`Request error: ${err.message}`);
        } else {
          console.error('Server error:', err.message);
          setError(`Server error: ${err.message}`);
        }
      }
    } catch (err: any) {
      // Handle outer try-catch errors
      console.error('Unexpected error in form submission:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Create comprehensive faculty list combining department faculty and others
  const displayedFaculties = useMemo(() => {
    if (!formData.departmentId) {
      return []; // Don't show any faculty if no department is selected
    }
    
    // If not showing all faculties, just return the department faculties
    if (!formData.showAllFaculty) {
      return Array.isArray(faculties) ? faculties : [];
    }
    
    // When showing all faculties, separate department faculty from others
    const deptFaculty = Array.isArray(faculties) ? faculties : [];
    const deptFacultyIds = new Set(deptFaculty.map(f => f.id?.toString()));
    
    // Filter out faculty from the selected department to avoid duplicates
    const otherFaculty = Array.isArray(allFaculties) 
      ? allFaculties.filter(f => !deptFacultyIds.has(f.id?.toString()))
      : [];
    
    // Combine department faculty first, then all others
    const combinedFaculty = [...deptFaculty, ...otherFaculty];
    
    // Log faculty data for debugging
    console.log(`Faculty list: ${deptFaculty.length} from dept + ${otherFaculty.length} from other depts = ${combinedFaculty.length} total`);
    
    return combinedFaculty;
  }, [formData.departmentId, formData.showAllFaculty, faculties, allFaculties]);

  return (
    <Paper elevation={2} sx={{ p: 3, width: '100%' }}>
      {/* Title Section */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Faculty-Subject Mapping
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
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
              {/* Faculty Field with Autocomplete for advanced search */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Faculty *
                  </Typography>
                  <Autocomplete<Faculty, false, false, false>
                    id="faculty-autocomplete"
                    options={displayedFaculties}
                    loading={isFacultyLoading}
                    loadingText="Loading faculty members..."
                    getOptionLabel={(option: Faculty) => {
                      const facultyName = option.name || 'Unknown Faculty';
                      // Add department info for faculty from other departments
                      if (formData.showAllFaculty && option.department && 
                          option.department.id?.toString() !== formData.departmentId) {
                        const deptCode = option.department.code || option.department.name || '?';
                        return `${facultyName} (${deptCode})`;
                      }
                      return facultyName;
                    }}
                    groupBy={(option: Faculty) => {
                      // Group by department when showing all faculty
                      if (formData.showAllFaculty && option.department) {
                        if (option.department.id?.toString() === formData.departmentId) {
                          return 'Selected Department';
                        } else {
                          return 'Other Departments';
                        }
                      }
                      return '';
                    }}
                    isOptionEqualToValue={(option: Faculty, value: Faculty) => {
                      return option.id?.toString() === value.id?.toString();
                    }}
                    value={displayedFaculties.find(f => f.id?.toString() === formData.facultyId) || null}
                    onChange={(_event: React.SyntheticEvent, newValue: Faculty | null) => {
                      handleChange('facultyId', newValue?.id?.toString() || '');
                    }}
                    renderInput={(params: React.ComponentProps<typeof TextField>) => (
                      <TextField 
                        {...params} 
                        label="Search Faculty" 
                        placeholder={displayedFaculties.length === 0 ? 'No faculty available' : 'Type to search...'}
                        required 
                        disabled={!formData.departmentId || loading}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isFacultyLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    disabled={!formData.departmentId || loading}
                    noOptionsText="No faculty found with that name"
                    renderOption={(props: React.HTMLAttributes<HTMLLIElement>, option: Faculty) => (
                      <li {...props} key={option.id?.toString() || `faculty-${Math.random()}`}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <Typography variant="body1">{option.name || 'Unknown Faculty'}</Typography>
                          {option.department && (
                            <Typography variant="caption" color="text.secondary">
                              {option.designation || 'Faculty'} 
                              {option.department && ` • ${option.department.name || option.department.code || '?'}`}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    )}
                  />
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

              {/* Batch Field - Editable even when subject is selected */}
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
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', pl: 1 }}>
                      {formData.subjectId ? "Auto-suggested from subject, but you can change it" : "Select a batch for this mapping"}
                    </Typography>
                  </FormControl>
                </Box>
              </Grid>

              {/* Section Field - Read-only when subject is selected */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Section
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.section || ""}
                    placeholder={"Auto-filled from subject's section"}
                    disabled={loading}
                    InputProps={{
                      readOnly: !!formData.subjectId,
                    }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#000000',
                        opacity: 0.8,
                      },
                      '& .MuiInputBase-input.Mui-readOnly': {
                        bgcolor: '#f5f5f5',
                      }
                    }}
                    helperText={formData.subjectId ? 
                      "This field is auto-filled from subject's section data" : 
                      "Section will be auto-filled when a subject is selected"}
                  />
                </Box>
              </Grid>

              {/* Semester Field - Read-only when subject is selected */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Semester *
                  </Typography>
                  {formData.subjectId ? (
                    <TextField
                      fullWidth
                      required
                      value={formData.semester || ""}
                      placeholder="Auto-filled from subject"
                      disabled={loading}
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: '#000000',
                          opacity: 0.8,
                        },
                        '& .MuiInputBase-input.Mui-readOnly': {
                          bgcolor: '#f5f5f5',
                        }
                      }}
                      helperText="This field is auto-filled from subject's data"
                    />
                  ) : (
                    <FormControl fullWidth required>
                      <Select
                        value={formData.semester || ""}
                        onChange={(e: SelectChangeEvent) => handleChange('semester', e.target.value as string)}
                        displayEmpty
                        sx={{ height: '48px' }}
                        disabled={loading}
                      >
                        <MenuItem value=""><em>Select Semester</em></MenuItem>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <MenuItem key={sem} value={sem.toString()}>
                            {sem}
                          </MenuItem>
                        ))}
                      </Select>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', pl: 1 }}>
                        Select a semester
                      </Typography>
                    </FormControl>
                  )}
                </Box>
              </Grid>

              {/* Academic Year Field - Read-only when subject is selected */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Academic Year *
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    value={formData.academicYear}
                    placeholder="Auto-filled from subject"
                    disabled={loading}
                    InputProps={{
                      readOnly: !!formData.subjectId,
                    }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#000000',
                        opacity: 0.8,
                      },
                      '& .MuiInputBase-input.Mui-readOnly': {
                        bgcolor: '#f5f5f5',
                      }
                    }}
                    helperText={formData.subjectId ? 
                      "This field is auto-filled from subject data" : 
                      "Academic year will be auto-filled when a subject is selected"}
                  />
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

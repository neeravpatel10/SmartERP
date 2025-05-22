import React, { useState, useEffect, useCallback } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress,
  Grid,
  Box
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { FilterParams, Department, Batch, Section, Subject, CIE } from './types';
import axios from 'axios';


interface MarksFilterBarProps {
  filterParams: FilterParams;
  onFilterChange: (name: string, value: string) => void;
  userType?: number;
  facultyId?: number;
  departmentId?: number;
}

const MarksFilterBar: React.FC<MarksFilterBarProps> = ({ 
  filterParams, 
  onFilterChange,
  userType,
  facultyId,
  departmentId
}) => {
  // State for dropdown options
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // State for loading
  const [loading, setLoading] = useState({
    departments: false,
    batches: false,
    sections: false,
    subjects: false
  });
  
  // Derive login type constants
  const isStudent = userType === 4;
  const isFaculty = userType === 2;
  const isDeptAdmin = userType === 3;
  const isSuperAdmin = userType === 1;

  // Define fetch functions using useCallback
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, departments: true }));
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const url = `${baseUrl}/departments?active=all`;
      
      console.log('Fetching departments from URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      });
      
      console.log('Departments response:', response.data);
      
      if (response.data?.data?.departments) {
        setDepartments(response.data.data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(prev => ({ ...prev, departments: false }));
    }
  }, []);
  
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, batches: true }));
      // Use department ID from props or filter params
      const deptId = isSuperAdmin 
        ? filterParams.departmentId
        : (isDeptAdmin && departmentId) 
          ? departmentId 
          : filterParams.departmentId;

      // Use axios directly to bypass potential issues with the API utility
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      let url = `${baseUrl}/batches?active=all`;
      if (deptId) {
        url += `&departmentId=${deptId}`;
      }
      
      // Log the URL being called
      console.log('Fetching batches from URL:', url);
      
      // Direct axios call
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          // Add authorization if needed
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      });
      
      console.log('Batches response:', response.data);
      
      if (response.data?.data?.batches) {
        setBatches(response.data.data.batches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(prev => ({ ...prev, batches: false }));
    }
  }, [filterParams.departmentId, isDeptAdmin, departmentId, isSuperAdmin]);
  
  const fetchSections = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, sections: true }));
      if (filterParams.batchId) {
        // Ensure batchId is properly converted to string
        const batchId = String(filterParams.batchId);
        
        // Use axios directly to bypass potential issues with the API utility
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
        
        // Create proper parameters using URLSearchParams for consistent formatting
        const params = new URLSearchParams({
          active: 'all',  // Always include active=all as guaranteed parameter
          batchId: batchId
        });
        
        const url = `${baseUrl}/sections?${params.toString()}`;
        
        // Enhanced logging for debugging
        console.log('Fetching sections - Batch ID:', batchId, 'URL:', url);
        
        // Direct axios call
        const response = await axios.get(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
          }
        });
        
        console.log('Sections response:', response.data);
        
        // Check multiple possible response formats based on API patterns
        let sectionsData = null;
        if (response.data?.data?.sections) {
          sectionsData = response.data.data.sections;
        } else if (response.data?.sections) {
          sectionsData = response.data.sections;
        } else if (Array.isArray(response.data?.data)) {
          sectionsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          sectionsData = response.data;
        }
        
        if (sectionsData && Array.isArray(sectionsData)) {
          console.log('Found sections data:', sectionsData.length, 'sections');
          setSections(sectionsData);
        } else {
          console.warn('No sections data found in response');
          setSections([]);
        }
      } else {
        // Clear sections if no batch is selected
        setSections([]);
      }
    } catch (error: any) {
      console.error('Error fetching sections:', error);
      // Log detailed error information
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data
        });
      }
      setSections([]);
    } finally {
      setLoading(prev => ({ ...prev, sections: false }));
    }
  }, [filterParams.batchId]);
  
  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, subjects: true }));
      if (filterParams.departmentId) {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
        const url = `${baseUrl}/subjects?active=all&departmentId=${filterParams.departmentId}`;
        
        console.log('Fetching subjects from URL:', url);
        
        const response = await axios.get(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
          }
        });
        
        console.log('Subjects response:', response.data);
        
        if (response.data?.data?.subjects) {
          setSubjects(response.data.data.subjects);
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(prev => ({ ...prev, subjects: false }));
    }
  }, [filterParams.departmentId]);
  
  const fetchFacultySubjects = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, subjects: true }));
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      // Temporary fix: Avoid using facultyId due to backend issue
      // Use departmentId instead if available, or fetch all subjects
      let url = `${baseUrl}/subjects?active=all`;
      
      // If we have departmentId from props, use that to filter instead
      if (departmentId) {
        url += `&departmentId=${departmentId}`;
      }
      
      console.log('Fetching faculty subjects from URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      });
      
      console.log('Faculty subjects response:', response.data);
      
      if (response.data?.data?.subjects) {
        setSubjects(response.data.data.subjects);
      }
    } catch (error) {
      console.error('Error fetching faculty subjects:', error);
    } finally {
      setLoading(prev => ({ ...prev, subjects: false }));
    }
  }, [facultyId, departmentId]);

  // Load departments for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      fetchDepartments();
    }
  }, [isSuperAdmin, fetchDepartments]);

  // Load batches based on department
  useEffect(() => {
    if ((filterParams.departmentId || isDeptAdmin || departmentId) && !isStudent) {
      fetchBatches();
    }
  }, [filterParams.departmentId, isDeptAdmin, departmentId, isSuperAdmin, isStudent, fetchBatches]);

  // Load sections based on batch
  useEffect(() => {
    if (filterParams.batchId && !isStudent) {
      fetchSections();
    }
  }, [filterParams.batchId, isStudent, fetchSections]);

  // Load subjects based on department, batch, section
  useEffect(() => {
    if (!isStudent) {
      if (isFaculty || isDeptAdmin) {
        // Faculty sees only their own subjects
        fetchFacultySubjects();
      } else if (isSuperAdmin && filterParams.departmentId) {
        // Super admin sees all subjects for the selected department
        fetchSubjects();
      }
    }
  }, [
    isStudent,
    isFaculty,
    isDeptAdmin,
    isSuperAdmin,
    filterParams.departmentId,
    fetchSubjects,
    fetchFacultySubjects
  ]);

  // Auto-select first option when available
  useEffect(() => {
    // Auto-select first department for super admin
    if (isSuperAdmin && departments.length > 0 && !filterParams.departmentId) {
      onFilterChange('departmentId', String(departments[0].id));
    }
    
    // Auto-select first batch
    if (batches.length > 0 && !filterParams.batchId) {
      onFilterChange('batchId', String(batches[0].id));
    }
    
    // Auto-select first section
    if (sections.length > 0 && !filterParams.sectionId) {
      onFilterChange('sectionId', String(sections[0].id));
    }
    
    // Auto-select first subject
    if (subjects.length > 0 && !filterParams.subjectId) {
      onFilterChange('subjectId', String(subjects[0].id));
    }

    // Auto-select first CIE option if not set
    if (!filterParams.cieId && filterParams.subjectId) {
      onFilterChange('cieId', '1'); // Default to CIE 1
    }
  }, [departments, batches, sections, subjects, isSuperAdmin, filterParams, onFilterChange]);

  // Handle filter change
  const handleChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    onFilterChange(name, value);
  };

  // Specialized handlers for each filter type
  const handleDepartmentChange = (event: SelectChangeEvent<string>) => {
    handleChange(event);
  };

  const handleBatchChange = (event: SelectChangeEvent<string>) => {
    handleChange(event);
  };

  const handleSectionChange = (event: SelectChangeEvent<string>) => {
    handleChange(event);
  };

  const handleSubjectChange = (event: SelectChangeEvent<string>) => {
    handleChange(event);
  };

  const handleCIEChange = (event: SelectChangeEvent<string>) => {
    handleChange(event);
  };

  // Define CIE options (hardcoded as they don't change)
  const cieOptions: CIE[] = [
    { id: 1, name: 'CIE 1' },
    { id: 2, name: 'CIE 2' },
    { id: 3, name: 'CIE 3' }
  ];

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Grid container spacing={2}>
        {/* Department Dropdown (Super Admin) */}
        {isSuperAdmin && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filterParams.departmentId || ''}
                onChange={handleDepartmentChange}
                label="Department"
                disabled={loading.departments}
              >
                {loading.departments ? (
                  <MenuItem value="">
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : (
                  departments.map(dept => (
                    <MenuItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Batch Dropdown (Super Admin and Dept Admin) */}
        {(isSuperAdmin || isDeptAdmin) && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Batch</InputLabel>
              <Select
                value={filterParams.batchId || ''}
                onChange={handleBatchChange}
                label="Batch"
                disabled={loading.batches}
              >
                {loading.batches ? (
                  <MenuItem value="">
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : (
                  batches.map(batch => (
                    <MenuItem key={batch.id} value={String(batch.id)}>
                      {batch.name} ({batch.academicYear})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Section Dropdown (Super Admin and Dept Admin) */}
        {(isSuperAdmin || isDeptAdmin) && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                value={filterParams.sectionId || ''}
                onChange={handleSectionChange}
                label="Section"
                disabled={loading.sections}
              >
                {loading.sections ? (
                  <MenuItem value="">
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : (
                  sections.map(section => (
                    <MenuItem key={section.id} value={String(section.id)}>
                      {section.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Subject Dropdown (All roles) */}
        <Grid item xs={12} sm={6} md={isFaculty ? 3 : 2}>
          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select
              value={filterParams.subjectId || ''}
              onChange={handleSubjectChange}
              label="Subject"
              disabled={loading.subjects}
              MenuProps={{
                PaperProps: {
                  style: { maxHeight: 300 },
                },
              }}
            >
              {loading.subjects ? (
                <MenuItem value="">
                  <CircularProgress size={20} />
                </MenuItem>
              ) : (
                subjects.map(subject => (
                  <MenuItem key={subject.id} value={String(subject.id)}>
                    {subject.code} - {subject.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>
        
        {/* CIE Dropdown (All roles) */}
        <Grid item xs={12} sm={6} md={isFaculty ? 3 : 2}>
          <FormControl fullWidth>
            <InputLabel>CIE</InputLabel>
            <Select
              value={filterParams.cieId || '1'}
              onChange={handleCIEChange}
              label="CIE"
              name="cieId"
            >
              {cieOptions.map(cie => (
                <MenuItem key={cie.id} value={String(cie.id)}>
                  {cie.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MarksFilterBar;

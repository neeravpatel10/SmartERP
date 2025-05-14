import React, { useState, useEffect, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import api from '../../utils/api';
import axios from 'axios'; // Import axios directly for bypassing throttling
import { useAuth } from '../../contexts/AuthContext';
import CustomModal from '../bootstrap/CustomModal';

interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  markingSchema?: string;
}

interface Department {
  id: number;
  code: string;
  name: string;
}

interface ExamComponent {
  name: string;
  componentType?: string;
  maxMarks?: number;
  max_marks?: number;  // Backend uses this format
  weightagePercent?: number;
  isCalculated?: boolean; // Flag for internally calculated components
}

interface Section {
  id: number;
  name: string;
  batchId: string;
  departmentId: number;
  currentSemester: number;
}

interface SubjectFormData {
  code: string;
  name: string;
  semester: number;
  sectionId: number;
  schemeYear: number;
  categoryId: number;
  credits: number;
  departmentId: number;
  isLab: boolean;
}

// New interface for tracking which fields have been touched
interface TouchedFields {
  code?: boolean;
  name?: boolean;
  semester?: boolean;
  sectionId?: boolean;
  schemeYear?: boolean;
  categoryId?: boolean;
  credits?: boolean;
  departmentId?: boolean;
  isLab?: boolean;
}

interface AddEditSubjectModalProps {
  show: boolean;
  handleClose: () => void;
  subjectToEdit?: any;
  onSuccess: () => void;
}

const AddEditSubjectModal: React.FC<AddEditSubjectModalProps> = ({
  show,
  handleClose,
  subjectToEdit,
  onSuccess
}) => {
  const { user, loginType } = useAuth();
  const [formData, setFormData] = useState<SubjectFormData>({
    code: '',
    name: '',
    semester: 1,
    sectionId: 0,
    schemeYear: new Date().getFullYear(),
    categoryId: 0,
    credits: 3,
    departmentId: (user && user.departmentId) || 0,
    isLab: false
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Add effect to track when user auth is complete
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // If we have user data, auth is complete
    if (user) {
      setIsAuthLoading(false);
    } 
    // If no token, we have an auth error
    else if (!token) {
      setIsAuthLoading(false);
    }
    // If we have token but no user, auth is still loading
    else {
      setIsAuthLoading(true);
      
      // Add a timeout to avoid infinite loading
      const timeout = setTimeout(() => {
        setIsAuthLoading(false);
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [user]);

  // Track which fields have been touched
  const [touched, setTouched] = useState<TouchedFields>({});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewComponents, setPreviewComponents] = useState<ExamComponent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Add loading state specifically for departments
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  
  // Add state for sections
  const [sections, setSections] = useState<Section[]>([]);
  const [isSectionsLoading, setIsSectionsLoading] = useState(false);
  
  // Fetch departments with optimized loading
  const fetchDepartments = useCallback(async () => {
    setIsDepartmentsLoading(true);
    try {
      if (isAuthLoading) {
        return;
      }

      console.log('Fetching departments bypassing throttling...');
      
      // Use direct axios call to bypass API throttling system
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      
      try {
        // Direct axios call to bypass throttling
        const response = await axios({
          method: 'GET',
          url: `${API_URL}/departments`,
          params: {
            limit: 200, // Get all departments
            fields: 'id,code,name', // Only request essential fields
            noHeads: true
          },
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Department response received:', response);
        
        // Handle the response
        if (response?.data?.success) {
          let departmentsList = [];
          
          // Handle different response structures
          if (response.data.data?.departments && Array.isArray(response.data.data.departments)) {
            departmentsList = response.data.data.departments;
            console.log(`Loaded ${departmentsList.length} departments from standard response`);
          } else if (Array.isArray(response.data.data)) {
            departmentsList = response.data.data;
            console.log(`Loaded ${departmentsList.length} departments from flat array`);
          }
          
          // Debug the departments list
          console.log('Department list:', departmentsList);
          
          // Set departments and check if we got any
          if (departmentsList.length > 0) {
            setDepartments(departmentsList);
            
            // Pre-select department if needed
            if (!subjectToEdit) {
              if (loginType === 1) {
                // For admin users, don't pre-select - force them to make an explicit choice
                // However, if we're in edit mode, we'll keep the existing value
                console.log('Admin user detected - department selection required');
                setFormData(prev => ({
                  ...prev,
                  departmentId: 0
                }));
              } else if (user?.departmentId) {
                // For non-admin users, pre-select their own department
                console.log('Non-admin user - setting department to user department:', user.departmentId);
                setFormData(prev => ({
                  ...prev,
                  departmentId: user.departmentId || 0
                }));
              }
            }
          } else {
            console.warn('No departments found in response', response.data);
            setDepartments([]);
          }
        } else {
          console.warn('Department API returned unsuccessful response:', response?.data);
          setDepartments([]);
        }
      } catch (axiosError) {
        console.error('Department API call failed:', axiosError);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Department loading failed:', error);
      setDepartments([]);
    } finally {
      setIsDepartmentsLoading(false);
    }
  }, [subjectToEdit, user, setFormData, isAuthLoading, loginType]);

  // Define updatePreviewComponents first before it's used in fetchCategories
  const updatePreviewComponents = useCallback((category: Category) => {
    if (!category.markingSchema) {
      setPreviewComponents([]);
      return;
    }

    try {
      let markingSchema = JSON.parse(category.markingSchema);
      if (Array.isArray(markingSchema)) {
        // Transform the schema to handle different property naming conventions
        const transformedSchema = markingSchema.map(component => ({
          name: component.name || '',
          componentType: component.componentType || 
                        (component.name && component.name.toLowerCase().includes('external') ? 'external' : 'internal'),
          maxMarks: component.maxMarks || component.max_marks || 0,
          weightagePercent: component.weightagePercent || 
                          (component.max_marks ? (component.max_marks / 100) * 100 : 0)
        }));

        // Separate external and internal components
        const externalComponent = transformedSchema.find(comp => 
          comp.name.toLowerCase().includes('external') || comp.componentType === 'external'
        );
        
        const internalComponents = transformedSchema.filter(comp => 
          !comp.name.toLowerCase().includes('external') && comp.componentType !== 'external'
        );
        
        // Calculate internal total
        let internalTotalMarks = 0;
        internalComponents.forEach(comp => {
          internalTotalMarks += comp.maxMarks;
        });
        
        // Calculate external and internal weightage
        const externalWeightage = externalComponent ? externalComponent.weightagePercent : 50;
        const internalWeightage = 100 - (externalWeightage || 50);
        
        // Create internal total component
        const internalTotalComponent = {
          name: 'Internal (Total)',
          componentType: 'internal-total',
          maxMarks: internalTotalMarks,
          weightagePercent: internalWeightage,
          isCalculated: true
        };
        
        // Include all components plus the calculated total
        setPreviewComponents([...transformedSchema, internalTotalComponent]);
      } else {
        setPreviewComponents([]);
      }
    } catch (error) {
      console.error('Error parsing marking schema:', error);
      setPreviewComponents([]);
    }
  }, []);

  // Fetch categories with optimized loading - now defined after updatePreviewComponents
  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      if (isAuthLoading) {
        return;
      }

      console.log('Fetching categories bypassing throttling...');
      
      // Use direct axios call to bypass API throttling system
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      
      try {
        // Direct axios call to bypass throttling
        const response = await axios({
          method: 'GET',
          url: `${API_URL}/subjects/categories`,
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Categories response received:', response);
        
        // Handle the response
        if (response?.data?.success) {
          const categoriesList = response.data.data || [];
          
          // Debug the categories list
          console.log('Categories list:', categoriesList);
          
          // Set categories and check if we got any
          if (Array.isArray(categoriesList) && categoriesList.length > 0) {
            setCategories(categoriesList);
            
            // If editing and we have a categoryId, set the selected category
            if (subjectToEdit && subjectToEdit.categoryId) {
              const category = categoriesList.find(c => c.id === subjectToEdit.categoryId);
              if (category) {
                setSelectedCategory(category);
                updatePreviewComponents(category);
              }
            }
          } else {
            console.warn('No categories found in response', response.data);
            setCategories([]);
          }
        } else {
          console.warn('Categories API returned unsuccessful response:', response?.data);
          setCategories([]);
        }
      } catch (axiosError) {
        console.error('Categories API call failed:', axiosError);
        setCategories([]);
      }
    } catch (error) {
      console.error('Categories loading failed:', error);
      setCategories([]);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, [subjectToEdit, isAuthLoading, updatePreviewComponents]);

  // Fetch departments and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      if (isAuthLoading) {
        return;
      }
      
      try {
        // Fetch both departments and categories in parallel
        await Promise.all([
          fetchDepartments(),
          fetchCategories()
        ]);
      } catch (error) {
        console.error('Error fetching initialization data:', error);
        setError('Failed to load required data. Please try refreshing the page.');
      }
    };

    fetchData();
  }, [subjectToEdit, fetchDepartments, fetchCategories, isAuthLoading]);

  // Set form data if editing
  useEffect(() => {
    if (subjectToEdit) {
      setFormData({
        code: subjectToEdit.code || '',
        name: subjectToEdit.name || '',
        semester: subjectToEdit.semester || 1,
        sectionId: subjectToEdit.sectionId || 0,
        schemeYear: subjectToEdit.schemeYear || new Date().getFullYear(),
        categoryId: subjectToEdit.categoryId || 0,
        credits: subjectToEdit.credits || 3,
        departmentId: subjectToEdit.departmentId || (user?.departmentId || 1),
        isLab: subjectToEdit.isLab || false
      });

      // If category ID is set, get preview components
      if (subjectToEdit.categoryId) {
        const category = categories.find(c => c.id === subjectToEdit.categoryId);
        if (category) {
          setSelectedCategory(category);
          updatePreviewComponents(category);
        }
      }
    }
  }, [subjectToEdit, categories, user]);

  // Use a separate effect to set the departmentId when user data is available
  useEffect(() => {
    if (user?.departmentId) {
      setFormData(prevData => ({
        ...prevData,
        departmentId: user.departmentId || 0
      }));
    }
  }, [user]);

  // Mark field as touched on blur
  const handleBlur = (e: React.FocusEvent<any>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target;
    
    // Mark the field as touched when it's changed
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
      return;
    }

    // Handle number inputs
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
      return;
    }

    // Handle category change and update preview
    if (name === 'categoryId') {
      const categoryId = parseInt(value);
      setFormData({ ...formData, categoryId });
      
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setSelectedCategory(category);
        updatePreviewComponents(category);
      } else {
        setSelectedCategory(null);
        setPreviewComponents([]);
      }
      return;
    }

    // Handle all other inputs
    setFormData({ ...formData, [name]: value });
  };

  // Validate a specific field and return error message if invalid
  const validateField = (field: keyof SubjectFormData): string | null => {
    const value = formData[field];
    
    switch (field) {
      case 'code':
        return !value || String(value).trim() === '' ? 'Subject code is required' : null;
      case 'name':
        return !value || String(value).trim() === '' ? 'Subject name is required' : null;
      case 'semester':
        return Number(value) < 1 || Number(value) > 8 ? 'Semester must be between 1 and 8' : null;
      case 'schemeYear':
        return Number(value) < 2000 || Number(value) > 2100 ? 'Invalid scheme year' : null;
      case 'credits':
        return Number(value) < 1 || Number(value) > 15 ? 'Credits must be between 1 and 15' : null;
      case 'departmentId':
        return !value || Number(value) <= 0 ? 'Department is required' : null;
      case 'categoryId':
        return !value || Number(value) <= 0 ? 'Category is required' : null;
      default:
        return null;
    }
  };
  
  // Get error message for a field if it has been touched and is invalid
  const getFieldError = (field: keyof SubjectFormData): string | null => {
    return touched[field] ? validateField(field) : null;
  };

  // Add function to fetch sections based on semester and department
  const fetchSections = useCallback(async (semester: number, departmentId: number) => {
    if (!departmentId) return;
    
    setIsSectionsLoading(true);
    try {
      console.log(`Fetching sections for semester ${semester} and department ${departmentId}...`);
      
      // Use direct axios call for better performance
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      
      const response = await axios({
        method: 'GET',
        url: `${API_URL}/sections`,
        params: {
          departmentId,
          currentSemester: semester
        },
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (response?.data?.success && response.data.data) {
        const sectionsData = Array.isArray(response.data.data) ? response.data.data : [];
        console.log(`Loaded ${sectionsData.length} sections`);
        setSections(sectionsData);
      } else {
        console.warn('No sections found in response', response?.data);
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    } finally {
      setIsSectionsLoading(false);
    }
  }, []);

  // Update to refetch sections when semester or department changes
  useEffect(() => {
    if (formData.semester && formData.departmentId) {
      fetchSections(formData.semester, formData.departmentId);
    }
  }, [formData.semester, formData.departmentId, fetchSections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    setTouched({
      code: true,
      name: true,
      semester: true,
      sectionId: true,
      schemeYear: true,
      categoryId: true,
      credits: true,
      departmentId: true,
      isLab: true
    });
    
    // Validate all fields
    const errors = {
      code: validateField('code'),
      name: validateField('name'),
      semester: validateField('semester'),
      schemeYear: validateField('schemeYear'),
      credits: validateField('credits'),
      departmentId: validateField('departmentId'),
      categoryId: validateField('categoryId')
      // sectionId is optional so we don't validate it
    };
    
    // Check if any validation errors exist
    const hasErrors = Object.values(errors).some(error => error !== null);
    
    if (hasErrors) {
      // Find the first error message
      const errorMessage = Object.values(errors).find(error => error !== null);
      setError(errorMessage || 'Please correct the errors in the form');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Create a copy of form data for submission and ensure all values have correct types
      const submissionData = {
        code: String(formData.code).trim(),
        name: String(formData.name).trim(),
        semester: Number(formData.semester),
        schemeYear: Number(formData.schemeYear),
        categoryId: Number(formData.categoryId),
        departmentId: Number(formData.departmentId),
        credits: Number(formData.credits),
        isLab: Boolean(formData.isLab),
        // Add sectionId if it's set to a valid value
        ...(formData.sectionId > 0 ? { sectionId: Number(formData.sectionId) } : {})
      };

      // Validate and fix department ID
      if (!submissionData.departmentId || submissionData.departmentId <= 0) {
        if (loginType !== 1 && user?.departmentId) {
          submissionData.departmentId = Number(user.departmentId);
        } else {
          setError('Please select a valid department');
          setLoading(false);
          return;
        }
      }

      // All validation passed, make the API request
      const endpoint = subjectToEdit ? `/subjects/${subjectToEdit.id}` : '/subjects';
      
      console.log('Submitting subject data:', submissionData);
      
      try {
        const response = await api({
          method: subjectToEdit ? 'put' : 'post',
          url: endpoint,
          data: submissionData
        });
        
        // Handle successful response
        if (response.data && response.data.success) {
          // Provide success feedback
          const message = subjectToEdit 
            ? `Subject "${submissionData.code}" has been updated successfully.` 
            : `New subject "${submissionData.code}" has been created successfully.`;
          
          console.log(message);
          
          // Set success message and show it to the user
          setSuccessMessage(message);
          
          // Wait 2 seconds before closing the modal to let user see the success message
          setTimeout(() => {
            handleClose();
            onSuccess();
          }, 2000);
        } else {
          // Handle unsuccessful API response
          setError(response.data?.message || 'Failed to save the subject');
          console.error('API returned unsuccessful response:', response.data);
        }
      } catch (apiError: any) {
        console.error('API error details:', apiError.response?.data);
        
        // Extract the detailed error message if available
        let errorMessage = 'An error occurred while saving the subject';
        
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
        
        setError(`Submission error: ${errorMessage}`);
      }
    } catch (error: any) {
      // Handle other errors
      console.error('Error in form submission:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setError('');
    setSuccessMessage('');
    handleClose();
  };

  return (
    <CustomModal 
      show={show} 
      onHide={handleDialogClose} 
      size="lg"
      centered={true}
      className="subject-modal"
    >
      {/* Modal header */}
      <CustomModal.Header closeButton>
        <div className="d-flex align-items-center">
          <span className="h5 mb-0">
            {subjectToEdit ? 'Edit Subject' : 'Add New Subject'}
          </span>
          {loading && (
            <Spinner animation="border" size="sm" className="ms-3" />
          )}
        </div>
      </CustomModal.Header>

      <style type="text/css">
      {`
        /* Responsive styles for the subject modal */
        @media (max-width: 768px) {
          .subject-modal {
            max-width: 100%;
            margin: 0.5rem;
          }
          .form-select-lg {
            font-size: 1rem;
            padding: 0.375rem 2.25rem 0.375rem 0.75rem;
            height: auto;
          }
          .modal-body {
            padding: 1rem;
          }
        }
        
        /* Make modal body scrollable */
        .subject-modal .modal-body {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }
        
        /* Improve form spacing */
        .subject-form .form-group {
          margin-bottom: 1rem;
        }
        
        /* Make table responsive */
        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}
      </style>

      <CustomModal.Body>
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}
        
        {successMessage && (
          <Alert variant="success">{successMessage}</Alert>
        )}
        
        {isAuthLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-3">Loading user data...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit} className="subject-form">
            <Alert variant="success" className="mb-3">
              <i className="fas fa-check-circle me-2"></i>
              <strong>New Feature:</strong> You can now select a section for this subject from available sections in the selected department and semester.
            </Alert>
            <div className="row mb-4">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Subject Code*</Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    isInvalid={!!getFieldError('code')}
                    disabled={subjectToEdit && subjectToEdit.status !== 'draft'}
                    placeholder="Enter subject code"
                  />
                  {getFieldError('code') && (
                    <div className="invalid-feedback">
                      {getFieldError('code')}
                    </div>
                  )}
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Subject Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    isInvalid={!!getFieldError('name')}
                    disabled={subjectToEdit && subjectToEdit.status !== 'draft'}
                    placeholder="Enter subject name"
                  />
                  {getFieldError('name') && (
                    <div className="invalid-feedback">
                      {getFieldError('name')}
                    </div>
                  )}
                </Form.Group>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Semester*</Form.Label>
                  <Form.Control
                    type="number"
                    name="semester"
                    min={1}
                    max={8}
                    value={formData.semester}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    isInvalid={!!getFieldError('semester')}
                    disabled={subjectToEdit && subjectToEdit.status !== 'draft'}
                    placeholder="1-8"
                  />
                  {getFieldError('semester') && (
                    <div className="invalid-feedback">
                      {getFieldError('semester')}
                    </div>
                  )}
                  <small className="text-muted">
                    Changing semester will load available sections.
                  </small>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    Section
                    {isSectionsLoading && (
                      <Spinner animation="border" size="sm" className="ms-2" />
                    )}
                  </Form.Label>
                  <Form.Select
                    name="sectionId"
                    value={formData.sectionId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={subjectToEdit && subjectToEdit.status !== 'draft' || isSectionsLoading}
                  >
                    <option value={0}>Select Section</option>
                    {Array.isArray(sections) && sections.length > 0 ? (
                      sections.map(section => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>{isSectionsLoading ? 'Loading sections...' : 'No sections available'}</option>
                    )}
                  </Form.Select>
                  {!isSectionsLoading && sections.length === 0 && formData.departmentId > 0 && formData.semester > 0 && (
                    <small className="text-muted">
                      No sections found for semester {formData.semester}. Please create sections first.
                    </small>
                  )}
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Scheme Year*</Form.Label>
                  <Form.Select
                    name="schemeYear"
                    value={formData.schemeYear}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    isInvalid={!!getFieldError('schemeYear')}
                    disabled={subjectToEdit && subjectToEdit.status !== 'draft'}
                  >
                    <option value="2021">2021 Scheme</option>
                    <option value="2022">2022 Scheme</option>
                  </Form.Select>
                  {getFieldError('schemeYear') && (
                    <div className="invalid-feedback">
                      {getFieldError('schemeYear')}
                    </div>
                  )}
                </Form.Group>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Credits*</Form.Label>
                  <Form.Control
                    type="number"
                    name="credits"
                    min={1}
                    max={15}
                    value={formData.credits}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    isInvalid={!!getFieldError('credits')}
                    disabled={subjectToEdit && subjectToEdit.status !== 'draft'}
                    placeholder="1-15"
                  />
                  {getFieldError('credits') && (
                    <div className="invalid-feedback">
                      {getFieldError('credits')}
                    </div>
                  )}
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Is Lab?</Form.Label>
                  <div className="mt-2">
                    <Form.Check
                      type="checkbox"
                      name="isLab"
                      checked={formData.isLab}
                      onChange={handleChange}
                      disabled={subjectToEdit && subjectToEdit.status !== 'draft'}
                      label="Yes, this is a lab subject"
                    />
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    Category*
                    {isCategoriesLoading && (
                      <Spinner animation="border" size="sm" className="ms-2" />
                    )}
                  </Form.Label>
                  <Form.Select
                    name="categoryId"
                    value={formData.categoryId || 0}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    isInvalid={!!getFieldError('categoryId')}
                    disabled={subjectToEdit && subjectToEdit.status !== 'draft' || isCategoriesLoading}
                  >
                    <option value={0}>Select Category</option>
                    {Array.isArray(categories) && categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.code ? `${cat.code} - ${cat.name}` : cat.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>{isCategoriesLoading ? 'Loading categories...' : 'No categories available'}</option>
                    )}
                  </Form.Select>
                  {getFieldError('categoryId') && (
                    <div className="invalid-feedback">
                      {getFieldError('categoryId')}
                    </div>
                  )}
                  {!isCategoriesLoading && Array.isArray(categories) && categories.length === 0 && (
                    <div className="d-flex align-items-center mt-2">
                      <span className="text-danger me-2">No categories found.</span>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={fetchCategories}
                        className="d-flex align-items-center"
                      >
                        <span className="me-1">Retry</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                        </svg>
                      </Button>
                    </div>
                  )}
                </Form.Group>
              </div>
            </div>

            {/* Department selection with improved UI for admins */}
            <div className="row mb-4">
              <div className="col-12">
                <Form.Group className="mb-3 border p-3 bg-light rounded">
                  <Form.Label className="fw-bold d-flex align-items-center mb-3">
                    <span className="me-2">Department Selection*</span>
                    {isDepartmentsLoading && (
                      <Spinner animation="border" size="sm" className="ms-2" />
                    )}
                    {loginType === 1 && (
                      <span className="badge bg-info ms-2">Admin Mode</span>
                    )}
                  </Form.Label>
                  
                  {/* Department selection hint for admins */}
                  {loginType === 1 && (
                    <p className="text-muted small mb-3">
                      As an administrator, you can assign this subject to any department. 
                      Please select the appropriate department.
                    </p>
                  )}
                  
                  {/* Main department selector */}
                  <Form.Select
                    name="departmentId"
                    value={formData.departmentId || 0}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    disabled={(subjectToEdit && subjectToEdit.status !== 'draft') || isDepartmentsLoading}
                    isInvalid={!!getFieldError('departmentId')}
                    className="form-select-lg mb-2"
                  >
                    <option value="0">Select Department</option>
                    {Array.isArray(departments) && departments.length > 0 ? (
                      departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.code ? `${dept.code} - ${dept.name}` : dept.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>{isDepartmentsLoading ? 'Loading departments...' : 'No departments available'}</option>
                    )}
                  </Form.Select>
                  
                  {/* Error or helper messages */}
                  {getFieldError('departmentId') && (
                    <div className="invalid-feedback d-block">
                      {getFieldError('departmentId')}
                    </div>
                  )}
                  
                  {!isDepartmentsLoading && Array.isArray(departments) && departments.length === 0 && (
                    <div className="d-flex align-items-center mt-2">
                      <span className="text-danger me-2">No departments found.</span>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={fetchDepartments}
                        className="d-flex align-items-center"
                      >
                        <span className="me-1">Retry</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                        </svg>
                      </Button>
                    </div>
                  )}
                </Form.Group>
              </div>
            </div>

            {/* Preview of marking schema */}
            {selectedCategory && (
              <div className="mt-4 p-3 bg-light rounded border">
                <h5 className="mb-3 text-primary">Marking Schema Preview</h5>
                <p className="text-muted mb-3">
                  <small>This is the default marking schema that will be applied based on the selected category.</small>
                </p>
                
                {previewComponents.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm" className="mb-0">
                      <thead className="bg-primary text-white">
                        <tr>
                          <th>Component</th>
                          <th>Type</th>
                          <th className="text-center">Max Marks</th>
                          <th className="text-center">Weightage (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewComponents.map((component, index) => {
                          // Check if this is the calculated internal total or external component
                          const isInternalTotal = component.componentType === 'internal-total';
                          const isExternal = component.name.toLowerCase().includes('external') || component.componentType === 'external';
                          
                          // Skip internal total for now - will render at the end
                          if (isInternalTotal) return null;
                          
                          return (
                            <tr key={index} className={isExternal ? 'table-warning' : ''}>
                              <td className="fw-bold">{component.name}</td>
                              <td>{isExternal ? 'External' : 'Internal'}</td>
                              <td className="text-center">{component.maxMarks || 0}</td>
                              <td className="text-center">{component.weightagePercent || 0}%</td>
                            </tr>
                          );
                        })}
                        
                        {/* Render separator row */}
                        <tr>
                          <td colSpan={4} className="p-0 border-bottom border-dark">
                            <div style={{ height: '3px' }} className="bg-light"></div>
                          </td>
                        </tr>
                        
                        {/* Render the internal total row */}
                        {previewComponents.filter(c => c.componentType === 'internal-total').map((component, index) => (
                          <tr key={`total-${index}`} className="table-primary fw-bold">
                            <td>{component.name}</td>
                            <td>Summary</td>
                            <td className="text-center">{component.maxMarks || 0}</td>
                            <td className="text-center">{component.weightagePercent || 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="info" className="mb-0">
                    No marking schema preview available for this category.
                  </Alert>
                )}
              </div>
            )}
          </Form>
        )}
      </CustomModal.Body>
      <CustomModal.Footer>
        {error && (
          <div className="w-100 mb-3">
            <Alert variant="danger" className="mb-0 py-2">
              {error}
            </Alert>
          </div>
        )}
        
        <div className="d-flex w-100 justify-content-between">
          <Button 
            variant="outline-secondary" 
            onClick={handleDialogClose} 
            className="px-4"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={loading || isAuthLoading} 
            className="px-4 d-flex align-items-center"
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{subjectToEdit ? 'Update Subject' : 'Create Subject'}</span>
            )}
          </Button>
        </div>
      </CustomModal.Footer>
    </CustomModal>
  );
};

export default AddEditSubjectModal; 
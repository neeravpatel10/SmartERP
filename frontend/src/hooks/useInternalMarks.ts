import { useState, useCallback, useRef } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Define API response type to fix TypeScript errors
interface ApiErrorResponse {
  success: boolean;
  message: string;
}

// Type definitions for our API responses
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Types for blueprint
export interface SubQuestion {
  id?: number;
  label: string;
  maxMarks: number;
  // Add index signature to allow string indexing for dynamic property access
  [key: string]: string | number | undefined;
}

export interface Question {
  questionNo: number;
  subs: SubQuestion[];
}

export interface Blueprint {
  id?: number;
  subjectId: number;
  cieNo: number;
  questions: Question[];
  createdBy?: number;
  createdAt?: string;
  subject?: {
    name: string;
    code: string;
  };
}

// Types for grid data
export interface Student {
  id: string; // Changed from number to string (using USN as ID)
  usn: string;
  name: string;
}

export interface Column {
  id: number;
  questionNo: number;
  label: string;
  maxMarks: number;
}

export interface Mark {
  subqId: number;
  marks: number | null;
}

export interface GridRow {
  studentId: string; // Changed from number to string (using USN)
  marks: Mark[];
}

export interface GridData {
  students: Student[];
  cols: Column[];
  rows: GridRow[];
}

// Type for the mark entry request
export interface MarkEntry {
  subqId: number;
  studentId: number;
  marks: number;
}

// Type for the blueprint payload
export interface BlueprintPayload {
  subjectId: number;
  cieNo: number;
  questions: Question[];
}

// Type for the save mark payload
export interface SaveMarkPayload {
  subqId: number;
  studentUsn: string; // Changed from studentId (number) to studentUsn (string)
  marks: number | null;
}

/**
 * Hook for interacting with the Internal Marks API
 */
export const useInternalMarks = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const pendingRequestRef = useRef<AbortController | null>(null);
  
  // Function to show notifications - wrapped in useCallback to avoid dependency issues
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    console.log(`Notification: ${message} (${type})`);
    // In a real implementation, this would use a notification system
  }, []);

  const createBlueprint = useCallback(async (blueprint: BlueprintPayload) => {
    try {
      setLoading(true);
      setError(null);
      
      // Cancel any pending requests to avoid race conditions
      if (pendingRequestRef.current) {
        pendingRequestRef.current.abort();
      }

      const controller = new AbortController();
      pendingRequestRef.current = controller;

      const response = await api.post('/marks/internal/blueprint', blueprint, {
        signal: controller.signal
      });

      pendingRequestRef.current = null;

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return null; // Request was aborted, no need to handle
      }

      // Handle specific error cases
      if (error.response?.status === 401) {
        navigate('/login');
        return null;
      }
      
      // Handle database schema errors
      if (error.response?.data?.message?.includes('Could not find mapping for model')) {
        console.warn('Database schema error:', error.response.data);
        setError('Database setup incomplete. Please check Prisma schema for InternalExamBlueprint model.');
        return null;
      }
      
      // Set general error message
      const message = error.response?.data?.message || 'Error creating blueprint';
      setError(message);
      
      throw error;
    } finally {
      setLoading(false);
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const getBlueprint = async (
    subjectId: number, 
    cieNo: number
  ): Promise<Blueprint | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<Blueprint>>(
        `/marks/internal/blueprint?subjectId=${subjectId}&cieNo=${cieNo}`
      );
      return response.data.data;
    } catch (err) {
      const error = err as AxiosError;
      
      // Handle common error cases
      if (error.response?.status === 404) {
        // It's a blueprint not found case - set a specific error for this
        const errorData = error.response.data as ApiErrorResponse;
        if (errorData?.message === 'Blueprint not found') {
          setError('Blueprint not found');
          console.log('Blueprint not found for subject', subjectId, 'and CIE', cieNo);
        }
        return null;
      }
      
      // Handle database schema errors
      if (error.response?.data && (error.response.data as ApiErrorResponse)?.message?.includes('Could not find mapping for model')) {
        console.warn('Database schema error:', error.response.data);
        setError('Database setup incomplete. Please check Prisma schema for InternalExamBlueprint model.');
        return null;
      }
      
      const message = (error.response?.data as ApiErrorResponse)?.message || 'Error fetching blueprint';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBlueprint = async (
    id: number, 
    blueprint: Blueprint
  ): Promise<Blueprint | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token directly from localStorage
      const token = localStorage.getItem('token');
      
      // Create headers with authorization token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      };
      
      console.log('Updating blueprint with token:', token ? 'Token present' : 'No token');
      
      const response = await api.put<ApiResponse<Blueprint>>(
        `/marks/internal/blueprint/${id}`, 
        blueprint,
        { headers: headers }
      );
      
      return response.data.data;
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error updating blueprint:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 401) {
        showNotification('Authentication error. Please log in again.', 'error');
        navigate('/login');
      }
      
      const message = (error.response?.data as ApiErrorResponse)?.message || 'Error updating blueprint';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getGridData = async (
    subjectId: number, 
    cieNo: number
  ): Promise<GridData | null> => {
    try {
      // Input validation first
      if (!subjectId || isNaN(Number(subjectId))) {
        console.error('Invalid subject ID:', subjectId);
        setError('Invalid subject ID');
        return null;
      }

      if (!cieNo || isNaN(Number(cieNo))) {
        console.error('Invalid CIE number:', cieNo);
        setError('Invalid CIE number');
        return null;
      }
      
      setLoading(true);
      setError(null);
      
      // Construct proper URL with explicit string for better error detection
      const url = `/marks/internal/grid?subjectId=${subjectId}&cieNo=${cieNo}`;
      console.log('Fetching grid data from:', url);
      
      // Explicitly set request configuration
      const response = await api.get<ApiResponse<GridData>>(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data) {
        console.error('Empty response data');
        setError('Received empty response from server');
        return null;
      }
      
      return response.data.data;
    } catch (err) {
      const error = err as AxiosError;
      console.error('Grid data fetch error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      const message = (error.response?.data as ApiErrorResponse)?.message || 'Error fetching grid data';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveSingleMark = useCallback(async ({ subqId, studentUsn, marks }: SaveMarkPayload) => {
    // Validate parameters to avoid invalid ID format errors
    if (isNaN(subqId) || !studentUsn) {
      showNotification('Invalid parameters for saving mark', 'error');
      return false;
    }
    
    // Only validate as number if marks is not null
    if (marks !== null && isNaN(marks)) {
      showNotification('Invalid mark value', 'error');
      return false;
    }

    try {
      const controller = new AbortController();
      
      // Get token directly from localStorage
      const token = localStorage.getItem('token');
      
      // Create headers with authorization token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      };
      
      console.log('Saving mark with token:', token ? 'Token present' : 'No token');
      console.log('Saving mark data:', { subqId, studentUsn, marks });
      
      const response = await api.post('/marks/internal/marks', {
        subqId,
        studentUsn,
        marks
      }, { 
        signal: controller.signal,
        headers: headers
      });
      
      if (response.data.success) {
        return true;
      } else {
        // If the request was not aborted but server returned success: false
        const errorMessage = response.data.message || 'Failed to save mark';
        showNotification(errorMessage, 'error');
        return false;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return false; // Request was aborted
      }

      if (error.response?.status === 401) {
        showNotification('Authentication error. Please log in again.', 'error');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save mark';
        console.error('Error saving mark:', error.response?.status, error.response?.data);
        showNotification(errorMessage, 'error');
      }
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, showNotification]);

  const downloadTemplate = async (subjectId: number, cieNo: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Using axios directly for blob response
      const response = await axios.get(
        `${api.defaults.baseURL}/marks/internal/template?subjectId=${subjectId}&cieNo=${cieNo}`,
        {
          responseType: 'blob',
          // Use headers that match the expected type
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `internal_marks_template_${subjectId}_${cieNo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      const error = err as AxiosError;
      const message = (error.response?.data as ApiErrorResponse)?.message || 'Error downloading template';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const uploadMarks = async (
    file: File, 
    subjectId: number, 
    cieNo: number
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post(
        `/marks/internal/upload?subjectId=${subjectId}&cieNo=${cieNo}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return true;
    } catch (err) {
      const error = err as AxiosError;
      const message = (error.response?.data as ApiErrorResponse)?.message || 'Error uploading marks';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    createBlueprint,
    getBlueprint,
    updateBlueprint,
    getGridData,
    saveSingleMark,
    downloadTemplate,
    uploadMarks
  };
};

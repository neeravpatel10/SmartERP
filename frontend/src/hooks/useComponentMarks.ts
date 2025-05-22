import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from '../utils/toast';

export type ComponentType = 'A1' | 'A2' | 'QZ' | 'SM';

export interface ComponentConfig {
  id: number;
  subjectId: number;
  component: ComponentType;
  maxMarks: number;
  attemptCount: number;
}

export interface ComponentMarksEntry {
  usn: string;
  name: string;
  marks: number | null;
  maxMarks: number;
}

export interface ComponentMarksGridData {
  data: ComponentMarksEntry[];
  pagination: {
    page: number;
    size: number;
    totalCount: number;
    totalPages: number;
  };
  maxMarks: number;
}

export interface ComponentMark {
  studentUsn: string;
  subjectId: number;
  component: ComponentType;
  attemptNo: number;
  marks: number;
}

export const useComponentMarks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gridData, setGridData] = useState<ComponentMarksGridData | null>(null);
  const [components, setComponents] = useState<ComponentConfig[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get all components configured for a subject
  const getSubjectComponents = useCallback(async (subjectId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/marks/components?subjectId=${subjectId}`);
      
      if (response.data?.success) {
        setComponents(response.data.data || []);
      } else {
        setError(response.data?.message || 'Failed to fetch components');
        setComponents([]);
      }
      
      return response.data?.data || [];
    } catch (err: any) {
      console.error('Error fetching subject components:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching components');
      setComponents([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get grid data for a specific component
  const getComponentGrid = useCallback(async (
    subjectId: number,
    component: ComponentType,
    attemptNo: number,
    page = 1,
    size = 50
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/marks/components/grid', {
        params: {
          subjectId,
          component,
          attemptNo,
          page,
          size
        }
      });
      
      if (response.data?.success) {
        setGridData(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to fetch grid data');
        setGridData(null);
      }
      
      return response.data?.data || null;
    } catch (err: any) {
      console.error('Error fetching component grid:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching grid data');
      setGridData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a single mark entry
  const updateMark = useCallback(async (entry: ComponentMark) => {
    try {
      setError(null);
      
      const response = await api.patch('/api/marks/components/entry', entry);
      
      if (response.data?.success) {
        toast.success('Mark updated successfully');
        return true;
      } else {
        setError(response.data?.message || 'Failed to update mark');
        toast.error(response.data?.message || 'Failed to update mark');
        return false;
      }
    } catch (err: any) {
      console.error('Error updating mark:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error updating mark';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  // Get the download URL for an Excel template
  const getTemplateUrl = useCallback((subjectId: number, component: ComponentType, attemptNo: number) => {
    return `/api/marks/components/template?subjectId=${subjectId}&component=${component}&attemptNo=${attemptNo}`;
  }, []);

  // Clear state when unmounting
  useEffect(() => {
    return () => {
      setComponents([]);
      setGridData(null);
      setError(null);
    };
  }, []);

  // Determine if user has edit permissions
  const canEdit = useCallback(() => {
    // Faculty (type 2) and Dept Admin (type 3) can edit
    return user?.loginType === 2 || user?.loginType === 3 || user?.loginType === 1;
  }, [user]);

  // Determine if user can export
  const canExport = useCallback(() => {
    // All except students can export
    return user?.loginType !== -1;
  }, [user]);

  return {
    loading,
    error,
    components,
    gridData,
    getSubjectComponents,
    getComponentGrid,
    updateMark,
    getTemplateUrl,
    canEdit,
    canExport
  };
};

export default useComponentMarks;

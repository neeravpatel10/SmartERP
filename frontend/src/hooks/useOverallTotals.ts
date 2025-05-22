import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export interface OverallTotalsEntry {
  usn: string;
  name: string;
  cieTotal: number;
  assignment: number;
  quiz: number;
  seminar: number;
  overallTotal: number;
}

export interface OverallTotalsGridData {
  subject: {
    id: number;
    code: string;
    name: string;
  };
  grid: OverallTotalsEntry[];
  pagination: {
    page: number;
    size: number;
    totalCount: number;
    totalPages: number;
  };
}

export const useOverallTotals = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gridData, setGridData] = useState<OverallTotalsGridData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the overall totals grid
  const getTotalsGrid = useCallback(async (
    subjectId: number,
    page = 1,
    size = 50
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/marks/components/totals/grid', {
        params: {
          subjectId,
          page,
          size
        }
      });
      
      if (response.data?.success) {
        setGridData(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to fetch totals grid data');
        setGridData(null);
      }
      
      return response.data?.data || null;
    } catch (err: any) {
      console.error('Error fetching overall totals:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching totals data');
      setGridData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get the export URL for the overall totals
  const getExportUrl = useCallback((subjectId: number, format: 'xlsx' | 'csv' | 'pdf' = 'xlsx') => {
    return `/api/marks/components/totals/export?subjectId=${subjectId}&format=${format}`;
  }, []);

  // Clear state when unmounting
  useEffect(() => {
    return () => {
      setGridData(null);
      setError(null);
    };
  }, []);

  // Determine if user can export
  const canExport = useCallback(() => {
    // All except students can export
    return user?.loginType !== -1;
  }, [user]);

  return {
    loading,
    error,
    gridData,
    getTotalsGrid,
    getExportUrl,
    canExport
  };
};

export default useOverallTotals;

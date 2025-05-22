import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export interface Subject {
  id: number;
  code: string;
  name: string;
  semester: number;
  departmentId: number;
  departmentName?: string;
}

const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchSubjects = useCallback(async (departmentId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try with the direct subjects endpoint first
      const apiUrl = departmentId
        ? `/api/subjects?departmentId=${departmentId}`
        : '/api/subjects';
      
      console.log('Fetching subjects from:', apiUrl);
      const response = await api.get(apiUrl);
      
      if (response.data?.success) {
        // Directly use subjects array
        const subjectsData = response.data.data?.subjects || response.data.data || response.data;
        console.log('Subjects data:', subjectsData);
        
        // Handle different API response formats
        if (Array.isArray(subjectsData)) {
          setSubjects(subjectsData as Subject[]);
        } else if (typeof subjectsData === 'object' && subjectsData !== null) {
          // Try to extract from common response patterns
          const extractedSubjects = subjectsData.subjects || subjectsData.data || [];
          setSubjects(Array.isArray(extractedSubjects) ? extractedSubjects : []);
        } else {
          setSubjects([]);
        }
      } else {
        // Fallback to faculty-subject-mapping only if needed
        console.log('Fallback to faculty-subject-mapping endpoint');
        try {
          const fallbackUrl = departmentId
            ? `/api/faculty-subject-mapping?departmentId=${departmentId}&active=all`
            : '/api/faculty-subject-mapping?active=all';
          
          const fallbackResponse = await api.get(fallbackUrl);
          
          if (fallbackResponse.data?.success && Array.isArray(fallbackResponse.data.data)) {
            // Extract unique subjects from mappings
            const mappedSubjects = fallbackResponse.data.data
              .filter((mapping: any) => mapping?.subject)
              .map((mapping: any) => mapping.subject);
            
            const uniqueSubjects = Array.from(
              new Map(mappedSubjects.map((item: any) => [item.id, item])).values()
            );
            setSubjects(uniqueSubjects as Subject[]);
          } else {
            setError('Failed to fetch subjects from both endpoints');
          }
        } catch (fallbackErr: any) {
          console.error('Error fetching subjects from fallback endpoint:', fallbackErr);
          setError('Failed to load subjects from any available endpoint');
        }
      }
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchSubjects();
    }
  }, [token, fetchSubjects]);

  return {
    subjects,
    loading,
    error,
    fetchSubjects
  };
};

export default useSubjects;

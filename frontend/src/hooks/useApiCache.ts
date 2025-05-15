import { useCallback, useRef } from 'react';
import api from '../utils/api';
import { createResourceCache } from '../utils/helpers';

/**
 * Hook to provide a cached API layer that minimizes redundant API calls
 * It automatically caches GET requests for better performance
 */
export function useApiCache() {
  // Create a resource cache that persists between renders
  const cacheRef = useRef(createResourceCache());
  
  const getCached = useCallback(async (url: string, params: any = {}, ttl: number = 120000) => {
    if (!url) {
      console.error('Invalid URL provided to useApiCache.getCached');
      throw new Error('URL is required for API requests');
    }
    
    const key = `${url}|${JSON.stringify(params)}`;
    try {
      return cacheRef.current.get(
        key,
        // Use regular get instead of getCached to avoid potential issues
        () => api.get(url, { params }),
        ttl
      );
    } catch (error) {
      console.error(`Error in useApiCache.getCached for ${url}:`, error);
      throw error;
    }
  }, []);
  
  return {
    getCached,
    invalidateCache: useCallback((url: string, params: any = {}) => {
      const key = `${url}|${JSON.stringify(params)}`;
      cacheRef.current.invalidate(key);
    }, []),
    clearCache: useCallback(() => {
      cacheRef.current.clear();
    }, [])
  };
}

export default useApiCache; 
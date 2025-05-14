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
    const key = `${url}|${JSON.stringify(params)}`;
    return cacheRef.current.get(
      key,
      () => api.getCached(url, { params }),
      ttl
    );
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
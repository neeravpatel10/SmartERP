import React, { createContext, useContext, ReactNode } from 'react';
import useApiCache from '../hooks/useApiCache';

type ApiCacheContextType = ReturnType<typeof useApiCache>;

// Create the context with a default value
const ApiCacheContext = createContext<ApiCacheContextType | null>(null);

interface ApiCacheProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the API cache context
 */
export const ApiCacheProvider: React.FC<ApiCacheProviderProps> = ({ children }) => {
  const apiCache = useApiCache();
  
  return (
    <ApiCacheContext.Provider value={apiCache}>
      {children}
    </ApiCacheContext.Provider>
  );
};

/**
 * Hook to use the API cache context
 */
export function useApi() {
  const context = useContext(ApiCacheContext);
  
  if (!context) {
    throw new Error('useApi must be used within an ApiCacheProvider');
  }
  
  return context;
}

export default ApiCacheContext; 
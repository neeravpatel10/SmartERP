import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAuth } from '../../contexts/AuthContext';

// Global object to store login type for components that can't access context
declare global {
  interface Window {
    __AUTH_DEBUG__: {
      loginType: number | null;
      isAdmin: boolean;
      isDeptAdmin: boolean;
      userId: number | null;
    };
  }
}

// Create global object if it doesn't exist
if (typeof window !== 'undefined') {
  window.__AUTH_DEBUG__ = window.__AUTH_DEBUG__ || {
    loginType: null,
    isAdmin: false,
    isDeptAdmin: false,
    userId: null
  };
}

/**
 * Helper component to ensure login type is available globally across the app
 * This addresses issues with components that can't directly access AuthContext
 */
const AuthTypeDebugger: React.FC = () => {
  const reduxAuth = useSelector((state: RootState) => state.auth);
  const { user, loginType, isAdmin, isDeptAdmin } = useAuth();

  // Update global object whenever auth state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use either context or Redux values, preferring context
      window.__AUTH_DEBUG__ = {
        loginType: loginType || reduxAuth.user?.loginType || null,
        isAdmin: isAdmin || reduxAuth.user?.loginType === 1 || false,
        isDeptAdmin: isDeptAdmin || reduxAuth.user?.loginType === 3 || false,
        userId: user?.id || reduxAuth.user?.id || null
      };
      
      console.log('Auth debug values updated:', window.__AUTH_DEBUG__);
    }
  }, [reduxAuth, user, loginType, isAdmin, isDeptAdmin]);

  // This component doesn't render anything
  return null;
};

/**
 * Helper function to get auth values for components that can't use hooks
 */
export const getAuthValues = () => {
  if (typeof window !== 'undefined') {
    return window.__AUTH_DEBUG__;
  }
  
  return {
    loginType: null,
    isAdmin: false,
    isDeptAdmin: false,
    userId: null
  };
};

export default AuthTypeDebugger; 
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { getCurrentUser } from '../store/slices/authSlice';
import { User as ReduxUser } from '../store/slices/authSlice';

// User role type
export type UserRole = 1 | 2 | 3 | -1;

// Define our User interface that's compatible with the Redux User
export interface User {
  id: number;
  username: string;
  email: string;
  role?: UserRole; // Make role optional since Redux User might not have it
  loginType: number;
  departmentId?: number | null;
  firstLogin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  loginType: number | null;
  isAdmin: boolean;
  isDeptAdmin: boolean;
  isFaculty: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  token: null,
  loginType: null,
  isAdmin: false,
  isDeptAdmin: false,
  isFaculty: false,
  login: () => {},
  logout: () => {}
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Get auth state from Redux
  const { user: reduxUser, token, loading } = useSelector(
    (state: RootState) => state.auth
  );
  const dispatch = useDispatch<any>(); // Use any for dispatch to avoid type issues

  // Map Redux user to our User interface
  const mapReduxUserToContextUser = (reduxUser: ReduxUser | null): User | null => {
    if (!reduxUser) return null;
    
    return {
      id: reduxUser.id,
      username: reduxUser.username,
      email: reduxUser.email,
      loginType: reduxUser.loginType,
      departmentId: reduxUser.department?.id,
      firstLogin: reduxUser.firstLogin
    };
  };

  // Initialize context state from Redux
  const [contextUser, setContextUser] = useState<User | null>(mapReduxUserToContextUser(reduxUser));
  const [contextToken, setContextToken] = useState<string | null>(token);
  const [loginType, setLoginType] = useState<number | null>(reduxUser?.loginType || null);

  // Sync context state with Redux whenever it changes
  useEffect(() => {
    console.log('AuthContext: Redux auth state changed', { 
      reduxUser, 
      loginType: reduxUser?.loginType 
    });
    
    const mappedUser = mapReduxUserToContextUser(reduxUser);
    
    if (JSON.stringify(mappedUser) !== JSON.stringify(contextUser)) {
      setContextUser(mappedUser);
      setLoginType(reduxUser?.loginType || null);
    }
    
    if (token !== contextToken) {
      setContextToken(token);
    }
    
    // If we have a token but no user, try to fetch the user
    if (token && !reduxUser && !loading) {
      console.log('AuthContext: Have token but no user, dispatching getCurrentUser');
      dispatch(getCurrentUser());
    }
  }, [reduxUser, token, loading, contextUser, contextToken, dispatch]);

  // Derived state for role-based checks
  const isAdmin = loginType === 1;
  const isDeptAdmin = loginType === 3;
  const isFaculty = loginType === 2;

  // These are kept for compatibility but actually use the Redux actions
  const login = (userData: User) => {
    setContextUser(userData);
    setLoginType(userData.loginType);
    setContextToken("dummy-token");
  };

  const logout = () => {
    setContextUser(null);
    setLoginType(null);
    setContextToken(null);
  };

  const value = {
    user: contextUser,
    token: contextToken,
    isAuthenticated: !!contextUser,
    loginType,
    isAdmin,
    isDeptAdmin,
    isFaculty,
    login,
    logout
  };

  // Debug output for auth context
  useEffect(() => {
    console.log('AuthContext value updated:', { 
      isAuthenticated: !!contextUser,
      userId: contextUser?.id,
      loginType,
      isAdmin,
      isDeptAdmin
    });
  }, [contextUser, loginType, isAdmin, isDeptAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 
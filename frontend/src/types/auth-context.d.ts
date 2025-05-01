declare module '../../contexts/AuthContext' {
  export type UserRole = 1 | 2 | 3 | -1;
  
  export interface User {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    loginType: number;
    departmentId?: number | null;
    firstLogin?: boolean;
  }

  export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading?: boolean;
    error?: string | null;
    login: (userData: User) => void;
    logout: () => void;
  }

  export const useAuth: () => AuthContextType;
} 
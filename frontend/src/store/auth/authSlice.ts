import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  passwordResetSent: boolean;
  passwordResetSuccess: boolean;
  accountUnlockSuccess: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface ChangePasswordCredentials {
  currentPassword: string;
  newPassword: string;
}

interface PasswordResetRequestPayload {
  email: string;
}

interface PasswordResetConfirmPayload {
  token: string;
  newPassword: string;
}

interface UnlockAccountPayload {
  userId: string;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  passwordResetSent: false,
  passwordResetSuccess: false,
  accountUnlockSuccess: false,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (credentials: ChangePasswordCredentials) => {
    try {
      const response = await api.post('/auth/change-password', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (payload: PasswordResetRequestPayload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/forgot-password', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to request password reset. Please try again.'
      );
    }
  }
);

export const confirmPasswordReset = createAsyncThunk(
  'auth/confirmPasswordReset',
  async (payload: PasswordResetConfirmPayload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/reset-password', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reset password. Please try again.'
      );
    }
  }
);

export const unlockAccount = createAsyncThunk(
  'auth/unlockAccount',
  async (payload: UnlockAccountPayload) => {
    try {
      const response = await api.post('/auth/unlock-account', payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      // Remove auth header
      delete api.defaults.headers.common['Authorization'];
      
      // Reset state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    resetError: (state) => {
      state.error = null;
    },
    resetPasswordResetStates: (state) => {
      state.passwordResetSent = false;
      state.passwordResetSuccess = false;
    },
    resetAccountUnlockState: (state) => {
      state.accountUnlockSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Change password cases
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        
        // If token is invalid, logout the user
        if (action.payload === 'Invalid token' || action.payload === 'Token expired') {
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      })
      
      // Request password reset cases
      .addCase(requestPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.passwordResetSent = false;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.loading = false;
        state.passwordResetSent = true;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.passwordResetSent = false;
      })
      
      // Confirm password reset cases
      .addCase(confirmPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.passwordResetSuccess = false;
      })
      .addCase(confirmPasswordReset.fulfilled, (state) => {
        state.loading = false;
        state.passwordResetSuccess = true;
      })
      .addCase(confirmPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.passwordResetSuccess = false;
      })
      
      // Unlock account cases
      .addCase(unlockAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.accountUnlockSuccess = false;
      })
      .addCase(unlockAccount.fulfilled, (state) => {
        state.loading = false;
        state.accountUnlockSuccess = true;
      })
      .addCase(unlockAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.accountUnlockSuccess = false;
      });
  }
});

export const { 
  logout, 
  resetError, 
  resetPasswordResetStates, 
  resetAccountUnlockState 
} = authSlice.actions;

export default authSlice.reducer; 
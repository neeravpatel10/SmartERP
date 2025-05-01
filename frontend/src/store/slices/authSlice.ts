import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface User {
  id: number;
  username: string;
  email: string;
  loginType: number;
  department?: any;
  firstLogin: boolean;
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

// Get token from localStorage
const storedToken = localStorage.getItem('token');

// Set the token on axios defaults immediately if available
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
  console.log('Auth slice initialized with token from localStorage');
}

const initialState: AuthState = {
  user: null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
  passwordResetSent: false,
  passwordResetSuccess: false,
  accountUnlockSuccess: false,
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      
      if (response.data.success) {
        const token = response.data.data.token;
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set auth header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Auth token set after login');
        
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Login failed');
      }
      return rejectWithValue('Network error. Please try again.');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      // Ensure the authorization header is set
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Auth token set for getCurrentUser request');
      
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      console.error('Error getting current user:', error);
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to get user');
      }
      return rejectWithValue('Network error. Please try again.');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      localStorage.removeItem('token');
      // Clear auth header
      delete axios.defaults.headers.common['Authorization'];
      console.log('Auth token removed on logout');
      return null;
    } catch (error: any) {
      return rejectWithValue('Failed to logout');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    passwords: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.post(
        `${API_URL}/auth/change-password`,
        passwords,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to change password');
      }
      return rejectWithValue('Network error. Please try again.');
    }
  }
);

// Request password reset (forgot password)
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, data);
      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to request password reset');
      }
      return rejectWithValue('Network error. Please try again.');
    }
  }
);

// Confirm password reset
export const confirmPasswordReset = createAsyncThunk(
  'auth/confirmPasswordReset',
  async (data: { token: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, data);
      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to reset password');
      }
      return rejectWithValue('Network error. Please try again.');
    }
  }
);

// Unlock user account
export const unlockAccount = createAsyncThunk(
  'auth/unlockAccount',
  async (data: { userId: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.post(
        `${API_URL}/admin/unlock-account`, 
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to unlock account');
      }
      return rejectWithValue('Network error. Please try again.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
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
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        console.log('login.fulfilled: Storing token:', action.payload.token ? 'Token Present' : 'Token MISSING!');
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        console.log('getCurrentUser.rejected: Attempting to remove token from localStorage');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        console.log('Auth token removed due to getCurrentUser rejection');
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });

    // Change password
    builder
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
      });
      
    // Request password reset
    builder
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
      });
      
    // Confirm password reset
    builder
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
      });
      
    // Unlock account
    builder
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
      });
  },
});

export const { resetError, resetPasswordResetStates, resetAccountUnlockState } = authSlice.actions;
export default authSlice.reducer; 
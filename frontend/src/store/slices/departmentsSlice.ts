import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '..';

export interface Department {
  id: string;
  name: string;
  code: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DepartmentsState {
  departments: Department[];
  currentDepartment: Department | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: DepartmentsState = {
  departments: [],
  currentDepartment: null,
  loading: false,
  error: null,
  success: false
};

// Get all departments
export const getDepartments = createAsyncThunk(
  'departments/getDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/departments');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
    }
  }
);

// Get department by ID
export const getDepartmentById = createAsyncThunk(
  'departments/getDepartmentById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/departments/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch department');
    }
  }
);

// Create department
export const createDepartment = createAsyncThunk(
  'departments/createDepartment',
  async (department: Omit<Department, 'id'>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/departments', department);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create department');
    }
  }
);

// Update department
export const updateDepartment = createAsyncThunk(
  'departments/updateDepartment',
  async (department: Department, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/departments/${department.id}`, department);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update department');
    }
  }
);

// Delete department
export const deleteDepartment = createAsyncThunk(
  'departments/deleteDepartment',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/departments/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete department');
    }
  }
);

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    resetSuccess: (state) => {
      state.success = false;
    },
    resetError: (state) => {
      state.error = null;
    },
    clearCurrentDepartment: (state) => {
      state.currentDepartment = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all departments
      .addCase(getDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(getDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get department by ID
      .addCase(getDepartmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDepartmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDepartment = action.payload;
      })
      .addCase(getDepartmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create department
      .addCase(createDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.departments.push(action.payload);
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Update department
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Update department in list if it exists
        const index = state.departments.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
        
        state.currentDepartment = action.payload;
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Delete department
      .addCase(deleteDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.departments = state.departments.filter(
          department => department.id !== action.payload
        );
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetSuccess, resetError, clearCurrentDepartment } = departmentsSlice.actions;

export const selectDepartments = (state: RootState) => state.departments.departments;
export const selectCurrentDepartment = (state: RootState) => state.departments.currentDepartment;
export const selectDepartmentsLoading = (state: RootState) => state.departments.loading;
export const selectDepartmentsError = (state: RootState) => state.departments.error;
export const selectDepartmentsSuccess = (state: RootState) => state.departments.success;

export default departmentsSlice.reducer; 
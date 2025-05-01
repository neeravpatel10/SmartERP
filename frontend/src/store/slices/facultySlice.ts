import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '..';

// Types
export interface Faculty {
  id: string;          // Assuming ID is a string from the backend
  name: string;        // Single name field as in backend
  prefix?: string;     // Adding prefix as per backend model
  email: string;
  phone?: string;
  dateOfBirth?: string | Date; // Date of Birth
  gender?: string;
  designation: string;
  yearOfJoining?: string;
  departmentId: number; // Assuming department ID is a number
  isActive?: boolean;
  userId?: number;     // Link to the user account
  qualification?: string;
  teachingExperience?: string;
  industryExperience?: string;
  permanentAddress?: string;
  presentAddress?: string;
  aicteId?: string;

  // Optional populated fields from backend
  department?: {
    id: number;
    name: string;
    code?: string;
  };
  user?: {
    id: number;
    username: string;
    isActive: boolean;
  };
}

interface FacultyState {
  facultyList: Faculty[];
  currentFaculty: Faculty | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  totalItems: number;
}

// Initial state
const initialState: FacultyState = {
  facultyList: [],
  currentFaculty: null,
  loading: false,
  error: null,
  success: false,
  totalItems: 0,
};

// --- Async Thunks ---

// Fetch all faculty with pagination and search
export const fetchFaculty = createAsyncThunk(
  'faculty/fetchFaculty',
  async (
    { page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string }, 
    { rejectWithValue }
  ) => {
    try {
      // Adjust the API endpoint as needed
      const response = await axios.get(`/faculty?page=${page}&limit=${limit}&search=${search}`); 
      // Assuming the backend returns { data: { faculty: [], pagination: { total: ... } } }
      // Adjust payload structure based on your actual API response
      return response.data.data; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch faculty');
    }
  }
);

// Fetch single faculty by ID
export const fetchFacultyById = createAsyncThunk(
  'faculty/fetchFacultyById',
  async (facultyId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/faculty/${facultyId}`);
      return response.data.data; // Assuming response.data.data contains the faculty object
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch faculty details');
    }
  }
);

// Create new faculty
export const createFaculty = createAsyncThunk(
  'faculty/createFaculty',
  async (facultyData: Omit<Faculty, 'id'>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/faculty', facultyData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create faculty');
    }
  }
);

// Update faculty
export const updateFaculty = createAsyncThunk(
  'faculty/updateFaculty',
  async (facultyData: Partial<Faculty> & { id: string }, { rejectWithValue }) => {
    try {
      const { id, ...updateData } = facultyData;
      const response = await axios.put(`/faculty/${id}`, updateData);
      return response.data.data; // Assuming response.data.data contains the updated faculty object
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update faculty');
    }
  }
);

// Delete faculty
export const deleteFaculty = createAsyncThunk(
  'faculty/deleteFaculty',
  async (facultyId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/faculty/${facultyId}`);
      return facultyId; // Return the ID of the deleted faculty
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete faculty');
    }
  }
);

// --- Slice Definition ---

const facultySlice = createSlice({
  name: 'faculty',
  initialState,
  reducers: {
    resetFacultySuccess: (state) => {
      state.success = false;
    },
    resetFacultyError: (state) => {
      state.error = null;
    },
    clearCurrentFaculty: (state) => {
      state.currentFaculty = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Faculty List
      .addCase(fetchFaculty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFaculty.fulfilled, (state, action) => {
        state.loading = false;
        // Adjust based on actual API response structure
        state.facultyList = action.payload.faculty || action.payload.facultyList || []; 
        state.totalItems = action.payload.pagination?.total || action.payload.totalItems || 0;
      })
      .addCase(fetchFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Faculty By ID
      .addCase(fetchFacultyById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentFaculty = null; // Clear previous while loading new one
      })
      .addCase(fetchFacultyById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFaculty = action.payload;
      })
      .addCase(fetchFacultyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Faculty
      .addCase(createFaculty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createFaculty.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Optionally add to list immediately or rely on re-fetch
        state.facultyList.push(action.payload);
        state.totalItems += 1;
      })
      .addCase(createFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      // Update Faculty
      .addCase(updateFaculty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateFaculty.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.facultyList.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.facultyList[index] = action.payload;
        }
        if (state.currentFaculty?.id === action.payload.id) {
          state.currentFaculty = action.payload;
        }
      })
      .addCase(updateFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      // Delete Faculty
      .addCase(deleteFaculty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteFaculty.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.facultyList = state.facultyList.filter(f => f.id !== action.payload);
        state.totalItems -= 1;
        if (state.currentFaculty?.id === action.payload) {
          state.currentFaculty = null;
        }
      })
      .addCase(deleteFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

// Export actions and reducer
export const { resetFacultySuccess, resetFacultyError, clearCurrentFaculty } = facultySlice.actions;
export default facultySlice.reducer;

// Selectors
export const selectAllFaculty = (state: RootState) => state.faculty.facultyList;
export const selectCurrentFaculty = (state: RootState) => state.faculty.currentFaculty;
export const selectFacultyLoading = (state: RootState) => state.faculty.loading;
export const selectFacultyError = (state: RootState) => state.faculty.error;
export const selectFacultySuccess = (state: RootState) => state.faculty.success;
export const selectFacultyTotalItems = (state: RootState) => state.faculty.totalItems; 
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '..';

// Types
export interface Student {
  usn: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  batchId: string;
  semester: number;
  department?: {
    id: string;
    name: string;
  };
  batch?: {
    id: string;
    name: string;
  };
}

interface StudentsState {
  students: Student[];
  currentStudent: Student | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  totalItems: number;
}

// Initial state
const initialState: StudentsState = {
  students: [],
  currentStudent: null,
  loading: false,
  error: null,
  success: false,
  totalItems: 0
};

// Get all students with pagination
export const fetchStudents = createAsyncThunk(
  'students/fetchStudents',
  async ({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/students?page=${page}&limit=${limit}&search=${search}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch students');
    }
  }
);

// Get student by USN
export const fetchStudentById = createAsyncThunk(
  'students/fetchStudentById',
  async (usn: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/students/${usn}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch student');
    }
  }
);

// Create new student
export const createStudent = createAsyncThunk(
  'students/createStudent',
  async (student: Omit<Student, 'id'>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/students', student);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create student');
    }
  }
);

// Update student
export const updateStudent = createAsyncThunk(
  'students/updateStudent',
  async (student: Partial<Student> & { usn: string }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/students/${student.usn}`, student);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update student');
    }
  }
);

// Delete student
export const deleteStudent = createAsyncThunk(
  'students/deleteStudent',
  async (usn: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/students/${usn}`);
      return usn;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete student');
    }
  }
);

// Bulk upload students
export const bulkUploadStudents = createAsyncThunk(
  'students/bulkUpload',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/students/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload students');
    }
  }
);

// Download student template
export const downloadTemplate = createAsyncThunk(
  'students/downloadTemplate',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/students/template', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to download template');
    }
  }
);

// Create the slice
const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    resetSuccess: (state) => {
      state.success = false;
    },
    resetError: (state) => {
      state.error = null;
    },
    clearCurrentStudent: (state) => {
      state.currentStudent = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get students
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.students;
        state.totalItems = action.payload.totalItems;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get student by USN
      .addCase(fetchStudentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStudent = action.payload;
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create student
      .addCase(createStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.students.push(action.payload);
        state.totalItems += 1;
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Update student
      .addCase(updateStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Update student in list if it exists
        const index = state.students.findIndex(s => s.usn === action.payload.usn);
        if (index !== -1) {
          state.students[index] = action.payload;
        }
        
        state.currentStudent = action.payload;
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Delete student
      .addCase(deleteStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.students = state.students.filter(student => student.usn !== action.payload);
        state.totalItems -= 1;
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Bulk upload students
      .addCase(bulkUploadStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(bulkUploadStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // The response might contain information about how many students were created
        console.log('Bulk upload successful:', action.payload);
      })
      .addCase(bulkUploadStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Download template
      .addCase(downloadTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadTemplate.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(downloadTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetSuccess, resetError, clearCurrentStudent } = studentsSlice.actions;

export const selectStudents = (state: RootState) => state.students.students;
export const selectCurrentStudent = (state: RootState) => state.students.currentStudent;
export const selectStudentsLoading = (state: RootState) => state.students.loading;
export const selectStudentsError = (state: RootState) => state.students.error;
export const selectStudentsSuccess = (state: RootState) => state.students.success;
export const selectStudentsTotalItems = (state: RootState) => state.students.totalItems;

export default studentsSlice.reducer; 
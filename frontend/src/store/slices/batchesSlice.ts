import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '..';

export interface Batch {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BatchesState {
  batches: Batch[];
  currentBatch: Batch | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: BatchesState = {
  batches: [],
  currentBatch: null,
  loading: false,
  error: null,
  success: false
};

// Get all batches
export const getBatches = createAsyncThunk(
  'batches/getBatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/batches');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch batches');
    }
  }
);

// Get batch by ID
export const getBatchById = createAsyncThunk(
  'batches/getBatchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/batches/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch batch');
    }
  }
);

// Create batch
export const createBatch = createAsyncThunk(
  'batches/createBatch',
  async (batch: Omit<Batch, 'id'>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/batches', batch);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create batch');
    }
  }
);

// Update batch
export const updateBatch = createAsyncThunk(
  'batches/updateBatch',
  async (batch: Batch, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/batches/${batch.id}`, batch);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update batch');
    }
  }
);

// Delete batch
export const deleteBatch = createAsyncThunk(
  'batches/deleteBatch',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/batches/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete batch');
    }
  }
);

const batchesSlice = createSlice({
  name: 'batches',
  initialState,
  reducers: {
    resetSuccess: (state) => {
      state.success = false;
    },
    resetError: (state) => {
      state.error = null;
    },
    clearCurrentBatch: (state) => {
      state.currentBatch = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all batches
      .addCase(getBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = action.payload;
      })
      .addCase(getBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get batch by ID
      .addCase(getBatchById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBatchById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBatch = action.payload;
      })
      .addCase(getBatchById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create batch
      .addCase(createBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.batches.push(action.payload);
      })
      .addCase(createBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Update batch
      .addCase(updateBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Update batch in list if it exists
        const index = state.batches.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.batches[index] = action.payload;
        }
        
        state.currentBatch = action.payload;
      })
      .addCase(updateBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Delete batch
      .addCase(deleteBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.batches = state.batches.filter(
          batch => batch.id !== action.payload
        );
      })
      .addCase(deleteBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetSuccess, resetError, clearCurrentBatch } = batchesSlice.actions;

export const selectBatches = (state: RootState) => state.batches.batches;
export const selectCurrentBatch = (state: RootState) => state.batches.currentBatch;
export const selectBatchesLoading = (state: RootState) => state.batches.loading;
export const selectBatchesError = (state: RootState) => state.batches.error;
export const selectBatchesSuccess = (state: RootState) => state.batches.success;

export default batchesSlice.reducer; 
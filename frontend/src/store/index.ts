import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import studentsReducer from './slices/studentsSlice';
import departmentsReducer from './slices/departmentsSlice';
import batchesReducer from './slices/batchesSlice';
import adminUsersReducer from './admin/usersSlice';
import facultyReducer from './slices/facultySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    students: studentsReducer,
    departments: departmentsReducer,
    batches: batchesReducer,
    adminUsers: adminUsersReducer,
    faculty: facultyReducer,
    // Add other reducers here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
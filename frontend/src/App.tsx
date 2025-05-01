import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import './utils/theme.ts'; // Import theme configuration
import axios from 'axios';

// Layouts
import AuthLayout from './components/layouts/AuthLayout';
import MainLayout from './components/layouts/MainLayout';

// Pages
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
// Uncomment and add imports for Students and Faculty
// import Students from './pages/students/Students'; // Removing unused import
import StudentDetail from './pages/students/StudentDetail';
import FacultyList from './pages/faculty/Faculty'; // Updated import
import Attendance from './pages/attendance/Attendance';
import AttendanceSession from './pages/attendance/AttendanceSession';
import CreateAttendanceSession from './pages/attendance/CreateAttendanceSession';
import CreateBatchSession from './pages/attendance/CreateBatchSession';
import AttendanceAlertsPage from './pages/attendance/AttendanceAlerts';
import StudentAttendance from './pages/attendance/StudentAttendance';
import ComponentConfig from './pages/marks/ComponentConfig';
import MarkEntry from './pages/marks/MarkEntry';
import Marks from './pages/marks/Marks';
import Components from './pages/marks/Components';
import SubjectComponents from './pages/marks/SubjectComponents';
// import ExamComponent from './pages/marks/ExamComponent';
import SubjectResults from './pages/results/SubjectResults';
import StudentResults from './pages/results/StudentResults';
import Departments from './pages/departments/Departments';
import DepartmentBatches from './pages/departments/Batches';
import AllBatches from './pages/batches/Batches';
import StudentProfile from './pages/profile/StudentProfile';
import AuditLogs from './pages/admin/AuditLogs';
import UnlockAccount from './pages/admin/UnlockAccount';
import UserList from './pages/admin/UserList';
import UserRegistration from './pages/admin/UserRegistration';
import UserProfileEdit from './pages/admin/UserProfileEdit';

// Subject routes
import SubjectList from './components/subjects/SubjectList';
import SubjectDetail from './components/subjects/SubjectDetail';
import FacultySubjectMappingPage from './pages/subjects/FacultySubjectMappingPage';

// Student pages
import StudentsList from './pages/students/StudentsList';
import StudentForm from './pages/students/StudentForm';

// Faculty pages (Add import for FacultyForm)
import FacultyForm from './pages/faculty/FacultyForm';

// Import Google Fonts in index.html or add this if using a CSS import approach
// Add this to your public/index.html in the <head> section:
// <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: number[]; // Add optional requiredRoles prop
}

// Protected route component
const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRoles && user && !requiredRoles.includes(user.loginType)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);
  
  // Set up authentication on app start
  useEffect(() => {
    // Check if we have a token and make sure it's set in axios
    const token = localStorage.getItem('token');
    if (token) {
      console.log('App: Setting global axios auth header on app start');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try to get the current user data
      dispatch(getCurrentUser());
    }
  }, [dispatch]);
  
  // Log authentication state for debugging
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, loading, userExists: !!user });
  }, [isAuthenticated, loading, user]);

  // First login route (forces password change)
  const FirstLoginRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);

    if (loading) return <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b50900] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>;
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (user?.firstLogin) {
      return <Navigate to="/change-password" replace />;
    }

    return <>{children}</>;
  };

  // Super Admin route guard
  const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);

    if (loading) return <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b50900] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>;
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (user?.firstLogin) {
      return <Navigate to="/change-password" replace />;
    }

    // Log state before checking role
    console.log('[SuperAdminRoute] Check:', { loading, isAuthenticated, userId: user?.id, loginType: user?.loginType });

    // Check if user is a super admin (loginType === 1)
    if (user?.loginType !== 1) {
      console.log('[SuperAdminRoute] Redirecting: User is not Super Admin or user data unavailable.');
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  };

  // Protected Layout component that wraps all authenticated routes
  const ProtectedLayout = () => {
    return (
      <FirstLoginRoute>
        <MainLayout>
          <Outlet />
        </MainLayout>
      </FirstLoginRoute>
    );
  };

  return (
    <Router>
      <div className="font-sans min-h-screen bg-gray-50">
        <Routes>
          {/* Auth routes - Outside MainLayout */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <AuthLayout>
                  <Login />
                </AuthLayout>
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <AuthLayout>
                  <ForgotPassword />
                </AuthLayout>
              )
            }
          />
          <Route
            path="/reset-password"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <AuthLayout>
                  <ResetPassword />
                </AuthLayout>
              )
            }
          />
          <Route
            path="/change-password"
            element={
              isAuthenticated ? <AuthLayout><ChangePassword /></AuthLayout> : <Navigate to="/login" replace />
            }
          />

          {/* Root route redirect */}
          <Route 
            path="/" 
            element={
              loading ? (
                <div>Loading...</div>
              ) : isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Protected Application Routes nested under ProtectedLayout */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Student Management Routes */}
            <Route path="/students">
              <Route index element={
                <ProtectedRoute requiredRoles={[1, 3]}>
                  <StudentsList />
                </ProtectedRoute>
              } />
              <Route path="add" element={
                <ProtectedRoute requiredRoles={[1, 3]}>
                  <StudentForm mode="create" />
                </ProtectedRoute>
              } />
              <Route path="edit/:usn" element={
                <ProtectedRoute requiredRoles={[1, 3]}>
                  <StudentForm mode="edit" />
                </ProtectedRoute>
              } />
              <Route path=":usn" element={
                <ProtectedRoute requiredRoles={[1, 2, 3]}>
                  <StudentDetail />
                </ProtectedRoute>
              } />
            </Route>

            {/* Student Profile Route - Only for students */}
            <Route path="/profile" element={
              <ProtectedRoute requiredRoles={[-1]}>
                <StudentProfile />
              </ProtectedRoute>
            } />

            {/* Faculty Management Routes */}
            <Route path="/faculty">
              <Route index element={
                <ProtectedRoute requiredRoles={[1, 3]}>
                  <FacultyList />
                </ProtectedRoute>
              } />
              <Route path="add" element={
                <ProtectedRoute requiredRoles={[1, 3]}>
                  <FacultyForm mode="create" />
                </ProtectedRoute>
              } />
              <Route path="edit/:id" element={
                <ProtectedRoute requiredRoles={[1, 3]}>
                  <FacultyForm mode="edit" />
                </ProtectedRoute>
              } />
            </Route>

            {/* Subject Routes */}
            <Route path="/subjects">
              <Route index element={
                <ProtectedRoute requiredRoles={[1, 2, 3]}>
                  <SubjectList />
                </ProtectedRoute>
              } />
              <Route path="create" element={
                <ProtectedRoute requiredRoles={[1, 3]}>
                  <SubjectDetail />
                </ProtectedRoute>
              } />
              <Route path=":id" element={
                <ProtectedRoute requiredRoles={[1, 2, 3]}>
                  <SubjectDetail />
                </ProtectedRoute>
              } />
            </Route>

            {/* Department & Batch Routes */}
            <Route path="/departments" element={
              <ProtectedRoute requiredRoles={[1]}>
                <Departments />
              </ProtectedRoute>
            } />
            <Route path="/departments/:id/batches" element={
              <ProtectedRoute requiredRoles={[1, 3]}>
                <DepartmentBatches />
              </ProtectedRoute>
            } />
            <Route path="/batches" element={
              <ProtectedRoute requiredRoles={[1, 3]}>
                <AllBatches />
              </ProtectedRoute>
            } />

            {/* Subject Routes */}
            <Route path="/subject-mappings" element={<ProtectedRoute requiredRoles={[1, 3]}><FacultySubjectMappingPage /></ProtectedRoute>} />

            {/* Attendance Routes */}
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/attendance/sessions/new" element={<ProtectedRoute requiredRoles={[2]}><CreateAttendanceSession /></ProtectedRoute>} />
            <Route path="/attendance/sessions/batch/new" element={<ProtectedRoute requiredRoles={[2]}><CreateBatchSession /></ProtectedRoute>} />
            <Route path="/attendance/sessions/:id" element={<AttendanceSession />} />
            <Route path="/attendance/alerts" element={<ProtectedRoute requiredRoles={[1, 2, 3]}><AttendanceAlertsPage /></ProtectedRoute>} />
            <Route path="/attendance/student/:usn" element={<StudentAttendance />} />

            {/* Marks & Results Routes */}
            <Route path="/marks" element={<Marks />} />
            <Route path="/marks/components" element={<ProtectedRoute requiredRoles={[1, 3]}><Components /></ProtectedRoute>} />
            <Route path="/marks/subjects/:subjectId/components" element={<SubjectComponents />} />
            <Route path="/marks/components/config/:componentId" element={<ProtectedRoute requiredRoles={[2]}><ComponentConfig /></ProtectedRoute>} />
            <Route path="/marks/entry/:sessionIdOrComponentId" element={<ProtectedRoute requiredRoles={[2]}><MarkEntry /></ProtectedRoute>} />
            <Route path="/results/subject/:subjectId" element={<SubjectResults />} />
            <Route path="/results/student/:usn" element={<StudentResults />} />

            {/* Admin Routes */}
            <Route path="/admin/users" element={<SuperAdminRoute><UserList /></SuperAdminRoute>} />
            <Route path="/admin/users/register" element={<SuperAdminRoute><UserRegistration /></SuperAdminRoute>} />
            <Route path="/admin/users/edit/:id" element={<SuperAdminRoute><UserProfileEdit /></SuperAdminRoute>} />
            <Route path="/admin/audit-logs" element={<SuperAdminRoute><AuditLogs /></SuperAdminRoute>} />
            <Route path="/admin/unlock-account" element={<SuperAdminRoute><UnlockAccount /></SuperAdminRoute>} />
            
            {/* Catch-all for unknown protected routes - maybe redirect to dashboard? */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* You might want a specific 404 page for non-auth, non-protected routes */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}

        </Routes>
      </div>
    </Router>
  );
};

export default App; 
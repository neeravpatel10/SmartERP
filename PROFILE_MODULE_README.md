# Profile Module Documentation

## Overview

The Profile Module provides a comprehensive UI for users to view and edit their profile information based on their role and permissions. It follows a tab-based layout with support for responsive design and is accessible via the `/profile` route for the user's own profile, and `/users/:id/profile` for admin access to other users' profiles.

## Features

- **Responsive Design**: Mobile-first approach with desktop breakpoint at 640px
- **Role-based permissions**: Different edit permissions based on user role (student, faculty, dept-admin, super-admin)
- **Tab-based Interface**: Basic, Contact, Academic, and Security tabs
- **Avatar Upload**: Drag & drop or click to browse, with progress indicator
- **Password Change**: Modal with password strength indicator
- **Form Validation**: Using yup and react-hook-form
- **Toast Notifications**: Success and error messages for user feedback

## Integration Guide

### 1. Add Routes to the Router

Add the following routes to your application's router configuration:

```tsx
// In your router config file (e.g., src/routes/index.tsx)
import ProfilePage from '../pages/ProfilePage';

// Add these routes to your routes array
const routes = [
  // ... existing routes
  {
    path: '/profile',
    element: <ProfilePage />,
    protected: true, // Requires authentication
  },
  {
    path: '/users/:id/profile',
    element: <ProfilePage />,
    protected: true,
    roles: [1, 3], // Only for super-admin (1) and dept-admin (3)
  },
];
```

### 2. Add Navigation Links

Add navigation links to your application's sidebar or header:

```tsx
// In your Sidebar/NavBar component
<List>
  {/* ... existing nav items */}
  <ListItem component={Link} to="/profile">
    <ListItemIcon>
      <PersonIcon />
    </ListItemIcon>
    <ListItemText primary="Profile" />
  </ListItem>
  
  {/* Admin-only section */}
  {(isAdmin || isDeptAdmin) && (
    // User management section might include:
    <ListItem component={Link} to="/users">
      <ListItemIcon>
        <PeopleIcon />
      </ListItemIcon>
      <ListItemText primary="User Management" />
    </ListItem>
  )}
</List>
```

### 3. Add Toast Provider

Ensure the Toast provider is added to your application:

```tsx
// In your App.tsx or equivalent
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        {/* Your application */}
        <Router>
          <Routes>{/* ... */}</Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
```

## Backend API Requirements

The Profile module interacts with the following API endpoints:

1. `GET /api/me` - Get current user profile
2. `PUT /api/me` - Update current user profile
3. `GET /users/:id` - Get user profile by ID (admin only)
4. `PUT /users/:id` - Update user profile by ID (admin only)
5. `POST /change-password` - Change password
6. `POST /display-pic/upload` - Upload profile picture

All endpoints expect and return data with the following envelope structure:

```json
{
  "success": true|false,
  "message": "Success or error message",
  "data": { ... }
}
```

For detailed request/response formats, refer to the `api_examples.http` file.

## Dependencies

- React 18
- React Router v6
- Material UI v5
- React Hook Form
- Yup
- Axios

## File Structure

```
src/
├── components/
│   └── profile/
│       ├── ProfileTabs.tsx     - Main component with tab structure
│       ├── BasicTab.tsx        - Basic information tab
│       ├── ContactTab.tsx      - Contact information tab
│       ├── AcademicTab.tsx     - Academic information tab
│       ├── SecurityTab.tsx     - Security settings tab
│       ├── AvatarUploader.tsx  - Avatar upload component
│       └── PasswordModal.tsx   - Password change modal
├── pages/
│   └── ProfilePage.tsx         - Page component with routing
├── validation/
│   └── profile.ts              - Validation schemas
├── hooks/
│   └── useToast.ts             - Toast notification hook
└── __tests__/
    └── passwordValidator.test.ts - Unit test for password validator
```

## Permission Matrix

The following matrix shows which fields are editable based on user role:

| Field             | Student | Faculty | Dept-Admin | Super-Admin |
|-------------------|:-------:|:-------:|:----------:|:-----------:|
| name              |    ❌    |    ✅    |     ✅      |      ✅      |
| preferredName     |    ❌    |    ✅    |     ✅      |      ✅      |
| phone, address    |    ✅    |    ✅    |     ✅      |      ✅      |
| department        |    ❌    |    ❌    |     ✅      |      ✅      |
| batch, section    |    ❌    |    ❌    |     ✅      |      ✅      |
| subjectsTaught    |    -    |    ❌    |     ✅      |      ✅      |
| avatar            |    ✅    |    ✅    |     ✅      |      ✅      |
| loginEmail / USN  |    ❌    |    ❌    |     ❌      |      ✅      |

## Testing

Run unit tests for the password validator:

```bash
npm test -- --testPathPattern=passwordValidator
```

## Future Enhancements

1. Add profile completeness indicator
2. Implement activity log tracking for profile changes
3. Add two-factor authentication option in Security tab
4. Implement profile verification badge for faculty members

// Theme configuration as per college_erp_ui_design.md

import { createTheme } from '@mui/material/styles';

export const colors = {
  // Primary colors
  primary: {
    main: '#b50900', // Maroon
    light: '#d40a00',
    dark: '#940800',
    contrastText: '#ffffff',
  },
  
  // Accent colors - warm yellow/orange
  accent: {
    main: '#f5a623',
    light: '#ffc95c',
    dark: '#c17800',
    contrastText: '#000000',
  },
  
  // Neutral colors
  neutral: {
    white: '#ffffff',
    lightGray: '#f5f5f5',
    gray: '#e0e0e0',
    darkGray: '#9e9e9e',
    text: '#212121',
    textSecondary: '#757575',
  },
  
  // System colors
  system: {
    success: '#4caf50',
    info: '#2196f3',
    warning: '#ff9800',
    error: '#f44336',
  },
};

export const typography = {
  fontFamily: 'Poppins, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',  // 48px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  md: '0.25rem',  // 4px
  lg: '0.5rem',   // 8px
  xl: '1rem',     // 16px
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Role-specific UI configurations
export const roleConfig = {
  student: {
    navType: 'bottom',
    layout: 'card',
    navItems: [
      { label: 'Home', icon: '🏠', path: '/home' },
      { label: 'Marks', icon: '📊', path: '/marks' },
      { label: 'Attendance', icon: '📆', path: '/attendance' },
      { label: 'Notices', icon: '📣', path: '/notices' },
      { label: 'Profile', icon: '👤', path: '/profile' },
    ],
  },
  faculty: {
    navType: 'tabs',
    layout: 'dashboard',
    navItems: [
      { label: 'Dashboard', icon: '📊', path: '/dashboard' },
      { label: 'Marks', icon: '📝', path: '/marks' },
      { label: 'Attendance', icon: '📋', path: '/attendance' },
      { label: 'Uploads', icon: '📤', path: '/uploads' },
      { label: 'Mappings', icon: '🔄', path: '/mappings' },
    ],
  },
  deptAdmin: {
    navType: 'sidebar',
    layout: 'dashboard',
    navItems: [
      { label: 'Dashboard', icon: '📊', path: '/dashboard' },
      { label: 'Students', icon: '👨‍🎓', path: '/students' },
      { label: 'Faculty', icon: '👨‍🏫', path: '/faculty' },
      { label: 'Subjects', icon: '📚', path: '/subjects' },
      { label: 'Attendance', icon: '📋', path: '/attendance' },
      { label: 'Marks', icon: '📝', path: '/marks' },
    ],
  },
  superAdmin: {
    navType: 'sidebar',
    layout: 'dashboard',
    navItems: [
      { label: 'Dashboard', icon: '📊', path: '/dashboard' },
      { label: 'Departments', icon: '🏢', path: '/departments' },
      { label: 'Batches', icon: '👥', path: '/batches' },
      { label: 'Students', icon: '👨‍🎓', path: '/students' },
      { label: 'Faculty', icon: '👨‍🏫', path: '/faculty' },
      { label: 'Subjects', icon: '📚', path: '/subjects' },
      { label: 'Settings', icon: '⚙️', path: '/settings' },
    ],
  },
};

const muiTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.primary.contrastText,
    },
    secondary: {
      main: colors.accent.main,
      light: colors.accent.light,
      dark: colors.accent.dark,
      contrastText: colors.accent.contrastText,
    },
    error: { main: colors.system.error },
    warning: { main: colors.system.warning },
    info: { main: colors.system.info },
    success: { main: colors.system.success },
    background: {
      default: colors.neutral.lightGray,
      paper: colors.neutral.white,
    },
    text: {
      primary: colors.neutral.text,
      secondary: colors.neutral.textSecondary,
    },
  },
  typography: {
    fontFamily: typography.fontFamily,
  },
});

export default muiTheme; 
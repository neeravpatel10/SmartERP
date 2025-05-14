import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Navigation items based on user role
  const getNavItems = () => {
    const items = [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    ];

    // Add items based on role (loginType)
    if (user?.loginType === 1) {
      // Super Admin
      items.push(
        { to: '/departments', label: 'Departments', icon: '🏢' },
        { to: '/batches', label: 'Batches', icon: '👥' },
        { to: '/students', label: 'Students', icon: '👨‍🎓' },
        { to: '/students/login-management', label: 'Student Logins', icon: '🔑' },
        { to: '/faculty', label: 'Faculty', icon: '👨‍🏫' },
        { to: '/subjects', label: 'Subjects', icon: '📚' },
        { to: '/faculty-subject-mapping', label: 'Subject Mapping', icon: '🔄' },
        { to: '/settings', label: 'Settings', icon: '⚙️' },
      );
    } else if (user?.loginType === 3) {
      // Department Admin
      items.push(
        { to: '/students', label: 'Students', icon: '👨‍🎓' },
        { to: '/students/login-management', label: 'Student Logins', icon: '🔑' },
        { to: '/faculty', label: 'Faculty', icon: '👨‍🏫' },
        { to: '/subjects', label: 'Subjects', icon: '📚' },
        { to: '/faculty-subject-mapping', label: 'Subject Mapping', icon: '🔄' },
        { to: '/attendance', label: 'Attendance', icon: '📋' },
        { to: '/marks', label: 'Marks', icon: '📝' },
      );
    } else if (user?.loginType === 2) {
      // Faculty
      items.push(
        { to: '/faculty/dashboard', label: 'My Dashboard', icon: '🏠' },
        { to: '/subjects', label: 'My Subjects', icon: '📚' },
        { to: '/attendance', label: 'Attendance', icon: '📋' },
        { to: '/marks', label: 'Marks', icon: '📝' },
        { to: '/uploads', label: 'Resources', icon: '📤' },
        { to: '/timetable', label: 'Timetable', icon: '🗓️' },
      );
    } else if (user?.loginType === -1) {
      // Student
      items.push(
        { to: '/attendance/student', label: 'Attendance', icon: '📋' },
        { to: '/marks/student', label: 'Marks', icon: '📊' },
        { to: '/timetable', label: 'Timetable', icon: '🗓️' },
        { to: '/assignments', label: 'Assignments', icon: '📝' },
        { to: '/resources', label: 'Resources', icon: '📁' },
      );
    }

    return items;
  };

  const navItems = getNavItems();

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          College ERP
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.to}
            component={Link}
            to={item.to}
            selected={location.pathname === item.to}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navItems.find((item) => item.to === location.pathname)?.label || 'College ERP'}
          </Typography>
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">{user?.email}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); navigate('/change-password'); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Change Password
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); handleLogout(); }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout; 
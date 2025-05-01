import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: string;
  text?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

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
        { to: '/faculty', label: 'Faculty', icon: '👨‍🏫' },
        { to: '/subjects', label: 'Subjects', icon: '📚' },
        { to: '/faculty-subject-mapping', label: 'Subject Mapping', icon: '🔄' },
        { to: '/reports', label: 'Reports', icon: '📈' },
        { to: '/settings', label: 'Settings', icon: '⚙️' },
      );
    } else if (user?.loginType === 3) {
      // Department Admin
      items.push(
        { to: '/students', label: 'Students', icon: '👨‍🎓' },
        { to: '/faculty', label: 'Faculty', icon: '👨‍🏫' },
        { to: '/subjects', label: 'Subjects', icon: '📚' },
        { to: '/faculty-subject-mapping', label: 'Subject Mapping', icon: '🔄' },
        { to: '/attendance', label: 'Attendance', icon: '📋' },
        { to: '/marks', label: 'Marks', icon: '📝' },
        { to: '/reports', label: 'Reports', icon: '📈' },
      );
    } else if (user?.loginType === 2) {
      // Faculty
      items.push(
        { to: '/subjects', label: 'My Subjects', icon: '📚' },
        { to: '/attendance', label: 'Attendance', icon: '📋' },
        { to: '/marks', label: 'Marks', icon: '📝' },
        { to: '/uploads', label: 'Resources', icon: '📤' },
        { to: '/timetable', label: 'Timetable', icon: '🗓️' },
        { to: '/reports', label: 'Reports', icon: '📈' },
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

  const getQuickActions = () => {
    if (user?.loginType === 1) {
      return [
        { label: 'Add User', action: () => navigate('/users/add') },
        { label: 'System Status', action: () => navigate('/system-status') },
        { label: 'Backup Data', action: () => console.log('Backup initiated') },
      ];
    } else if (user?.loginType === 3) {
      return [
        { label: 'Add Student', action: () => navigate('/students/add') },
        { label: 'Add Subject', action: () => navigate('/subjects/add') },
        { label: 'View Reports', action: () => navigate('/reports') },
      ];
    } else if (user?.loginType === 2) {
      return [
        { label: 'Take Attendance', action: () => navigate('/attendance/new') },
        { label: 'Upload Marks', action: () => navigate('/marks/upload') },
        { label: 'View Schedule', action: () => navigate('/timetable') },
      ];
    }
    return [];
  };

  const navItems = getNavItems();
  const quickActions = getQuickActions();
  const isStudent = user?.loginType === -1;

  // Group nav items for better organization (for admin/faculty only)
  const getGroupedNavItems = () => {
    if (isStudent) return { main: navItems };
    
    if (user?.loginType === 1) {
      return {
        main: navItems.slice(0, 1),
        administration: [
          { to: '/departments', label: 'Departments', icon: '🏢' },
          { to: '/batches', label: 'Batches', icon: '👥' },
          { to: '/students', label: 'Students', icon: '👨‍🎓' },
          { to: '/faculty', label: 'Faculty', icon: '👨‍🏫' },
        ],
        academics: [
          { to: '/subjects', label: 'Subjects', icon: '📚' },
          { to: '/faculty-subject-mapping', label: 'Subject Mapping', icon: '🔄' },
          { to: '/reports', label: 'Reports', icon: '📈' },
        ],
        system: [
          { to: '/settings', label: 'Settings', icon: '⚙️' },
          { to: '/users', label: 'User Management', icon: '👥' },
          { to: '/audit-logs', label: 'Audit Logs', icon: '📋' },
        ]
      };
    } else if (user?.loginType === 3) {
      return {
        main: navItems.slice(0, 1),
        people: [
          { to: '/students', label: 'Students', icon: '👨‍🎓' },
          { to: '/faculty', label: 'Faculty', icon: '👨‍🏫' },
        ],
        academics: [
          { to: '/subjects', label: 'Subjects', icon: '📚' },
          { to: '/faculty-subject-mapping', label: 'Subject Mapping', icon: '🔄' },
          { to: '/attendance', label: 'Attendance', icon: '📋' },
          { to: '/marks', label: 'Marks', icon: '📝' },
          { to: '/reports', label: 'Reports', icon: '📈' },
        ]
      };
    } else if (user?.loginType === 2) {
      return {
        main: navItems.slice(0, 1),
        teaching: [
          { to: '/subjects', label: 'My Subjects', icon: '📚' },
          { to: '/attendance', label: 'Attendance', icon: '📋' },
          { to: '/marks', label: 'Marks', icon: '📝' },
        ],
        resources: [
          { to: '/uploads', label: 'Resources', icon: '📤' },
          { to: '/timetable', label: 'Timetable', icon: '🗓️' },
          { to: '/reports', label: 'Reports', icon: '📈' },
        ]
      };
    }
    
    return { main: navItems };
  };
  
  const groupedNavItems = getGroupedNavItems();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#b50900] text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-xl font-bold">AIET College ERP</span>
            </Link>
            {location.pathname !== '/dashboard' && (
              <span className="ml-4 text-lg">
                {user?.loginType === 1 ? 'Computer Science & Engineering' : user?.department?.name}
              </span>
            )}
          </div>
          
          {/* Center section with time and date - Hidden on mobile */}
          <div className="hidden md:flex flex-col items-center">
            <div className="text-sm font-semibold">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs opacity-80">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
          
          {/* Mobile menu button - not for students as they use bottom nav */}
          {!isStudent && (
            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          )}
          
          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button className="p-1 rounded-full hover:bg-white hover:bg-opacity-20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
            
            {/* Quick actions button */}
            {!isStudent && quickActions.length > 0 && (
              <div className="relative hidden md:block">
                <button 
                  className="p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          action.action();
                          setDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* User dropdown */}
            <div className="relative">
              <button 
                className="flex items-center space-x-1 bg-white bg-opacity-10 rounded-full px-2 py-1 hover:bg-opacity-20"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="w-7 h-7 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                  <span className="text-sm">{user?.username?.charAt(0)?.toUpperCase()}</span>
                </div>
                <span className="hidden md:inline">{user?.username}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-gray-500">
                      {user?.loginType === 1 ? 'Administrator' : 
                       user?.loginType === 3 ? 'Department Admin' : 
                       user?.loginType === 2 ? 'Faculty' : 'Student'}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/change-password"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Change Password
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu - not for students */}
      {!isStudent && isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-md absolute top-14 left-0 right-0 z-40">
          <nav className="px-4 py-2">
            <ul className="divide-y">
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`block py-3 px-4 ${
                      location.pathname === item.to ? 'text-[#b50900] font-medium' : 'text-gray-600'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 py-2 border-t">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 px-4 text-gray-600"
                >
                  ⚡ {action.label}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-2 border-t">
              <button
                onClick={handleLogout}
                className="block w-full text-left py-2 px-4 text-red-600 font-medium"
              >
                🚪 Logout
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className={`flex flex-1 ${isStudent ? 'pb-16' : ''}`}>
        {/* Sidebar navigation for Faculty/Admin (desktop) */}
        {!isStudent && (
          <aside className="hidden md:block w-64 bg-white border-r overflow-y-auto sticky top-14 h-[calc(100vh-3.5rem)]">
            {/* User info section */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#b50900] bg-opacity-20 flex items-center justify-center text-[#b50900]">
                  {user?.loginType === 1 ? '🧑‍💼' : 
                   user?.loginType === 3 ? '👨‍💼' : 
                   user?.loginType === 2 ? '👨‍🏫' : '👨‍🎓'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user?.username}</p>
                  <p className="text-xs text-gray-500">
                    {user?.loginType === 1 ? 'Administrator' : 
                     user?.loginType === 3 ? 'Department Admin' : 
                     user?.loginType === 2 ? 'Faculty' : 'Student'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Navigation items - grouped */}
            <nav className="p-4">
              {Object.entries(groupedNavItems).map(([group, items]) => (
                <div key={group} className="mb-6">
                  {group !== 'main' && (
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                      {group}
                    </h3>
                  )}
                  <ul className="space-y-1">
                    {items.map((item: NavItem) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className={`flex items-center px-2 py-2 text-sm rounded-md ${
                            location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
                              ? 'bg-[#b50900] bg-opacity-10 text-[#b50900] font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="mr-3 text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              
              {/* Quick actions section */}
              {quickActions.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className="w-full text-left px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md flex items-center"
                      >
                        <span className="mr-3 text-amber-500">⚡</span>
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </aside>
        )}

        {/* Page content */}
        <main className={`flex-1 ${isStudent ? 'p-3' : 'p-4 md:p-6'} overflow-auto`}>
          {/* For admins/faculty - add filter bar at top if needed */}
          {!isStudent && (user?.loginType === 1 || user?.loginType === 3) && location.pathname !== '/dashboard' && (
            <div className="mb-6 p-3 bg-white rounded-md shadow-sm">
              <div className="flex flex-wrap gap-3">
                <select className="form-select px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-[#b50900] focus:ring focus:ring-[#b50900] focus:ring-opacity-20">
                  <option>All Departments</option>
                  <option>Computer Science</option>
                  <option>Electronics</option>
                  <option>Mechanical</option>
                </select>
                <select className="form-select px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-[#b50900] focus:ring focus:ring-[#b50900] focus:ring-opacity-20">
                  <option>All Semesters</option>
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                  <option>Semester 3</option>
                </select>
                <select className="form-select px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-[#b50900] focus:ring focus:ring-[#b50900] focus:ring-opacity-20">
                  <option>All Sections</option>
                  <option>Section A</option>
                  <option>Section B</option>
                  <option>Section C</option>
                </select>
                <select className="form-select px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-[#b50900] focus:ring focus:ring-[#b50900] focus:ring-opacity-20">
                  <option>Current Academic Year</option>
                  <option>2022-2023</option>
                  <option>2021-2022</option>
                </select>
                <button className="ml-auto bg-gray-100 text-gray-600 px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors">
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className={isStudent ? '' : ''}>
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Student */}
      {isStudent && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
          <div className="flex justify-around">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center py-2 flex-1 ${
                  location.pathname === item.to || location.pathname.startsWith(`${item.to}/`) 
                    ? 'text-[#b50900]' 
                    : 'text-gray-600'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex flex-col items-center py-2 flex-1 text-gray-600"
            >
              <span className="text-2xl">👤</span>
              <span className="text-xs">Profile</span>
            </button>
          </div>
          
          {/* Mobile profile dropdown for students */}
          {isStudent && dropdownOpen && (
            <div className="absolute bottom-16 right-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setDropdownOpen(false)}
              >
                My Profile
              </Link>
              <Link
                to="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setDropdownOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      )}
    </div>
  );
};

export default MainLayout; 
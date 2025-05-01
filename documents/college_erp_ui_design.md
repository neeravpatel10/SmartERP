
# User Interface Design Document – College ERP (AIET)

## Layout Structure

### Students
- Bottom sticky nav bar: 🏠 Home | 📊 Marks | 📆 Attendance | 📣 Notices | 👤 Profile
- Responsive card layout
- Expandable tables for marks and attendance logs

### Faculty
- Tabbed layout: Marks | Attendance | Uploads | Mappings
- Calendar-based attendance view
- Upload/Download buttons for Excel

### Department Admin & HOD
- Sidebar navigation
- Top filters (semester, section, department)
- Exportable tables and modals

### Super Admin
- Sidebar + top nav combo
- Full control over users, departments, mappings
- Multi-department analytics with charts

## Core Components
- Role-based login
- Excel upload/download
- Chart.js for graphs
- Table filters and sorting
- Profile image upload

## Interaction Patterns
- Mobile-first design
- Collapsible menus
- Floating action buttons for uploads
- Modal dialogs for quick updates

## Visual Design Elements & Color Scheme
- Primary: Maroon (#b50900)
- Accent: Warm Yellow/Orange
- Neutral: Soft white and light gray
- Logo splash screen on login
- Clean black for text

## Mobile, Web App, Desktop Considerations
- Mobile optimized for students
- Touch-friendly forms for faculty
- Desktop dashboards for Admins

## Typography
- Font: Poppins or Inter
- Min size: 14px
- Bold section headers
- Line height optimized for readability

## Accessibility
- High contrast color ratios
- ARIA labels and alt tags
- Large click areas
- Keyboard accessible nav

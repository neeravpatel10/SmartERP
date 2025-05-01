
# 📘 Student Profile & Academic Progression – Feature Specification

## 🧭 Overview
This module provides a complete academic profile for each student, accessible by role. It includes semester-wise breakdowns of marks, attendance, and trends across academic years.

---

## ✅ Functional Behavior
- Semester-wise subject breakdown
- Attendance and marks trends visualized
- Profile data restricted by role-based access
- Only faculty and admins can download full student profile
- Students can view but **not download** their profile

---

## 🧑‍🎓 Profile Sections

### 1. Personal Information
- USN
- Full Name
- Email / Contact
- Department, Batch, Semester

### 2. Semester Tabs (e.g., Sem 1, Sem 2…)
- Table per subject:
  - Subject Code / Name
  - Marks: CIEs, Assignments, Labs
  - Final Marks
  - Attendance (session-wise and %)
- Graphs:
  - Line Chart: Total marks per semester
  - Bar Chart: Attendance % per subject

### 3. Cumulative Summary
- Overall Attendance Average
- Total Subjects Attempted
- Credits Earned (if enabled later)

---

## 🖼️ UI/UX – Profile Layout

### Left Sidebar:
- Profile photo + basic info
- Buttons (Admin/Faculty only): Download PDF

### Main Panel:
- Semester Tabs
- Expandable subject cards
  - Component-wise marks (CIE I, II, etc.)
  - Attendance pie/bar breakdown
- Responsive layout (mobile-friendly)

### Visual Widgets:
- 📈 Line Chart: Performance trend by semester
- 📊 Pie Chart: Subject-wise attendance share
- 📏 Progress bars: % marks and attendance per subject

---

## 🔐 Role Access
| Role         | Access Type                         |
|--------------|-------------------------------------|
| Student      | View own profile only (no download) |
| Faculty      | View full profile of assigned students |
| Dept Admin   | View + download all dept students   |
| Super Admin  | View + download all students        |

---

## 📤 Export Controls
- Only available for Admin & Faculty
- Format: PDF
- Includes:
  - Personal Info
  - Semester-wise breakdown
  - Component marks
  - Attendance stats
  - Graphs / summary charts

---

## 🧑‍💻 API Endpoints
| Endpoint                              | Method | Description                                |
|---------------------------------------|--------|--------------------------------------------|
| `/profile/:usn`                       | GET    | View student academic profile              |
| `/profile/:usn/download`              | GET    | PDF export (faculty/admin only)            |
| `/profile/:usn/semesters/:sem_number` | GET    | Fetch detailed semester-wise data          |

---

## 🔮 Future Enhancements
- GPA/CGPA summary
- Academic standing comparison chart
- Integration with skill/certification modules

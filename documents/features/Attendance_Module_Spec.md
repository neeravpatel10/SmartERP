# 📘 Attendance Management – Detailed Feature Specification

## 🧭 Overview
The Attendance Module allows faculty to record, update, and export student attendance based on subject and session. The system supports session-wise tracking, subject-scope enforcement, and separate calculations for theory and lab attendance.

---

## ✅ Core Functional Workflow
- Faculty selects subject and section via dropdown.
- Session is created for a specific date and type (`theory` or `lab`).
- Students are loaded automatically based on subject-faculty mapping.
- Attendance is recorded per session.
- Faculty can edit or delete any of their created sessions.
- Faculty can create or update **multiple sessions at once** through batch session creation and editing UI.

---

## 🧪 Attendance Calculation Logic

### 🧾 Session Types
| Type    | Duration Representation |
|---------|--------------------------|
| Theory  | 1 period per session     |
| Lab     | 1 session = 3 periods    |

### 📊 Attendance Formula
```
attendance_percentage = (total_periods_present / total_periods_conducted) * 100
```
- Calculated **separately** for theory and lab per subject
- Attendance threshold: **85%**
- Teachers (faculty) will be visually notified when a student drops below threshold; no notifications sent to students

---

## 👨‍🏫 Role-Based Behavior
| Role         | Permissions |
|--------------|-------------|
| Faculty      | Can create, edit, delete sessions for mapped subjects |
| Dept Admin   | Can view/export attendance in their department |
| Super Admin  | Full access and export |
| Student      | View own attendance, subject-wise breakdown only |

---

## 🖼️ UI/UX Design – Entry Page
### Faculty View:
- 📅 Date Picker (mandatory)
- 📘 Subject + Section Dropdown (filtered by mappings)
- ⏱️ Session Type selector: Theory / Lab
- 🔁 **Batch Period Selector**: Faculty can mark attendance for multiple periods in one go (e.g., periods 1 to 3 for lab)
- 🧑‍🎓 Student List (Auto-loaded)
- ✅ Present/Absent checkbox per student
- 🔢 Period Count: Defaults to 1 (Theory) or 3 (Lab)
- 💾 Save button

### Editing Page:
- Select session by subject and date
- Update attendance status
- Option to delete session
- Audit log for admin review
- 🔁 **Batch edit mode** for marking multiple periods with identical status

### Previous Sessions Display:
- 📜 Session history shown as a table or collapsible list
- Columns: Date, Session Type, Period Count, Subject Code & Name, Section, Present/Absent count
- ✏️ Edit and 🗑️ Delete icons next to each session
- 📅 Filters: Subject, Date Range, Session Type
- 🧾 Export option for individual session
- ✅ Support for multi-select batch actions (edit/delete/export)
- 🔍 Clicking on a session opens the full detail view for editing

### 📑 Multi-Session Entry/Edit (Batch Mode):
- Faculty can select a date range and assign common parameters (e.g., subject, session type)
- System auto-creates sessions for selected dates
- A table view shows all sessions for review and batch marking
- Useful for repeated lab blocks or predictable weekly schedules

### 📊 Faculty Dashboard Alert Widget:
- Shows a list of students below the 85% threshold for any subject handled by the faculty
- Widget displays: Student Name, USN, Subject, Current Attendance %
- Clicking on a student opens their attendance breakdown page
- Color-coded indicators (e.g., red if < 75%, yellow if between 75-85%)
- Sort and filter options by subject or semester

---

## 📤 Excel Upload Specification
- Format: One student per row
```
USN | Subject Code | Date | Present/Absent
```
- Auto-validates:
  - USN exists and mapped to subject
  - Subject is valid and assigned to faculty
  - Date is valid (no duplicates)

---

## 📅 Reporting & Admin Exports
- Dept Admin & SA can export:
  - Subject-wise session logs
  - Monthly attendance summary per subject
- Faculty can export their own subjects’ attendance data

---

## 🗃️ Table Definitions

### `attendance_sessions`
```sql
session_id INT PK,
subject_id INT,
faculty_id INT,
section VARCHAR(10),
date DATE,
session_type ENUM('theory', 'lab'),
period_count INT DEFAULT 1,
created_at TIMESTAMP
```

### `attendance_entries`
```sql
entry_id INT PK,
session_id INT,
student_id INT,
status ENUM('Present', 'Absent'),
recorded_by INT,
timestamp DATETIME
```

---

## 🧑‍💻 API Endpoints

### 🔹 Faculty
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/attendance/sessions` | POST | Create a new session |
| `/attendance/session/:id` | PUT | Edit a session |
| `/attendance/session/:id` | DELETE | Delete a session |
| `/attendance/session/:id` | GET | View attendance entries |
| `/attendance/upload` | POST | Bulk Excel upload |
| `/attendance/sessions/batch` | POST | Create multiple sessions at once |
| `/attendance/sessions/batch-edit` | PUT | Edit multiple sessions in batch mode |
| `/attendance/alerts/faculty` | GET | Fetch list of students below threshold by subject |

### 🔹 Students
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/attendance/student/:usn` | GET | View student-specific subject-wise breakdown |

### 🔹 Admins
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/attendance/overview` | GET | Department summary dashboard |
| `/attendance/export/subject/:id` | GET | Export CSV of attendance logs |
| `/attendance/export/monthly` | GET | Monthly subject-wise report |

---

## 🔮 Future Enhancements
- Add leave tagging (e.g., medical leave, holidays)

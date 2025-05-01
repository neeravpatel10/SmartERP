
# 📘 Access Control & Audit Logging – Feature Specification

## 🧭 Overview
This module enforces role-based access throughout the ERP and tracks user actions on sensitive data such as attendance, marks, profiles, and subject lifecycle changes.

---

## 🔐 Role-Based Access Matrix

| Role         | Permissions                                                                 |
|--------------|------------------------------------------------------------------------------|
| Student      | View only own profile, marks, attendance; cannot download                  |
| Faculty      | View and edit mapped students’ attendance, marks, and profile              |
| Dept Admin   | Full access within department: students, subjects, reports, attendance     |
| Super Admin  | Global access across all modules and departments                           |

---

## 👁️ Editable Permissions Summary

### Faculty Can Edit:
- Student profile (name, email/contact, batch, section)
- Marks (only for mapped subjects)
- Attendance sessions (only for assigned subjects)

### Dept Admin / Super Admin Can Edit:
- All profile fields
- Reassign faculty, lock subjects, override result
- Audit logs & lifecycle controls

---

## 📋 Modules with Access Restrictions
- Marks: Only mapped faculty can upload/edit
- Attendance: Only mapped faculty can modify sessions
- Results: Only Dept Admin/Super Admin can finalize or unlock
- Profile: Editable by assigned faculty or Admin roles

---

## 🛡️ Audit Logging System
All sensitive actions will be tracked in the `audit_log` table.

### Sample Tracked Actions:
| Action                    | Logged Fields                                                  |
|---------------------------|----------------------------------------------------------------|
| Marks upload              | user_id, subject_id, filename, timestamp, component_count      |
| Attendance entry/edit     | faculty_id, session_id, changed_fields, timestamp              |
| Subject lock/unlock       | subject_id, status, changed_by, timestamp                     |
| Result calculation        | subject_id, triggered_by, timestamp                            |
| Profile edit              | student_usn, modified_by, changed_fields, timestamp            |

---

## 🗃️ Database Table: `audit_log`
```sql
audit_id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT NOT NULL,
role ENUM('student', 'faculty', 'dept_admin', 'super_admin') NOT NULL,
action_type VARCHAR(100),
entity_type VARCHAR(100),
entity_id VARCHAR(100),
details TEXT,
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 🖼️ UI/UX Components

### Admin “Audit Viewer” Panel:
- Filters: User, Role, Module, Date Range
- Columns: Timestamp, Action, Entity, Performed By
- Export option (CSV/Excel)

### Inline Footnotes:
- Show last modified by + timestamp next to:
  - Subject lock status
  - Attendance sessions
  - Profile info

---

## 🧑‍💻 API Enhancements
| Endpoint                             | Method | Description                                  |
|--------------------------------------|--------|----------------------------------------------|
| `/audit-log`                         | GET    | View audit logs (Admin only)                 |
| `/audit-log/export`                  | GET    | Export logs based on filters                 |
| `/profile/edit/:usn`                 | PUT    | Edit profile (Faculty/Admin access only)     |
| `/attendance/session/edit/:id`       | PUT    | Edit session (log action)                    |
| `/marks/edit/:studentId/:subjectId`  | PUT    | Edit marks (log action)                      |
| `/subjects/lock/:id`                 | PUT    | Log subject status change                    |

---

## 🔮 Future Enhancements
- Real-time audit stream for Admin dashboard
- Alert rules (e.g., suspicious edits or bulk overrides)
- Role-based workflow approvals for sensitive updates

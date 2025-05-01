
# 📘 Subject Lifecycle Management – Feature Specification

## 🧭 Overview
This module integrates subject category assignment into the lifecycle, ensuring category-specific components are initialized at the draft stage.

This module governs the life cycle of a subject across its usage in the system. From initial creation to archival, each stage is controlled by role-based transitions to ensure accuracy, accountability, and audit readiness.

---

## 🔄 Lifecycle Stages

| Stage    | Description                                            |
| -------- | ------------------------------------------------------ |
| Draft    | Initial setup; components, faculty mapping pending     |
| Active   | Used in current semester; attendance and marks enabled |
| Locked   | No further edits to marks or attendance allowed        |
| Archived | Subject closed for semester; read-only reports only    |

---

## ✅ Functional Behavior
- Subject category (IPCC, PCCL, UHV, etc.) must be selected during the `draft` stage
- This drives component generation and attendance logic configuration

- Subjects begin in `draft` state after creation
- Mapped to faculty and components are added → status set to `active`
- Once attendance and marks entry are completed, status is changed to `locked`
- Post results declaration, subject is `archived` automatically

---

## 🔐 Role Permissions

| Role        | Permissions                                               |
| ----------- | --------------------------------------------------------- |
| Dept Admin  | Create subjects, update from draft to active, lock/unlock |
| Super Admin | Full override access for any department                   |
| Faculty     | View lifecycle stage, cannot change status                |

---

## 🖼️ UI/UX – Lifecycle Interface

### Subject Table View:
- Table with columns: Subject Name, Subject Code, Semester, Section, Category, Assigned Faculty, Status Badge
- Status shown with icons: 🟡 Draft | 🟢 Active | 🔒 Locked | 📦 Archived
- Action button (⋮) next to each subject with:
  - View Details
  - Change Status (Draft → Active, Active → Locked, etc.)
  - View Status Timeline

### Subject Creation / Edit Form:
- Form fields:
  - Subject Name
  - Subject Code
  - Semester, Section, Batch
  - Category Dropdown (IPCC, PCC, PROJ, etc.)
  - Max Marks or Credit Options
  - Assigned Faculty
- Validation checks:
  - Subject Code uniqueness per dept+semester
  - Required fields: subject_code, category, semester, section

### Status Transition Modal:
- Triggered when Admin clicks "Lock" or "Archive"
- Modal confirmation with status summary and warning:
  - "⚠️ Are you sure you want to lock this subject?"
  - Checklist:
    - ✅ Faculty assigned
    - ✅ All attendance sessions recorded
    - ✅ All IA components uploaded
    - ✅ No pending disputes
- Proceed / Cancel buttons

### Timeline Log View:
- Embedded under each subject detail view
- Display of lifecycle transitions:
  - Status → Timestamp → Changed By
  - Color-coded by stage
- Read-only to all roles except Super Admin
- During subject creation (`draft`), Admin selects **subject category** (dropdown: IPCC, PROJ, etc.)
- Category determines applicable mark components and session types
- Transition interface includes checklist:
  - ✅ All components assigned
  - ✅ Faculty mapped
  - ✅ Attendance sessions present
  - ✅ Marks uploaded
- Lock confirmation modal:
  - Displays warnings: e.g., "3 students missing marks", "Attendance incomplete"
- Timeline log visible per subject: status history + timestamps + actor

- Subject list includes a **status badge**: 🟡 Draft | 🟢 Active | 🔒 Locked | 📦 Archived
- Lifecycle transition options as dropdown actions per subject (visible to Admin only)
- Lock confirmation modal:
  - "You are about to lock this subject. All marks and attendance will become read-only. Proceed?"
- Color indicators:
  - Draft = yellow badge
  - Active = green badge
  - Locked = red/grey badge
  - Archived = faded with 📦 icon

---

## 🔁 Lifecycle Transitions

| From   | To       | Triggered By       |
| ------ | -------- | ------------------ |
| Draft  | Active   | Dept Admin         |
| Active | Locked   | Dept Admin / SA    |
| Locked | Active   | SA (override only) |
| Locked | Archived | Auto or Admin      |

---

## 🗃️ Database Updates

### Add to `subjects` table:
```sql
category_id INT NOT NULL, -- FK to subject_categories
status ENUM('draft', 'active', 'locked', 'archived') DEFAULT 'draft',
locked_at TIMESTAMP NULL,
archived_at TIMESTAMP NULL
```

### Add to `subject_status_log` (new table):
```sql
log_id INT PRIMARY KEY AUTO_INCREMENT,
subject_id INT,
status ENUM('draft', 'active', 'locked', 'archived'),
changed_by INT,
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 🧑‍💻 API Endpoints

| Endpoint                | Method | Role        | Description              |
| ----------------------- | ------ | ----------- | ------------------------ |
| `/subjects/lock/:id`    | PUT    | Admin / SA  | Lock a subject           |
| `/subjects/unlock/:id`  | PUT    | Super Admin | Unlock a locked subject  |
| `/subjects/archive/:id` | PUT    | Admin / SA  | Manually archive subject |
| `/subjects/status/:id`  | GET    | All roles   | View lifecycle status    |

---

## 📤 Audit & Reporting

- All lifecycle status changes logged with timestamp and actor
- Archived subjects automatically excluded from new uploads
- View-only mode enforced at database and UI layer

---

## 🔮 Future Enhancements

- Scheduled auto-locking at semester deadline
- Subject grouping by academic year for quicker lifecycle management
- Integration with accreditation export modules

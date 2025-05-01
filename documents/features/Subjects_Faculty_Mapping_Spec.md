# 📘 Subjects & Faculty Mapping – Detailed Feature Specification

## 🧭 Overview
This module governs how subjects are created, categorized, and assigned to faculty. It forms the foundation for attendance and marks modules, ensuring scope-restricted access and consistent data flow across semesters, batches, and departments.

---

## 🧩 Subject Creation – Managed by Department Admin

### ✅ Functional Behavior
| Action       | Role         | Description                                 |
|--------------|--------------|---------------------------------------------|
| Add Subject  | Dept Admin   | Adds subject scoped to dept/semester/section. Allowed only before subject-faculty mapping begins. |
| Edit Subject | Dept Admin   | Permissible before any attendance or marks entries exist. Post-mapping, only limited fields (like subject name or category) may be editable. |
| View Subject | All Roles    | Filtered by role, dept, semester, section, and batch. Faculty see only mapped subjects. |

### 📝 Required Fields
- `subject_name`: Full name of the subject (e.g., Data Structures)
- `subject_code`: Code as per university scheme (e.g., 18CS33)
- `semester`: The semester number (1–8)
- `section`: Class section (e.g., A, B, C)
- `batch_id`: Foreign key to batches table (e.g., 2021, 2022 batch)
- `dept_id`: Foreign key to departments
- `category_id`: Maps to types like IPCC, PCCL, UHV, etc.
- `scheme_year`: Year of scheme version (e.g., 2021 Scheme)
- `is_lab`: Boolean value indicating if the subject has lab component
- `credits`: Optional; can be displayed on report cards

### 🆔 Uniqueness Rule
```text
(subject_code + dept_id + semester + section + batch_id) → UNIQUE
```

### 🔁 Reuse & Scheme Handling
- Subject codes may **repeat across departments and schemes**
- Same subject allowed across multiple **departments** with isolation by context
- New schemes require **fresh entries** for the same subject name with scheme-year tracking
- Admin interface must allow filtering by scheme-year to prevent data collision

### 🗂️ Subject Categories & Component Relevance
Each category influences how marks and attendance behave:

| Category | Components | Attendance Scope |
|----------|------------|------------------|
| IPCC     | Theory + Lab (Integrated) | Both (separate sessions per type) |
| PCC      | Theory + Assignments      | Theory only |
| ESC/UHV  | Theory + Assignments      | Theory only |
| PCCL     | Lab only                  | Lab only |
| AEC/SEC  | Lab only                  | Lab only |
| PROJ     | Evaluation-based          | Optional, milestone-based |
| Mini Project | 5 Custom Components   | Optional |

---

## 👨‍🏫 Faculty–Subject Mapping

### ✅ Functional Behavior
| Action            | Role             | Description                                      |
|-------------------|------------------|--------------------------------------------------|
| Assign Faculty    | Dept Admin / SA  | Map subject to faculty with scope, semester, section, and batch_id |
| View Mappings     | Faculty/Admin    | Faculty sees only their assigned subjects; admins see all mappings |
| Remove Mapping    | Dept Admin / SA  | Allowed before attendance or marks entry. Post-entry, deactivation (`active = FALSE`) preferred over deletion |

### 💡 Mapping Rules
- One subject → **multiple faculty** allowed (e.g., lab/theory split)
- One faculty → may handle same subject across **multiple batches/sections**
- Mapping supports **component_scope** ENUM: `theory`, `lab`, `both`
- **Mid-semester reassignment** supported via `active = false` and remap to another faculty
- Use `is_primary = TRUE` to define lead faculty when multiple are mapped to the same scope

### 🔐 Role-Based Mapping View
| Role         | Access Scope                     |
|--------------|----------------------------------|
| Faculty      | Mapped subjects only             |
| Dept Admin   | Subjects and mappings within department |
| Super Admin  | Full access to all mappings      |

### 🧾 faculty_subject_mapping Table (Finalized Schema)
```sql
faculty_subject_mapping (
  id INT PRIMARY KEY AUTO_INCREMENT,
  faculty_id INT NOT NULL,               -- FK to faculty
  subject_id INT NOT NULL,               -- FK to subjects
  semester INT NOT NULL,
  section VARCHAR(10) NOT NULL,
  batch_id INT NOT NULL,
  component_scope ENUM('theory', 'lab', 'both') DEFAULT 'theory',
  is_primary BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## 📌 Attendance & Marks Integration

### 🔍 Scope Enforcement
- Only faculty mapped with appropriate `component_scope` can:
  - Mark attendance sessions
  - Upload component-wise marks
- Attendance sessions must track `session_type = theory/lab` for IPCC subjects
- Faculty not assigned to the relevant scope will see restricted options in the UI

### 🧪 Marks Upload Flow
- When uploading marks, faculty only see students from:
  - Their mapped subject
  - Matching semester, section, and batch
  - Components tagged for their `component_scope`
- IPCC subjects require split entry under theory and lab

---

## 📁 Supporting Tables
### `subjects`
```sql
subject_id, subject_code, name, dept_id, semester, section, batch_id, category_id, scheme_year, is_lab
```

### `subject_categories`
```sql
category_id, name (e.g., IPCC, PCC, PROJ, etc.)
```

### `faculty_subject_mapping`
```sql
faculty_id, subject_id, semester, section, batch_id, component_scope, is_primary, active
```

---

## 🧑‍💻 API Endpoint Specification

### 🔹 Subjects API
| Endpoint                | Method | Access Role       | Description                             |
|-------------------------|--------|-------------------|-----------------------------------------|
| `/subjects`             | GET    | All roles         | List subjects (role/dept scoped)         |
| `/subjects`             | POST   | Dept Admin        | Add a subject                           |
| `/subjects/:id`         | PUT    | Dept Admin        | Update a subject                        |
| `/subjects/:id`         | DELETE | Super Admin       | Delete a subject (soft/hard delete TBD) |
| `/subjects/:id`         | GET    | All roles         | View subject by ID                      |

### 🔹 Faculty-Subject Mapping API
| Endpoint                              | Method | Access Role       | Description                              |
|---------------------------------------|--------|-------------------|------------------------------------------|
| `/faculty-subject-mapping`            | GET    | Faculty/Admin     | List subject mappings                     |
| `/faculty-subject-mapping`            | POST   | Dept Admin / SA   | Assign subject to faculty                |
| `/faculty-subject-mapping/:id`        | DELETE | Dept Admin / SA   | Remove (soft) mapping                    |
| `/faculty-subject-mapping/active/:id` | PUT    | Dept Admin / SA   | Deactivate mapping (mid-sem change)      |
| `/faculty-subject-mapping/check`      | POST   | Internal Logic    | Validate before attendance/marks actions |

---

## 📘 UI/UX Expectations
- **Faculty dashboard**:
  - Show "Mapped Subjects" tab
  - Filter by semester, section, component_scope
- **Dept Admin panel**:
  - Bulk mapping view (checklist + dropdown)
  - Sort by subject, semester, faculty
  - Visual tag: Theory, Lab, or Both
- **System** auto-hides marks/attendance tabs unless mapping exists

---

## 🔮 Future Enhancements
- Auto-suggestion of faculty based on workload and subject expertise
- Admin-controlled mapping templates per department
- Version history tracking for mid-sem changes
- Visual flow chart of mappings for dashboard analytics

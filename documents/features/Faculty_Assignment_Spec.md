
# 📘 Faculty Assignment Dashboard – Feature Specification

## 🧭 Overview
This module allows Admins to assign faculty to subjects, sections, semesters, and batches. It supports both manual and bulk (Excel-based) assignment, with validation and role-based access control.

---

## ✅ Functional Behavior
- Admins can assign one or more faculty to a subject-section-semester-batch
- Mappings are validated to prevent conflicts or duplication
- Faculty can view but not edit their own assignments
- Bulk Excel upload is supported
- Exportable list of mappings for reporting or auditing

---

## 🔐 Role Access Matrix
| Role         | Access                                       |
|--------------|----------------------------------------------|
| Super Admin  | Manage assignments for all departments       |
| Dept Admin   | Manage only within their department          |
| Faculty      | View only their own subject mappings         |
| Student      | No access                                    |

---

## 🗂️ Data Model

### `faculty_subject_mapping`
Includes approval status:
```sql
mapping_id INT PRIMARY KEY,
status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
approved_by INT,
approved_at TIMESTAMP,
faculty_id INT NOT NULL,
subject_id INT NOT NULL,
section VARCHAR(10) NOT NULL,
semester INT NOT NULL,
batch_id INT NOT NULL,
created_at TIMESTAMP
```

---

## 📥 Bulk Assignment via Excel
- Admin can upload `.xlsx` with the following columns:
  ```text
  Faculty Email | Subject Code | Section | Semester | Batch Year
  ```
- System validates:
  - Faculty email exists and is mapped
  - Subject code is valid and belongs to department
  - No duplicate assignment for same subject-section-semester-batch
- Upload log viewable with errors (if any)

---

## 🖼️ UI/UX Expectations

### Admin View:
- Mapping table:
  - Subject | Section | Semester | Faculty | Batch | Mapped On
- Filters:
  - Department, Semester, Section, Faculty
- Add Mapping:
  - Modal with dropdowns for each field
- Bulk Upload:
  - Upload .xlsx file → preview table → Confirm → Success/Error display
- Export Mapping: Button to download filtered table as CSV/PDF

### Faculty View:
- Read-only list:
  - Subject, Section, Semester, Batch

---

## 🧑‍💻 API Endpoints
| Endpoint                         | Method | Description                             |
|----------------------------------|--------|-----------------------------------------|
| `/faculty-mapping`              | GET    | List all mappings                       |
| `/faculty-mapping`              | POST   | Create new mapping                      |
| `/faculty-mapping/bulk-upload`  | POST   | Upload Excel and assign in bulk         |
| `/faculty-mapping/:id`          | PUT    | Update mapping                          |
| `/faculty-mapping/:id`          | DELETE | Delete mapping                          |
| `/faculty-mapping/export`       | GET    | Export mapping report                   |

---

## 🔁 Approval Workflow
- All new or updated faculty-subject mappings require approval from the HOD (Dept Admin role)
- Mapping status: `Pending`, `Approved`, `Rejected`
- HOD Dashboard includes:
  - Pending requests with approve/reject buttons
  - Optional comment box for rejection reason
- Only `Approved` mappings are activated and visible to faculty
- All approval actions are logged with user and timestamp

---

## 🔮 Future Enhancements
- Faculty load dashboard (subjects per semester)
- Suggest least-loaded faculty for assignment
- Approval queue before mapping becomes active

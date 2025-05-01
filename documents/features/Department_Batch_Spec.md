
# 📘 Department & Batch Management – Feature Specification

## 🧭 Overview
This module enables creation and management of academic departments and batch years. It supports default semester tracking, archiving, and integration with subject mapping and student records.

---

## ✅ Functional Behavior
- Admins can create departments and assign HODs
- Dept Admins can manage batch year entries
- Batches track current semester and can auto-rollover (with approval)
- Archived batches cannot be assigned new subject mappings
- Dropdown filters (dept, batch, sem) enabled across modules

---

## 🧑‍💻 Role Access Matrix
| Role         | Access Level                      |
|--------------|-----------------------------------|
| Super Admin  | All departments + batch creation  |
| Dept Admin   | Own department's batch mgmt       |
| Faculty      | View assigned batch/subject info  |
| Student      | View own batch/sem info           |

---

## 🗂️ Data Model

### `departments`
```sql
department_id INT PRIMARY KEY,
name VARCHAR(100),
short_code VARCHAR(10),
hod_name VARCHAR(100),
created_at TIMESTAMP
```

### `batches`
```sql
batch_id INT PRIMARY KEY,
year INT NOT NULL,
dept_id INT NOT NULL,
current_semester INT DEFAULT 1,
auto_rollover BOOLEAN DEFAULT FALSE,
archived BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP
```

---

## 🔁 Semester Auto-Rollover (Optional)
- Controlled via `auto_rollover = TRUE` flag in batches table
- Triggered from Admin or Dept Admin panel at semester-end
- Requires approval before execution
- On trigger:
  - Semester number is incremented for the batch
  - Subject mappings and student academic tracking are updated
  - Restricted if batch is archived
- Audit log captures rollover action (timestamp + performed_by)

---

## 🖼️ UI/UX Expectations

### Admin View:
- Department list table with name, code, HOD
- Batch view:
  - Year | Dept | Current Sem | Auto-Rollover ON/OFF | Archive toggle
- Button to add department or batch
- Filters by dept, year, archive status

### Edit Forms:
- Department: name, short code, optional HOD name
- Batch: year, dept, starting semester, rollover toggle, archive checkbox
- Rollover button triggers confirmation modal: "Are you sure you want to promote this batch to the next semester?"

---

## 🔐 Archive Rule Logic
- Archived batches:
  - Cannot be assigned new subjects
  - Appear in filters but marked as [ARCHIVED]
  - Only view/export allowed (no edits)

---

## 🧑‍💻 API Endpoints
| Endpoint                     | Method | Description                          |
|------------------------------|--------|--------------------------------------|
| `/departments`              | GET    | List all departments                 |
| `/departments`              | POST   | Create new department                |
| `/batches`                  | GET    | List all batches (filterable)        |
| `/batches`                  | POST   | Create new batch                     |
| `/batches/:id/rollover`     | PUT    | Approve semester rollover            |
| `/batches/:id/archive`      | PUT    | Archive batch                        |

---

## 🔮 Future Enhancements
- Department KPI dashboard (e.g., pass %, avg marks)
- Auto-disable access for archived batch users
- Department logo, contact info


# 📘 Data Import, Export & Migration – Feature Specification

## 🧭 Overview
This module supports importing historical data from an old database and managing ongoing data exchange via Excel/CSV templates. It includes data transformation, validation, and mapping to the new ERP schema.

---

## ✅ Functional Scope
- One-time migration from legacy SQL database
- Excel-based import/export for key modules (marks, attendance, students, mappings)
- Field validation, duplicate detection, schema normalization

---

## 🔄 Migration from Old Database

### Process Flow:
1. Admin uploads `.sql` dump or old database export
2. Scripts extract and transform data
3. Map old tables → new schema (manual mapping JSON or script-based)
4. Insert into new ERP tables with validation

### Required Tables for Migration:
- `users`
- `students`
- `faculty`
- `department`
- `batches`

---

## 🧪 Data Transformation Rules
- Convert student IDs → `usn`
- Normalize subject codes across batch + dept
- Parse dates to consistent format
- Drop unused/archived entities
- Deduplicate where required (e.g., faculty, subjects)

---

## 📁 Excel Import Format (Ongoing)

### 1. Student Upload
```text
USN | Name | Email | Phone | Dept | Batch | Semester | Section
```

### 2. Marks Upload
```text
USN | Subject Code | CIE I | CIE II | Assignment | Lab CIE | Total
```

### 3. Attendance Upload
```text
USN | Subject Code | Date | Status (Present/Absent)
```

---

## 🖼️ UI Expectations
- Admin Import Console
  - Choose: SQL Import or Excel Import
  - Preview data before inserting
  - Show transformation results + validation issues
  - Export error log for correction

- Download Template Buttons
  - Per module (students, attendance, marks)
  - Includes sample rows + format guide

---

## 🧑‍💻 API Endpoints
| Endpoint                          | Method | Description                            |
|-----------------------------------|--------|----------------------------------------|
| `/import/sql/upload`             | POST   | Upload and process legacy `.sql` file  |
| `/import/excel/students`         | POST   | Upload new student Excel file          |
| `/import/excel/marks`            | POST   | Upload marks file                      |
| `/import/excel/attendance`       | POST   | Upload attendance file                 |
| `/import/errors/download`        | GET    | Download validation failure log        |

---

## 🔐 Role Access
| Role         | Access                                       |
|--------------|----------------------------------------------|
| Super Admin  | Full access to SQL and Excel imports         |
| Dept Admin   | Excel import only within department          |
| Faculty      | No import access                             |
| Student      | No access                                    |

---

## 🔮 Future Enhancements
- Google Sheets import connector
- Historical result report generator post-import
- Student ID mapping reference table with rollback option

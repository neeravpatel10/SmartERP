
# 📘 Final Result Calculation – Feature Specification

## 🧭 Overview
This module computes the final internal result of students per subject per semester. It combines IA marks, assignment scores, and attendance percentages. Eligibility checks are applied.

---

## ✅ Functional Behavior
- Final results = component-wise marks total
- Eligibility = attendance ≥ 85% (configurable)
- Calculation can be triggered per student, subject, or in bulk
- Result status (PASS/FAIL) is **not stored**, only total marks and attendance %

---

## 🔄 Calculation Logic
1. **Total Marks** = Sum of all `student_component_marks` per subject
2. **Attendance %** = Present Sessions / Total Sessions (from `attendance_entries`)

---

## 🔐 Role Access
| Role         | Access                                                                 |
|--------------|-------------------------------------------------------------------------|
| Faculty      | View final result of mapped students                                   |
| Dept Admin   | Trigger result calculation per subject / semester                      |
| Super Admin  | Bulk compute results across department                                 |
| Student      | View personal result and subject summary (locked subjects only)        |

---

## 🖼️ UI/UX – Final Result View

### For Dept Admin:
- Select filters: Department, Semester, Section, Subject
- View all students’ results in sortable table
- Batch recalculation option
- Export current filtered view (PDF, Excel)

### For Faculty:
- Subject selection dropdown auto-filters mapped subjects
- Student table with component-wise marks, attendance % and total
- Recalculate options visible only for mapped subjects
- Export available for individual or full subject data

### For Students:
- Dashboard with semester tabs (e.g., Semester 1, Semester 2)
- Card view or compact table:
  - Subject Code, Subject Name, Attendance %, Total Marks
- Progress bar showing marks earned out of max possible
- Color indicators (green/yellow/red) for attention
- Mobile responsive layout, export disabled

### For Faculty / Admin:
- Select: Subject + Section + Semester
- Table View:
| USN | Name | CIE I | CIE II | Assignment | Lab CIE | Attendance % | Total |
|-----|------|-------|--------|------------|---------|----------------|--------|
- 📊 Export Options: PDF / Excel
- 🔄 Buttons:
  - Recalculate Entire Subject
  - Recalculate for Individual Student

### For Students:
- Tabbed semester-wise report:
  - Subject | Marks | Attendance
- Progress bar + Total Summary Card (e.g., Total: 245 / 300)
- Locked view only – no edit

---

## 🗃️ Database Updates

### `marks` table:
```sql
attendance_percent DECIMAL(5,2),
is_finalized BOOLEAN DEFAULT FALSE,
calculated_on TIMESTAMP
```

---

## 🧑‍💻 API Endpoints
| Endpoint                                | Method | Description                              |
|-----------------------------------------|--------|------------------------------------------|
| `/results/calculate/:subject_id`        | POST   | Trigger result calculation for a subject |
| `/results/calculate/:subject_id/:usn`   | POST   | Recalculate result for specific student  |
| `/results/view/:subject_id`             | GET    | View all student results in subject      |
| `/results/student/:usn`                 | GET    | Student view of personal result          |

---

## 🔮 Future Enhancements
- Grading logic integration (A/B/C scale)
- GPA/CGPA tracking across semesters

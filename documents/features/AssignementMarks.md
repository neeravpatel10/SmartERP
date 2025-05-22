# Assignment & Quiz Marks Module Design

> **Scope:** End‑to‑end specification for recording and viewing non‑CIE components—Assignments, Quizzes, and Seminars—and exposing an Overall‑Total page that sums all components for each subject.

---

## 1  Component matrix

Each **subject** can have zero → N extra components, chosen from:

| Code | Label in UI  | Typical Max | Notes                                     |
| ---- | ------------ | ----------- | ----------------------------------------- |
| `A1` | Assignment 1 | 10          | Some subjects omit A2                     |
| `A2` | Assignment 2 | 10          | If present, best of A1/A2 counts in total |
| `QZ` | Quiz         | 5           | Quiz or mid‑semester test                 |
| `SM` | Seminar      | 5           | Presentation marks                        |

> **Mapping source:** A new table `subject_component_config` maps (subject\_id → component\_code → max\_marks). Dept‑Admin sets this once at semester start.

---

## 2  Database additions

### 2.1 `subject_component_config`

Stores which components exist for each subject and their max marks.

```prisma
model SubjectComponentConfig {
  id           Int      @id @default(autoincrement())
  subjectId    Int
  component    String   // 'A1' | 'A2' | 'QZ' | 'SM'
  maxMarks     Int
  createdBy    Int
  createdAt    DateTime @default(now())

  subject      Subject  @relation(fields: [subjectId], references: [subject_id])

  @@unique([subjectId, component])
  @@map("subject_component_config")
}
```

### 2.2 `student_component_marks`

Generic marks table for ALL non‑CIE components.

```prisma
model StudentComponentMarks {
  id           Int      @id @default(autoincrement())
  studentId    Int
  subjectId    Int
  component    String   // matches config.component
  attemptNo    Int      // 1 for first assignment/quiz, 2 for re‑test etc.
  marks        Decimal  @db.Decimal(5,2)
  updatedAt    DateTime @updatedAt

  student      Student  @relation(fields: [studentId], references: [student_id])
  subject      Subject  @relation(fields: [subjectId], references: [subject_id])

  @@unique([studentId, subjectId, component, attemptNo])
  @@map("student_component_marks")
}
```

### 2.3 `student_overall_totals`

Snapshot table recomputed whenever *any* component changes.

```prisma
model StudentOverallTotals {
  id           Int      @id @default(autoincrement())
  studentId    Int
  subjectId    Int
  cieTotal     Int      // best‑2‑of‑3 from student_internal_totals
  assignment   Int?
  quiz         Int?
  seminar      Int?
  overallTotal Int
  updatedAt    DateTime @updatedAt

  student      Student  @relation(fields: [studentId], references: [student_id])
  subject      Subject  @relation(fields: [subjectId], references: [subject_id])

  @@unique([studentId, subjectId])
  @@map("student_overall_totals")
}
```

*Totals formula:* simple **addition** of the components present for that subject/category. No weighting or grade bands.

---

## 3  Workflow & UI

### 3.1 Faculty entry flow

1. **Pick subject** (filtered to faculty mappings).
2. System calls `/components?subjectId` → shows the list from `subject_component_config`.
3. Faculty chooses component (A1, A2, QZ, SM) & *attempt #* (defaults to 1).
4. Editable grid appears (one row per student) with a single numeric column *Marks* (0 – maxMarks).
5. Toolbar: **Download Template ↧** / **Upload Filled Sheet ↥** / **Save Draft** / **Submit Final**.

> **Re‑create blueprint each attempt:** Selecting “Attempt 2” adds a new row in `student_component_marks` with `attemptNo = 2`.

### 3.2 Dept‑Admin override

*Dept‑Admin* can switch `isEditable` flag on grid to edit any marks for their department.

### 3.3 Student portal

Student sees a **single “Assignment” column** (system shows *best* of A1/A2 if both exist) plus Quiz & Seminar columns, along with overall total.

### 3.4 Navigation / page layout

```
Marks
├── Internals (existing)
├── Assignment & Quiz
│   ├── Grid (Faculty / Dept‑Admin)
│   └── Download / Upload buttons
└── Totals
    └── Overall grid + export
```

Component selector lives inside the “Assignment & Quiz” page header.

---

## 4  REST API

| Verb      | Route                                                     | Purpose                                                                  |
| --------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| **GET**   | `/marks/components?subjectId`                             | Returns `{component, maxMarks, attempts}` list                           |
| **GET**   | `/marks/component/grid?subjectId&component&attemptNo`     | Grid JSON for entry/view                                                 |
| **PATCH** | `/marks/component/entry`                                  | Inline cell save `{{studentId, subjectId, component, attemptNo, marks}}` |
| **POST**  | `/marks/component/upload`                                 | Excel upload (multipart)                                                 |
| **GET**   | `/marks/component/template?subjectId&component&attemptNo` | XLSX template                                                            |
| **GET**   | `/marks/totals?subjectId`                                 | Overall‑Totals grid for view/export                                      |

All endpoints return ERP envelope and respect role guards.

---

## 5  Excel template rules

*Headers:* `USN | Name | Marks (max X)`.
*Validation:* numeric 0–maxMarks. Template auto‑populated with students.

---

## 6  Calculation services

1. **Best‑of‑assignments**: if both A1 & A2 exist, take higher marks.
2. **Overall**: `cieTotal + bestAssignment + quiz + seminar` (components missing → treated as 0).
3. Recompute and upsert into `student_overall_totals` after any component or CIE save.

---

## 7  Export formats

* XLSX, CSV, PDF for both Assignment grids and Totals grid.
* PDF uses same layout as on‑screen; numbers < passMark (if one is decided later) can be highlighted but not required now.

---

## 8  Roles & permissions

| Role             | Entry         | Edit        | View                 | Export |
| ---------------- | ------------- | ----------- | -------------------- | ------ |
| Faculty (mapped) | ✅             | ✅ their own | ✅                    | ✅      |
| Dept‑Admin       | ✅ any in dept | ✅           | ✅                    | ✅      |
| Super‑Admin      | N/A           | N/A         | ✅ all                | ✅      |
| Student          | ❌             | ❌           | ✅ own marks & totals | No     |

---

## 9  Out‑of‑scope for v1

* Deadline locking, grade bands, letter grades.
* Notification emails.
* Graphical analytics.

> These can be layered on once the base module is stable.

---

## 10  Next steps

1. **Confirm mapping table values** for each subject category (max marks).
2. Implement new Prisma models & migration.
3. Build `/marks/components` API & grid page.
4. Hook recalculation into existing CIE save flow.
5. Add Totals page & export.

---

*Prepared for further review — update any section marked TODO once subject‑category mapping is finalised.*

---

### Export permissions

| Role        | Can Export?        |
| ----------- | ------------------ |
| Faculty     | Yes (XLSX/CSV/PDF) |
| Dept‑Admin  | Yes                |
| Super‑Admin | Yes                |
| Student     | **No** – view‑only |

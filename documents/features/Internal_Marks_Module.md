# Internal Marks Module Design

> **Scope:** End‑to‑end specification for the faculty‑entry workflow that captures CIE/IA marks, auto‑derives totals using the “best of Part A & Part B” rule, and stores both granular and aggregated data.

---

## 1  Overview

Faculty mapped to a subject can, for each CIE/IA (3 per semester),

1. define the four‑question blueprint (Q1–Q4 → sub‑questions & max marks),
2. enter marks inline or via Excel template, and
3. let the system compute the best‑scoring question from each part and a rounded total.
   All data flow, validation, and UI behaviour are detailed below.

---

## 2  Database Schema (Additions)

| Table                       | Purpose                                                              | Core Columns                                                                                  |
| --------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `internal_exam_blueprint`   | Stores the question→sub‑question structure for one CIE of a subject. | `blueprint_id` PK, `subject_id` FK, `cie_no` (1‑3), `created_by`, `created_at`                |
| `internal_subquestion`      | Child rows under a blueprint.                                        | `subq_id` PK, `blueprint_id` FK, `question_no` (1‑4), `label` (varchar 10), `max_marks` (int) |
| `student_subquestion_marks` | Raw marks per student × sub‑question.                                | `id` PK, `subq_id` FK, `student_id` FK, `marks` (decimal 5,2)                                 |
| `student_internal_totals`   | Derived snapshot for reports.                                        | `id`, `student_id`, `subject_id`, `cie_no`, `best_part_a`, `best_part_b`, `total` (int)       |

<details>
<summary>📄 Prisma sample</summary>

```prisma
model InternalExamBlueprint {
  id          Int      @id @default(autoincrement())
  subject     Subject  @relation(fields: [subjectId], references: [id])
  subjectId   Int
  cieNo       Int
  createdBy   Int
  createdAt   DateTime @default(now())
  subqs       InternalSubquestion[]
}

model InternalSubquestion {
  id            Int      @id @default(autoincrement())
  blueprint     InternalExamBlueprint @relation(fields: [blueprintId], references: [id])
  blueprintId   Int
  questionNo    Int  // 1‑4
  label         String
  maxMarks      Int
  marks         StudentSubquestionMarks[]
}

model StudentSubquestionMarks {
  id          Int   @id @default(autoincrement())
  subq        InternalSubquestion @relation(fields: [subqId], references: [id])
  subqId      Int
  student     Student @relation(fields: [studentId], references: [id])
  studentId   Int
  marks       Decimal @db.Decimal(5,2)
}

model StudentInternalTotals {
  id          Int   @id @default(autoincrement())
  studentId   Int
  subjectId   Int
  cieNo       Int
  bestPartA   Int
  bestPartB   Int
  total       Int
}
```

</details>

---

## 3  REST API

| METHOD    | ENDPOINT                                    | BODY / PARAMS                                                             | ACCESS            |
| --------- | ------------------------------------------- | ------------------------------------------------------------------------- | ----------------- |
| **POST**  | `/marks/internal/blueprint`                 | `{ subjectId, cieNo, questions:[{questionNo, subs:[{label,maxMarks}]}] }` | Faculty           |
| **GET**   | `/marks/internal/blueprint?subjectId&cieNo` | –                                                                         | Faculty / HOD     |
| **PUT**   | `/marks/internal/blueprint/:id`             | (same schema)                                                             | Faculty (creator) |
| **GET**   | `/marks/internal/grid?subjectId&cieNo`      | returns `{ students:[{usn,name}], cols:[subq meta], rows:[marks] }`       | Faculty           |
| **PATCH** | `/marks/internal/entry`                     | `{ subqId, studentId, marks }` (single‑cell save)                         | Faculty           |
| **POST**  | `/marks/internal/upload`                    | multipart/form‑data Excel                                                 | Faculty           |
| **GET**   | `/marks/internal/template?subjectId&cieNo`  | – XLSX download                                                           | Faculty           |

All responses follow the ERP contract:

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

---

## 4  Excel Template Rules

1. Faculty **completes blueprint** → server generates an XLSX with:

   * pre‑filled `USN`, `Name` columns (all students mapped to the subject),
   * a column per sub‑question (e.g. `1a`, `1b`, … `4b`),
   * built‑in data‑validation → numeric `0 ≤ marks ≤ max_marks`.
2. Upload endpoint validates:

   * correct headers (no extra / missing sub‑qs),
   * valid USNs, numeric marks within range.

---

## 5  Grid UI Flow (React + Tailwind)

| # | Component                  | Behaviour                                                                                                                                       |
| - | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | **Subject + CIE selector** | Dropdowns list only faculty‑mapped subjects.                                                                                                    |
| 2 | **Blueprint modal**        | Four accordion cards (Q1‑Q4). “Add sub‑question” adds a row with *label* + *max marks*. Save ⇢ grid loads. Modal locked until blueprint edited. |
| 3 | **Inline grid**            | Row = student. Cells are numeric `<input>` with live validation; Tab/Enter navigation. Totals column read‑only.                                 |
| 4 | **Toolbar**                | `Download Template` ↧ · `Upload` ↥ · `Save Draft`                                                                                               |

**Prevention rule:** once a blueprint exists, UI forbids adding columns beyond the defined sub‑qs (hard stop, not just a warning).

---

## 6  Scoring Algorithm

```pseudo
for each student, subject, cie:
  partA1 = Σ marks (question_no == 1)
  partA2 = Σ marks (question_no == 2)
  bestA  = max(partA1, partA2)

  partB3 = Σ marks (question_no == 3)
  partB4 = Σ marks (question_no == 4)
  bestB  = max(partB3, partB4)

  total  = round(bestA + bestB)  // 14.5 → 15
  upsert StudentInternalTotals
```

*Missing sub‑questions count as 0, so an unanswered part = 0.*

---

## 7  Category‑Specific Max‑Marks Reference

| Category               | CIE I | CIE II | CIE III | Assignment            | Notes                      |
| ---------------------- | ----- | ------ | ------- | --------------------- | -------------------------- |
| IPCC                   | 15    | 15     | 15      | 10                    | Theory + Lab integrated    |
| PCC / ESC / UHV        | 25    | 25     | –       | –                     | Only two internals         |
| PCCL & AEC             | 15    | 15     | 15      | –                     | Includes lab component     |
| Project / Mini‑Project | –     | –      | –       | Continuous assessment | Handled in separate module |

Defaults live in `subject_categories`; blueprint UI shows “Max per CIE: XX” banner but distribution across sub‑qs is flexible.

---

## 8  Implementation Checklist

* [ ] Prisma migration for four tables & relations.
* [ ] Service to generate template (SheetJS) + upload parser.
* [ ] Blueprint wizard component.
* [ ] React grid (sticky header, inline editing).
* [ ] API endpoints & validation middleware.
* [ ] Unit tests for scoring edge‑cases:

  * One part missing,
  * Marks at max limit,
  * Decimal → rounding.

---

### v1 Exclusions

* Progress tracker, HOD approval flow, date‑locking — reserved for a future release.

---

© 2025 AIET ERP Team – internal design document. Do not distribute without permission.

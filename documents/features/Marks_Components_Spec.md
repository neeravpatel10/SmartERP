# 📘 Marks & Components – Detailed Feature Specification

## 🧭 Overview
This module handles the uploading, editing, viewing, and auto-calculation of internal assessment and practical marks. Marks are stored component-wise and mapped to subject categories. Final scores are derived from uploaded components.

---

## ✅ Functional Behavior
- Faculty can upload marks for only the subjects assigned to them
- Marks are uploaded using Excel templates or entered manually
- Components are auto-generated based on subject category (IPCC, PCC, etc.)
- Final marks are computed automatically using weighted logic
- Faculty can edit marks any time until results are finalized
- Dept Admins can override default component templates if needed

---

## 🧮 Component Templates by Category
| Category | Exam Component | Max Marks | Notes |
|----------|----------------|-----------|-------|
| IPCC     | CIE I          | 15        | Configured as subparts (e.g., 1a, 1b, 1c...) |
|          | CIE II         | 15        | Same as CIE I |
|          | Assignment     | 10        | Single assignment upload |
|          | Lab Record     | 15        | Practical evaluation |
|          | Lab CIE        | 10        | Lab test/Viva |
| PCC/ESC/UHV | CIE I       | 25        | Could be entered as average or part-wise |
|          | Assignment 1   | 15        | Configurable |
|          | Assignment 2   | 10        | Configurable |
| PCCL/AEC | Lab Record     | 30        | Full lab practical marks |
|          | Lab CIE        | 20        | Viva or Lab Test |
| PROJ     | Presentation   | 20        | Project Phase I/II |
|          | Requirement Analysis | 20   | Design & planning |
|          | Report         | 20        | Final documentation |
|          | IEEE Paper     | 40        | Technical writing component |
| Mini Project | Objective of Mini Project | 20 | Statement clarity |
|          | Work Undertaken | 20       | Execution & progress |
|          | Technical Knowledge | 20    | Student learning |
|          | Viva Voce      | 20        | Oral assessment |
|          | Final Report   | 20        | Final submission quality |

---

## 🧩 IA Question Configuration (CIE I, CIE II)
Faculty must configure each IA structure before entering marks:

### Configuration Fields:
- Total number of questions (e.g., Q1–Q4)
- Subparts per question (e.g., Q1 → 1a, 1b, 1c)
- Maximum marks per subpart (e.g., 1a = 5, 1b = 5, 1c = 5)
- Define Part A (e.g., Q1 & Q2), Part B (e.g., Q3 & Q4)
- Minimum required questions to attempt (e.g., 1 from Part A and 1 from Part B)

### Behavior:
- System generates dynamic Excel template or form based on configuration
- Total marks per student auto-calculated from answered subparts
- Manual override allowed for exceptional cases

---

## 📝 Assignment Marks Configuration
- Faculty can configure number of assignments (e.g., Assignment 1, Assignment 2)
- Max marks can be assigned to each assignment independently
- Assignments can be configured before marks upload or entry
- Final assignment component score = sum of all configured assignments
- Editable after creation, but logs should track changes

## 📊 Marks Auto-Calculation Logic
- **Final Marks** = Weighted sum of component marks
- Weightage per component is derived from the default template unless overridden
- No manual entry of final marks required
- Auto-validation to ensure max marks are not exceeded

---

## 📁 Excel Upload Template Format
- Structure:
```
usn | name | subject_code | 1a | 1b | 1c | 2a | 2b | 2c | 3a | 3b | 3c | 4a | 4b | 4c | cie_1_total | assignment | lab_record | lab_cie | total
```
- One student per row
- Validations:
  - USN must exist and be mapped
  - Subject must be assigned to uploading faculty
  - Component values must not exceed configured max marks

---

## ✏️ Manual Entry / Edit Interface
- Dropdowns for Subject, Section, Semester, and Component (e.g., CIE I, Assignment)
- If CIE I/II is selected and not yet configured:
  - Prompt for IA structure: number of questions, subparts, and max marks per subpart
  - Define Part A and Part B logic with minimum answer constraints

### Entry Table View
| USN | Name | 1a | 1b | 1c | Q1 Total | 2a | 2b | Q2 Total | Assignment | Lab CIE | Final |
|-----|------|----|----|----|----------|----|----|----------|------------|---------|--------|
- Individual subpart entry fields (auto-validated)
- Auto-calculated totals for each question and final marks
- Highlight missing values or over-limit entries
- Tooltips with max marks per field
- Color-coded feedback (green for complete, red for errors)

### Edit Mode
- Accessible per student or per component
- Inline table editing or modal view
- Shows original entry, current value, and timestamp of update
- All changes saved with faculty identifier for audit

### Actions
- 💾 Save & Calculate
- 📤 Upload from Excel
- ⬇️ Download Excel template
- 📊 Preview subject-wide totals and performance distribution

---

## 🎓 Marks Display for Students
### Student View UI
- Dashboard with per-semester tab (e.g., Semester 3, Semester 4)
- Each tab shows card or table layout:

| Subject Code | Subject Name | CIE I | CIE II | Assignment | Lab CIE | Total |
|--------------|---------------|--------|---------|-------------|---------|--------|

- Hover tooltips show detailed breakdown
- Color-coded status (e.g., green for high scores, red for low scores)
- Mobile-first responsive view with expandable subject cards
- Summary bar per semester (e.g., Total Avg, Top 3 scores, Lowest score)

## 🧑‍🏫 Role-Based Access

### View Logic:
- **Students**: Can only see their own marks per subject via the per-semester dashboard
- **Faculty**: Can view and edit marks of all students for the subjects assigned to them
- **Dept Admin**: Can view, filter, and download full department-wide student marks
- All views support filters by subject, section, semester, and scoring range
| Role         | Permissions |
|--------------|-------------|
| Faculty      | Upload/edit marks only for mapped subjects |
| Dept Admin   | View/export all department marks, manage templates |
| Super Admin  | Full access |
| Student      | View final marks only (per subject) |

---

## 🗃️ Table Definitions

### `ia_question_config`
```sql
config_id INT PRIMARY KEY AUTO_INCREMENT,
subject_id INT NOT NULL,
cie_type ENUM('CIE I', 'CIE II') NOT NULL,
question_number INT NOT NULL,
subpart VARCHAR(10),
part ENUM('A', 'B') DEFAULT NULL,
max_marks INT NOT NULL,
created_by INT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### `assignment_config`
```sql
assignment_id INT PRIMARY KEY AUTO_INCREMENT,
subject_id INT NOT NULL,
assignment_name VARCHAR(100) NOT NULL,
max_marks INT NOT NULL,
weightage DECIMAL(5,2),
created_by INT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### `exam_components`
```sql
component_id INT PK,
subject_id INT,
component_name VARCHAR(100),
max_marks INT,
weightage_percent DECIMAL(5,2),
is_custom BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP
```

### `student_component_marks`
```sql
id INT PK,
student_id INT,
subject_id INT,
component_id INT,
marks DECIMAL(5,2),
recorded_by INT,
timestamp DATETIME
```

### `marks`
```sql
mark_id INT PK,
student_id INT,
subject_id INT,
total_marks DECIMAL(5,2),
calculated BOOLEAN DEFAULT TRUE,
last_updated TIMESTAMP
```

---

## 🧑‍💻 API Endpoints

### 🔹 Faculty
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/exam-components/:subjectId` | GET | Fetch template components for subject |
| `/marks/upload` | POST | Upload Excel sheet of marks |
| `/marks/manual-entry` | POST | Submit marks via form entry |
| `/marks/edit/:studentId/:subjectId` | PUT | Edit component marks manually |
| `/marks/view/:subjectId` | GET | View component marks per subject |
| `/marks/ia-config/:subjectId` | POST | Define IA question structure with parts and max marks |

### 🔹 Admin
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/exam-components` | POST | Create/override component template |
| `/marks/export/:subjectId` | GET | Export subject-wise marks CSV |

---

## 📊 Reports & Admin Filtering
- Dept Admin dashboard includes:
  - Filter by subject, semester, section, batch
  - Sort by final marks (high to low, low to high, average range)
  - Search by USN or name
- Visual analytics (bar/line charts) to display:
  - Top scorers
  - Below average list
  - Distribution by category/component
- Student-wise performance summary table
- One-click access to underperforming or top-performing lists
- Button to switch between table view and graphical summary

## 📤 Export Options
- Faculty and Dept Admin can export:
  - Full marksheet per subject (with component breakdown)
  - Filter by section, semester, or batch
  - Format: CSV, Excel, PDF

---

## 🔮 Future Enhancements
- Grade conversion (if needed in future)
- Locking mechanism after internal review
- Subject-wise moderation tracking

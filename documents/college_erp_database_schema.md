
# 🧩 College ERP – Database Schema Documentation

## ✅ Core Tables Overview

### 1. `users`
- `user_id` (PK)
- `email`
- `password_hash`
- `login_type` (1 = Super Admin, 2 = Faculty, 3 = Dept Admin, -1 = Student)
- `linked_id` (foreign key to `faculty` or `students`)

### 2. `students`
- `student_id` (PK)
- `name`
- `usn`
- `batch_id` (FK)
- `dept_id` (FK)

### 3. `faculty`
- `faculty_id` (PK)
- `name`
- `email`
- `dept_id` (FK)

### 4. `departments`
- `dept_id` (PK)
- `name`

### 5. `batches`
- `batch_id` (PK)
- `year`
- `section`

### 6. `subjects`
- `subject_id` (PK)
- `name`
- `semester`
- `dept_id` (FK)
- `category_id` (FK to `subject_categories`)

### 7. `subject_categories`
- `category_id` (PK)
- `name`

### 8. `faculty_subject_mapping`
- `id` (PK)
- `faculty_id` (FK)
- `subject_id` (FK)
- `semester`
- `section`

---

## 🕒 Attendance Management

### 9. `attendance_sessions`
- `session_id` (PK)
- `subject_id` (FK)
- `date`
- `faculty_id` (FK)
- `section`

### 10. `attendance_entries`
- `entry_id` (PK)
- `session_id` (FK)
- `student_id` (FK)
- `status` (Present/Absent)

---

## 🧪 Marks Management

### 11. `exam_components`
- `component_id` (PK)
- `name` (IA1, IA2, Assignment, etc.)
- `max_marks`
- `weightage`

### 12. `student_component_marks`
- `id` (PK)
- `student_id` (FK)
- `subject_id` (FK)
- `component_id` (FK)
- `marks`

### 13. `marks`
- `mark_id` (PK)
- `student_id` (FK)
- `subject_id` (FK)
- `total_marks`
- `grade`

---

## 🖼️ Display

### 14. `display_pic`
- `id` (PK)
- `user_id` (FK)
- `image_path`

---

## 🔁 Relationships Summary
- `users.linked_id` → `students` or `faculty`
- `students` → `batches`, `departments`
- `faculty_subject_mapping` → `faculty`, `subjects`
- `attendance_entries` → `attendance_sessions`, `students`
- `student_component_marks` → `exam_components`, `students`, `subjects`
- `marks` → `students`, `subjects`

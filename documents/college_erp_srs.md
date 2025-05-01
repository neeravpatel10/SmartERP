
# Software Requirements Specification (SRS) – College ERP System (AIET)

## System Design
A modular ERP platform supporting multi-role access, scoped views for departments, real-time updates, and downloadable/uploadable Excel support.

## Architecture Pattern
- Frontend: React.js SPA with Vite
- Backend: Node.js REST API (Express.js)
- Database: MySQL (refined ERP schema)
- ORM: Prisma
- Deployment: Docker + Nginx

## State Management
- Redux Toolkit (frontend global state)
- JWT-based session logic
- Local state for form interactions
- Excel upload parsing with SheetJS

## Data Flow
1. User logs in → JWT
2. Based on role → render scoped data
3. Faculty downloads/upload Excel templates
4. Admin/HOD generate analytics reports

## Technical Stack
- React.js, Tailwind CSS
- Node.js, Express.js, Prisma ORM
- MySQL (existing schema)
- SheetJS, Multer, Bcrypt, JWT

## Authentication Process
- `users` table with `login_type`
  - -1 = Student, 2 = Faculty, 3 = Dept Admin, 1 = Super Admin
- JWT issued on login
- Middleware checks token + role
- Scoped access for Dept Admin via `department_id`

## Route Design
- `/login`, `/me`, `/change-password`
- `/students`, `/faculty`, `/users` (CRUD based on role)
- `/subjects`, `/faculty-subject-mapping`
- `/attendance/sessions`, `/attendance/upload`
- `/marks/upload`, `/exam-components`
- `/reports/*` for department and subject analytics
- `/display-pic/*`

## API Design
All responses are in JSON:
```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": { ... }
}
```
Excel upload: `multipart/form-data`  
Authorization: `Bearer <token>`

## Database Design ERD

### Key Tables:
- `users`: login, role management
- `students`, `faculty`: department-linked profiles
- `subjects`, `batches`, `departments`, `subject_categories`
- `faculty_subject_mapping`: connects faculty to subjects
- `attendance_sessions` + `attendance_entries`
- `exam_components` + `student_component_marks`
- `marks`: final marks and grades
- `display_pic`: profile image path

### Relationships:
- `users.linked_id` → `students` or `faculty`
- `students` → `batches`, `departments`
- `faculty_subject_mapping` → `faculty`, `subjects`
- `attendance_entries` → `sessions`, `students`
- `student_component_marks` → `exam_components`, `subjects`, `students`

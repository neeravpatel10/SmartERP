
# 📡 College ERP API Documentation

## 🔐 Authentication & User Roles
| Role             | Code  | Scope                                                      |
|------------------|-------|-------------------------------------------------------------|
| Super Admin      | 1     | Full system access across all departments                  |
| Faculty          | 2     | Subjects assigned to them only                             |
| Department Admin | 3     | CRUD access within their department                        |
| Student          | -1    | Access to personal data only                               |

## 🔑 Auth Endpoints
| Method | Endpoint         | Description                   |
|--------|------------------|-------------------------------|
| POST   | /login           | Authenticate and return JWT   |
| GET    | /me              | Get current user details      |
| POST   | /change-password | Change user password          |

## 👤 User Management
| Method | Endpoint        | Access        | Description              |
|--------|-----------------|---------------|--------------------------|
| GET    | /users          | Super Admin   | List all users           |
| POST   | /users          | Super Admin   | Create user              |
| PUT    | /users/:id      | Super Admin   | Update user              |
| DELETE | /users/:id      | Super Admin   | Delete user              |

## 🧑‍🎓 Student & Faculty Management
| Method | Endpoint           | Access            | Description            |
|--------|--------------------|-------------------|------------------------|
| GET    | /students          | Dept Admin / SA   | List students          |
| POST   | /students          | Dept Admin / SA   | Add student            |
| GET    | /students/:id      | Student/Admin     | View student profile   |
| GET    | /faculty           | Dept Admin / SA   | List faculty           |
| POST   | /faculty           | Dept Admin / SA   | Add faculty            |
| GET    | /faculty/:id       | Faculty/Admin     | View faculty profile   |

## 📚 Subjects & Mappings
| Method | Endpoint                      | Access            | Description                     |
|--------|-------------------------------|-------------------|---------------------------------|
| GET    | /subjects                     | Dept Admin / SA   | List subjects                   |
| POST   | /subjects                     | Admin             | Add subject                     |
| GET    | /faculty-subject-mapping     | Faculty / Admin   | View subject mappings           |
| POST   | /faculty-subject-mapping     | Dept Admin / SA   | Assign subject to faculty       |
| DELETE | /faculty-subject-mapping/:id | Dept Admin / SA   | Remove mapping                  |

## 🗓️ Attendance
| Method | Endpoint                        | Access            | Description                          |
|--------|---------------------------------|-------------------|--------------------------------------|
| GET    | /attendance/sessions            | Faculty / HOD     | List sessions                        |
| POST   | /attendance/sessions            | Faculty           | Create session                       |
| POST   | /attendance/upload              | Faculty           | Bulk upload attendance via Excel     |
| GET    | /attendance/student/:studentId  | HOD / Student     | View attendance summary              |
| GET    | /attendance/session/:sessionId  | Faculty           | View entries in a session            |

## 🧪 Marks & Components
| Method | Endpoint                           | Access           | Description                        |
|--------|------------------------------------|------------------|------------------------------------|
| GET    | /exam-components                   | Admin            | List exam components               |
| POST   | /exam-components                   | Admin            | Create exam component              |
| GET    | /marks/student/:studentId          | Faculty/Student  | Get marks by student               |
| GET    | /marks/subject/:subjectId          | Faculty/HOD      | Get marks by subject               |
| POST   | /marks/upload                      | Faculty          | Upload component-wise marks        |
| GET    | /student-component-marks           | Faculty/HOD      | View marks across components       |

## 📊 Reports
| Method | Endpoint                      | Access          | Description                           |
|--------|-------------------------------|------------------|---------------------------------------|
| GET    | /reports/department           | Dept Admin / SA | Performance overview by department    |
| GET    | /reports/subject/:subjectId   | Dept Admin / SA | View analytics for a subject          |
| GET    | /reports/student/:studentId   | Dept Admin / SA | Full student performance profile      |
| GET    | /reports/attendance/overview  | Dept Admin / SA | Attendance trends & analytics         |

## 🖼️ Profile Picture
| Method | Endpoint                  | Access        | Description                         |
|--------|---------------------------|---------------|-------------------------------------|
| POST   | /display-pic/upload       | Authenticated | Upload/update profile photo         |
| GET    | /display-pic/:userId      | Public        | Retrieve profile photo              |

# 📘 Subject Management Module – Complete Solution Design (2022 Scheme)

## 💾 0. Subject Categories (Prefilled)

### Table Schema: `subject_categories`

| Field         | Type            | Description                             |
| ------------- | --------------- | --------------------------------------- |
| id            | INT (PK)        | Auto increment                          |
| code          | VARCHAR(191)    | Unique category identifier (e.g., IPCC) |
| name          | VARCHAR(191)    | Human-readable category name            |
| description   | VARCHAR(191)    | Short explanation                       |
| markingSchema | LONGTEXT (JSON) | Default component logic in JSON         |
| createdAt     | DATETIME(3)     | Timestamp on creation                   |
| updatedAt     | DATETIME(3)     | Timestamp on update                     |

### Prefilled Categories

| Code       | Name                                | Type          | Description                                 |
| ---------- | ----------------------------------- | ------------- | ------------------------------------------- |
| IPCC       | Integrated Professional Core Course | Theory + Lab  | Combined theory and lab components.         |
| PCC        | Professional Core Course            | Theory        | Core subjects with CIE-based evaluations.   |
| ESC        | Engineering Science Course          | Theory        | Fundamental engineering courses.            |
| UHV        | Universal Human Values              | Theory        | Courses focused on human values.            |
| PCCL       | Professional Core Course Lab        | Lab           | Practical lab sessions.                     |
| AEC        | Ability Enhancement Course          | Lab/Practical | Skill enhancement practical sessions.       |
| PROJ       | Final Year Project                  | Project       | Major final-year project.                   |
| MINI\_PROJ | Mini Project                        | Project       | Smaller, mid-program projects.              |
| MC         | Mandatory Course                    | Theory        | Mandatory non-credit courses.               |
| OEC        | Open Elective Course                | Theory        | Electives from outside the core discipline. |
| PEC        | Professional Elective Course        | Theory        | Electives within the discipline.            |
| SEC        | Skill Enhancement Course            | Practical     | Courses aimed at specific skills.           |

## 📜 1. Overview

The Subject Management module enables Department Admins and Super Admins to effectively manage academic subjects, including creation, updates, category management, lifecycle tracking, and automatic marking schema assignments.

## 🔌 2. API Specification

### POST `/subjects`

**Request:**

```
{
  "code": "CS301",
  "name": "Data Structures",
  "semester": 3,
  "section": "A",
  "schemeYear": 2022,
  "categoryId": 2,
  "credits": 4,
  "departmentId": 1,
  "isLab": 0
}
```

**Successful Response:**

```
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "id": 101,
    "code": "CS301",
    "status": "draft"
  }
}
```

### GET `/subjects`

**Response:**

```
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [{
    "id": 101,
    "code": "CS301",
    "name": "Data Structures",
    "semester": 3,
    "status": "active"
  }]
}
```

### PUT `/subjects/:id`

**Request:**

```
{
  "name": "Advanced Data Structures",
  "credits": 5,
  "status": "active"
}
```

**Response:**

```
{
  "success": true,
  "message": "Subject updated successfully",
  "data": {}
}
```

### DELETE `/subjects/:id`

**Response:**

```
{
  "success": true,
  "message": "Subject archived successfully",
  "data": {}
}
```

### GET `/subject-categories`

**Response:**

```
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": [{
    "id": 1,
    "code": "IPCC",
    "name": "Integrated Professional Core Course"
  }]
}
```

## ⚙️ 3. Auto-Marking Schema Logic

* On subject creation, fetch marking schema from the selected category.
* Automatically populate the exam components for the subject.
* Allow updates only when the subject status is "draft".

## 🔄 4. Status Transitions

| Action                 | From Status  | To Status |
| ---------------------- | ------------ | --------- |
| Create Subject         | —            | draft     |
| Activate Subject       | draft        | active    |
| Lock after final marks | active       | locked    |
| Archive Subject        | draft/active | archived  |

* Status transitions are logged for audit purposes.

## 👥 5. Role-Specific Behaviors

| Role        | Permissions                                      |
| ----------- | ------------------------------------------------ |
| Dept Admin  | CRUD subjects and mappings within own department |
| Super Admin | Global CRUD permissions, manage categories       |
| Faculty     | View assigned subjects                           |
| Student     | View subjects relevant to their enrollment       |

## ✅ 6. Validation Rules

* Ensure unique `subject_code` per department, semester, and scheme year.
* Require positive integer for `credits`.
* Validate category existence.
* Mandatory `schemeYear`.
* No edits for subjects in "locked" or "archived" status.
* Explicit validation for lab linkage in IPCC.
* Marking schema JSON integrity validation.

## 🖥️ 7. UI Specification

* Sidebar navigation clearly labeled for Subjects.
* Department Admin Interface: Filters, Table columns (Code, Name, Category, Lab Linked, Status, Actions), Actions (Edit, Archive, View Components).
* Super Admin Interface: Additional department filter and table columns.
* Interactive modals with live preview for marking schema.

## 📊 8. Technical Diagrams

### ER Diagram

```
subjects
|-- departmentId
|-- categoryId
|-- exam_components
|-- subject_status_log

subject_categories
|-- markingSchema

exam_components
|-- subjectId
|-- component details

subject_status_log
|-- subjectId
|-- status transition logs
```

### Lifecycle Diagram

```
Draft --> Active --> Locked
Draft --> Archived
Active --> Archived
```

## 🧪 9. Test Plan

* Functional Tests: subject creation, duplicate checks, status transition validations, component auto-generation.
* Validation Tests: credits input, category existence, mandatory fields.
* Role-Based Tests: Dept Admin, Super Admin CRUD, Faculty read-only, Student view-only.

## 🚨 10. Error Handling

| HTTP Code | Scenario              | Response Message                        |
| --------- | --------------------- | --------------------------------------- |
| 400       | Validation failure    | "Invalid input provided"                |
| 401       | Unauthorized          | "Authentication required"               |
| 403       | Forbidden             | "Permission denied"                     |
| 404       | Resource not found    | "Subject not found"                     |
| 409       | Conflict              | "Subject with this code already exists" |
| 500       | Internal server error | "An unexpected error occurred"          |

**Example Error Response:**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "credits must be a positive integer",
    "categoryId is required"
  ]
}
```

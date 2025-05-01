# Audit Logging System Documentation

## Overview

The ERP system includes a comprehensive audit logging system that tracks sensitive user actions across the application. This provides accountability, helps with troubleshooting, and ensures compliance with academic record-keeping requirements.

## Architecture

The audit logging system consists of several components:

1. **AuditLog Model (Prisma)**: Stores audit log entries with detailed information about each action.
2. **auditLogService.ts**: Service with functions to create, retrieve, and export audit logs.
3. **auditMiddleware.ts**: Middleware components that capture request context and record audit events.
4. **auditLog.controller.ts**: Controller with API endpoints for viewing and exporting logs.
5. **auditLog.routes.ts**: Routes for accessing audit log data (restricted to super admins).

## Audited Actions

The system records the following types of actions:

| Action Type | Description | Entity Types |
|-------------|-------------|--------------|
| create | Creating a new entity | user, faculty, student, department, batch, subject, examComponent |
| update | Updating an existing entity | user, faculty, student, department, batch, subject |
| delete | Deleting an entity | batch, iaConfig |
| status_change | Changing an entity's status | subject (activate, lock, unlock, archive) |
| configure | Configuring settings | iaConfig |
| grade | Recording a student's grade | studentMark |
| bulk_create | Creating multiple entities | faculty, student |
| bulk_grade | Recording grades for multiple students | studentMarks |

## Audited Routes

The following routes include audit logging:

### User Management
- POST `/api/users/register`: Creating a new user
- PUT `/api/users/profile`: Updating user profile

### Department Management
- POST `/api/departments`: Creating a department
- PUT `/api/departments/:id`: Updating a department

### Faculty Management
- POST `/api/faculty`: Creating a faculty member
- PUT `/api/faculty/:id`: Updating a faculty member
- POST `/api/faculty/bulk-upload`: Bulk uploading faculty

### Batch Management
- POST `/api/batches`: Creating a batch
- PUT `/api/batches/:id`: Updating a batch
- DELETE `/api/batches/:id`: Deleting a batch

### Subject Lifecycle
- PUT `/api/lifecycle/subjects/:subjectId/activate`: Activating a subject
- PUT `/api/lifecycle/subjects/:subjectId/lock`: Locking a subject
- PUT `/api/lifecycle/subjects/:subjectId/unlock`: Unlocking a subject
- PUT `/api/lifecycle/subjects/:subjectId/archive`: Archiving a subject

### Marks & Grading
- POST `/api/marks/exam-components`: Creating an exam component
- POST `/api/marks/student-marks`: Recording a student's mark
- POST `/api/marks/upload`: Bulk uploading marks

### IA Configuration
- POST `/api/ia-config/components/:componentId/config`: Saving IA configuration
- DELETE `/api/ia-config/components/:componentId/config`: Removing IA configuration

## Audit Log Data

Each audit log entry contains:

- User who performed the action
- Action type (create, update, delete, etc.)
- Entity type (user, department, faculty, etc.)
- Entity ID
- Timestamp
- IP address
- User agent
- Old value (for updates/deletes)
- New value (for creates/updates)

## Accessing Audit Logs

Audit logs are accessible only to super administrators through:

- Web interface: `/audit-logs` in the admin panel
- API: `/api/audit-logs` endpoints
- Export functionality for compliance and reporting

## Extending Audit Logging

To add audit logging to new routes:

1. Import the middleware components:
   ```typescript
   import { setAuditContext, captureEntityState, logAudit } from '../middleware/auditMiddleware';
   ```

2. Add the middleware to the route:
   ```typescript
   router.post(
     '/', 
     authenticate, 
     validate(schema),
     setAuditContext('create', 'entityType'),
     controllerFunction,
     logAudit
   );
   ```

3. For updates, capture the original entity state:
   ```typescript
   captureEntityState(
     'entityType',
     (req) => req.params.id,
     async (id) => await prisma.entity.findUnique({ where: { id: parseInt(id) } })
   ),
   ``` 
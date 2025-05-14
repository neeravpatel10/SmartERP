# College ERP Backend

Backend services for the College ERP system.

## Section-Subject Relation Migration

We've recently added a new feature to link subjects with sections. This improves organization and makes it easier to filter subjects by section.

### Running the Migration

To apply the migration to your database:

1. Make sure your database is running
2. Install the required dependency:

```bash
npm install mysql2
```

3. Run the SQL migration script:

```bash
# Windows/Linux/macOS
node scripts/apply-section-migration-sql.js
```

4. Restart the backend server

### New Features

This migration adds:

- A proper relation between subjects and sections
- The ability to select sections from a dropdown in the subject form
- A new section API for fetching sections filtered by department and semester
- Enhanced filtering capabilities in the subject list

### API Updates

- `GET /api/sections` - Get sections with optional filtering by departmentId and currentSemester
- `GET /api/sections/:id` - Get a specific section by ID
- Subject endpoints now support `sectionId` in request/response data 
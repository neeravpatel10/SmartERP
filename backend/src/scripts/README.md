# User Migration Scripts

This directory contains scripts for migrating user data from a legacy MySQL database to the new Prisma database system and verifying the migration.

## Setup

Before running these scripts, make sure you have the following environment variables set in your `.env` file (at the root of the backend directory):

```
SOURCE_DB_HOST=legacy-mysql-host
SOURCE_DB_USER=username
SOURCE_DB_PASSWORD=password
SOURCE_DB_NAME=legacy_db_name
```

## Migration Process

### 1. User Migration Script

The `migrate-users.js` script transfers users from the legacy MySQL database to the new Prisma database.

**Features:**
- Migrates users in batches to manage memory usage
- Maps departments between systems
- Handles role conversion
- Creates audit logs for each migrated user
- Provides detailed statistics on completion

**Running the script:**

```bash
node migrate-users.js
```

### 2. Verification Script

The `verify-migration.js` script checks the migration's completeness and correctness.

**Features:**
- Compares user counts between source and target databases
- Samples and compares individual user records
- Examines audit logs from the migration
- Identifies potential issues like missing users or incomplete data

**Running the script:**

```bash
node verify-migration.js
```

## Migration Strategy

The migration process follows these steps:

1. **Preparation**
   - Back up both source and target databases
   - Set up environment variables
   - Run schema validation on target database

2. **Migration Execution**
   - Run the migration script
   - Monitor progress through console output
   - Address any errors that occur during migration

3. **Verification**
   - Run the verification script
   - Check the user counts and sample comparisons
   - Investigate and fix any discrepancies

4. **Post-Migration Tasks**
   - Manually verify critical user accounts
   - Update any department mappings if needed
   - Run application-level tests to ensure system functionality

## Troubleshooting

### Common Issues

1. **Connection errors**
   - Verify that the database credentials and connection strings are correct
   - Check network connectivity between the script and databases

2. **Missing users**
   - Check for special characters in usernames or emails
   - Verify department mappings are complete
   - Look for data format inconsistencies in the source data

3. **Department assignment issues**
   - Run a query to find users with missing departments
   - Update the department mapping logic if needed

### Fixing Failed Migrations

If the verification script identifies issues, you can:

1. Fix the specific users in the target database manually
2. Update the migration script and run it again with the `--update-only` flag
3. Use the targeted fix scripts in the `fixes` directory (if available)

## Support

For assistance with these scripts, contact the system administrator or the development team. 
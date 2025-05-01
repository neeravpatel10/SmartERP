-- Migration script to transfer data from legacy 'users' table to new 'User' table
-- This will map the following fields:
-- users.id -> User.id
-- users.username -> User.username
-- users.username -> User.email (with @aiet.edu.in appended)
-- users.password -> User.passwordHash
-- users.identity -> User.loginType
-- users.dept -> Look up Department.name and set departmentId

-- First step: Get department IDs
-- Run this to see existing departments in the new system
-- SELECT id, name FROM Department;

-- Migration query - modify Department ID mapping as needed
INSERT INTO User (
  id, 
  username, 
  email, 
  passwordHash, 
  loginType, 
  departmentId, 
  isActive, 
  firstLogin,
  createdAt,
  updatedAt
)
SELECT 
  u.id,
  u.username,
  CONCAT(u.username, '@aiet.edu.in') AS email,
  u.password AS passwordHash,
  u.identity AS loginType,
  -- Map department names to IDs (adjust these based on your actual Department table data)
  CASE 
    WHEN u.dept = 'Computer Science and Engineering' THEN 1
    WHEN u.dept = 'Information Science and Engineering' THEN 2
    WHEN u.dept = 'Electronics and Communication Engineering' THEN 3
    WHEN u.dept = 'Mechanical Engineering' THEN 4
    WHEN u.dept = 'Civil Engineering' THEN 5
    WHEN u.dept = 'Artificial Intelligence and machine Learning' THEN 6
    ELSE NULL
  END AS departmentId,
  TRUE AS isActive,
  FALSE AS firstLogin,
  u.created_at AS createdAt,
  CURRENT_TIMESTAMP() AS updatedAt
FROM users u
-- Optional: you can add a WHERE clause to filter which users to migrate
-- WHERE u.id > 0
ORDER BY u.id;

-- After running, set up appropriate logging for migrated accounts
INSERT INTO AuditLog (
  userId,
  action,
  entityType, 
  entityId,
  details,
  ipAddress,
  createdAt,
  updatedAt
)
SELECT 
  id,
  'USER_MIGRATED',
  'User',
  id,
  JSON_OBJECT('source', 'legacy_migration', 'old_username', username),
  '127.0.0.1',
  NOW(),
  NOW()
FROM User
WHERE email LIKE '%@aiet.edu.in';

-- In case of duplicates, you may need to run a clean-up after migration:
-- SELECT COUNT(*), username FROM User GROUP BY username HAVING COUNT(*) > 1;
-- SELECT COUNT(*), email FROM User GROUP BY email HAVING COUNT(*) > 1; 
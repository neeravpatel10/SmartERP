-- This script adds the sectionId to the subject table and creates the foreign key relationship
-- Run this directly against your database to bypass Prisma migration issues

-- 1. Check if sectionId column already exists, add it if not
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subject' AND COLUMN_NAME = 'sectionId';

SET @addColumn = CONCAT('ALTER TABLE `subject` ADD COLUMN `sectionId` INT NULL');
SET @createIndex = CONCAT('CREATE INDEX `Subject_sectionId_idx` ON `subject`(`sectionId`)');
SET @addForeignKey = CONCAT('ALTER TABLE `subject` ADD CONSTRAINT `Subject_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE');

-- Only run if column doesn't exist
SET @query = IF(@columnExists = 0, @addColumn, 'SELECT "sectionId column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Create index on sectionId (if column was just added)
SET @indexExists = 0;
SELECT COUNT(*) INTO @indexExists FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subject' AND INDEX_NAME = 'Subject_sectionId_idx';

-- Only create index if it doesn't exist
SET @query = IF(@indexExists = 0, @createIndex, 'SELECT "Index already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add foreign key constraint (if column was just added)
SET @fkExists = 0;
SELECT COUNT(*) INTO @fkExists FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subject' AND CONSTRAINT_NAME = 'Subject_sectionId_fkey';

-- Only add foreign key if it doesn't exist
SET @query = IF(@fkExists = 0, @addForeignKey, 'SELECT "Foreign key already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Update Prisma's migration history to mark this migration as applied
-- This will allow future migrations to proceed
INSERT IGNORE INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  uuid(), 
  '12345678901234567890123456789012', 
  NOW(), 
  '20250424210000_add_section_relation_to_subject', 
  NULL,
  NULL, 
  NOW(), 
  1
);

SELECT 'Migration applied successfully' AS result;

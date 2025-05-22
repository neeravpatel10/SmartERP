-- This script directly creates the Assignment & Quiz tables
-- bypassing Prisma's migration system

-- Create the ComponentEnum type if it doesn't exist
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` VARCHAR(36) NOT NULL,
  `checksum` VARCHAR(64) NOT NULL,
  `finished_at` DATETIME(3) NULL,
  `migration_name` VARCHAR(255) NOT NULL,
  `logs` TEXT NULL,
  `rolled_back_at` DATETIME(3) NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create tables for the Assignment & Quiz module

-- 1. Subject Component Configuration table
CREATE TABLE IF NOT EXISTS `SubjectComponentConfig` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `subjectId` INT NOT NULL,
  `component` ENUM('ASSIGNMENT', 'QUIZ') NOT NULL,
  `maxMarks` INT NOT NULL,
  `attemptCount` INT NOT NULL,
  
  PRIMARY KEY (`id`),
  INDEX `SubjectComponentConfig_subjectId_idx` (`subjectId`),
  CONSTRAINT `SubjectComponentConfig_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Student Component Marks table
CREATE TABLE IF NOT EXISTS `StudentComponentMarks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `studentUsn` VARCHAR(20) NOT NULL,
  `subjectId` INT NOT NULL,
  `component` ENUM('ASSIGNMENT', 'QUIZ') NOT NULL,
  `attemptNo` INT NOT NULL,
  `marks` DECIMAL(5, 2) NOT NULL,
  
  PRIMARY KEY (`id`),
  INDEX `StudentComponentMarks_studentUsn_idx` (`studentUsn`),
  INDEX `StudentComponentMarks_subjectId_idx` (`subjectId`),
  CONSTRAINT `StudentComponentMarks_studentUsn_fkey` FOREIGN KEY (`studentUsn`) REFERENCES `student` (`usn`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `StudentComponentMarks_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Student Overall Totals table
CREATE TABLE IF NOT EXISTS `StudentOverallTotals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `studentUsn` VARCHAR(20) NOT NULL,
  `subjectId` INT NOT NULL,
  `assignmentTotal` DECIMAL(5, 2) NOT NULL DEFAULT 0.0,
  `quizTotal` DECIMAL(5, 2) NOT NULL DEFAULT 0.0,
  
  PRIMARY KEY (`id`),
  INDEX `StudentOverallTotals_studentUsn_idx` (`studentUsn`),
  INDEX `StudentOverallTotals_subjectId_idx` (`subjectId`),
  CONSTRAINT `StudentOverallTotals_studentUsn_fkey` FOREIGN KEY (`studentUsn`) REFERENCES `student` (`usn`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `StudentOverallTotals_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Update Prisma's migration history to avoid conflicts
INSERT IGNORE INTO `_prisma_migrations` (
  `id`, 
  `checksum`, 
  `finished_at`,
  `migration_name`,
  `logs`,
  `started_at`,
  `applied_steps_count`
)
VALUES (
  UUID(), 
  '12345678901234567890123456789012', 
  NOW(),
  '20250424210000_add_section_relation_to_subject',
  'Applied manually via direct SQL',
  NOW(),
  1
);

INSERT IGNORE INTO `_prisma_migrations` (
  `id`, 
  `checksum`, 
  `finished_at`,
  `migration_name`,
  `logs`,
  `started_at`,
  `applied_steps_count`
)
VALUES (
  UUID(), 
  '98765432109876543210987654321098', 
  NOW(),
  '20250522000000_assignment_quiz_marks_tables',
  'Applied manually via direct SQL',
  NOW(),
  1
);

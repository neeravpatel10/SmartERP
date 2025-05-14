-- Migration: Add section relation to subject table
-- Author: AI Assistant
-- Date: 2025-04-24

-- Add sectionId to subject table if it doesn't exist
ALTER TABLE `subject` ADD COLUMN IF NOT EXISTS `sectionId` INT NULL;

-- Add foreign key constraint
ALTER TABLE `subject` ADD CONSTRAINT `Subject_sectionId_fkey` 
FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index on sectionId
CREATE INDEX `Subject_sectionId_fkey` ON `subject`(`sectionId`); 
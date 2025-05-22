-- This migration adds the sectionId column to the subject table
-- and creates a foreign key relationship to the section table

-- Add sectionId to subject table
ALTER TABLE `subject` ADD COLUMN `sectionId` INT NULL;

-- Create index on sectionId
CREATE INDEX `Subject_sectionId_idx` ON `subject`(`sectionId`);

-- Add foreign key constraint
ALTER TABLE `subject` ADD CONSTRAINT `Subject_sectionId_fkey` 
  FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;

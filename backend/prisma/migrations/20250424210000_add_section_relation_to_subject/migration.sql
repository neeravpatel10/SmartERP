-- Add sectionId to subject table
ALTER TABLE `subject` ADD COLUMN `sectionId` INT NULL;

-- Add foreign key constraint
ALTER TABLE `subject` ADD CONSTRAINT `Subject_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index on sectionId
CREATE INDEX `Subject_sectionId_fkey` ON `subject`(`sectionId`); 
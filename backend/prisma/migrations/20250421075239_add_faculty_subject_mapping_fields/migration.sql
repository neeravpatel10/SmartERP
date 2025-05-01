-- AlterTable
ALTER TABLE `facultysubjectmapping` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `componentScope` VARCHAR(191) NOT NULL DEFAULT 'theory',
    ADD COLUMN `isPrimary` BOOLEAN NOT NULL DEFAULT true;

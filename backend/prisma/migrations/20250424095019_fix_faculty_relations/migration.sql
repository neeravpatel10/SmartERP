/*
  Warnings:

  - The primary key for the `faculty` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dob` on the `faculty` table. All the data in the column will be lost.
  - You are about to drop the column `experienceYears` on the `faculty` table. All the data in the column will be lost.
  - You are about to drop the column `middleName` on the `faculty` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `attendancesession` DROP FOREIGN KEY `AttendanceSession_facultyId_fkey`;

-- DropForeignKey
ALTER TABLE `department` DROP FOREIGN KEY `Department_hodId_fkey`;

-- DropForeignKey
ALTER TABLE `faculty` DROP FOREIGN KEY `Faculty_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `facultysubjectmapping` DROP FOREIGN KEY `FacultySubjectMapping_facultyId_fkey`;

-- AlterTable
ALTER TABLE `attendancesession` MODIFY `facultyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `department` MODIFY `hodId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `faculty` DROP PRIMARY KEY,
    DROP COLUMN `dob`,
    DROP COLUMN `experienceYears`,
    DROP COLUMN `middleName`,
    ADD COLUMN `aicteId` VARCHAR(191) NULL,
    ADD COLUMN `dateOfBirth` VARCHAR(191) NULL,
    ADD COLUMN `industryExperience` VARCHAR(191) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `permanentAddress` VARCHAR(191) NULL,
    ADD COLUMN `prefix` VARCHAR(191) NULL,
    ADD COLUMN `presentAddress` VARCHAR(191) NULL,
    ADD COLUMN `teachingExperience` VARCHAR(191) NULL,
    ADD COLUMN `yearOfJoining` VARCHAR(191) NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `phone` VARCHAR(191) NULL,
    MODIFY `designation` VARCHAR(191) NULL,
    MODIFY `departmentId` INTEGER NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `facultysubjectmapping` MODIFY `facultyId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `display_pic` (
    `username` VARCHAR(191) NOT NULL,
    `dp` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faculty_details` (
    `faculty_id` VARCHAR(191) NOT NULL,
    `faculty_name` VARCHAR(191) NULL,
    `faculty_desg` VARCHAR(191) NULL,
    `faculty_dept` VARCHAR(191) NULL,
    `faculty_qulfy` VARCHAR(191) NULL,
    `faculty_yoj` VARCHAR(191) NULL,
    `faculty_dob` VARCHAR(191) NULL,
    `faculty_email` VARCHAR(191) NULL,
    `faculty_contact` VARCHAR(191) NULL,
    `faculty_parmenent_address` VARCHAR(191) NULL,

    PRIMARY KEY (`faculty_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_hodId_fkey` FOREIGN KEY (`hodId`) REFERENCES `Faculty`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Faculty` ADD CONSTRAINT `Faculty_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacultySubjectMapping` ADD CONSTRAINT `FacultySubjectMapping_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `Faculty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceSession` ADD CONSTRAINT `AttendanceSession_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `Faculty`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

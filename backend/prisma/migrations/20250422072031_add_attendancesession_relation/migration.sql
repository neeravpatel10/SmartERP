/*
  Warnings:

  - You are about to drop the `batches` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `attendancesession` DROP FOREIGN KEY `AttendanceSession_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `batches` DROP FOREIGN KEY `batches_department_id_fkey`;

-- DropForeignKey
ALTER TABLE `facultysubjectmapping` DROP FOREIGN KEY `FacultySubjectMapping_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `Student_batchId_fkey`;

-- AlterTable
ALTER TABLE `attendancesession` MODIFY `batchId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `facultysubjectmapping` MODIFY `batchId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `student` MODIFY `batchId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `batches`;

-- CreateTable
CREATE TABLE `Batch` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `academicYear` VARCHAR(191) NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `currentSemester` INTEGER NOT NULL DEFAULT 1,
    `autoRollover` BOOLEAN NOT NULL DEFAULT false,
    `archived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Batch_name_academicYear_departmentId_key`(`name`, `academicYear`, `departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Batch` ADD CONSTRAINT `Batch_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacultySubjectMapping` ADD CONSTRAINT `FacultySubjectMapping_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceSession` ADD CONSTRAINT `AttendanceSession_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

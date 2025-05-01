-- AlterTable
ALTER TABLE `examcomponent` ADD COLUMN `isCustom` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mark` ADD COLUMN `isCalculated` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `studentcomponentmark` ADD COLUMN `recordedBy` INTEGER NULL;

-- CreateTable
CREATE TABLE `IAQuestionConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `componentId` INTEGER NOT NULL,
    `questionNumber` INTEGER NOT NULL,
    `subpart` VARCHAR(191) NULL,
    `part` VARCHAR(191) NULL,
    `maxMarks` DOUBLE NOT NULL,
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IAQuestionConfig_componentId_questionNumber_subpart_key`(`componentId`, `questionNumber`, `subpart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssignmentConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `componentId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `maxMarks` DOUBLE NOT NULL,
    `weightage` DOUBLE NULL,
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AssignmentConfig_componentId_name_key`(`componentId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `IAQuestionConfig` ADD CONSTRAINT `IAQuestionConfig_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `ExamComponent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssignmentConfig` ADD CONSTRAINT `AssignmentConfig_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `ExamComponent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_hodId_fkey` FOREIGN KEY (`hodId`) REFERENCES `Faculty`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

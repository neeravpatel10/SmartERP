-- AddForeignKey
ALTER TABLE `StudentComponentMark` ADD CONSTRAINT `StudentComponentMark_recordedBy_fkey` FOREIGN KEY (`recordedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

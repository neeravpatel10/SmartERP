"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Student profile routes
router.get('/:usn', auth_1.authenticate, profile_controller_1.getStudentProfile);
router.get('/:usn/download', auth_1.authenticate, profile_controller_1.downloadStudentProfile);
router.get('/:usn/semesters/:sem_number', auth_1.authenticate, profile_controller_1.getStudentSemesterData);
exports.default = router;

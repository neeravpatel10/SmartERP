"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const results_controller_1 = require("../controllers/results.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Results calculation routes
router.post('/calculate/:subject_id', auth_1.authenticate, results_controller_1.calculateSubjectResults);
router.post('/calculate/:subject_id/:usn', auth_1.authenticate, results_controller_1.calculateStudentResult);
// Results view routes
router.get('/view/:subject_id', auth_1.authenticate, results_controller_1.viewSubjectResults);
router.get('/student/:usn', auth_1.authenticate, results_controller_1.viewStudentResults);
exports.default = router;

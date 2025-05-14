"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var assignmentConfig_controller_1 = require("../controllers/assignmentConfig.controller");
var auth_1 = require("../middleware/auth");
var validation_1 = require("../utils/validation");
// Create assignment config validation schema
var router = (0, express_1.Router)();
// Assignment Configuration routes
router.get('/components/:componentId/assignment-config', auth_1.authenticate, assignmentConfig_controller_1.getAssignmentConfig);
router.post('/components/:componentId/assignment-config', auth_1.authenticate, (0, validation_1.validate)(validation_1.assignmentConfigSchema), assignmentConfig_controller_1.saveAssignmentConfig);
router.delete('/components/:componentId/assignment-config', auth_1.authenticate, assignmentConfig_controller_1.removeAssignmentConfig);
exports.default = router;

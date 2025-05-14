"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var dashboard_controller_1 = require("../controllers/dashboard.controller");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Get integrated dashboard data
router.get('/', auth_1.authenticate, dashboard_controller_1.getDashboardData);
exports.default = router;

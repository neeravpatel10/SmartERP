"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get integrated dashboard data
router.get('/', auth_1.authenticate, dashboard_controller_1.getDashboardData);
exports.default = router;

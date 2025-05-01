"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../utils/validation");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/login', (0, validation_1.validate)(validation_1.loginSchema), auth_controller_1.login);
router.post('/forgot-password', (0, validation_1.validate)(validation_1.passwordResetRequestSchema), auth_controller_1.requestPasswordReset);
router.post('/reset-password', (0, validation_1.validate)(validation_1.passwordResetConfirmSchema), auth_controller_1.confirmPasswordReset);
// Protected routes
router.get('/me', auth_1.authenticate, auth_controller_1.getCurrentUser);
router.post('/change-password', auth_1.authenticate, (0, validation_1.validate)(validation_1.changePasswordSchema), auth_controller_1.changePassword);
// Admin routes
router.post('/unlock-account', auth_1.authenticate, (0, validation_1.validate)(validation_1.unlockAccountSchema), auth_controller_1.unlockAccount);
exports.default = router;

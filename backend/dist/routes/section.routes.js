"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const section_controller_1 = require("../controllers/section.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Section routes
router.get('/', auth_1.authenticate, section_controller_1.getSections);
router.get('/:id', auth_1.authenticate, section_controller_1.getSectionById);
exports.default = router;

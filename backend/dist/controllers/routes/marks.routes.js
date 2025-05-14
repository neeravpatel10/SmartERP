"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var validation_1 = require("../utils/validation");
var marks_controller_1 = require("../controllers/marks.controller");
var auth_1 = require("../middleware/auth");
var auditMiddleware_1 = require("../middleware/auditMiddleware");
var index_1 = require("../index");
var router = (0, express_1.Router)();
// Read-only routes - no audit needed
router.get('/exam-components', auth_1.authenticate, marks_controller_1.getExamComponents);
router.get('/exam-components/:id', auth_1.authenticate, marks_controller_1.getExamComponentById);
router.get('/student/:usn', auth_1.authenticate, marks_controller_1.getStudentMarks);
// Add route to get marks for a specific component
router.get('/components/:componentId/marks', auth_1.authenticate, marks_controller_1.getComponentMarks);
// Add route to download marks template
router.get('/components/:componentId/template', auth_1.authenticate, marks_controller_1.downloadMarksTemplate);
// Create exam component - audit this action
router.post('/exam-components', auth_1.authenticate, (0, validation_1.validate)(validation_1.examComponentSchema), (0, auditMiddleware_1.setAuditContext)('create', 'examComponent'), marks_controller_1.createExamComponent, auditMiddleware_1.logAudit);
// Add student marks - audit this action (critical for academic integrity)
router.post('/student-marks', auth_1.authenticate, (0, validation_1.validate)(validation_1.studentComponentMarkSchema), (0, auditMiddleware_1.captureEntityState)('studentMark', function (req) { return "".concat(req.body.componentId, "-").concat(req.body.usn); }, function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, componentId, usn;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = id.split('-'), componentId = _a[0], usn = _a[1];
                return [4 /*yield*/, index_1.prisma.studentComponentMark.findFirst({
                        where: {
                            componentId: parseInt(componentId),
                            student: {
                                usn: usn
                            }
                        }
                    })];
            case 1: return [2 /*return*/, _b.sent()];
        }
    });
}); }), (0, auditMiddleware_1.setAuditContext)('grade', 'studentMark', function (req) { return "".concat(req.body.componentId, "-").concat(req.body.usn); }), marks_controller_1.addStudentComponentMark, auditMiddleware_1.logAudit);
// Bulk upload marks - audit this action (critical for academic integrity)
router.post('/upload', auth_1.authenticate, (0, validation_1.validate)(validation_1.bulkMarksSchema), (0, auditMiddleware_1.setAuditContext)('bulk_grade', 'studentMarks', function (req) { return req.body.componentId.toString(); }), marks_controller_1.bulkUploadMarks, auditMiddleware_1.logAudit);
exports.default = router;

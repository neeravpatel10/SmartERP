"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.deleteComponent = exports.updateComponent = exports.createCustomComponent = exports.getComponentById = exports.getComponentsForSubject = exports.getDefaultComponentsForSubject = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
// Get default components for a subject based on its category
var getDefaultComponentsForSubject = function (subjectId) { return __awaiter(void 0, void 0, void 0, function () {
    var subject, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, prisma.subject.findUnique({
                        where: { id: subjectId },
                        include: { category: true },
                    })];
            case 1:
                subject = _a.sent();
                if (!subject) {
                    throw new Error('Subject not found');
                }
                if (!subject.category) {
                    throw new Error('Subject does not have a category assigned');
                }
                return [4 /*yield*/, generateDefaultComponents(subject.id, subject.category.code)];
            case 2: 
            // Get or create components based on category
            return [2 /*return*/, _a.sent()];
            case 3:
                error_1 = _a.sent();
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getDefaultComponentsForSubject = getDefaultComponentsForSubject;
// Helper function to generate default components based on subject category
var generateDefaultComponents = function (subjectId, categoryCode) { return __awaiter(void 0, void 0, void 0, function () {
    var existingComponents, componentTemplates, components;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.examComponent.findMany({
                    where: { subjectId: subjectId },
                })];
            case 1:
                existingComponents = _a.sent();
                if (existingComponents.length > 0) {
                    return [2 /*return*/, existingComponents];
                }
                componentTemplates = getComponentTemplatesByCategory(categoryCode, subjectId);
                return [4 /*yield*/, prisma.$transaction(componentTemplates.map(function (template) {
                        return prisma.examComponent.create({
                            data: template
                        });
                    }))];
            case 2:
                components = _a.sent();
                return [2 /*return*/, components];
        }
    });
}); };
// Define component templates based on subject category
var getComponentTemplatesByCategory = function (categoryCode, subjectId) {
    var templates = [];
    switch (categoryCode) {
        case 'IPCC':
            templates.push({
                subjectId: subjectId,
                name: 'CIE I',
                componentType: 'CIE',
                maxMarks: 15,
                weightagePercent: 20,
            }, {
                subjectId: subjectId,
                name: 'CIE II',
                componentType: 'CIE',
                maxMarks: 15,
                weightagePercent: 20,
            }, {
                subjectId: subjectId,
                name: 'Assignment',
                componentType: 'Assignment',
                maxMarks: 10,
                weightagePercent: 15,
            }, {
                subjectId: subjectId,
                name: 'Lab Record',
                componentType: 'Lab',
                maxMarks: 15,
                weightagePercent: 25,
            }, {
                subjectId: subjectId,
                name: 'Lab CIE',
                componentType: 'Lab',
                maxMarks: 10,
                weightagePercent: 20,
            });
            break;
        case 'PCC':
        case 'ESC':
        case 'UHV':
            templates.push({
                subjectId: subjectId,
                name: 'CIE I',
                componentType: 'CIE',
                maxMarks: 25,
                weightagePercent: 40,
            }, {
                subjectId: subjectId,
                name: 'Assignment 1',
                componentType: 'Assignment',
                maxMarks: 15,
                weightagePercent: 30,
            }, {
                subjectId: subjectId,
                name: 'Assignment 2',
                componentType: 'Assignment',
                maxMarks: 10,
                weightagePercent: 30,
            });
            break;
        case 'PCCL':
        case 'AEC':
            templates.push({
                subjectId: subjectId,
                name: 'Lab Record',
                componentType: 'Lab',
                maxMarks: 30,
                weightagePercent: 60,
            }, {
                subjectId: subjectId,
                name: 'Lab CIE',
                componentType: 'Lab',
                maxMarks: 20,
                weightagePercent: 40,
            });
            break;
        case 'PROJ':
            templates.push({
                subjectId: subjectId,
                name: 'Presentation',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId: subjectId,
                name: 'Requirement Analysis',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId: subjectId,
                name: 'Report',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId: subjectId,
                name: 'IEEE Paper',
                componentType: 'Project',
                maxMarks: 40,
                weightagePercent: 40,
            });
            break;
        case 'MINI':
            templates.push({
                subjectId: subjectId,
                name: 'Objective of Mini Project',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId: subjectId,
                name: 'Work Undertaken',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId: subjectId,
                name: 'Technical Knowledge',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId: subjectId,
                name: 'Viva Voce',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            }, {
                subjectId: subjectId,
                name: 'Final Report',
                componentType: 'Project',
                maxMarks: 20,
                weightagePercent: 20,
            });
            break;
        default:
            // Generic components for unknown categories
            templates.push({
                subjectId: subjectId,
                name: 'CIE I',
                componentType: 'CIE',
                maxMarks: 20,
                weightagePercent: 50,
            }, {
                subjectId: subjectId,
                name: 'Assignment',
                componentType: 'Assignment',
                maxMarks: 20,
                weightagePercent: 50,
            });
    }
    return templates;
};
// Get all components for a subject
var getComponentsForSubject = function (subjectId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.examComponent.findMany({
                    where: { subjectId: subjectId },
                    orderBy: { name: 'asc' },
                })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.getComponentsForSubject = getComponentsForSubject;
// Get a specific component by ID
var getComponentById = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.examComponent.findUnique({
                    where: { id: id },
                })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.getComponentById = getComponentById;
// Create a custom component
var createCustomComponent = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.examComponent.create({
                    data: __assign(__assign({}, data), { isCustom: true }),
                })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.createCustomComponent = createCustomComponent;
// Update a component
var updateComponent = function (id, data) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.examComponent.update({
                    where: { id: id },
                    data: data,
                })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.updateComponent = updateComponent;
// Delete a component
var deleteComponent = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var hasMarks;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.studentComponentMark.findFirst({
                    where: { componentId: id },
                })];
            case 1:
                hasMarks = _a.sent();
                if (hasMarks) {
                    throw new Error('Cannot delete component with recorded marks');
                }
                return [4 /*yield*/, prisma.examComponent.delete({
                        where: { id: id },
                    })];
            case 2: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.deleteComponent = deleteComponent;

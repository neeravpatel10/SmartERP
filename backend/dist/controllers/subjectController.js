"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubjectsByDepartment = exports.getSubjectsByStatus = exports.getSubjectStatusHistory = exports.updateSubjectStatus = exports.deleteSubject = exports.updateSubject = exports.createSubject = exports.getSubjectById = exports.getAllSubjects = void 0;
const subjectService = __importStar(require("../services/subjectService"));
const client_1 = require("@prisma/client");
// Get all subjects
const getAllSubjects = async (req, res) => {
    try {
        const subjects = await subjectService.getAllSubjects();
        res.status(200).json(subjects);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getAllSubjects = getAllSubjects;
// Get subject by ID
const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await subjectService.getSubjectById(Number(id));
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json(subject);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSubjectById = getSubjectById;
// Create new subject
const createSubject = async (req, res) => {
    try {
        const subjectData = req.body;
        const userId = req.user.id; // Get user ID from auth middleware
        const subject = await subjectService.createSubject(subjectData, userId);
        res.status(201).json(subject);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createSubject = createSubject;
// Update subject
const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subjectData = req.body;
        const subject = await subjectService.updateSubject(Number(id), subjectData);
        res.status(200).json(subject);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateSubject = updateSubject;
// Delete subject
const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        await subjectService.deleteSubject(Number(id));
        res.status(200).json({ message: 'Subject deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteSubject = deleteSubject;
// Update subject status
const updateSubjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id; // Get user ID from auth middleware
        // Validate status
        if (!Object.values(client_1.SubjectStatus).includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const subject = await subjectService.updateSubjectStatus(Number(id), status, userId);
        res.status(200).json(subject);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateSubjectStatus = updateSubjectStatus;
// Get subject status history
const getSubjectStatusHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const statusHistory = await subjectService.getSubjectStatusHistory(Number(id));
        res.status(200).json(statusHistory);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSubjectStatusHistory = getSubjectStatusHistory;
// Get subjects by status
const getSubjectsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        // Validate status
        if (!Object.values(client_1.SubjectStatus).includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const subjects = await subjectService.getSubjectsByStatus(status);
        res.status(200).json(subjects);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSubjectsByStatus = getSubjectsByStatus;
// Get subjects by department
const getSubjectsByDepartment = async (req, res) => {
    try {
        const { departmentId } = req.params;
        const subjects = await subjectService.getSubjectsByDepartment(Number(departmentId));
        res.status(200).json(subjects);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSubjectsByDepartment = getSubjectsByDepartment;

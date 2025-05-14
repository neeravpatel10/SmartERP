"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSectionById = exports.getSections = void 0;
const index_1 = require("../index");
/**
 * Get sections filtered by department and semester
 * @route GET /api/sections
 */
const getSections = async (req, res) => {
    try {
        const { departmentId, currentSemester, batchId } = req.query;
        // Build the query filter
        const filter = {};
        // Add filters if provided
        if (departmentId) {
            filter.departmentId = parseInt(departmentId);
        }
        if (currentSemester) {
            filter.currentSemester = parseInt(currentSemester);
        }
        if (batchId) {
            filter.batchId = batchId;
        }
        // Get sections with department info
        const sections = await index_1.prisma.section.findMany({
            where: filter,
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json({
            success: true,
            message: 'Sections fetched successfully',
            data: sections
        });
    }
    catch (error) {
        console.error('Error fetching sections:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getSections = getSections;
/**
 * Get section by ID
 * @route GET /api/sections/:id
 */
const getSectionById = async (req, res) => {
    try {
        const { id } = req.params;
        const sectionId = parseInt(id);
        if (isNaN(sectionId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section ID'
            });
        }
        const section = await index_1.prisma.section.findUnique({
            where: { id: sectionId },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!section) {
            return res.status(404).json({
                success: false,
                message: 'Section not found'
            });
        }
        res.json({
            success: true,
            data: section
        });
    }
    catch (error) {
        console.error('Error fetching section:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getSectionById = getSectionById;

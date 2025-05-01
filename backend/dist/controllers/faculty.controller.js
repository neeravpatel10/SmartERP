"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUploadFaculty = exports.getFacultySubjects = exports.getFacultyById = exports.getFaculty = exports.updateFaculty = exports.createFaculty = void 0;
const index_1 = require("../index");
const bcrypt_1 = __importDefault(require("bcrypt"));
const createFaculty = async (req, res) => {
    try {
        const { firstName, middleName, lastName, email, phone, designation, gender, dob, qualification, experienceYears, departmentId } = req.body;
        // Check if email already exists
        const existingFacultyEmail = await index_1.prisma.faculty.findFirst({
            where: { email }
        });
        if (existingFacultyEmail) {
            return res.status(400).json({
                success: false,
                message: 'Faculty with this email already exists'
            });
        }
        // Check if department exists
        const department = await index_1.prisma.department.findUnique({
            where: { id: departmentId }
        });
        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Department not found'
            });
        }
        // Create faculty
        const faculty = await index_1.prisma.faculty.create({
            data: {
                firstName,
                middleName,
                lastName,
                email,
                phone,
                designation,
                gender,
                dob: dob ? new Date(dob) : undefined,
                qualification,
                experienceYears,
                departmentId
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
        // Create user account for the faculty
        const username = email.split('@')[0].toLowerCase(); // Use email prefix as username
        const defaultPassword = `${firstName.toLowerCase()}${departmentId}@faculty`; // Default password pattern
        const hashedPassword = await bcrypt_1.default.hash(defaultPassword, 10);
        const user = await index_1.prisma.user.create({
            data: {
                username,
                email,
                passwordHash: hashedPassword,
                loginType: 2, // Faculty login type
                departmentId,
                isActive: true,
                firstLogin: true,
                faculty: {
                    connect: {
                        id: faculty.id
                    }
                }
            },
            select: {
                id: true,
                username: true,
                loginType: true,
                isActive: true,
                firstLogin: true
            }
        });
        res.status(201).json({
            success: true,
            message: 'Faculty created successfully',
            data: {
                faculty,
                user,
                defaultPassword // Provide the default password in the response for first-time setup
            }
        });
    }
    catch (error) {
        console.error('Create faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createFaculty = createFaculty;
const updateFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, middleName, lastName, email, phone, designation, gender, dob, qualification, experienceYears, departmentId } = req.body;
        // Check if faculty exists
        const existingFaculty = await index_1.prisma.faculty.findUnique({
            where: { id: parseInt(id) }
        });
        if (!existingFaculty) {
            return res.status(404).json({
                success: false,
                message: 'Faculty not found'
            });
        }
        // If email is being updated, check for duplicates
        if (email && email !== existingFaculty.email) {
            const duplicateEmail = await index_1.prisma.faculty.findFirst({
                where: {
                    email,
                    id: { not: parseInt(id) }
                }
            });
            if (duplicateEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another faculty'
                });
            }
        }
        // If departmentId is provided, check if department exists
        if (departmentId) {
            const department = await index_1.prisma.department.findUnique({
                where: { id: departmentId }
            });
            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: 'Department not found'
                });
            }
        }
        // Update faculty
        const updatedFaculty = await index_1.prisma.faculty.update({
            where: { id: parseInt(id) },
            data: {
                firstName,
                middleName,
                lastName,
                email,
                phone,
                designation,
                gender,
                dob: dob ? new Date(dob) : undefined,
                qualification,
                experienceYears,
                departmentId
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
        // If email is updated, also update the linked user account
        if (email && email !== existingFaculty.email) {
            await index_1.prisma.user.updateMany({
                where: {
                    faculty: {
                        id: parseInt(id)
                    }
                },
                data: {
                    email
                }
            });
        }
        // If department is updated, also update the linked user account
        if (departmentId && departmentId !== existingFaculty.departmentId) {
            await index_1.prisma.user.updateMany({
                where: {
                    faculty: {
                        id: parseInt(id)
                    }
                },
                data: {
                    departmentId
                }
            });
        }
        res.json({
            success: true,
            message: 'Faculty updated successfully',
            data: updatedFaculty
        });
    }
    catch (error) {
        console.error('Update faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateFaculty = updateFaculty;
const getFaculty = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', departmentId, designation } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        // Build filter conditions
        const filterConditions = {};
        if (departmentId) {
            filterConditions.departmentId = parseInt(departmentId);
        }
        if (designation) {
            filterConditions.designation = designation;
        }
        // Build search condition
        const searchCondition = search ? {
            OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } }
            ]
        } : {};
        // Combine filter and search conditions
        const whereCondition = {
            ...filterConditions,
            ...searchCondition
        };
        // Get total count for pagination
        const total = await index_1.prisma.faculty.count({
            where: whereCondition
        });
        // Get faculty members with pagination, filtering, and search
        const faculty = await index_1.prisma.faculty.findMany({
            where: whereCondition,
            select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
                phone: true,
                designation: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        isActive: true
                    }
                },
                _count: {
                    select: {
                        subjectMappings: true
                    }
                }
            },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            orderBy: [
                { designation: 'asc' },
                { firstName: 'asc' }
            ]
        });
        res.json({
            success: true,
            data: {
                faculty,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(total / limitNumber)
                }
            }
        });
    }
    catch (error) {
        console.error('Get faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFaculty = getFaculty;
const getFacultyById = async (req, res) => {
    try {
        const { id } = req.params;
        const faculty = await index_1.prisma.faculty.findUnique({
            where: { id: parseInt(id) },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        isActive: true,
                        lastLogin: true
                    }
                },
                subjectMappings: {
                    include: {
                        subject: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                semester: true,
                                credits: true,
                                isLab: true
                            }
                        },
                        batch: {
                            select: {
                                id: true,
                                name: true,
                                startYear: true,
                                endYear: true
                            }
                        }
                    },
                    orderBy: {
                        subject: {
                            name: 'asc'
                        }
                    }
                }
            }
        });
        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Faculty not found'
            });
        }
        res.json({
            success: true,
            data: faculty
        });
    }
    catch (error) {
        console.error('Get faculty by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFacultyById = getFacultyById;
const getFacultySubjects = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = parseInt(id);
        // Check if faculty exists
        const faculty = await index_1.prisma.faculty.findUnique({
            where: { id: facultyId }
        });
        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }
        // Find active mappings for this faculty
        const mappings = await index_1.prisma.facultySubjectMapping.findMany({
            where: {
                facultyId: facultyId,
                active: true,
                // Optionally filter by current academic year
                // academicYear: getCurrentAcademicYear(),
            },
            include: {
                subject: {
                    include: {
                        department: {
                            select: { id: true, name: true, code: true }
                        },
                        category: {
                            select: { id: true, name: true, code: true }
                        }
                    }
                },
                batch: {
                    select: { id: true, name: true, academicYear: true }
                }
            },
            orderBy: [
                { subject: { name: 'asc' } },
                { batchId: 'asc' },
                { section: 'asc' }
            ]
        });
        // Extract subject details along with mapping info (like section, batch)
        const facultySubjects = mappings.map(m => ({
            ...m.subject,
            mappingId: m.id,
            section: m.section,
            semester: m.semester,
            batch: m.batch,
            componentScope: m.componentScope,
            isPrimary: m.isPrimary,
            academicYear: m.academicYear,
        }));
        res.json({
            success: true,
            data: facultySubjects
        });
    }
    catch (error) {
        console.error('Get faculty subjects error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getFacultySubjects = getFacultySubjects;
const bulkUploadFaculty = async (req, res) => {
    try {
        const { faculty } = req.body;
        if (!Array.isArray(faculty) || faculty.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or empty faculty array'
            });
        }
        // Collect all emails for duplicate check
        const emails = faculty.map(f => f.email);
        // Check for duplicates in the database
        const existingFaculty = await index_1.prisma.faculty.findMany({
            where: {
                email: { in: emails }
            },
            select: {
                email: true
            }
        });
        if (existingFaculty.length > 0) {
            const existingEmails = existingFaculty.map(f => f.email);
            return res.status(400).json({
                success: false,
                message: 'Some faculty members already exist in the database',
                data: {
                    existingEmails
                }
            });
        }
        // Check if departments exist
        const departmentIds = [...new Set(faculty.map(f => f.departmentId))];
        const departments = await index_1.prisma.department.findMany({
            where: { id: { in: departmentIds } },
            select: { id: true }
        });
        if (departments.length !== departmentIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more department IDs are invalid'
            });
        }
        // Create faculty in bulk
        const createdFaculty = await index_1.prisma.$transaction(faculty.map(f => index_1.prisma.faculty.create({
            data: {
                firstName: f.firstName,
                middleName: f.middleName,
                lastName: f.lastName,
                email: f.email,
                phone: f.phone,
                designation: f.designation,
                gender: f.gender,
                dob: f.dob ? new Date(f.dob) : undefined,
                qualification: f.qualification,
                experienceYears: f.experienceYears,
                departmentId: f.departmentId
            }
        })));
        // Create user accounts for the faculty
        const userCreationPromises = createdFaculty.map(async (f) => {
            const username = f.email.split('@')[0].toLowerCase();
            const defaultPassword = `${f.firstName.toLowerCase()}${f.departmentId}@faculty`;
            const hashedPassword = await bcrypt_1.default.hash(defaultPassword, 10);
            return index_1.prisma.user.create({
                data: {
                    username,
                    email: f.email,
                    passwordHash: hashedPassword,
                    loginType: 2, // Faculty login type
                    departmentId: f.departmentId,
                    isActive: true,
                    firstLogin: true,
                    faculty: {
                        connect: {
                            id: f.id
                        }
                    }
                },
                select: {
                    id: true,
                    username: true
                }
            });
        });
        const createdUsers = await Promise.all(userCreationPromises);
        res.status(201).json({
            success: true,
            message: `Successfully added ${createdFaculty.length} faculty members`,
            data: {
                count: createdFaculty.length,
                faculty: createdFaculty.map(f => ({ id: f.id, email: f.email }))
            }
        });
    }
    catch (error) {
        console.error('Bulk upload faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.bulkUploadFaculty = bulkUploadFaculty;

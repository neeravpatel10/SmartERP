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
        const { name, prefix, email, phone, designation, gender, dateOfBirth, qualification, departmentId, teachingExperience, industryExperience, yearOfJoining, permanentAddress, presentAddress, aicteId } = req.body;
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
        // Check if department exists if departmentId is provided
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
        // Generate a unique ID for the faculty
        const facultyCount = await index_1.prisma.faculty.count();
        const facultyId = `FAC${String(facultyCount + 1).padStart(4, '0')}`;
        // Create faculty with correct fields based on the Prisma schema
        const faculty = await index_1.prisma.faculty.create({
            data: {
                id: facultyId,
                email,
                phone,
                designation,
                gender,
                dateOfBirth,
                qualification,
                teachingExperience,
                industryExperience,
                yearOfJoining,
                permanentAddress,
                presentAddress,
                aicteId,
                name,
                prefix,
                departmentId,
                isActive: true
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
        const defaultPassword = `${name ? name.toLowerCase().replace(/\s+/g, '') : 'faculty'}${departmentId || ''}@faculty`; // Default password pattern
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
                facultyAccount: {
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
                defaultPassword
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
        const { name, prefix, email, phone, designation, gender, dateOfBirth, qualification, departmentId, teachingExperience, industryExperience, yearOfJoining, permanentAddress, presentAddress, aicteId, isActive } = req.body;
        // Check if faculty exists
        const existingFaculty = await index_1.prisma.faculty.findUnique({
            where: { id }
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
                    id: { not: id }
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
            where: { id },
            data: {
                name,
                prefix,
                email,
                phone,
                designation,
                gender,
                dateOfBirth,
                qualification,
                teachingExperience,
                industryExperience,
                yearOfJoining,
                permanentAddress,
                presentAddress,
                aicteId,
                departmentId,
                isActive: isActive !== undefined ? isActive : existingFaculty.isActive
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
        // Update associated user if email is changed
        if (email && email !== existingFaculty.email) {
            const user = await index_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { username: existingFaculty.email.split('@')[0] },
                        { email: existingFaculty.email }
                    ]
                }
            });
            if (user) {
                await index_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        email,
                        username: email.split('@')[0]
                    }
                });
            }
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
        const { page = 1, limit = 10, search = '', departmentId } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        // Build search and filter conditions
        let whereCondition = {};
        if (search) {
            whereCondition.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
                { designation: { contains: search } }
            ];
        }
        if (departmentId) {
            whereCondition.departmentId = parseInt(departmentId);
            // If departmentId is provided, return all faculty for that department (no pagination)
            const faculty = await index_1.prisma.faculty.findMany({
                where: whereCondition,
                include: {
                    department: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                }
            });
            // Split name into firstName and lastName for frontend compatibility
            const facultyList = faculty.map(f => {
                const [firstName, ...rest] = (f.name || '').split(' ');
                const lastName = rest.join(' ');
                return {
                    ...f,
                    firstName,
                    lastName
                };
            });
            return res.json({
                success: true,
                data: {
                    faculty: facultyList,
                    pagination: {
                        total: faculty.length,
                        page: 1,
                        limit: faculty.length,
                        totalPages: 1
                    }
                }
            });
        }
        // Default: paginated
        const total = await index_1.prisma.faculty.count({
            where: whereCondition
        });
        const faculty = await index_1.prisma.faculty.findMany({
            where: whereCondition,
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            orderBy: {
                name: 'asc'
            }
        });
        // Split name for paginated as well
        const facultyList = faculty.map(f => {
            const [firstName, ...rest] = (f.name || '').split(' ');
            const lastName = rest.join(' ');
            return {
                ...f,
                firstName,
                lastName
            };
        });
        res.json({
            success: true,
            data: {
                faculty: facultyList,
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
            where: { id },
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
                        email: true,
                        isActive: true,
                        loginType: true
                    }
                },
                subjectMappings: {
                    include: {
                        subject: true,
                        batch: true
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
        const faculty = await index_1.prisma.faculty.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true
            }
        });
        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Faculty not found'
            });
        }
        const subjectMappings = await index_1.prisma.facultySubjectMapping.findMany({
            where: {
                facultyId: id,
                active: true
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        semester: true,
                        credits: true,
                        isLab: true
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true,
                        academicYear: true,
                        currentSemester: true
                    }
                }
            },
            orderBy: [
                { academicYear: 'desc' },
                { subject: { name: 'asc' } }
            ]
        });
        // Group by academic year
        const groupedByYear = {};
        subjectMappings.forEach(mapping => {
            if (!groupedByYear[mapping.academicYear]) {
                groupedByYear[mapping.academicYear] = [];
            }
            groupedByYear[mapping.academicYear].push({
                id: mapping.id,
                subject: mapping.subject,
                batch: mapping.batch,
                section: mapping.section,
                semester: mapping.semester,
                isPrimary: mapping.isPrimary
            });
        });
        res.json({
            success: true,
            data: {
                faculty,
                subjectsByYear: groupedByYear
            }
        });
    }
    catch (error) {
        console.error('Get faculty subjects error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFacultySubjects = getFacultySubjects;
const bulkUploadFaculty = async (req, res) => {
    try {
        const { facultyData } = req.body;
        if (!Array.isArray(facultyData) || facultyData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No faculty data provided or invalid format'
            });
        }
        const results = {
            success: [],
            errors: []
        };
        // Process each faculty
        for (const faculty of facultyData) {
            try {
                const { name, email, phone, designation, departmentCode, qualification } = faculty;
                // Validate required fields
                if (!email || !departmentCode) {
                    results.errors.push({
                        email: email || 'Unknown',
                        error: 'Missing required fields: email or departmentCode'
                    });
                    continue;
                }
                // Find department by code
                const department = await index_1.prisma.department.findUnique({
                    where: { code: departmentCode }
                });
                if (!department) {
                    results.errors.push({
                        email,
                        error: `Department with code ${departmentCode} not found`
                    });
                    continue;
                }
                // Check for existing faculty with the same email
                const existingFaculty = await index_1.prisma.faculty.findFirst({
                    where: { email }
                });
                if (existingFaculty) {
                    results.errors.push({
                        email,
                        error: 'Faculty with this email already exists'
                    });
                    continue;
                }
                // Generate faculty ID
                const facultyCount = await index_1.prisma.faculty.count();
                const id = `FAC${String(facultyCount + 1).padStart(4, '0')}`;
                // Create faculty with proper fields according to the schema
                const createdFaculty = await index_1.prisma.faculty.create({
                    data: {
                        id,
                        email,
                        phone,
                        designation,
                        qualification,
                        name,
                        departmentId: department.id,
                        isActive: true
                    }
                });
                // Create user account
                const username = email.split('@')[0].toLowerCase();
                const defaultPassword = `${name ? name.toLowerCase().replace(/\s+/g, '') : 'faculty'}${department.id}@faculty`;
                const hashedPassword = await bcrypt_1.default.hash(defaultPassword, 10);
                await index_1.prisma.user.create({
                    data: {
                        username,
                        email,
                        passwordHash: hashedPassword,
                        loginType: 2, // Faculty login type
                        departmentId: department.id,
                        isActive: true,
                        firstLogin: true,
                        facultyAccount: {
                            connect: {
                                id: createdFaculty.id
                            }
                        }
                    }
                });
                results.success.push({
                    id: createdFaculty.id,
                    name,
                    email,
                    defaultPassword
                });
            }
            catch (error) {
                console.error('Error creating faculty:', error);
                results.errors.push({
                    email: faculty.email || 'Unknown',
                    error: 'Internal error creating faculty'
                });
            }
        }
        res.status(200).json({
            success: true,
            message: `Successfully created ${results.success.length} faculty entries with ${results.errors.length} errors`,
            data: results
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

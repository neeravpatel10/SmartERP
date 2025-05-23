"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudent = exports.exportStudentsToExcel = exports.importStudentsFromExcel = exports.bulkUploadStudents = exports.getStudentByUSN = exports.getStudents = exports.updateStudent = exports.getStudentsWithoutLogins = exports.createMultipleStudentLogins = exports.createStudentLogin = exports.createStudent = void 0;
const index_1 = require("../index");
const bcrypt_1 = __importDefault(require("bcrypt"));
const exceljs_1 = __importDefault(require("exceljs"));
const errors_1 = require("../utils/errors");
const validation_1 = require("../utils/validation");
const createStudent = async (req, res) => {
    try {
        const { usn, firstName, middleName, lastName, email, phone, dob, gender, address, batchId, departmentId, semester, section, admissionYear, fatherName, motherName, guardianName, guardianContact } = req.body;
        // Check if USN already exists
        const existingStudentUSN = await index_1.prisma.student.findUnique({
            where: { usn }
        });
        if (existingStudentUSN) {
            return res.status(400).json({
                success: false,
                message: 'Student with this USN already exists'
            });
        }
        // Check if email already exists
        const existingStudentEmail = await index_1.prisma.student.findFirst({
            where: { email }
        });
        if (existingStudentEmail) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email already exists'
            });
        }
        // Check if batch exists
        const batch = await index_1.prisma.batch.findUnique({
            where: { id: batchId }
        });
        if (!batch) {
            return res.status(400).json({
                success: false,
                message: 'Batch not found'
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
        // Create student without creating user account
        const student = await index_1.prisma.student.create({
            data: {
                usn,
                firstName,
                middleName,
                lastName,
                email,
                phone,
                dob: dob ? new Date(dob) : undefined,
                gender,
                address,
                batchId,
                departmentId,
                semester,
                section,
                admissionYear,
                fatherName,
                motherName,
                guardianName,
                guardianContact
            },
            include: {
                batch: {
                    select: {
                        id: true,
                        name: true,
                        academicYear: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: {
                student
            }
        });
    }
    catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createStudent = createStudent;
// New function to create login for a single student
const createStudentLogin = async (req, res) => {
    try {
        const { usn } = req.params;
        // Check if student exists
        const student = await index_1.prisma.student.findUnique({
            where: { usn }
        });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        // Check if student already has a user account
        if (student.userId) {
            return res.status(400).json({
                success: false,
                message: 'Student already has a user account'
            });
        }
        // Check if username (USN) already exists in user table
        const existingUser = await index_1.prisma.user.findFirst({
            where: { username: usn.toLowerCase() }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        // Create user account
        const username = usn.toLowerCase();
        const defaultPassword = usn;
        const hashedPassword = await bcrypt_1.default.hash(defaultPassword, 10);
        const user = await index_1.prisma.user.create({
            data: {
                username,
                email: student.email || `${username}@placeholder.edu`,
                passwordHash: hashedPassword,
                loginType: -1, // Student login type
                departmentId: student.departmentId,
                isActive: true,
                firstLogin: true,
                student: {
                    connect: {
                        usn
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
            message: 'Student login created successfully',
            data: {
                user,
                defaultPassword // Include default password in the response
            }
        });
    }
    catch (error) {
        console.error('Create student login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createStudentLogin = createStudentLogin;
// New function to create multiple student logins at once
const createMultipleStudentLogins = async (req, res) => {
    try {
        const { studentIds } = req.body;
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of student USNs'
            });
        }
        const results = {
            success: [],
            failed: []
        };
        // Process each student
        for (const usn of studentIds) {
            try {
                // Check if student exists
                const student = await index_1.prisma.student.findUnique({
                    where: { usn }
                });
                if (!student) {
                    results.failed.push({ usn, reason: 'Student not found' });
                    continue;
                }
                // Check if student already has a user account
                if (student.userId) {
                    results.failed.push({ usn, reason: 'Student already has a user account' });
                    continue;
                }
                // Check if username (USN) already exists in the user table
                const existingUser = await index_1.prisma.user.findFirst({
                    where: { username: usn.toLowerCase() }
                });
                if (existingUser) {
                    results.failed.push({ usn, reason: 'Username already exists' });
                    continue;
                }
                // Create user account
                const username = usn.toLowerCase();
                const defaultPassword = usn;
                const hashedPassword = await bcrypt_1.default.hash(defaultPassword, 10);
                const user = await index_1.prisma.user.create({
                    data: {
                        username,
                        email: student.email || `${username}@placeholder.edu`, // Fallback if email is missing
                        passwordHash: hashedPassword,
                        loginType: -1, // Student login type
                        departmentId: student.departmentId,
                        isActive: true,
                        firstLogin: true,
                        student: {
                            connect: {
                                usn
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
                results.success.push({
                    usn,
                    userId: user.id,
                    username: user.username,
                    defaultPassword
                });
            }
            catch (error) {
                console.error(`Error creating login for student ${usn}:`, error);
                results.failed.push({
                    usn,
                    reason: error.message || 'Internal error'
                });
            }
        }
        res.status(200).json({
            success: true,
            message: `Created ${results.success.length} student logins, ${results.failed.length} failed`,
            data: results
        });
    }
    catch (error) {
        console.error('Create student logins error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createMultipleStudentLogins = createMultipleStudentLogins;
// New function to get students without logins
const getStudentsWithoutLogins = async (req, res) => {
    try {
        const { departmentId, batchId, search } = req.query;
        let whereClause = {
            userId: null // Only fetch students without user accounts
        };
        // Add optional filters
        if (departmentId) {
            whereClause.departmentId = parseInt(departmentId);
        }
        if (batchId) {
            whereClause.batchId = batchId;
        }
        if (search) {
            whereClause.OR = [
                { usn: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } }
            ];
        }
        const students = await index_1.prisma.student.findMany({
            where: whereClause,
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
                        name: true,
                        academicYear: true
                    }
                }
            },
            orderBy: { usn: 'asc' }
        });
        res.json({
            success: true,
            data: {
                students,
                count: students.length
            }
        });
    }
    catch (error) {
        console.error('Error fetching students without logins:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStudentsWithoutLogins = getStudentsWithoutLogins;
const updateStudent = async (req, res) => {
    try {
        // Remove dob from req.body if missing, empty, or invalid
        if ('dob' in req.body && (!req.body.dob || isNaN(new Date(req.body.dob).getTime()))) {
            delete req.body.dob;
        }
        console.log('REQ.BODY BEFORE PRISMA:', req.body);
        const { usn } = req.params;
        const { firstName, middleName, lastName, email, phone, dob, gender, address, batchId, departmentId, semester, section, fatherName, motherName, guardianName, guardianContact } = req.body;
        // Check if student exists
        const existingStudent = await index_1.prisma.student.findUnique({
            where: { usn }
        });
        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        // If email is being updated, check for duplicates
        if (email && email !== existingStudent.email) {
            const duplicateEmail = await index_1.prisma.student.findFirst({
                where: {
                    email,
                    usn: { not: usn }
                }
            });
            if (duplicateEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another student'
                });
            }
        }
        // If batchId is provided, check if batch exists
        if (batchId) {
            const batch = await index_1.prisma.batch.findUnique({
                where: { id: batchId }
            });
            if (!batch) {
                return res.status(400).json({
                    success: false,
                    message: 'Batch not found'
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
        // Update student
        const updatedStudent = await index_1.prisma.student.update({
            where: { usn },
            data: {
                firstName,
                middleName,
                lastName,
                email,
                phone,
                dob: dob && !isNaN(new Date(dob).getTime()) ? new Date(dob) : undefined,
                gender,
                address,
                batchId,
                departmentId,
                semester,
                section,
                fatherName,
                motherName,
                guardianName,
                guardianContact
            },
            include: {
                batch: {
                    select: {
                        id: true,
                        name: true,
                        academicYear: true
                    }
                },
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
        if (email && email !== existingStudent.email) {
            await index_1.prisma.user.updateMany({
                where: {
                    student: {
                        usn
                    }
                },
                data: {
                    email
                }
            });
        }
        // If department is updated, also update the linked user account
        if (departmentId && departmentId !== existingStudent.departmentId) {
            await index_1.prisma.user.updateMany({
                where: {
                    student: {
                        usn
                    }
                },
                data: {
                    departmentId
                }
            });
        }
        res.json({
            success: true,
            message: 'Student updated successfully',
            data: updatedStudent
        });
    }
    catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateStudent = updateStudent;
const getStudents = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', departmentId, batchId, semester, section } = req.query;
        let pageNumber = parseInt(page);
        let limitNumber = parseInt(limit);
        // Ensure pageNumber and limitNumber are valid positive integers
        if (isNaN(pageNumber) || pageNumber < 1) {
            pageNumber = 1;
        }
        if (isNaN(limitNumber) || limitNumber < 1) {
            limitNumber = 10; // Or a reasonable default limit
        }
        // Build filter conditions
        const filterConditions = {};
        if (departmentId) {
            filterConditions.departmentId = parseInt(departmentId);
        }
        if (batchId) {
            filterConditions.batchId = batchId;
        }
        if (semester) {
            filterConditions.semester = parseInt(semester);
        }
        if (section) {
            filterConditions.section = section;
        }
        // Build search condition
        const searchCondition = search ? {
            OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { usn: { contains: search } },
                { email: { contains: search } }
            ]
        } : {};
        // Combine filter and search conditions
        const whereCondition = {
            ...filterConditions,
            ...searchCondition
        };
        // Get total count for pagination
        const total = await index_1.prisma.student.count({
            where: whereCondition
        });
        // Get students with pagination, filtering, and search
        const students = await index_1.prisma.student.findMany({
            where: whereCondition,
            select: {
                usn: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
                phone: true,
                semester: true,
                section: true,
                batch: {
                    select: {
                        id: true,
                        name: true,
                        academicYear: true
                    }
                },
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
                        isActive: true,
                        lastLogin: true
                    }
                },
                addresses: {
                    select: {
                        type: true,
                        state: true,
                        district: true,
                        houseName: true,
                        village: true,
                        pincode: true
                    }
                },
                guardians: {
                    select: {
                        type: true,
                        name: true,
                        contact: true,
                        aadhar: true,
                        panCard: true,
                        occupation: true
                    }
                }
            },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
            orderBy: [
                { semester: 'asc' },
                { section: 'asc' },
                { firstName: 'asc' }
            ]
        });
        // Format student data to include full name and organize related data
        const formattedStudents = students.map(student => {
            var _a, _b, _c, _d, _e;
            return ({
                ...student,
                fullName: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim(),
                address: ((_a = student.addresses) === null || _a === void 0 ? void 0 : _a.find(addr => addr.type === 'present')) || null,
                permanentAddress: ((_b = student.addresses) === null || _b === void 0 ? void 0 : _b.find(addr => addr.type === 'permanent')) || null,
                guardian: ((_c = student.guardians) === null || _c === void 0 ? void 0 : _c.find(g => g.type === 'guardian')) || null,
                father: ((_d = student.guardians) === null || _d === void 0 ? void 0 : _d.find(g => g.type === 'father')) || null,
                mother: ((_e = student.guardians) === null || _e === void 0 ? void 0 : _e.find(g => g.type === 'mother')) || null
            });
        });
        res.json({
            success: true,
            data: {
                students: formattedStudents,
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
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStudents = getStudents;
const getStudentByUSN = async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { usn } = req.params;
        const student = await index_1.prisma.student.findUnique({
            where: { usn },
            select: {
                usn: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
                phone: true,
                semester: true,
                section: true,
                admissionYear: true,
                departmentId: true,
                batchId: true,
                batch: {
                    select: {
                        id: true,
                        name: true,
                        academicYear: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                addresses: {
                    select: {
                        type: true,
                        state: true,
                        district: true,
                        houseName: true,
                        village: true,
                        pincode: true
                    }
                },
                guardians: {
                    select: {
                        type: true,
                        name: true,
                        contact: true,
                        aadhar: true,
                        panCard: true,
                        occupation: true
                    }
                },
                entranceExams: {
                    select: {
                        kcetRank: true,
                        comedkRank: true,
                        jeeRank: true
                    }
                },
                pucRecord: {
                    select: {
                        school: true,
                        boardUniversity: true,
                        regNo: true,
                        year: true,
                        maxMarks: true,
                        obtainedMarks: true,
                        percentage: true,
                        subTotalMarks: true,
                        physicsMax: true,
                        physicsObtained: true,
                        mathsMax: true,
                        mathsObtained: true,
                        chemMax: true,
                        chemObtained: true,
                        electiveMax: true,
                        electiveObtained: true,
                        englishMax: true,
                        englishObtained: true
                    }
                },
                sslcRecord: {
                    select: {
                        school: true,
                        boardUniversity: true,
                        regNo: true,
                        year: true,
                        maxMarks: true,
                        obtainedMarks: true,
                        percentage: true
                    }
                }
            }
        });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        // Format the response
        const formattedStudent = {
            ...student,
            fullName: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim(),
            address: ((_a = student.addresses) === null || _a === void 0 ? void 0 : _a.find(addr => addr.type === 'present')) || null,
            permanentAddress: ((_b = student.addresses) === null || _b === void 0 ? void 0 : _b.find(addr => addr.type === 'permanent')) || null,
            guardian: ((_c = student.guardians) === null || _c === void 0 ? void 0 : _c.find(g => g.type === 'guardian')) || null,
            father: ((_d = student.guardians) === null || _d === void 0 ? void 0 : _d.find(g => g.type === 'father')) || null,
            mother: ((_e = student.guardians) === null || _e === void 0 ? void 0 : _e.find(g => g.type === 'mother')) || null,
            pucDetails: ((_f = student.pucRecord) === null || _f === void 0 ? void 0 : _f[0]) || null, // Get the first PUC record if exists
            sslcDetails: ((_g = student.sslcRecord) === null || _g === void 0 ? void 0 : _g[0]) || null // Get the first SSLC record if exists
        };
        res.json({
            success: true,
            data: formattedStudent
        });
    }
    catch (error) {
        console.error('Get student by USN error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStudentByUSN = getStudentByUSN;
const bulkUploadStudents = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        // Fetch all batches and departments for lookup
        const allBatches = await index_1.prisma.batch.findMany({ select: { id: true, name: true } });
        const allDepartments = await index_1.prisma.department.findMany({ select: { id: true, name: true, code: true } });
        // Create maps for efficient name-to-ID lookup (case-insensitive)
        const batchNameToId = new Map(allBatches.map(b => [b.name.toLowerCase(), b.id]));
        // Allow lookup by name or code for departments
        const departmentNameToId = new Map();
        allDepartments.forEach(d => {
            departmentNameToId.set(d.name.toLowerCase(), d.id);
            if (d.code) {
                departmentNameToId.set(d.code.toLowerCase(), d.id);
            }
        });
        // Process the uploaded file (Excel/CSV)
        const fileBuffer = req.file.buffer;
        let studentsData = [];
        let parsingErrors = [];
        try {
            // Parse the Excel or CSV file
            const workbook = new exceljs_1.default.Workbook();
            await workbook.xlsx.load(fileBuffer);
            const worksheet = workbook.getWorksheet(1);
            // Use { raw: false } to get formatted strings, { defval: '' } for empty cells
            const rawData = worksheet.getRows(2, worksheet.actualRowCount).map((row) => {
                const rowIndex = row.number;
                // Flexible header matching (case-insensitive, common variations)
                const getRowValue = (keys) => {
                    for (const key of keys) {
                        const lowerKey = key.toLowerCase();
                        const matchingHeader = Object.keys(row).find(header => header.toLowerCase() === lowerKey);
                        if (matchingHeader && row[matchingHeader] !== '') {
                            return String(row[matchingHeader]).trim(); // Ensure string and trim whitespace
                        }
                    }
                    return ''; // Return empty string if no key matches or value is empty
                };
                const batchName = getRowValue(['batch', 'batch_name']);
                const departmentNameOrCode = getRowValue(['dept_name', 'branch', 'dept', 'department']);
                const admissionYearStr = getRowValue(['reg_year', 'admissionyear', 'admission_year', 'admission year']);
                const semesterStr = getRowValue(['semester', 'sem']);
                const dobValue = getRowValue(['dob', 'date of birth']);
                const batchId = batchNameToId.get(batchName.toLowerCase());
                const departmentId = departmentNameToId.get(departmentNameOrCode.toLowerCase());
                // --- Basic Data Cleaning and Parsing ---
                let semester = parseInt(semesterStr, 10);
                if (isNaN(semester))
                    semester = null;
                let admissionYear = parseInt(admissionYearStr, 10);
                if (isNaN(admissionYear))
                    admissionYear = null;
                let dob = undefined;
                if (dobValue) {
                    // Try parsing common date formats or if ExcelJS parsed it already
                    const parsedDate = new Date(dobValue);
                    if (!isNaN(parsedDate.getTime())) {
                        // Check if it's a reasonable date (e.g., not epoch 0 if original string was not '0')
                        if (parsedDate.getTime() !== 0 || dobValue === '0') {
                            dob = parsedDate;
                        }
                    }
                    // Add more robust date parsing if needed for specific Excel formats
                }
                const usn = getRowValue(['usn', 'usn number']);
                const email = getRowValue(['email', 'email_id', 'email id']);
                const phone = getRowValue(['phone', 'mob_no', 'mobile', 'contact']);
                // Collect potential issues for this row
                const rowIssues = [];
                if (!usn)
                    rowIssues.push("Missing USN");
                if (!email)
                    rowIssues.push("Missing Email");
                if (!getRowValue(['fname', 'firstname', 'first name']))
                    rowIssues.push("Missing First Name");
                if (!getRowValue(['lname', 'lastname', 'last name']))
                    rowIssues.push("Missing Last Name");
                if (batchName && !batchId)
                    rowIssues.push(`Batch '${batchName}' not found`);
                if (departmentNameOrCode && !departmentId)
                    rowIssues.push(`Department '${departmentNameOrCode}' not found`);
                if (!batchId)
                    rowIssues.push("Missing valid Batch");
                if (!departmentId)
                    rowIssues.push("Missing valid Department");
                if (semesterStr && semester === null)
                    rowIssues.push("Invalid Semester value");
                if (!semester)
                    rowIssues.push("Missing Semester"); // Make semester required?
                if (admissionYearStr && admissionYear === null)
                    rowIssues.push("Invalid Admission Year value");
                if (!admissionYear)
                    rowIssues.push("Missing Admission Year"); // Make admission year required
                return {
                    originalRowIndex: rowIndex, // Keep track for error reporting
                    usn,
                    firstName: getRowValue(['fname', 'firstname', 'first name']),
                    middleName: getRowValue(['mname', 'middlename', 'middle name']),
                    lastName: getRowValue(['lname', 'lastname', 'last name']),
                    email,
                    phone,
                    dob,
                    gender: getRowValue(['gender']),
                    address: getRowValue(['address', 'addr']),
                    batchId, // Looked-up ID
                    departmentId, // Looked-up ID
                    semester,
                    section: getRowValue(['section', 'sec']),
                    admissionYear, // Parsed from reg_year
                    fatherName: getRowValue(['fathername', 'father name', 'ffname']),
                    motherName: getRowValue(['mothername', 'mother name', 'mfname']),
                    guardianName: getRowValue(['guardianname', 'guardian name', 'gfname']),
                    guardianContact: getRowValue(['guardiancontact', 'guardian phone', 'gphone']),
                    _issues: rowIssues, // Store issues for validation
                    _batchName: batchName, // Store original names for error reporting
                    _departmentNameOrCode: departmentNameOrCode
                };
            });
            if (!Array.isArray(studentsData) || studentsData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid student data found in the file'
                });
            }
            // --- Validation Phase ---
            const invalidEntries = studentsData.filter(student => student._issues.length > 0);
            if (invalidEntries.length > 0) {
                const formattedErrors = invalidEntries.map(entry => ({
                    row: entry.originalRowIndex,
                    usn: entry.usn || 'N/A',
                    batchAttempted: entry._batchName,
                    deptAttempted: entry._departmentNameOrCode,
                    issues: entry._issues
                }));
                return res.status(400).json({
                    success: false,
                    message: `Found ${invalidEntries.length} invalid entries in the file. Please correct them and re-upload.`,
                    errors: formattedErrors
                });
            }
        }
        catch (parseError) {
            console.error('File parsing or data transformation error:', parseError);
            return res.status(400).json({
                success: false,
                message: `Failed to parse file or process data: ${parseError.message}`
            });
        }
        // Filter out entries that had issues during mapping (already handled above, but as safeguard)
        const validStudents = studentsData.filter(student => student._issues.length === 0);
        if (validStudents.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid student records to process after validation.'
            });
        }
        // Collect all valid USNs and emails for duplicate check
        const usns = validStudents.map(student => student.usn);
        const emails = validStudents.map(student => student.email);
        // Check for duplicate USNs/Emails within the file itself
        const usnCounts = usns.reduce((acc, usn) => ({ ...acc, [usn]: (acc[usn] || 0) + 1 }), {});
        const emailCounts = emails.reduce((acc, email) => ({ ...acc, [email]: (acc[email] || 0) + 1 }), {});
        const duplicateUsnsInFile = Object.entries(usnCounts).filter(([_, count]) => count > 1).map(([usn, _]) => usn);
        const duplicateEmailsInFile = Object.entries(emailCounts).filter(([_, count]) => count > 1).map(([email, _]) => email);
        if (duplicateUsnsInFile.length > 0 || duplicateEmailsInFile.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate USNs or Emails found within the uploaded file.',
                data: {
                    duplicateUsnsInFile,
                    duplicateEmailsInFile
                }
            });
        }
        // Check for duplicates in the database
        const existingStudents = await index_1.prisma.student.findMany({
            where: {
                OR: [
                    { usn: { in: usns } },
                    { email: { in: emails } }
                ]
            },
            select: {
                usn: true,
                email: true
            }
        });
        if (existingStudents.length > 0) {
            // Report which specific USNs/Emails already exist
            const existingUSNs = existingStudents.map(s => s.usn);
            const existingEmails = existingStudents.map(s => s.email);
            const conflictingEntries = validStudents.filter(s => existingUSNs.includes(s.usn) || existingEmails.includes(s.email))
                .map(s => ({
                row: s.originalRowIndex,
                usn: s.usn,
                email: s.email,
                conflict: existingUSNs.includes(s.usn) ? 'USN exists' : 'Email exists'
            }));
            return res.status(400).json({
                success: false,
                message: `Found ${existingStudents.length} students with conflicting USN or Email already in the database.`,
                errors: conflictingEntries
            });
        }
        // --- Database Insertion Phase ---
        let createdStudentsCount = 0;
        const creationErrors = [];
        // Use transaction for atomicity
        try {
            await index_1.prisma.$transaction(async (tx) => {
                for (const student of validStudents) {
                    try {
                        const createdStudent = await tx.student.create({
                            data: {
                                usn: student.usn,
                                firstName: student.firstName,
                                middleName: student.middleName,
                                lastName: student.lastName,
                                email: student.email,
                                phone: student.phone,
                                dob: student.dob,
                                gender: student.gender,
                                address: student.address,
                                batchId: student.batchId, // Assert non-null as validation passed
                                departmentId: student.departmentId, // Assert non-null
                                semester: student.semester, // Assert non-null
                                section: student.section,
                                admissionYear: student.admissionYear, // Assert non-null
                                fatherName: student.fatherName,
                                motherName: student.motherName,
                                guardianName: student.guardianName,
                                guardianContact: student.guardianContact
                            }
                        });
                        // Remove automatic user account creation
                        createdStudentsCount++;
                    }
                    catch (studentError) {
                        // Log individual creation error and add to list
                        console.error(`Error creating student USN ${student.usn} (Row ${student.originalRowIndex}):`, studentError);
                        creationErrors.push({
                            row: student.originalRowIndex,
                            usn: student.usn,
                            error: studentError.message || 'Failed to create student'
                        });
                        // Important: Re-throw the error to abort the transaction
                        throw studentError;
                    }
                }
            }); // End transaction
            // If transaction succeeded without re-throwing error
            res.status(201).json({
                success: true,
                message: `Successfully added ${createdStudentsCount} students. You can now create logins for them.`,
                data: {
                    count: createdStudentsCount
                }
            });
        }
        catch (transactionError) {
            // Transaction was rolled back
            console.error('Bulk upload transaction error:', transactionError);
            res.status(500).json({
                success: false,
                message: 'Bulk upload failed due to an error during database insertion. Transaction rolled back.',
                // Provide specific errors if available and safe to expose
                errors: creationErrors.length > 0 ? creationErrors : [{ error: transactionError.message || 'Transaction failed' }]
            });
        }
    }
    catch (error) {
        // Catch-all for unexpected errors (e.g., initial DB fetch failure)
        console.error('Unexpected bulk upload students error:', error);
        res.status(500).json({
            success: false,
            message: `Internal server error: ${error.message}`
        });
    }
};
exports.bulkUploadStudents = bulkUploadStudents;
// Function to handle Excel file upload and student data import
const importStudentsFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            throw new errors_1.BadRequestError('No file uploaded');
        }
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new errors_1.BadRequestError('Excel file is empty or invalid');
        }
        const students = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            if (rowNumber === 1)
                return; // Skip header row
            const student = {
                usn: ((_a = row.getCell(1).value) === null || _a === void 0 ? void 0 : _a.toString()) || '',
                firstName: ((_b = row.getCell(2).value) === null || _b === void 0 ? void 0 : _b.toString()) || '',
                lastName: ((_c = row.getCell(3).value) === null || _c === void 0 ? void 0 : _c.toString()) || '',
                email: ((_d = row.getCell(4).value) === null || _d === void 0 ? void 0 : _d.toString()) || '',
                phone: ((_e = row.getCell(5).value) === null || _e === void 0 ? void 0 : _e.toString()) || '',
                departmentId: parseInt(((_f = row.getCell(6).value) === null || _f === void 0 ? void 0 : _f.toString()) || '0'),
                semester: parseInt(((_g = row.getCell(7).value) === null || _g === void 0 ? void 0 : _g.toString()) || '1'),
                section: ((_h = row.getCell(8).value) === null || _h === void 0 ? void 0 : _h.toString()) || '',
                admissionYear: parseInt(((_j = row.getCell(9).value) === null || _j === void 0 ? void 0 : _j.toString()) || '0'),
            };
            // Validate student data
            const validationResult = (0, validation_1.validateStudent)(student);
            if (!validationResult.success) {
                throw new errors_1.BadRequestError(`Invalid data in row ${rowNumber}: ${validationResult.error}`);
            }
            students.push(student);
        });
        // Bulk create students
        const result = await index_1.prisma.student.createMany({
            data: students,
            skipDuplicates: true,
        });
        res.json({
            success: true,
            message: `Successfully imported ${result.count} students`,
            data: result
        });
    }
    catch (error) {
        if (error instanceof errors_1.ApiError) {
            throw error;
        }
        throw new errors_1.BadRequestError('Failed to process Excel file: ' + error.message);
    }
};
exports.importStudentsFromExcel = importStudentsFromExcel;
// Function to export student data to Excel
const exportStudentsToExcel = async (req, res) => {
    try {
        const students = await index_1.prisma.student.findMany({
            include: {
                department: true,
            }
        });
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Students');
        // Add headers
        worksheet.columns = [
            { header: 'USN', key: 'usn', width: 15 },
            { header: 'First Name', key: 'firstName', width: 20 },
            { header: 'Last Name', key: 'lastName', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Department', key: 'department', width: 20 },
            { header: 'Semester', key: 'semester', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            { header: 'Admission Year', key: 'admissionYear', width: 15 }
        ];
        // Add data
        students.forEach(student => {
            var _a;
            worksheet.addRow({
                usn: student.usn,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                phone: student.phone,
                department: ((_a = student.department) === null || _a === void 0 ? void 0 : _a.name) || 'N/A',
                semester: student.semester,
                section: student.section,
                admissionYear: student.admissionYear
            });
        });
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
        res.send(buffer);
    }
    catch (error) {
        throw new errors_1.BadRequestError('Failed to export students: ' + error.message);
    }
};
exports.exportStudentsToExcel = exportStudentsToExcel;
// Delete student
const deleteStudent = async (req, res) => {
    try {
        const { usn } = req.params;
        // Check if student exists
        const student = await index_1.prisma.student.findUnique({
            where: {
                usn
            },
            include: {
                user: {
                    include: {
                        auditlog: true,
                        displaypic: true,
                        studentcomponentmark: true
                    }
                },
                studentcomponentmark: true,
                mark: true,
                attendanceentry: true,
                addresses: true,
                guardians: true,
                entranceExams: true,
                pucRecord: true,
                sslcRecord: true
            }
        });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        // Delete student and associated records using a transaction
        await index_1.prisma.$transaction(async (prisma) => {
            // First, delete all user-related records if user exists
            if (student.user) {
                // Delete audit logs
                if (student.user.auditlog.length > 0) {
                    await prisma.auditlog.deleteMany({
                        where: { userId: student.user.id }
                    });
                }
                // Delete display picture
                if (student.user.displaypic) {
                    await prisma.displaypic.delete({
                        where: { userId: student.user.id }
                    });
                }
                // Delete student component marks recorded by this user
                if (student.user.studentcomponentmark.length > 0) {
                    await prisma.studentcomponentmark.updateMany({
                        where: { recordedBy: student.user.id },
                        data: { recordedBy: null }
                    });
                }
            }
            // Delete student-related records
            if (student.studentcomponentmark.length > 0) {
                await prisma.studentcomponentmark.deleteMany({
                    where: { usn: usn }
                });
            }
            if (student.mark.length > 0) {
                await prisma.mark.deleteMany({
                    where: { usn: usn }
                });
            }
            if (student.attendanceentry.length > 0) {
                await prisma.attendanceentry.deleteMany({
                    where: { usn: usn }
                });
            }
            if (student.addresses.length > 0) {
                await prisma.studentAddress.deleteMany({
                    where: { usn: usn }
                });
            }
            if (student.guardians.length > 0) {
                await prisma.studentGuardian.deleteMany({
                    where: { usn: usn }
                });
            }
            if (student.entranceExams.length > 0) {
                await prisma.studentEntranceExam.deleteMany({
                    where: { usn: usn }
                });
            }
            if (student.pucRecord.length > 0) {
                await prisma.studentPucRecord.deleteMany({
                    where: { usn: usn }
                });
            }
            if (student.sslcRecord.length > 0) {
                await prisma.studentSslcRecord.deleteMany({
                    where: { usn: usn }
                });
            }
            // Delete the student record
            await prisma.student.delete({
                where: { usn: usn }
            });
            // Finally delete the user account
            if (student.user) {
                await prisma.user.delete({
                    where: { id: student.user.id }
                });
            }
        });
        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete student error:', error);
        // Handle specific Prisma errors
        if (error.code === 'P2003') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete student because it is referenced by other records'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete student'
        });
    }
};
exports.deleteStudent = deleteStudent;

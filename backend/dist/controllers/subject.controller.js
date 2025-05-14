"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExamComponent = exports.addCustomExamComponent = exports.getSubjectExamComponents = exports.updateCategoryMarkingSchema = exports.getSubjectCategoryById = exports.createSubjectCategory = exports.getSubjectCategories = exports.getStudentsBySubject = exports.updateSubjectStatus = exports.deleteSubject = exports.checkFacultySubjectAccess = exports.approveRejectFacultyMapping = exports.updateFacultySubjectMapping = exports.deleteFacultySubjectMapping = exports.getFacultySubjectMappings = exports.createFacultySubjectMapping = exports.getSubjectById = exports.getSubjects = exports.updateSubject = exports.createSubject = void 0;
const index_1 = require("../index");
const examComponentService_1 = require("../services/examComponentService");
const createSubject = async (req, res) => {
    try {
        const { code, name, semester, credits, isLab, departmentId, categoryId, schemeYear, section, sectionId } = req.body;
        const user = req.user;
        console.log("Subject creation request:", {
            code,
            departmentId,
            semester,
            schemeYear,
            section,
            sectionId
        });
        // Initialize uniqueSubjectCode with the original code
        let uniqueSubjectCode = code;
        // Check for required fields
        if (!code || !name || !semester || !credits || !departmentId) {
            return res.status(400).json({
                success: false,
                message: 'Code, name, semester, credits, and department are required fields'
            });
        }
        // Check if section id exists when provided
        let sectionName = section;
        if (sectionId && !section) {
            const sectionData = await index_1.prisma.section.findUnique({
                where: { id: sectionId },
                select: { name: true }
            });
            if (sectionData && sectionData.name) {
                sectionName = sectionData.name;
                console.log("Found section name from ID:", sectionName);
            }
        }
        // If category is provided, check if it exists
        let categoryIdToUse = undefined;
        if (categoryId) {
            // If category is a string (code), find by code
            if (typeof categoryId === 'string' && isNaN(parseInt(categoryId))) {
                const category = await index_1.prisma.subjectcategory.findUnique({
                    where: { code: categoryId }
                });
                if (category) {
                    categoryIdToUse = category.id;
                }
                else {
                    return res.status(400).json({
                        success: false,
                        message: 'Subject category not found'
                    });
                }
            }
            else {
                // If category is a number, use directly
                categoryIdToUse = parseInt(categoryId);
                // Verify category exists
                const category = await index_1.prisma.subjectcategory.findUnique({
                    where: { id: categoryIdToUse }
                });
                if (!category) {
                    return res.status(400).json({
                        success: false,
                        message: 'Subject category not found'
                    });
                }
            }
        }
        // Validate sectionId if provided
        if (sectionId) {
            const sectionExists = await index_1.prisma.section.findUnique({
                where: { id: sectionId }
            });
            if (!sectionExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Section not found'
                });
            }
        }
        // Check if department exists
        const departmentExists = await index_1.prisma.department.findUnique({
            where: { id: parseInt(departmentId) }
        });
        if (!departmentExists) {
            return res.status(400).json({
                success: false,
                message: 'Department not found'
            });
        }
        // Check if a subject with this code already exists before we generate our unique code
        const subjectWithCode = await index_1.prisma.$queryRawUnsafe(`SELECT id, code, departmentId, semester, schemeYear, sectionId FROM subject WHERE code = ?`, code);
        if (subjectWithCode && subjectWithCode.length > 0) {
            // If a subject with this code exists, we need to generate a unique code
            const hasDuplicate = subjectWithCode.some(existingSubject => existingSubject.departmentId === parseInt(departmentId) &&
                existingSubject.semester === parseInt(semester) &&
                existingSubject.schemeYear === schemeYear &&
                (!sectionId || existingSubject.sectionId === sectionId));
            if (hasDuplicate) {
                return res.status(409).json({
                    success: false,
                    message: 'Subject code already exists for this department, semester, and scheme year' +
                        (sectionId ? ' with the same section' : '')
                });
            }
            console.log(`Subject ${code} exists but will create with unique section code: ${uniqueSubjectCode}`);
        }
        // If we have section information, we need to make sure the code is unique
        // by appending the section code to the subject code
        if (sectionId) {
            // Get section code/name
            const section = await index_1.prisma.section.findUnique({
                where: { id: sectionId },
                select: { name: true }
            });
            // If we have a section name, use it to make the code unique
            if (section && section.name) {
                // Remove any spaces from section name
                const sectionCode = section.name.trim().replace(/\s+/g, '');
                // Check if the subject code already ends with the section code
                if (!uniqueSubjectCode.endsWith(sectionCode)) {
                    // Append section code to subject code
                    uniqueSubjectCode = `${code}-${sectionCode}`;
                    console.log(`Creating unique subject code for section: ${uniqueSubjectCode}`);
                }
            }
        }
        // Rather than using the Prisma model which has a unique constraint on the code,
        // we'll use raw SQL to create the subject which allows us to enforce our business logic
        const result = await index_1.prisma.$transaction(async (tx) => {
            // First check if a duplicate exists by our business rules (using the uniqueSubjectCode)
            let query = `
        SELECT id 
        FROM subject 
        WHERE code = ? 
        AND departmentId = ? 
        AND semester = ? 
        AND schemeYear = ?
      `;
            const params = [
                uniqueSubjectCode,
                parseInt(departmentId),
                parseInt(semester),
                schemeYear
            ];
            // If sectionId is provided, check with section
            if (sectionId) {
                query += ` AND sectionId = ?`;
                params.push(sectionId);
            }
            else {
                // If no section is provided, only check against subjects without section
                query += ` AND (sectionId IS NULL OR sectionId = 0)`;
            }
            const duplicates = await tx.$queryRawUnsafe(query, ...params);
            if (duplicates && duplicates.length > 0) {
                return {
                    error: sectionId
                        ? `Subject code ${uniqueSubjectCode} already exists for this department, semester, scheme year and section`
                        : `Subject code ${uniqueSubjectCode} already exists for this department, semester, and scheme year without a section`
                };
            }
            // Check if the uniqueSubjectCode already exists (global uniqueness check)
            const existingCode = await tx.$queryRawUnsafe(`SELECT id FROM subject WHERE code = ?`, uniqueSubjectCode);
            if (existingCode && existingCode.length > 0) {
                return {
                    error: `Subject code ${uniqueSubjectCode} already exists in the system. Please choose a different code.`
                };
            }
            // If we got here, we can create the subject with raw SQL
            // First get the max id to generate the next id
            const maxIdResult = await tx.$queryRawUnsafe(`SELECT MAX(id) as maxId FROM subject`);
            const nextId = maxIdResult[0].maxId ? maxIdResult[0].maxId + 1 : 1;
            // Create a timestamp for created/updated fields
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // Insert the subject using raw SQL without the section/sectionId first
            const insertResult = await tx.$executeRawUnsafe(`
        INSERT INTO subject (
          id, code, name, semester, credits, isLab, departmentId, 
          categoryId, status, schemeYear, createdAt, updatedAt
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, nextId, uniqueSubjectCode, name, parseInt(semester), parseInt(credits), isLab ? 1 : 0, parseInt(departmentId), categoryIdToUse || null, 'draft', schemeYear, now, now);
            // Now update the section fields
            if (sectionName !== undefined || sectionId !== undefined) {
                let updateQuery = `UPDATE subject SET `;
                const updateParams = [];
                if (sectionName !== undefined) {
                    updateQuery += `section = ?, `;
                    updateParams.push(sectionName);
                }
                if (sectionId !== undefined) {
                    updateQuery += `sectionId = ?, `;
                    updateParams.push(sectionId);
                }
                // Remove trailing comma and space
                updateQuery = updateQuery.slice(0, -2);
                // Add where clause
                updateQuery += ` WHERE id = ?`;
                updateParams.push(nextId);
                await tx.$executeRawUnsafe(updateQuery, ...updateParams);
            }
            // Create status log
            await tx.$executeRawUnsafe(`
        INSERT INTO subjectstatuslog (
          status, subjectId, changedBy, timestamp, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `, 'draft', nextId, user.userId, now, now, now);
            // Get the full subject record
            const createdSubject = await tx.$queryRawUnsafe(`
        SELECT * FROM subject WHERE id = ?
      `, nextId);
            return { subject: createdSubject[0] };
        });
        // Handle transaction results
        if ('error' in result) {
            return res.status(409).json({
                success: false,
                message: result.error
            });
        }
        const subject = result.subject;
        // If category is provided, auto-generate exam components
        if (categoryIdToUse) {
            try {
                await (0, examComponentService_1.getDefaultComponentsForSubject)(subject.id);
            }
            catch (error) {
                console.error('Error generating default components:', error);
                // We still return success for the subject creation
            }
        }
        res.status(201).json({
            success: true,
            message: `Subject created successfully${uniqueSubjectCode !== code ? ` with unique code ${uniqueSubjectCode}` : ''}${sectionName ? ` in section ${sectionName}` : ''}`,
            data: {
                id: subject.id,
                code: subject.code,
                status: subject.status,
                originalCode: code !== subject.code ? code : undefined,
                section: sectionName || undefined,
                sectionId: sectionId || undefined
            }
        });
    }
    catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createSubject = createSubject;
const updateSubject = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const { code, name, semester, credits, isLab, departmentId, categoryId, schemeYear, section, sectionId } = req.body;
        const subjectId = parseInt(id);
        console.log("Subject update request:", {
            id,
            code,
            departmentId,
            semester,
            schemeYear,
            section,
            sectionId
        });
        // Check if subject exists
        const existingSubject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId }
        });
        if (!existingSubject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // Check if subject is in a state that allows editing (must be 'draft')
        if (existingSubject.status !== 'draft') {
            return res.status(403).json({
                success: false,
                message: 'Subject can only be edited when in draft status'
            });
        }
        // Check if the sectionId is provided, try to get its name
        let sectionName = section;
        if (sectionId && !section) {
            try {
                const sectionData = await index_1.prisma.section.findUnique({
                    where: { id: sectionId },
                    select: { name: true }
                });
                if (sectionData && sectionData.name) {
                    sectionName = sectionData.name;
                    console.log("Found section name from ID:", sectionName);
                }
            }
            catch (error) {
                console.error("Error fetching section name:", error);
            }
        }
        // If code is being updated, check for duplicates within same department, semester, scheme, and section
        if (code && code !== existingSubject.code) {
            // Get current sectionId using raw SQL since it might not be in the model
            const currentSectionIdResult = await index_1.prisma.$queryRawUnsafe(`SELECT sectionId FROM subject WHERE id = ?`, subjectId);
            const currentSectionId = ((_a = currentSectionIdResult[0]) === null || _a === void 0 ? void 0 : _a.sectionId) || null;
            // The section we're updating to (either new one or current one)
            const targetSectionId = sectionId !== undefined ? sectionId : currentSectionId;
            // Build query for uniqueness check
            let query = `
        SELECT id 
        FROM subject 
        WHERE code = ? 
        AND departmentId = ? 
        AND semester = ? 
        AND schemeYear = ?
        AND id <> ? 
      `;
            const params = [
                code,
                departmentId || existingSubject.departmentId,
                semester || existingSubject.semester,
                schemeYear || existingSubject.schemeYear,
                subjectId // Exclude current subject
            ];
            // Include section in uniqueness check
            if (targetSectionId) {
                query += ` AND sectionId = ?`;
                params.push(targetSectionId);
            }
            else {
                // If no section, only check against other subjects without section
                query += ` AND (sectionId IS NULL OR sectionId = 0)`;
            }
            // Execute the query
            const duplicates = await index_1.prisma.$queryRawUnsafe(query, ...params);
            if (duplicates && duplicates.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: targetSectionId
                        ? 'Subject code already exists for this department, semester, scheme year and section'
                        : 'Subject code already exists for this department, semester, and scheme year without a section'
                });
            }
        }
        // If departmentId is provided, check if it exists
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
        // If categoryId is provided, check if it exists and get its ID if it's a code
        let categoryIdToUse = categoryId;
        if (categoryId !== undefined) {
            if (categoryId === null) {
                // Allow setting category to null
                categoryIdToUse = null;
            }
            else {
                let category;
                // Check if categoryId is a string code or numeric id
                if (typeof categoryId === 'string' && isNaN(parseInt(categoryId))) {
                    // It's a string code
                    category = await index_1.prisma.subjectcategory.findUnique({
                        where: { code: categoryId }
                    });
                    if (category) {
                        categoryIdToUse = category.id;
                    }
                }
                else {
                    // It's a numeric ID (or parseable as one)
                    const categoryIdNum = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
                    category = await index_1.prisma.subjectcategory.findUnique({
                        where: { id: categoryIdNum }
                    });
                }
                if (!category) {
                    return res.status(400).json({
                        success: false,
                        message: 'Subject category not found'
                    });
                }
            }
        }
        // Validate sectionId if provided
        if (sectionId) {
            const sectionExists = await index_1.prisma.section.findUnique({
                where: { id: sectionId }
            });
            if (!sectionExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Section not found'
                });
            }
        }
        // Step 1: Update subject fields except sectionId and section using Prisma
        // Create the data object with only the fields that are supported by Prisma
        const updateData = {
            updatedAt: new Date() // Required field
        };
        // Add fields only if they are provided
        if (code !== undefined)
            updateData.code = code;
        if (name !== undefined)
            updateData.name = name;
        if (semester !== undefined)
            updateData.semester = semester;
        if (credits !== undefined)
            updateData.credits = credits;
        if (isLab !== undefined)
            updateData.isLab = isLab;
        if (schemeYear !== undefined)
            updateData.schemeYear = schemeYear;
        // Add relationships using Prisma's relation format
        if (departmentId) {
            updateData.department = {
                connect: { id: departmentId }
            };
        }
        if (categoryIdToUse !== undefined) {
            updateData.subjectcategory = categoryIdToUse === null
                ? { disconnect: true } // Remove category if null
                : { connect: { id: categoryIdToUse } }; // Connect to category
        }
        // Update the subject with supported fields only
        const updatedSubject = await index_1.prisma.subject.update({
            where: { id: subjectId },
            data: updateData
        });
        // Step 2: Update section and sectionId separately with raw SQL
        // Update section name for backward compatibility
        if (sectionName !== undefined) {
            if (sectionName === null) {
                await index_1.prisma.$executeRawUnsafe(`UPDATE subject SET section = NULL WHERE id = ?`, subjectId);
            }
            else {
                await index_1.prisma.$executeRawUnsafe(`UPDATE subject SET section = ? WHERE id = ?`, sectionName, subjectId);
            }
        }
        // Update sectionId with the proper foreign key
        if (sectionId !== undefined) {
            if (sectionId === null) {
                await index_1.prisma.$executeRawUnsafe(`UPDATE subject SET sectionId = NULL WHERE id = ?`, subjectId);
            }
            else {
                await index_1.prisma.$executeRawUnsafe(`UPDATE subject SET sectionId = ? WHERE id = ?`, sectionId, subjectId);
            }
        }
        // If category was changed and the subject is in draft status, regenerate exam components
        if (categoryIdToUse !== undefined && categoryIdToUse !== existingSubject.categoryId) {
            try {
                // First delete existing components
                await index_1.prisma.examcomponent.deleteMany({
                    where: { subjectId: updatedSubject.id }
                });
                // Then generate new ones
                await (0, examComponentService_1.getDefaultComponentsForSubject)(updatedSubject.id);
            }
            catch (error) {
                console.error('Error regenerating components after category change:', error);
                // We still return success for the subject update
            }
        }
        res.json({
            success: true,
            message: `Subject updated successfully${updatedSubject.code !== code ? ` with code ${updatedSubject.code}` : ''}${sectionName ? ` in section ${sectionName}` : ''}`,
            data: {
                id: updatedSubject.id,
                code: updatedSubject.code,
                status: updatedSubject.status,
                section: sectionName || undefined,
                sectionId: sectionId || undefined
            }
        });
    }
    catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateSubject = updateSubject;
const getSubjects = async (req, res) => {
    try {
        const { departmentId, semester, schemeYear, status, categoryId, facultyId, code, name, isLab, page = 1, limit = 10, sectionId, all = false, withComponents = false } = req.query;
        // Build filter criteria based on query parameters
        const where = {};
        if (departmentId)
            where.departmentId = parseInt(departmentId);
        if (semester)
            where.semester = parseInt(semester);
        if (schemeYear)
            where.schemeYear = schemeYear;
        if (status)
            where.status = status;
        if (categoryId)
            where.categoryId = parseInt(categoryId);
        if (code)
            where.code = { contains: code };
        if (name)
            where.name = { contains: name };
        if (isLab !== undefined)
            where.isLab = isLab === 'true';
        // Collect subject IDs that match all filters for final query
        let filteredSubjectIds = [];
        let hasIdFilters = false;
        // Handle filtering by faculty if provided
        if (facultyId) {
            hasIdFilters = true;
            try {
                const mappings = await index_1.prisma.facultySubjectMapping.findMany({
                    where: {
                        facultyId: facultyId, // Faculty ID is a string in the model
                        active: true
                    },
                    select: {
                        subjectId: true
                    }
                });
                if (mappings.length === 0) {
                    // Return empty array if no mappings found
                    return res.json({
                        success: true,
                        subjects: [],
                        total: 0,
                        page: parseInt(page),
                        totalPages: 0
                    });
                }
                filteredSubjectIds = mappings.map(m => m.subjectId);
            }
            catch (error) {
                console.error("Error fetching faculty subject mappings:", error);
                return res.status(500).json({
                    success: false,
                    message: "Error fetching faculty subject mappings"
                });
            }
        }
        // Handle filtering by sectionId if provided
        if (sectionId) {
            hasIdFilters = true;
            try {
                const subjectsWithSection = await index_1.prisma.$queryRawUnsafe(`SELECT id FROM subject WHERE sectionId = ?`, parseInt(sectionId));
                if (subjectsWithSection.length === 0) {
                    // No subjects found with this sectionId
                    return res.json({
                        success: true,
                        subjects: [],
                        total: 0,
                        page: parseInt(page),
                        totalPages: 0
                    });
                }
                const sectionSubjectIds = subjectsWithSection.map(s => s.id);
                if (filteredSubjectIds.length > 0) {
                    // If we already have subject IDs from faculty filter, get the intersection
                    filteredSubjectIds = filteredSubjectIds.filter((id) => sectionSubjectIds.includes(id));
                    if (filteredSubjectIds.length === 0) {
                        // No overlap between filters
                        return res.json({
                            success: true,
                            subjects: [],
                            total: 0,
                            page: parseInt(page),
                            totalPages: 0
                        });
                    }
                }
                else {
                    // Otherwise, just use the section subjects
                    filteredSubjectIds = sectionSubjectIds;
                }
            }
            catch (error) {
                console.error("Error fetching subjects by section:", error);
                return res.status(500).json({
                    success: false,
                    message: "Error fetching subjects by section"
                });
            }
        }
        // Apply ID filters if any exist
        if (hasIdFilters) {
            where.id = { in: filteredSubjectIds };
        }
        // Count total subjects matching criteria for pagination
        const total = await index_1.prisma.subject.count({ where });
        // If no subjects match filters, return early
        if (total === 0) {
            return res.json({
                success: true,
                subjects: [],
                total: 0,
                page: parseInt(page),
                totalPages: 0
            });
        }
        // Calculate pagination values
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const totalPages = all ? 1 : Math.ceil(total / parsedLimit);
        const skip = all ? 0 : (parsedPage - 1) * parsedLimit;
        const take = all ? undefined : parsedLimit;
        // Fetch subjects with relations
        const subjects = await index_1.prisma.subject.findMany({
            where,
            skip,
            take,
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                subjectcategory: true,
                // Include faculty mappings if requested
                ...(withComponents ? {
                    facultysubjectmapping: {
                        where: { active: true },
                        include: {
                            faculty: true // Include the whole faculty relation
                        }
                    },
                    examcomponent: true
                } : {})
            },
            orderBy: [
                { semester: 'asc' },
                { code: 'asc' }
            ]
        });
        // If no subjects found, return empty array
        if (subjects.length === 0) {
            return res.json({
                success: true,
                subjects: [],
                total: 0,
                page: parsedPage,
                totalPages: 0
            });
        }
        // Get subject IDs to fetch section data
        const subjectIds = subjects.map(subject => subject.id);
        // Fetch section data for all subjects using a single query
        const sectionData = await index_1.prisma.$queryRawUnsafe(`SELECT s.id as subjectId, s.sectionId, sec.name as sectionName, sec.departmentId as sectionDeptId, sec.batchId, sec.currentSemester
       FROM subject s
       LEFT JOIN section sec ON s.sectionId = sec.id
       WHERE s.id IN (${subjectIds.map(() => '?').join(',')})`, ...subjectIds);
        // Create a map of subject ID to section data
        const sectionMap = {};
        sectionData.forEach(item => {
            if (item.subjectId) {
                sectionMap[item.subjectId] = {
                    id: item.sectionId,
                    name: item.sectionName,
                    departmentId: item.sectionDeptId,
                    batchId: item.batchId,
                    currentSemester: item.currentSemester
                };
            }
        });
        // Enhance subjects with section data
        const enhancedSubjects = subjects.map(subject => {
            var _a;
            return {
                ...subject,
                sectionId: ((_a = sectionMap[subject.id]) === null || _a === void 0 ? void 0 : _a.id) || null,
                sectionRelation: sectionMap[subject.id] || null
            };
        });
        // Return response with pagination metadata
        return res.json({
            success: true,
            subjects: enhancedSubjects,
            total,
            page: parsedPage,
            totalPages
        });
    }
    catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subjects',
            error: error.message
        });
    }
};
exports.getSubjects = getSubjects;
const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const subjectId = parseInt(id);
        // Get the subject with all related data
        const subject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                subjectcategory: true,
                // Include faculty mappings
                facultysubjectmapping: {
                    where: { active: true },
                    include: {
                        faculty: true // Include the whole faculty relationv
                    }
                },
                examcomponent: true,
                subjectstatuslog: {
                    orderBy: { timestamp: 'desc' },
                    take: 10
                }
            }
        });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // Get section data directly with a join instead of separate queries
        const sectionData = await index_1.prisma.$queryRawUnsafe(`SELECT s.sectionId, sec.id, sec.name, sec.departmentId, sec.batchId, sec.currentSemester
       FROM subject s
       LEFT JOIN section sec ON s.sectionId = sec.id
       WHERE s.id = ?`, subjectId);
        let sectionRelation = null;
        let sectionId = null;
        // Process section data if found
        if (sectionData && sectionData.length > 0 && sectionData[0].id) {
            sectionId = sectionData[0].sectionId;
            sectionRelation = {
                id: sectionData[0].id,
                name: sectionData[0].name,
                departmentId: sectionData[0].departmentId,
                batchId: sectionData[0].batchId,
                currentSemester: sectionData[0].currentSemester
            };
        }
        // Return enhanced subject with section data
        const enhancedSubject = {
            ...subject,
            sectionId,
            sectionRelation
        };
        res.json({
            success: true,
            subject: enhancedSubject
        });
    }
    catch (error) {
        console.error('Error fetching subject by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subject',
            error: error.message
        });
    }
};
exports.getSubjectById = getSubjectById;
// Faculty-Subject Mapping operations
const createFacultySubjectMapping = async (req, res) => {
    try {
        const { facultyId, subjectId, section, semester, batchId, academicYear, componentScope, isPrimary, active } = req.body;
        // Get the user making the request
        const userId = req.user.userId;
        const userRole = req.user.loginType;
        // Check if faculty exists
        const faculty = await index_1.prisma.faculty.findUnique({
            where: { id: facultyId },
            include: {
                department: true
            }
        });
        if (!faculty) {
            return res.status(400).json({
                success: false,
                message: 'Faculty not found'
            });
        }
        // Check if subject exists
        const subject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                department: true
            }
        });
        if (!subject) {
            return res.status(400).json({
                success: false,
                message: 'Subject not found'
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
        // Determine if the mapping should be auto-approved
        // Super Admin's mappings are auto-approved, Dept Admins' mappings for their department are auto-approved
        let status = 'pending';
        let approvedBy = null;
        let approvedAt = null;
        // Super Admin (role 1) can auto-approve any mapping
        if (userRole === 1) {
            status = 'approved';
            approvedBy = userId;
            approvedAt = new Date();
        }
        // Dept Admin (role 3) can auto-approve mappings within their department
        else if (userRole === 3) {
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId },
                include: { faculty: true }
            });
            if ((user === null || user === void 0 ? void 0 : user.faculty) && user.faculty.departmentId === faculty.departmentId &&
                faculty.departmentId === subject.departmentId) {
                status = 'approved';
                approvedBy = userId;
                approvedAt = new Date();
            }
        }
        // Check for existing mapping
        const existingMapping = await index_1.prisma.facultySubjectMapping.findFirst({
            where: {
                facultyId,
                subjectId,
                section,
                academicYear
            }
        });
        if (existingMapping) {
            // If mapping exists and is inactive, we can reactivate it
            if (existingMapping.active === false) {
                const updatedMapping = await index_1.prisma.facultySubjectMapping.update({
                    where: { id: existingMapping.id },
                    data: {
                        componentScope: componentScope || 'theory',
                        isPrimary: isPrimary !== undefined ? isPrimary : true,
                        active: true,
                        status: status,
                        approvedBy: approvedBy,
                        approvedAt: approvedAt
                    },
                    include: {
                        faculty: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        },
                        subject: {
                            select: {
                                id: true,
                                code: true,
                                name: true
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
                return res.json({
                    success: true,
                    message: 'Faculty-subject mapping reactivated successfully',
                    data: updatedMapping
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Faculty-subject mapping already exists'
            });
        }
        // If this is set as primary, set other mappings for the same subject, section, and component scope to non-primary
        if (isPrimary === true) {
            await index_1.prisma.facultySubjectMapping.updateMany({
                where: {
                    subjectId,
                    section,
                    academicYear,
                    componentScope: componentScope || 'theory'
                },
                data: {
                    isPrimary: false
                }
            });
        }
        // Create faculty-subject mapping
        const mapping = await index_1.prisma.facultySubjectMapping.create({
            data: {
                facultyId,
                subjectId,
                section,
                semester,
                batchId,
                academicYear,
                componentScope: componentScope || 'theory',
                isPrimary: isPrimary !== undefined ? isPrimary : true,
                active: active !== undefined ? active : true,
                status: status,
                approvedBy: approvedBy,
                approvedAt: approvedAt
            },
            include: {
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                subject: {
                    select: {
                        id: true,
                        code: true,
                        name: true
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
        res.status(201).json({
            success: true,
            message: 'Faculty-subject mapping created successfully',
            data: mapping
        });
    }
    catch (error) {
        console.error('Create faculty-subject mapping error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createFacultySubjectMapping = createFacultySubjectMapping;
const getFacultySubjectMappings = async (req, res) => {
    try {
        const { facultyId, subjectId, semester, section, batchId, academicYear, componentScope, active = 'true' } = req.query;
        // Build filter conditions
        const filterConditions = {};
        if (facultyId) {
            filterConditions.facultyId = parseInt(facultyId);
        }
        if (subjectId) {
            filterConditions.subjectId = parseInt(subjectId);
        }
        if (semester) {
            filterConditions.semester = parseInt(semester);
        }
        if (section) {
            filterConditions.section = section;
        }
        if (batchId) {
            filterConditions.batchId = parseInt(batchId);
        }
        if (academicYear) {
            filterConditions.academicYear = academicYear;
        }
        if (componentScope) {
            filterConditions.componentScope = componentScope;
        }
        // Handle active status filtering
        if (active !== undefined) {
            filterConditions.active = active === 'true';
        }
        // Get mappings
        const mappings = await index_1.prisma.facultySubjectMapping.findMany({
            where: filterConditions,
            include: {
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        department: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        semester: true,
                        credits: true,
                        isLab: true,
                        subjectcategory: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
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
            orderBy: [
                { subjectId: 'asc' },
                { facultyId: 'asc' }
            ]
        });
        res.json({
            success: true,
            count: mappings.length,
            data: mappings
        });
    }
    catch (error) {
        console.error('Get faculty-subject mappings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFacultySubjectMappings = getFacultySubjectMappings;
const deleteFacultySubjectMapping = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if mapping exists
        const mapping = await index_1.prisma.facultySubjectMapping.findUnique({
            where: { id: parseInt(id) }
        });
        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: 'Faculty-subject mapping not found'
            });
        }
        // Check if there are attendance or marks entries associated with this mapping
        // Assuming we have a way to associate attendance and marks with specific faculty mappings
        // This would need to be implemented based on the actual database schema
        // For now, instead of deleting, just set active to false (soft delete)
        const deactivatedMapping = await index_1.prisma.facultySubjectMapping.update({
            where: { id: parseInt(id) },
            data: { active: false }
        });
        res.json({
            success: true,
            message: 'Faculty-subject mapping deactivated successfully',
            data: deactivatedMapping
        });
    }
    catch (error) {
        console.error('Delete faculty-subject mapping error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteFacultySubjectMapping = deleteFacultySubjectMapping;
// Update faculty-subject mapping
const updateFacultySubjectMapping = async (req, res) => {
    try {
        const { id } = req.params;
        const { componentScope, isPrimary, active } = req.body;
        // Check if mapping exists
        const mapping = await index_1.prisma.facultySubjectMapping.findUnique({
            where: { id: parseInt(id) }
        });
        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: 'Faculty-subject mapping not found'
            });
        }
        // If setting as primary, set other mappings for the same subject to non-primary
        if (isPrimary === true) {
            await index_1.prisma.facultySubjectMapping.updateMany({
                where: {
                    subjectId: mapping.subjectId,
                    section: mapping.section,
                    academicYear: mapping.academicYear,
                    componentScope: componentScope || mapping.componentScope,
                    id: { not: parseInt(id) }
                },
                data: {
                    isPrimary: false
                }
            });
        }
        // Update mapping
        const updatedMapping = await index_1.prisma.facultySubjectMapping.update({
            where: { id: parseInt(id) },
            data: {
                componentScope,
                isPrimary,
                active,
                // When updated, reset to pending status unless it's by an admin
                status: 'pending',
                approvedBy: null,
                approvedAt: null
            },
            include: {
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                subject: {
                    select: {
                        id: true,
                        code: true,
                        name: true
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
        res.json({
            success: true,
            message: 'Faculty-subject mapping updated successfully',
            data: updatedMapping
        });
    }
    catch (error) {
        console.error('Update faculty-subject mapping error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateFacultySubjectMapping = updateFacultySubjectMapping;
/**
 * Approve or reject a faculty-subject mapping
 */
const approveRejectFacultyMapping = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        // Get the user making the request
        const userId = req.user.userId;
        const userRole = req.user.loginType;
        // Ensure only Dept Admin (3) or Super Admin (1) can approve/reject
        if (userRole !== 1 && userRole !== 3) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized. Only department admins or super admins can approve mappings.'
            });
        }
        // Check if mapping exists
        const mapping = await index_1.prisma.facultySubjectMapping.findUnique({
            where: { id: parseInt(id) },
            include: {
                faculty: {
                    include: {
                        department: true
                    }
                },
                subject: {
                    include: {
                        department: true
                    }
                }
            }
        });
        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: 'Faculty-subject mapping not found'
            });
        }
        // For Dept Admins, ensure they can only approve/reject mappings in their department
        if (userRole === 3) {
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId },
                include: { faculty: true }
            });
            if (!(user === null || user === void 0 ? void 0 : user.faculty) || user.faculty.departmentId !== mapping.faculty.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized. You can only approve mappings in your department.'
                });
            }
        }
        // Validate status
        if (status !== 'approved' && status !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "approved" or "rejected"'
            });
        }
        // If rejecting, ensure reason is provided
        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required when rejecting a mapping'
            });
        }
        // Update mapping status
        const updatedMapping = await index_1.prisma.facultySubjectMapping.update({
            where: { id: parseInt(id) },
            data: {
                status: status,
                approvedBy: userId,
                approvedAt: new Date(),
                rejectionReason: status === 'rejected' ? rejectionReason : null
            },
            include: {
                faculty: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                subject: {
                    select: {
                        id: true,
                        code: true,
                        name: true
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
        res.json({
            success: true,
            message: `Faculty-subject mapping ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
            data: updatedMapping
        });
    }
    catch (error) {
        console.error('Approve/reject faculty-subject mapping error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.approveRejectFacultyMapping = approveRejectFacultyMapping;
const checkFacultySubjectAccess = async (req, res) => {
    try {
        const { facultyId, subjectId, componentScope, section, academicYear } = req.body;
        // Validate required fields
        if (!facultyId || !subjectId || !componentScope) {
            return res.status(400).json({
                success: false,
                message: 'Faculty ID, Subject ID, and Component Scope are required'
            });
        }
        // Check mapping
        const mapping = await index_1.prisma.facultySubjectMapping.findFirst({
            where: {
                facultyId: facultyId, // Faculty ID is a string in the model
                subjectId: parseInt(subjectId),
                section: section,
                academicYear: academicYear,
                active: true,
                OR: [
                    { componentScope: componentScope },
                    { componentScope: 'both' }
                ]
            }
        });
        if (!mapping) {
            return res.json({
                success: true,
                hasAccess: false,
                message: 'Faculty does not have access to this subject component'
            });
        }
        // Faculty has access
        return res.json({
            success: true,
            hasAccess: true,
            isPrimary: mapping.isPrimary,
            message: 'Faculty has access to this subject component',
            data: mapping
        });
    }
    catch (error) {
        console.error('Check faculty-subject access error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.checkFacultySubjectAccess = checkFacultySubjectAccess;
// Add deleteSubject function
const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subjectId = parseInt(id);
        // Check if subject exists
        const existingSubject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId },
        });
        if (!existingSubject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found',
            });
        }
        // Perform soft delete by setting active to false
        // Also consider deactivating related FacultySubjectMappings?
        const updatedSubject = await index_1.prisma.subject.update({
            where: { id: subjectId },
            data: { active: false }, // Assuming an 'active' field exists
        });
        res.json({
            success: true,
            message: 'Subject deactivated successfully', // Changed message
            data: updatedSubject // Optionally return the updated subject
        });
    }
    catch (error) {
        // Error handling can be simplified as foreign key constraints 
        // are less likely with soft delete, unless the relation itself requires an active subject.
        console.error('Deactivate subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.deleteSubject = deleteSubject;
// Add updateSubjectStatus function
const updateSubjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = req.user; // Get user from auth middleware
        // Check if subject exists
        const existingSubject = await index_1.prisma.subject.findUnique({
            where: { id: parseInt(id) }
        });
        if (!existingSubject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // Validate the status transition
        const validTransitions = {
            'draft': ['active', 'archived'],
            'active': ['locked', 'archived'],
            'locked': ['archived'],
            'archived': []
        };
        if (!validTransitions[existingSubject.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${existingSubject.status} to ${status}. Valid transitions are: ${validTransitions[existingSubject.status].join(', ')}`
            });
        }
        // Set additional data based on status
        const updateData = { status };
        if (status === 'locked') {
            updateData.lockedAt = new Date();
        }
        if (status === 'archived') {
            updateData.archivedAt = new Date();
        }
        // Update subject status
        const updatedSubject = await index_1.prisma.subject.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        // Log the status change
        await index_1.prisma.subjectstatuslog.create({
            data: {
                status: status,
                changedBy: user.userId,
                updatedAt: new Date(),
                timestamp: new Date(),
                createdAt: new Date(),
                // Connect to the subject using the proper Prisma relation format
                subject: {
                    connect: { id: updatedSubject.id }
                }
            }
        });
        res.json({
            success: true,
            message: `Subject status updated to ${status}`,
            data: {
                id: updatedSubject.id,
                status: updatedSubject.status
            }
        });
    }
    catch (error) {
        console.error('Update subject status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateSubjectStatus = updateSubjectStatus;
// Add getStudentsBySubject function
const getStudentsBySubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subjectId = parseInt(id);
        // Check if subject exists
        const subject = await index_1.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        // Find active faculty subject mappings for this subject
        const mappings = await index_1.prisma.facultySubjectMapping.findMany({
            where: {
                subjectId: subjectId,
                active: true,
                // Optionally filter by current academic year if available/needed
                // academicYear: getCurrentAcademicYear(), 
            },
            select: {
                batchId: true,
                section: true,
            },
            distinct: ['batchId', 'section'] // Get unique batch/section combinations
        });
        if (mappings.length === 0) {
            // No active mappings found for this subject
            return res.json({ success: true, data: [] });
        }
        // Prepare OR conditions for student query based on mappings
        const studentQueryConditions = mappings.map(mapping => ({
            batchId: mapping.batchId,
            section: mapping.section,
            // Assuming student model has batchId and section
        }));
        // Find students belonging to these batch/section combinations
        const students = await index_1.prisma.student.findMany({
            where: {
                OR: studentQueryConditions,
                // Add other relevant filters if needed (e.g., student status)
                // isActive: true, 
            },
            select: {
                id: true,
                usn: true,
                firstName: true,
                lastName: true,
                section: true, // Include section and batch for clarity
                batch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { batchId: 'asc' },
                { section: 'asc' },
                { usn: 'asc' }
            ]
        });
        res.json({
            success: true,
            data: students
        });
    }
    catch (error) {
        console.error('Get students by subject error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getStudentsBySubject = getStudentsBySubject;
const getSubjectCategories = async (req, res) => {
    try {
        const categories = await index_1.prisma.subjectcategory.findMany({
            orderBy: {
                code: 'asc'
            }
        });
        res.json({
            success: true,
            message: 'Categories fetched successfully',
            data: categories
        });
    }
    catch (error) {
        console.error('Get subject categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getSubjectCategories = getSubjectCategories;
// Create a new subject category
const createSubjectCategory = async (req, res) => {
    try {
        const { code, name, description, markingSchema } = req.body;
        const user = req.user; // Get user from auth middleware
        // Validate required fields
        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message: 'Code and name are required fields'
            });
        }
        // Check if a category with this code already exists
        const existingCategory = await index_1.prisma.subjectcategory.findUnique({
            where: { code }
        });
        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: 'A category with this code already exists'
            });
        }
        // Validate marking schema if provided
        let parsedMarkingSchema = null;
        if (markingSchema) {
            // Check if it's already a string
            if (typeof markingSchema === 'string') {
                try {
                    // Ensure it contains valid JSON
                    parsedMarkingSchema = JSON.parse(markingSchema);
                }
                catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid marking schema JSON format'
                    });
                }
            }
            else if (Array.isArray(markingSchema)) {
                // If it's an array, stringify it
                parsedMarkingSchema = markingSchema;
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Marking schema must be an array of component objects'
                });
            }
            // Validate the schema structure
            if (!Array.isArray(parsedMarkingSchema)) {
                return res.status(400).json({
                    success: false,
                    message: 'Marking schema must be an array of component objects'
                });
            }
            // Validate each component has required fields
            for (const component of parsedMarkingSchema) {
                if (!component.name || typeof component.name !== 'string') {
                    return res.status(400).json({
                        success: false,
                        message: 'Each component must have a valid name property'
                    });
                }
                if (!component.max_marks || typeof component.max_marks !== 'number' || component.max_marks <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each component must have a valid max_marks property (positive number)'
                    });
                }
            }
        }
        // Create the new category
        const newCategory = await index_1.prisma.subjectcategory.create({
            data: {
                code,
                name,
                description,
                markingSchema: parsedMarkingSchema ? JSON.stringify(parsedMarkingSchema) : null,
                updatedAt: new Date()
            }
        });
        res.status(201).json({
            success: true,
            message: 'Subject category created successfully',
            data: newCategory
        });
    }
    catch (error) {
        console.error('Create subject category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createSubjectCategory = createSubjectCategory;
// Get a subject category by ID or code
const getSubjectCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if id is a number (ID) or string (code)
        const isNumeric = /^\d+$/.test(id);
        let category;
        if (isNumeric) {
            // Search by ID
            category = await index_1.prisma.subjectcategory.findUnique({
                where: { id: parseInt(id) }
            });
        }
        else {
            // Search by code
            category = await index_1.prisma.subjectcategory.findUnique({
                where: { code: id }
            });
        }
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Subject category not found'
            });
        }
        // Parse marking schema if it exists
        if (category.markingSchema) {
            try {
                const parsedSchema = JSON.parse(category.markingSchema);
                return res.json({
                    success: true,
                    data: {
                        ...category,
                        markingSchema: parsedSchema
                    }
                });
            }
            catch (e) {
                // If parsing fails, return the raw string
                return res.json({
                    success: true,
                    data: category
                });
            }
        }
        res.json({
            success: true,
            data: category
        });
    }
    catch (error) {
        console.error('Get subject category by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getSubjectCategoryById = getSubjectCategoryById;
// Update subject category marking schema
const updateCategoryMarkingSchema = async (req, res) => {
    try {
        const { id } = req.params;
        const { markingSchema, updateExistingSubjects = false } = req.body;
        const user = req.user;
        // Only super admin can update marking schemas
        if (user.loginType !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can update category marking schemas'
            });
        }
        // Validate the marking schema format
        if (!Array.isArray(markingSchema)) {
            return res.status(400).json({
                success: false,
                message: 'Marking schema must be an array of component objects'
            });
        }
        // Validate each component has required fields
        for (const component of markingSchema) {
            if (!component.name || typeof component.name !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Each component must have a valid name property'
                });
            }
            if (!component.max_marks || typeof component.max_marks !== 'number' || component.max_marks <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Each component must have a valid max_marks property (positive number)'
                });
            }
        }
        // Normalize the marking schema to ensure all components are properly formatted
        const normalizedSchema = markingSchema.map(component => ({
            name: component.name.trim(),
            max_marks: parseFloat(component.max_marks),
            componentType: component.name.toLowerCase().includes('external') ? 'external' : 'internal'
        }));
        // Check if id is a number or a string code
        const isNumeric = /^\d+$/.test(id);
        let categoryId;
        // Transaction to update category and potentially all subjects using this category
        const result = await index_1.prisma.$transaction(async (tx) => {
            // First find the category to update
            let category;
            if (isNumeric) {
                categoryId = parseInt(id);
                category = await tx.subjectcategory.findUnique({
                    where: { id: categoryId }
                });
            }
            else {
                category = await tx.subjectcategory.findUnique({
                    where: { code: id }
                });
                if (category) {
                    categoryId = category.id;
                }
            }
            if (!category) {
                return { error: 'Category not found' };
            }
            // Update the category
            const updatedCategory = await tx.subjectcategory.update({
                where: { id: categoryId },
                data: {
                    markingSchema: JSON.stringify(normalizedSchema),
                    updatedAt: new Date()
                }
            });
            // If requested, update all draft subjects with this category
            if (updateExistingSubjects) {
                // Find all draft subjects using this category
                const draftSubjects = await tx.subject.findMany({
                    where: {
                        categoryId: categoryId,
                        status: 'draft' // Only update subjects in draft status
                    }
                });
                let updatedSubjects = 0;
                // For each subject, update its exam components
                for (const subject of draftSubjects) {
                    // Delete existing non-custom components
                    await tx.examcomponent.deleteMany({
                        where: {
                            subjectId: subject.id,
                            isCustom: false
                        }
                    });
                    // Create new components based on normalized schema
                    for (const component of normalizedSchema) {
                        await tx.examcomponent.create({
                            data: {
                                subjectId: subject.id,
                                name: component.name,
                                componentType: component.componentType,
                                maxMarks: component.max_marks,
                                weightagePercent: (component.max_marks / 100) * 100,
                            }
                        });
                    }
                    updatedSubjects++;
                }
                return {
                    category: updatedCategory,
                    updatedSubjectsCount: updatedSubjects
                };
            }
            return {
                category: updatedCategory,
                updatedSubjectsCount: 0
            };
        });
        // Check for transaction error
        if ('error' in result) {
            return res.status(404).json({
                success: false,
                message: result.error
            });
        }
        res.json({
            success: true,
            message: 'Category marking schema updated successfully',
            data: {
                id: result.category.id,
                code: result.category.code,
                name: result.category.name,
                markingSchema: normalizedSchema,
                updatedSubjects: result.updatedSubjectsCount
            }
        });
    }
    catch (error) {
        console.error('Update category marking schema error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateCategoryMarkingSchema = updateCategoryMarkingSchema;
// Get exam components for a subject
const getSubjectExamComponents = async (req, res) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const subjectId = parseInt(id);
        // Check if subject exists
        const subject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                subjectcategory: true,
                examcomponent: {
                    orderBy: {
                        id: 'asc'
                    }
                }
            }
        });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        // Group components by type for easier consumption in frontend
        const internalComponents = subject.examcomponent.filter(c => c.componentType === 'internal');
        const externalComponents = subject.examcomponent.filter(c => c.componentType === 'external');
        const customComponents = subject.examcomponent.filter(c => c.isCustom);
        // Calculate total marks
        const totalInternalMarks = internalComponents.reduce((sum, c) => sum + c.maxMarks, 0);
        const totalExternalMarks = externalComponents.reduce((sum, c) => sum + c.maxMarks, 0);
        res.json({
            success: true,
            message: 'Exam components retrieved successfully',
            data: {
                subjectId: subject.id,
                subjectCode: subject.code,
                subjectName: subject.name,
                categoryCode: ((_a = subject.subjectcategory) === null || _a === void 0 ? void 0 : _a.code) || null,
                categoryName: ((_b = subject.subjectcategory) === null || _b === void 0 ? void 0 : _b.name) || null,
                components: subject.examcomponent,
                summary: {
                    internalComponents: internalComponents.length,
                    externalComponents: externalComponents.length,
                    customComponents: customComponents.length,
                    totalInternalMarks,
                    totalExternalMarks,
                    totalMarks: totalInternalMarks + totalExternalMarks
                },
                canEdit: subject.status === 'draft'
            }
        });
    }
    catch (error) {
        console.error('Get subject exam components error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getSubjectExamComponents = getSubjectExamComponents;
// Add custom exam component to a subject
const addCustomExamComponent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, componentType, maxMarks, weightagePercent } = req.body;
        const subjectId = parseInt(id);
        // Validate inputs
        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Component name is required'
            });
        }
        if (!componentType || !['internal', 'external'].includes(componentType)) {
            return res.status(400).json({
                success: false,
                message: 'Component type must be either "internal" or "external"'
            });
        }
        if (!maxMarks || typeof maxMarks !== 'number' || maxMarks <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Max marks must be a positive number'
            });
        }
        // Find the subject and check if it's in draft status
        const subject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId }
        });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        if (subject.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Custom components can only be added to subjects in draft status'
            });
        }
        // Check if component with same name already exists
        const existingComponent = await index_1.prisma.examcomponent.findFirst({
            where: {
                subjectId,
                name: {
                    equals: name,
                    mode: 'insensitive' // Case-insensitive comparison
                }
            }
        });
        if (existingComponent) {
            return res.status(409).json({
                success: false,
                message: 'A component with this name already exists for this subject'
            });
        }
        // Create the custom component
        const newComponent = await index_1.prisma.examcomponent.create({
            data: {
                subjectId,
                name,
                componentType,
                maxMarks: parseFloat(maxMarks.toString()),
                weightagePercent: weightagePercent ? parseFloat(weightagePercent.toString()) : (maxMarks / 100) * 100,
                isCustom: true // Mark as a custom component
            }
        });
        res.status(201).json({
            success: true,
            message: 'Custom exam component added successfully',
            data: newComponent
        });
    }
    catch (error) {
        console.error('Add custom exam component error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.addCustomExamComponent = addCustomExamComponent;
// Delete a custom exam component
const deleteExamComponent = async (req, res) => {
    try {
        const { id, componentId } = req.params;
        const subjectId = parseInt(id);
        const examComponentId = parseInt(componentId);
        // Find the subject and check if it's in draft status
        const subject = await index_1.prisma.subject.findUnique({
            where: { id: subjectId }
        });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        if (subject.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Exam components can only be modified for subjects in draft status'
            });
        }
        // Find the component
        const component = await index_1.prisma.examcomponent.findFirst({
            where: {
                id: examComponentId,
                subjectId
            }
        });
        if (!component) {
            return res.status(404).json({
                success: false,
                message: 'Exam component not found'
            });
        }
        // Prevent deletion of default components (non-custom ones) to maintain the category's marking schema integrity
        if (!component.isCustom) {
            return res.status(400).json({
                success: false,
                message: 'Only custom exam components can be deleted'
            });
        }
        // Delete the component
        await index_1.prisma.examcomponent.delete({
            where: { id: examComponentId }
        });
        res.json({
            success: true,
            message: 'Exam component deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete exam component error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteExamComponent = deleteExamComponent;

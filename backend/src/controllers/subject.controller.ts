import { Request, Response } from 'express';
import { prisma } from '../index';
import { getDefaultComponentsForSubject } from '../services/examComponentService';

export const createSubject = async (req: Request, res: Response) => {
  try {
    const { code, name, semester, credits, isLab, departmentId, categoryId, schemeYear, section, sectionId } = req.body;
    const user = (req as any).user;

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
      const sectionData = await prisma.section.findUnique({
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
        const category = await prisma.subjectcategory.findUnique({
          where: { code: categoryId }
        });
        
        if (category) {
          categoryIdToUse = category.id;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Subject category not found'
          });
        }
      } else {
        // If category is a number, use directly
        categoryIdToUse = parseInt(categoryId as any);
        
        // Verify category exists
        const category = await prisma.subjectcategory.findUnique({
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
      const sectionExists = await prisma.section.findUnique({
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
    const departmentExists = await prisma.department.findUnique({
      where: { id: parseInt(departmentId as any) }
    });

    if (!departmentExists) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if a subject with this code already exists before we generate our unique code
    const subjectWithCode = await prisma.$queryRawUnsafe(
      `SELECT id, code, departmentId, semester, schemeYear, sectionId FROM subject WHERE code = ?`,
      code
    ) as any[];

    if (subjectWithCode && subjectWithCode.length > 0) {
      // If a subject with this code exists, we need to generate a unique code
      const hasDuplicate = subjectWithCode.some(existingSubject => 
        existingSubject.departmentId === parseInt(departmentId as string) &&
        existingSubject.semester === parseInt(semester as string) &&
        existingSubject.schemeYear === schemeYear &&
        (!sectionId || existingSubject.sectionId === sectionId)
      );

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
      const section = await prisma.section.findUnique({
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
    const result = await prisma.$transaction(async (tx) => {
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
        parseInt(departmentId as any),
        parseInt(semester as any),
        schemeYear
      ];
      
      // If sectionId is provided, check with section
      if (sectionId) {
        query += ` AND sectionId = ?`;
        params.push(sectionId);
      } else {
        // If no section is provided, only check against subjects without section
        query += ` AND (sectionId IS NULL OR sectionId = 0)`;
      }
      
      const duplicates = await tx.$queryRawUnsafe(query, ...params) as any[];
      
      if (duplicates && duplicates.length > 0) {
        return { 
          error: sectionId 
            ? `Subject code ${uniqueSubjectCode} already exists for this department, semester, scheme year and section` 
            : `Subject code ${uniqueSubjectCode} already exists for this department, semester, and scheme year without a section`
        };
      }
      
      // Check if the uniqueSubjectCode already exists (global uniqueness check)
      const existingCode = await tx.$queryRawUnsafe(
        `SELECT id FROM subject WHERE code = ?`,
        uniqueSubjectCode
      ) as any[];
      
      if (existingCode && existingCode.length > 0) {
        return {
          error: `Subject code ${uniqueSubjectCode} already exists in the system. Please choose a different code.`
        };
      }
      
      // If we got here, we can create the subject with raw SQL
      // First get the max id to generate the next id
      const maxIdResult = await tx.$queryRawUnsafe(`SELECT MAX(id) as maxId FROM subject`) as any[];
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
      `, 
        nextId,
        uniqueSubjectCode,
        name, 
        parseInt(semester as any),
        parseInt(credits as any),
        isLab ? 1 : 0,
        parseInt(departmentId as any),
        categoryIdToUse || null,
        'draft',
        schemeYear,
        now,
        now
      );
      
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
      `,
        'draft',
        nextId,
        user.userId,
        now,
        now,
        now
      );
      
      // Get the full subject record
      const createdSubject = await tx.$queryRawUnsafe(`
        SELECT * FROM subject WHERE id = ?
      `, nextId) as any[];
      
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
        await getDefaultComponentsForSubject(subject.id);
      } catch (error) {
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
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, semester, credits, isLab, departmentId, categoryId, schemeYear, section, sectionId } = req.body;
    const subjectId = parseInt(id);

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
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
        const sectionData = await prisma.section.findUnique({
          where: { id: sectionId },
          select: { name: true }
        });
        if (sectionData && sectionData.name) {
          sectionName = sectionData.name;
        }
      } catch (error) {
        console.error("Error fetching section name:", error);
      }
    }

    // Step 1: Update subject fields using Prisma
    // Always include the required updatedAt field
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Add fields only if they are provided
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (semester !== undefined) updateData.semester = parseInt(semester as any);
    if (credits !== undefined) updateData.credits = parseInt(credits as any);
    if (isLab !== undefined) updateData.isLab = isLab;
    if (schemeYear !== undefined) updateData.schemeYear = parseInt(schemeYear as any);
    if (section !== undefined) updateData.section = section;
    
    // Update relationships if needed
    if (departmentId) {
      updateData.department = {
        connect: { id: parseInt(departmentId as any) }
      };
    }
    
    if (categoryId !== undefined) {
      if (categoryId === null) {
        updateData.subjectcategory = { disconnect: true };
      } else {
        updateData.subjectcategory = {
          connect: { id: parseInt(categoryId as any) }
        };
      }
    }
    
    // Update the subject with supported fields
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: updateData
    });

    // Step 2: If sectionId is provided, update it using raw SQL
    if (sectionId !== undefined) {
      if (sectionId === null) {
        await prisma.$executeRawUnsafe(
          `UPDATE subject SET sectionId = NULL WHERE id = ?`,
          subjectId
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE subject SET sectionId = ? WHERE id = ?`,
          parseInt(sectionId as any),
          subjectId
        );
      }
    }

    // If category was changed and the subject is in draft status, regenerate exam components
    if (categoryId !== undefined && categoryId !== existingSubject.categoryId) {
      try {
        // First delete existing components
        await prisma.examcomponent.deleteMany({
          where: { subjectId: updatedSubject.id }
        });
        
        // Then generate new ones - the service handles errors internally now
        const { getDefaultComponentsForSubject } = require('../services/examComponentService');
        await getDefaultComponentsForSubject(updatedSubject.id);
      } catch (error) {
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
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const { 
      departmentId, 
      semester, 
      schemeYear, 
      status, 
      categoryId, 
      facultyId,
      code,
      name,
      isLab,
      page = 1,
      limit = 10,
      all = false
    } = req.query;
    
    // Build basic filter criteria
    const where: any = {};
    
    if (departmentId) where.departmentId = parseInt(departmentId as string);
    if (semester) where.semester = parseInt(semester as string);
    if (schemeYear) where.schemeYear = parseInt(schemeYear as string);
    if (status) where.status = status;
    if (categoryId) where.categoryId = parseInt(categoryId as string);
    if (code) where.code = { contains: code };
    if (name) where.name = { contains: name };
    if (isLab !== undefined) where.isLab = isLab === 'true';

    // Filter by faculty ID if provided
    let filteredSubjectIds: number[] = [];
    if (facultyId) {
      const mappings = await prisma.facultySubjectMapping.findMany({
        where: { 
          facultyId: facultyId as string,
          active: true 
        },
        select: { subjectId: true }
      });
      
      if (mappings.length === 0) {
        return res.json({
          success: true,
          data: {
            subjects: [],
            pagination: {
              total: 0,
              page: parseInt(page as string),
              limit: parseInt(limit as string),
              totalPages: 0
            }
          }
        });
      }
      
      filteredSubjectIds = mappings.map(m => m.subjectId);
      where.id = { in: filteredSubjectIds };
    }

    // Count total for pagination
    const total = await prisma.subject.count({ where });
    
    if (total === 0) {
      return res.json({
        success: true,
        data: {
          subjects: [],
          pagination: {
            total: 0,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            totalPages: 0
          }
        }
      });
    }

    // Calculate pagination
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const totalPages = Math.ceil(total / limitNumber);
    const skip = all === 'true' ? 0 : (pageNumber - 1) * limitNumber;
    const take = all === 'true' ? undefined : limitNumber;
    
    // Fetch subjects with minimal includes
    const subjects = await prisma.subject.findMany({
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
        subjectcategory: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { semester: 'asc' },
        { code: 'asc' }
      ]
    });
    
    // Return with pagination data
    return res.json({
      success: true,
      data: {
        subjects,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate the ID parameter
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID format. Must be a valid number.'
      });
    }
    
    const subjectId = parseInt(id);
    
    // Get the subject with all related data
    const subject = await prisma.subject.findUnique({
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
    const sectionData = await prisma.$queryRawUnsafe(
      `SELECT s.sectionId, sec.id, sec.name, sec.departmentId, sec.batchId, sec.currentSemester
       FROM subject s
       LEFT JOIN section sec ON s.sectionId = sec.id
       WHERE s.id = ?`,
      subjectId
    ) as any[];
    
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
  catch (error: any) {
    console.error('Error fetching subject by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject',
      error: error.message
    });
  }
};

// Faculty-Subject Mapping operations
export const createFacultySubjectMapping = async (req: Request, res: Response) => {
  try {
    const { 
      facultyId, 
      subjectId, 
      section, 
      semester, 
      batchId, 
      academicYear,
      componentScope,
      isPrimary,
      active 
    } = req.body;
    
    // Get the user making the request
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.loginType;

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
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
    const subject = await prisma.subject.findUnique({
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
    const batch = await prisma.batch.findUnique({
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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { faculty: true }
      });
      
      if (user?.faculty && user.faculty.departmentId === faculty.departmentId && 
          faculty.departmentId === subject.departmentId) {
        status = 'approved';
        approvedBy = userId;
        approvedAt = new Date();
      }
    }

    // Check for existing mapping
    const existingMapping = await prisma.facultySubjectMapping.findFirst({
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
        const updatedMapping = await prisma.facultySubjectMapping.update({
          where: { id: existingMapping.id },
          data: { 
            componentScope: componentScope || 'theory',
            isPrimary: isPrimary !== undefined ? isPrimary : true,
            active: true,
            status: status as any,
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
      await prisma.facultySubjectMapping.updateMany({
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
    const mapping = await prisma.facultySubjectMapping.create({
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
        status: status as any,
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
  } catch (error) {
    console.error('Create faculty-subject mapping error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getFacultySubjectMappings = async (req: Request, res: Response) => {
  try {
    const { 
      facultyId, 
      subjectId, 
      semester, 
      section, 
      batchId, 
      academicYear,
      componentScope,
      active = 'true'
    } = req.query;

    // Build filter conditions
    const filterConditions: any = {};

    if (facultyId) {
      filterConditions.facultyId = parseInt(facultyId as string);
    }

    if (subjectId) {
      filterConditions.subjectId = parseInt(subjectId as string);
    }

    if (semester) {
      filterConditions.semester = parseInt(semester as string);
    }

    if (section) {
      filterConditions.section = section as string;
    }

    if (batchId) {
      filterConditions.batchId = parseInt(batchId as string);
    }

    if (academicYear) {
      filterConditions.academicYear = academicYear as string;
    }

    if (componentScope) {
      filterConditions.componentScope = componentScope as string;
    }

    // Handle active status filtering
    if (active !== undefined) {
      filterConditions.active = active === 'true';
    }

    // Get mappings
    const mappings = await prisma.facultySubjectMapping.findMany({
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
  } catch (error) {
    console.error('Get faculty-subject mappings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteFacultySubjectMapping = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if mapping exists
    const mapping = await prisma.facultySubjectMapping.findUnique({
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
    const deactivatedMapping = await prisma.facultySubjectMapping.update({
      where: { id: parseInt(id) },
      data: { active: false }
    });

    res.json({
      success: true,
      message: 'Faculty-subject mapping deactivated successfully',
      data: deactivatedMapping
    });
  } catch (error) {
    console.error('Delete faculty-subject mapping error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update faculty-subject mapping
export const updateFacultySubjectMapping = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      componentScope,
      isPrimary,
      active
    } = req.body;

    // Check if mapping exists
    const mapping = await prisma.facultySubjectMapping.findUnique({
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
      await prisma.facultySubjectMapping.updateMany({
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
    const updatedMapping = await prisma.facultySubjectMapping.update({
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
  } catch (error) {
    console.error('Update faculty-subject mapping error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Approve or reject a faculty-subject mapping
 */
export const approveRejectFacultyMapping = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    // Get the user making the request
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.loginType;
    
    // Ensure only Dept Admin (3) or Super Admin (1) can approve/reject
    if (userRole !== 1 && userRole !== 3) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Only department admins or super admins can approve mappings.'
      });
    }
    
    // Check if mapping exists
    const mapping = await prisma.facultySubjectMapping.findUnique({
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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { faculty: true }
      });
      
      if (!user?.faculty || user.faculty.departmentId !== mapping.faculty.departmentId) {
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
    const updatedMapping = await prisma.facultySubjectMapping.update({
      where: { id: parseInt(id) },
      data: {
        status: status as any,
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
  } catch (error) {
    console.error('Approve/reject faculty-subject mapping error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const checkFacultySubjectAccess = async (req: Request, res: Response) => {
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
    const mapping = await prisma.facultySubjectMapping.findFirst({
      where: {
        facultyId: facultyId as string, // Faculty ID is a string in the model
        subjectId: parseInt(subjectId as string),
        section: section as string,
        academicYear: academicYear as string,
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
  } catch (error) {
    console.error('Check faculty-subject access error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add deleteSubject function
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subjectId = parseInt(id);

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Perform soft delete by setting status to 'archived' instead of active: false
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: { 
        status: 'archived',
        archivedAt: new Date()
      },
    });

    // Also deactivate related faculty mappings
    await prisma.facultySubjectMapping.updateMany({
      where: { subjectId },
      data: { active: false }
    });

    res.json({
      success: true,
      message: 'Subject archived successfully',
      data: updatedSubject
    });

  } catch (error: any) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add updateSubjectStatus function
export const updateSubjectStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user as any; // Get user from auth middleware

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Validate the status transition
    const validTransitions: Record<string, string[]> = {
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
    const updateData: any = { status };
    
    if (status === 'locked') {
      updateData.lockedAt = new Date();
    }
    
    if (status === 'archived') {
      updateData.archivedAt = new Date();
    }

    // Update subject status
    const updatedSubject = await prisma.subject.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log the status change
    await prisma.subjectstatuslog.create({
      data: {
        status: status as any,
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
  } catch (error) {
    console.error('Update subject status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add getStudentsBySubject function
export const getStudentsBySubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subjectId = parseInt(id);

    // Check if subject exists
     const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
     if (!subject) {
       return res.status(404).json({ success: false, message: 'Subject not found' });
     }

    // Find active faculty subject mappings for this subject
    const mappings = await prisma.facultySubjectMapping.findMany({
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
    const students = await prisma.student.findMany({
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

  } catch (error) {
    console.error('Get students by subject error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getSubjectCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.subjectcategory.findMany({
      orderBy: {
        code: 'asc'
      }
    });

    res.json({
      success: true,
      message: 'Categories fetched successfully',
      data: categories
    });
  } catch (error) {
    console.error('Get subject categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create a new subject category
export const createSubjectCategory = async (req: Request, res: Response) => {
  try {
    const { code, name, description, markingSchema } = req.body;
    const user = req.user as any; // Get user from auth middleware

    // Validate required fields
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Code and name are required fields'
      });
    }

    // Check if a category with this code already exists
    const existingCategory = await prisma.subjectcategory.findUnique({
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
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Invalid marking schema JSON format'
          });
        }
      } else if (Array.isArray(markingSchema)) {
        // If it's an array, stringify it
        parsedMarkingSchema = markingSchema;
      } else {
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
    const newCategory = await prisma.subjectcategory.create({
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
  } catch (error) {
    console.error('Create subject category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get a subject category by ID or code
export const getSubjectCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if id is a number (ID) or string (code)
    const isNumeric = /^\d+$/.test(id);
    
    let category;
    if (isNumeric) {
      // Search by ID
      category = await prisma.subjectcategory.findUnique({
        where: { id: parseInt(id) }
      });
    } else {
      // Search by code
      category = await prisma.subjectcategory.findUnique({
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
      } catch (e) {
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
  } catch (error) {
    console.error('Get subject category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update subject category marking schema
export const updateCategoryMarkingSchema = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { markingSchema, updateExistingSubjects = false } = req.body;
    const user = req.user as any;
    
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
    const result = await prisma.$transaction(async (tx) => {
      // First find the category to update
      let category;
      if (isNumeric) {
        categoryId = parseInt(id);
        category = await tx.subjectcategory.findUnique({
          where: { id: categoryId }
        });
      } else {
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
  } catch (error) {
    console.error('Update category marking schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get exam components for a subject
export const getSubjectExamComponents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subjectId = parseInt(id);
    
    // Check if subject exists
    const subject = await prisma.subject.findUnique({
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
        categoryCode: subject.subjectcategory?.code || null,
        categoryName: subject.subjectcategory?.name || null,
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
  } catch (error) {
    console.error('Get subject exam components error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add custom exam component to a subject
export const addCustomExamComponent = async (req: Request, res: Response) => {
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
    const subject = await prisma.subject.findUnique({
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
    const existingComponent = await prisma.examcomponent.findFirst({
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
    const newComponent = await prisma.examcomponent.create({
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
  } catch (error) {
    console.error('Add custom exam component error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete a custom exam component
export const deleteExamComponent = async (req: Request, res: Response) => {
  try {
    const { id, componentId } = req.params;
    const subjectId = parseInt(id);
    const examComponentId = parseInt(componentId);
    
    // Find the subject and check if it's in draft status
    const subject = await prisma.subject.findUnique({
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
    const component = await prisma.examcomponent.findFirst({
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
    await prisma.examcomponent.delete({
      where: { id: examComponentId }
    });
    
    res.json({
      success: true,
      message: 'Exam component deleted successfully'
    });
  } catch (error) {
    console.error('Delete exam component error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

import { Request, Response } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcrypt';

export const createFaculty = async (req: Request, res: Response) => {
  try {
    const {
      name,
      prefix,
      email,
      phone,
      designation,
      gender,
      dateOfBirth,
      qualification,
      departmentId,
      teachingExperience,
      industryExperience,
      yearOfJoining,
      permanentAddress,
      presentAddress,
      aicteId
    } = req.body;

    // Check if email already exists
    const existingFacultyEmail = await prisma.faculty.findFirst({
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
      const department = await prisma.department.findUnique({
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
    const facultyCount = await prisma.faculty.count();
    const facultyId = `FAC${String(facultyCount + 1).padStart(4, '0')}`;

    // Create faculty with correct fields based on the Prisma schema
    const faculty = await prisma.faculty.create({
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
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = await prisma.user.create({
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
        defaultPassword
      }
    });
  } catch (error) {
    console.error('Create faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateFaculty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      prefix,
      email,
      phone,
      designation,
      gender,
      dateOfBirth,
      qualification,
      departmentId,
      teachingExperience,
      industryExperience,
      yearOfJoining,
      permanentAddress,
      presentAddress,
      aicteId,
      isActive
    } = req.body;

    // Check if faculty exists
    const existingFaculty = await prisma.faculty.findUnique({
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
      const duplicateEmail = await prisma.faculty.findFirst({
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
      const department = await prisma.department.findUnique({
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
    const updatedFaculty = await prisma.faculty.update({
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
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: existingFaculty.email.split('@')[0] },
            { email: existingFaculty.email }
          ]
        }
      });

      if (user) {
        await prisma.user.update({
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
  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getFaculty = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', departmentId } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);

    // Build search and filter conditions
    let whereCondition: any = {};
    if (search) {
      whereCondition.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } },
        { designation: { contains: search as string } }
      ];
    }
    if (departmentId) {
      whereCondition.departmentId = parseInt(departmentId as string);
    }
    
    // Count total for pagination
    const total = await prisma.faculty.count({
      where: whereCondition
    });
    
    // Return early if no results
    if (total === 0) {
      return res.json({
        success: true,
        data: {
          faculty: [],
          pagination: {
            total: 0,
            page: pageNumber,
            limit: limitNumber,
            totalPages: 0
          }
        }
      });
    }
    
    // Fetch faculty with pagination
    const faculty = await prisma.faculty.findMany({
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
    
    // Format response
    const facultyList = faculty.map(f => {
      const nameArray = (f.name || '').split(' ');
      const firstName = nameArray[0] || '';
      const lastName = nameArray.length > 1 ? nameArray.slice(1).join(' ') : '';
      
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
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getFacultyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const faculty = await prisma.faculty.findUnique({
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
        facultysubjectmapping: {
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
  } catch (error) {
    console.error('Get faculty by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Handler for /faculty/subject-mappings route
export const getFacultySubjectMappings = async (req: Request, res: Response) => {
  try {
    // Get faculty ID from authenticated user
    const facultyId = req.user?.facultyId;
    
    if (!facultyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access faculty subject mappings'
      });
    }
    
    // Get active parameter
    const isActive = req.query.active === 'true';
    
    // Get faculty with their subject mappings
    const facultyWithMappings = await prisma.faculty.findUnique({
      where: { 
        id: facultyId,
      },
      include: {
        facultysubjectmapping: {
          where: isActive ? { isActive: true } : {},
          include: {
            subject: true,
            batch: true
          }
        }
      }
    });
    
    if (!facultyWithMappings) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }
    
    res.json({
      success: true,
      data: facultyWithMappings.facultysubjectmapping
    });
  } catch (error) {
    console.error('Get faculty subject mappings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getFacultySubjects = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const faculty = await prisma.faculty.findUnique({
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

    const subjectMappings = await prisma.facultySubjectMapping.findMany({
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
    const groupedByYear: any = {};
    
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
  } catch (error) {
    console.error('Get faculty subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const bulkUploadFaculty = async (req: Request, res: Response) => {
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
        const {
          name,
          email,
          phone,
          designation,
          departmentCode,
          qualification
        } = faculty;

        // Validate required fields
        if (!email || !departmentCode) {
          results.errors.push({
            email: email || 'Unknown',
            error: 'Missing required fields: email or departmentCode'
          });
          continue;
        }

        // Find department by code
        const department = await prisma.department.findUnique({
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
        const existingFaculty = await prisma.faculty.findFirst({
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
        const facultyCount = await prisma.faculty.count();
        const id = `FAC${String(facultyCount + 1).padStart(4, '0')}`;

        // Create faculty with proper fields according to the schema
        const createdFaculty = await prisma.faculty.create({
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
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await prisma.user.create({
          data: {
            username,
            email,
            passwordHash: hashedPassword,
            loginType: 2, // Faculty login type
            departmentId: department.id,
            isActive: true,
            firstLogin: true,
            faculty: {
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
      } catch (error) {
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
  } catch (error) {
    console.error('Bulk upload faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 
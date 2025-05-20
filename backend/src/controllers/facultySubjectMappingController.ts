import { Request, Response } from 'express';
import { prisma } from '../index';
import { facultysubjectmapping_status } from '@prisma/client';

// Get all mappings with role-based filtering
export const getAllMappings = async (req: Request, res: Response) => {
  try {
    const { user } = req as any; // User data from auth middleware
    const { 
      facultyId, 
      subjectId, 
      batchId, 
      section, 
      semester, 
      academicYear,
      active = 'true',
      componentScope
    } = req.query;

    // Build query filters
    const filters: any = {};
    
    if (facultyId) filters.facultyId = facultyId as string;
    if (subjectId) filters.subjectId = parseInt(subjectId as string);
    if (batchId) filters.batchId = batchId as string;
    if (section) filters.section = section as string;
    if (semester) filters.semester = parseInt(semester as string);
    if (academicYear) filters.academicYear = academicYear as string;
    if (componentScope) filters.componentScope = componentScope as string;
    
    // Handle active filter
    if (active !== undefined && active !== 'all') {
      // Only apply filter if active is not 'all'
      filters.active = active === 'true';
    }

    // Add role-based filtering
    if (user.loginType === 2) { // Faculty
      // Get faculty ID from user
      const faculty = await prisma.faculty.findFirst({
        where: {
          id: user.facultyAccount?.id
        }
      });

      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: 'Faculty profile not found'
        });
      }

      // Faculty can only see their own mappings
      filters.facultyId = faculty.id;
    } else if (user.loginType === 3) { // Department Admin
      // Department admin can see mappings for their department
      filters.subject = {
        departmentId: user.departmentId
      };
    }
    // Super admin (loginType = 1) can see all mappings, no additional filters

    // Get mappings with filters
    const mappings = await prisma.facultySubjectMapping.findMany({
      where: filters,
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
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
            departmentId: true,
            categoryId: true,
            status: true,
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Faculty subject mappings retrieved successfully',
      data: mappings
    });
  } catch (error: any) {
    console.error('Error getting faculty subject mappings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve faculty subject mappings',
      error: error.message
    });
  }
};

// Get mapping by ID
export const getMappingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req as any;

    const mapping = await prisma.facultySubjectMapping.findUnique({
      where: { id: parseInt(id) },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            semester: true,
            departmentId: true,
            categoryId: true,
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
            academicYear: true,
            currentSemester: true
          }
        }
      }
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Faculty subject mapping not found'
      });
    }

    // Role-based access check
    if (user.loginType === 2) { // Faculty
      const faculty = await prisma.faculty.findFirst({
        where: {
          id: user.facultyAccount?.id
        }
      });

      if (!faculty || mapping.facultyId !== faculty.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this mapping'
        });
      }
    } else if (user.loginType === 3) { // Department Admin
      // Check if the subject's department matches the admin's department
      const subject = await prisma.subject.findUnique({
        where: { id: mapping.subjectId }
      });

      if (!subject || subject.departmentId !== user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view mapping for other departments'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Faculty subject mapping retrieved successfully',
      data: mapping
    });
  } catch (error: any) {
    console.error('Error getting faculty subject mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve faculty subject mapping',
      error: error.message
    });
  }
};

// Create new mapping
export const createMapping = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    const {
      facultyId,
      subjectId,
      section,
      semester,
      batchId,
      academicYear,
      componentScope,
      isPrimary
    } = req.body;

    // Validate request body
    if (!facultyId || !subjectId || !semester || !batchId || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Role-based permission check
    if (user.loginType !== 1 && user.loginType !== 3) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create faculty subject mappings'
      });
    }

    // If department admin, check if subject belongs to their department
    if (user.loginType === 3) {
      const subject = await prisma.subject.findUnique({
        where: { id: parseInt(subjectId) }
      });

      if (!subject || subject.departmentId !== user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You can only assign subjects from your department'
        });
      }
    }

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId }
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if a similar mapping already exists and is active
    const existingMapping = await prisma.facultySubjectMapping.findFirst({
      where: {
        facultyId,
        subjectId: parseInt(subjectId),
        section,
        academicYear,
        componentScope: componentScope || 'theory',
        active: true
      }
    });

    if (existingMapping) {
      return res.status(400).json({
        success: false,
        message: 'A similar active mapping already exists for this faculty, subject, section, and component scope'
      });
    }

    // Create new mapping
    const newMapping = await prisma.facultySubjectMapping.create({
      data: {
        facultyId,
        subjectId: parseInt(subjectId),
        section: section || null,
        semester: parseInt(semester),
        batchId,
        academicYear,
        componentScope: componentScope || 'theory',
        isPrimary: isPrimary === undefined ? true : Boolean(isPrimary),
        active: true,
        status: facultysubjectmapping_status.approved, // Auto-approve for admin created mappings
        approvedAt: new Date(),
        approvedBy: user.id,
        updatedAt: new Date()
      },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subject: {
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
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Faculty subject mapping created successfully',
      data: newMapping
    });
  } catch (error: any) {
    console.error('Error creating faculty subject mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create faculty subject mapping',
      error: error.message
    });
  }
};

// Update mapping status (active/inactive)
export const updateMappingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    const { user } = req as any;

    if (active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Active status is required'
      });
    }

    // Role-based permission check
    if (user.loginType !== 1 && user.loginType !== 3) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update faculty subject mappings'
      });
    }

    // Check if mapping exists
    const mapping = await prisma.facultySubjectMapping.findUnique({
      where: { id: parseInt(id) },
      include: {
        subject: {
          select: {
            departmentId: true
          }
        }
      }
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Faculty subject mapping not found'
      });
    }

    // If department admin, check if subject belongs to their department
    if (user.loginType === 3 && mapping.subject.departmentId !== user.departmentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update mappings for subjects in your department'
      });
    }

    // Check for attendance or marks entries before deactivating
    if (mapping.active && !active) {
      // Check for attendance
      const attendanceSessions = await prisma.attendanceSession.findMany({
        where: {
          subjectId: mapping.subjectId,
          facultyId: mapping.facultyId,
          section: mapping.section || undefined
        }
      });

      // Check for marks entries
      const marksEntries = await prisma.studentcomponentmark.findMany({
        where: {
          subjectId: mapping.subjectId,
          facultyId: mapping.facultyId
        }
      });

      if (attendanceSessions.length > 0 || marksEntries.length > 0) {
        // Warning: There are related entries, but we'll still deactivate
        console.log(`Warning: Deactivating mapping with existing attendance (${attendanceSessions.length}) or marks (${marksEntries.length}) entries`);
      }
    }

    // Update mapping status
    const updatedMapping = await prisma.facultySubjectMapping.update({
      where: { id: parseInt(id) },
      data: {
        active: Boolean(active)
      },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subject: {
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
      }
    });

    return res.status(200).json({
      success: true,
      message: `Faculty subject mapping ${active ? 'activated' : 'deactivated'} successfully`,
      data: updatedMapping
    });
  } catch (error: any) {
    console.error('Error updating faculty subject mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update faculty subject mapping',
      error: error.message
    });
  }
};

// Get students for a subject mapping
export const getStudentsForMapping = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req as any;

    // Find the mapping
    const mapping = await prisma.facultySubjectMapping.findUnique({
      where: { id: parseInt(id) },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            departmentId: true
          }
        },
        batch: true
      }
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Faculty subject mapping not found'
      });
    }

    // Role-based access check
    if (user.loginType === 2) { // Faculty
      const faculty = await prisma.faculty.findFirst({
        where: {
          id: user.facultyAccount?.id
        }
      });

      if (!faculty || mapping.facultyId !== faculty.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view students for this mapping'
        });
      }
    } else if (user.loginType === 3) { // Department Admin
      if (mapping.subject.departmentId !== user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view students for subjects in your department'
        });
      }
    }

    // Get students based on batch, department, and section
    const students = await prisma.student.findMany({
      where: {
        batchId: mapping.batchId,
        departmentId: mapping.subject.departmentId,
        semester: mapping.semester,
        section: mapping.section || undefined
      },
      select: {
        usn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        semester: true,
        section: true
      },
      orderBy: {
        usn: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: {
        mapping,
        students: students.map(student => ({
          ...student,
          name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim()
        }))
      }
    });
  } catch (error: any) {
    console.error('Error getting students for mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students',
      error: error.message
    });
  }
};

// Delete mapping (hard delete - only for unused mappings)
export const deleteMapping = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req as any;

    // Role-based permission check
    if (user.loginType !== 1 && user.loginType !== 3) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete faculty subject mappings'
      });
    }

    // Check if mapping exists
    const mapping = await prisma.facultySubjectMapping.findUnique({
      where: { id: parseInt(id) },
      include: {
        subject: {
          select: {
            departmentId: true
          }
        }
      }
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Faculty subject mapping not found'
      });
    }

    // If department admin, check if subject belongs to their department
    if (user.loginType === 3 && mapping.subject.departmentId !== user.departmentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete mappings for subjects in your department'
      });
    }

    // Check for attendance or marks entries before deleting
    const attendanceSessions = await prisma.attendanceSession.findMany({
      where: {
        subjectId: mapping.subjectId,
        facultyId: mapping.facultyId,
        section: mapping.section || undefined
      }
    });

    const marksEntries = await prisma.studentcomponentmark.findMany({
      where: {
        subjectId: mapping.subjectId,
        facultyId: mapping.facultyId
      }
    });

    if (attendanceSessions.length > 0 || marksEntries.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete mapping with existing attendance or marks entries. Use deactivate instead.',
        data: {
          attendanceCount: attendanceSessions.length,
          marksCount: marksEntries.length
        }
      });
    }

    // Delete mapping
    await prisma.facultySubjectMapping.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      success: true,
      message: 'Faculty subject mapping deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting faculty subject mapping:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete faculty subject mapping',
      error: error.message
    });
  }
};

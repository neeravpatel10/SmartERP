import { Request, Response } from 'express';
import { prisma } from '../index';

export const createBatch = async (req: Request, res: Response) => {
  try {
    const {
      departmentId,
      currentSemester,
      autoRollover,
      archived,
      academicYear
    } = req.body;

    // Validate academicYear format
    if (!academicYear || !/^[0-9]{4}-[0-9]{4}$/.test(academicYear)) {
      return res.status(400).json({
        success: false,
        message: 'Academic year must be in format YYYY-YYYY'
      });
    }

    // Get year from academicYear
    const year = academicYear.split('-')[0];
    const batchId = year;
    const name = `${year} Batch`;

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if batch already exists for the department and academic year
    const existingBatch = await prisma.batch.findFirst({
      where: {
        id: batchId,
        departmentId,
        academicYear
      }
    });

    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: 'Batch for this year and department already exists'
      });
    }

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        id: batchId,
        name,
        departmentId,
        currentSemester: currentSemester ?? 1,
        autoRollover: autoRollover ?? false,
        archived: archived ?? false,
        academicYear
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

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateBatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const batchId = id;
    const {
      name,
      departmentId,
      currentSemester,
      autoRollover,
      archived,
      academicYear
    } = req.body;

    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id: batchId }
    });

    if (!existingBatch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Validate academicYear format if provided
    if (academicYear && !/^\d{4}-\d{4}$/.test(academicYear)) {
      return res.status(400).json({
        success: false,
        message: 'Academic year must be in format YYYY-YYYY'
      });
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

    // If name or academicYear is being updated, check for duplicates
    if ((name && name !== existingBatch.name) || (academicYear && academicYear !== existingBatch.academicYear)) {
      const duplicateBatch = await prisma.batch.findFirst({
        where: {
          name: name || existingBatch.name,
          departmentId: departmentId || existingBatch.departmentId,
          academicYear: academicYear || existingBatch.academicYear,
          id: { not: batchId }
        }
      });

      if (duplicateBatch) {
        return res.status(400).json({
          success: false,
          message: 'Batch with this name and academic year already exists for this department'
        });
      }
    }

    // Archiving specific validation
    if (archived === true && existingBatch.archived === false) {
      // Check if there are active students associated with this batch
      const activeStudentsCount = await prisma.student.count({
        where: { batchId: batchId }
      });

      if (activeStudentsCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot archive batch with ${activeStudentsCount} associated students. Please reassign students first.`
        });
      }
      
      // Potentially check for active faculty mappings too
      const activeMappingsCount = await prisma.facultySubjectMapping.count({
        where: { batchId: batchId, active: true }
      });

      if (activeMappingsCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot archive batch with ${activeMappingsCount} active faculty mappings.`
        });
      }
    }

    // Prepare data for update
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (currentSemester !== undefined) updateData.currentSemester = currentSemester;
    if (autoRollover !== undefined) updateData.autoRollover = autoRollover;
    if (academicYear !== undefined) updateData.academicYear = academicYear;
    if (archived !== undefined) {
      updateData.archived = archived;
      // If archiving, also deactivate
      // if (archived === true) {
      //   updateData.isActive = false;
      // }
    }

    // Update batch
    const updatedBatch = await prisma.batch.update({
      where: { id: batchId },
      data: updateData,
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

    res.json({
      success: true,
      message: 'Batch updated successfully',
      data: updatedBatch
    });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getBatches = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', departmentId, isActive } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);

    // Build filter conditions
    const filterConditions: any = {};

    if (departmentId) {
      filterConditions.departmentId = parseInt(departmentId as string);
    }

    if (isActive !== undefined) {
      filterConditions.isActive = isActive === 'true';
    }

    // Build search condition
    const searchCondition = search ? {
      OR: [
        { name: { contains: search as string } }
      ]
    } : {};

    // Combine filter and search conditions
    const whereCondition = {
      ...filterConditions,
      ...searchCondition
    };

    // Get total count for pagination
    const total = await prisma.batch.count({
      where: whereCondition
    });

    // Get batches with pagination, filtering, and search
    const batches = await prisma.batch.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: {
            students: true
          }
        }
      },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      orderBy: [
        { academicYear: 'desc' },
        { name: 'asc' }
      ]
    });
    
    // Get department details for each batch
    const departmentIds = [...new Set(batches.map(batch => batch.departmentId))];
    const departments = await prisma.department.findMany({
      where: {
        id: { in: departmentIds }
      },
      select: {
        id: true,
        name: true,
        code: true
      }
    });
    
    // Create a map for quick department lookup
    const departmentMap = new Map(departments.map(dept => [dept.id, dept]));
    
    // Add department details to each batch
    const batchesWithDepartments = batches.map(batch => ({
      ...batch,
      department: departmentMap.get(batch.departmentId) || null
    }));

    res.json({
      success: true,
      data: {
        batches: batchesWithDepartments,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getBatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id },  
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            students: true,
            facultyMappings: true
          }
        }
      }
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Get batch by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getBatchStudents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);

    // Check if batch exists
    const batchExists = await prisma.batch.findUnique({
      where: { id }
    });

    if (!batchExists) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Build search condition
    const searchCondition = search ? {
      OR: [
        { firstName: { contains: search as string } },
        { lastName: { contains: search as string } },
        { usn: { contains: search as string } },
        { email: { contains: search as string } },
      ]
    } : {};

    // Combine batch ID and search conditions
    const whereCondition = {
      batchId: id,
      ...searchCondition
    };

    // Get total count for pagination
    const total = await prisma.student.count({
      where: whereCondition
    });

    // Get students for the batch with pagination and search
    const students = await prisma.student.findMany({
      where: whereCondition,
      select: {
        usn: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        section: true,
        semester: true,
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
        firstName: 'asc'
      }
    });

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (error) {
    console.error('Get batch students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteBatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Use ID directly as string to match Prisma schema
    const batchId = id;

    // Check if batch exists and if it has students
    const studentsCount = await prisma.student.count({
      where: { batchId }
    });

    if (studentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete batch with associated students'
      });
    }

    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id: batchId }
    });

    if (!existingBatch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Delete the batch
    await prisma.batch.delete({
      where: { id: batchId }
    });

    res.json({
      success: true,
      message: 'Batch deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete batch error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete batch because it is referenced by other records'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// New function for semester rollover
export const rolloverBatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const batchId = id; // Use ID as string
    const userId = (req as any).user?.id; // Get user ID from auth middleware

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

    // Check if batch is archived
    if (batch.archived) {
      return res.status(400).json({
        success: false,
        message: 'Cannot rollover semester for an archived batch'
      });
    }

    // Check if semester is already at max (e.g., 8)
    const MAX_SEMESTER = 8;
    if (batch.currentSemester >= MAX_SEMESTER) {
      return res.status(400).json({
        success: false,
        message: `Batch is already in the final semester (${MAX_SEMESTER})`
      });
    }

    // Increment the semester
    const nextSemester = batch.currentSemester + 1;

    // Update the batch's current semester
    const updatedBatch = await prisma.batch.update({
      where: { id: batchId },
      data: {
        currentSemester: nextSemester
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

    // TODO: Optionally, update student semesters in this batch
    // await prisma.student.updateMany({
    //   where: { batchId: batchId },
    //   data: { semester: nextSemester }
    // });

    // Add rollover info to audit context for logging
    if ((req as any).auditContext) {
      (req as any).auditContext.newValue = {
          ... (req as any).auditContext.oldValue,
          currentSemester: nextSemester,
          previousSemester: batch.currentSemester
      };
    }

    res.json({
      success: true,
      message: `Batch semester rolled over successfully to Semester ${nextSemester}`,
      data: updatedBatch
    });
  } catch (error: any) {
    console.error('Rollover batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during semester rollover'
    });
  }
}; 
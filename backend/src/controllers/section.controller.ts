import { Request, Response } from 'express';
import { prisma } from '../index';

/**
 * Get sections filtered by department and semester
 * @route GET /api/sections
 */
export const getSections = async (req: Request, res: Response) => {
  try {
    const { departmentId, currentSemester, batchId } = req.query;
    
    // Build the query filter
    const filter: any = {};
    
    // Add filters if provided
    if (departmentId) {
      filter.departmentId = parseInt(departmentId as string);
    }
    
    if (currentSemester) {
      filter.currentSemester = parseInt(currentSemester as string);
    }
    
    if (batchId) {
      filter.batchId = batchId as string;
    }
    
    // Get sections with department info
    const sections = await prisma.section.findMany({
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
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get section by ID
 * @route GET /api/sections/:id
 */
export const getSectionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sectionId = parseInt(id);
    
    if (isNaN(sectionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section ID'
      });
    }
    
    const section = await prisma.section.findUnique({
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
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 
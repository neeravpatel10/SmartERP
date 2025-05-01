import { Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';
import * as ExcelJS from 'exceljs';

/**
 * Create a new exam component
 */
export const createExamComponent = async (req: Request, res: Response) => {
  try {
    const { subjectId, name, componentType, maxMarks, weightagePercent } = req.body;

    // Validate that subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if component already exists for this subject
    const existingComponent = await prisma.examComponent.findFirst({
      where: {
        subjectId,
        name
      }
    });

    if (existingComponent) {
      return res.status(400).json({
        success: false,
        message: 'An exam component with this name already exists for this subject'
      });
    }

    // Create exam component
    const examComponent = await prisma.examComponent.create({
      data: {
        subjectId,
        name,
        componentType,
        maxMarks,
        weightagePercent
      },
      include: {
        subject: {
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
      message: 'Exam component created successfully',
      data: examComponent
    });
  } catch (error) {
    console.error('Create exam component error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all exam components with filters
 */
export const getExamComponents = async (req: Request, res: Response) => {
  try {
    const { subjectId, componentType, page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);

    // Build filter conditions
    const filterConditions: any = {};

    if (subjectId) {
      filterConditions.subjectId = parseInt(subjectId as string);
    }

    if (componentType) {
      filterConditions.componentType = componentType as string;
    }

    // Get total count for pagination
    const total = await prisma.examComponent.count({
      where: filterConditions
    });

    // Get exam components with pagination and filters
    const examComponents = await prisma.examComponent.findMany({
      where: filterConditions,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            semester: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        _count: {
          select: {
            studentMarks: true
          }
        }
      },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      orderBy: [
        { subject: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: {
        examComponents,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (error) {
    console.error('Get exam components error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get a specific exam component by ID
 */
export const getExamComponentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const examComponent = await prisma.examComponent.findUnique({
      where: { id: parseInt(id) },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            semester: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        studentMarks: {
          include: {
            student: {
              select: {
                usn: true,
                firstName: true,
                middleName: true,
                lastName: true,
                section: true,
                semester: true
              }
            }
          },
          orderBy: {
            student: {
              firstName: 'asc'
            }
          }
        }
      }
    });

    if (!examComponent) {
      return res.status(404).json({
        success: false,
        message: 'Exam component not found'
      });
    }

    res.json({
      success: true,
      data: examComponent
    });
  } catch (error) {
    console.error('Get exam component by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Add a student component mark
 */
export const addStudentComponentMark = async (req: Request, res: Response) => {
  try {
    const { usn, componentId, marksObtained } = req.body;

    // Validate component exists
    const component = await prisma.examComponent.findUnique({
      where: { id: componentId }
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Exam component not found'
      });
    }

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { usn }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Validate marks are within range
    if (marksObtained > component.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed maximum marks (${component.maxMarks})`
      });
    }

    // Check if mark already exists
    const existingMark = await prisma.studentComponentMark.findFirst({
      where: {
        componentId,
        usn
      }
    });

    if (existingMark) {
      // Update existing mark
      const updatedMark = await prisma.studentComponentMark.update({
        where: {
          id: existingMark.id
        },
        data: {
          marksObtained
        }
      });

      return res.json({
        success: true,
        message: 'Marks updated successfully',
        data: updatedMark
      });
    }

    // Create new mark
    const studentMark = await prisma.studentComponentMark.create({
      data: {
        usn,
        componentId,
        marksObtained
      }
    });

    res.status(201).json({
      success: true,
      message: 'Marks added successfully',
      data: studentMark
    });
  } catch (error) {
    console.error('Add student component mark error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Bulk upload marks for a component
 */
export const bulkUploadMarks = async (req: Request, res: Response) => {
  try {
    const { componentId, marks } = req.body;

    // Validate component exists
    const component = await prisma.examComponent.findUnique({
      where: { id: componentId }
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Exam component not found'
      });
    }

    if (!Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Marks must be a non-empty array'
      });
    }

    // Schema for validating marks
    const markSchema = z.object({
      usn: z.string(),
      marksObtained: z.number().min(0)
    });

    // Validate all marks
    const validationResult = z.array(markSchema).safeParse(marks);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid marks format',
        errors: validationResult.error.errors
      });
    }

    // Validate marks are within range
    const invalidMarks = marks.filter(mark => mark.marksObtained > component.maxMarks);
    if (invalidMarks.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed maximum marks (${component.maxMarks})`,
        data: {
          invalidMarks
        }
      });
    }

    // Get all student USNs
    const usns = marks.map(mark => mark.usn);

    // Verify all students exist
    const students = await prisma.student.findMany({
      where: {
        usn: {
          in: usns
        }
      },
      select: {
        usn: true
      }
    });

    if (students.length !== usns.length) {
      const foundUsns = students.map(student => student.usn);
      const missingUsns = usns.filter(usn => !foundUsns.includes(usn));

      return res.status(400).json({
        success: false,
        message: 'Some students were not found',
        data: {
          missingUsns
        }
      });
    }

    // Process marks in batches
    const processedMarks: any[] = [];

    // Get existing marks to determine updates vs inserts
    const existingMarks = await prisma.studentComponentMark.findMany({
      where: {
        componentId,
        usn: {
          in: usns
        }
      }
    });

    const existingUsns = existingMarks.map(mark => mark.usn);
    
    // Prepare updates and inserts
    const updates = marks.filter(mark => existingUsns.includes(mark.usn))
      .map(mark => {
        const existingMark = existingMarks.find(em => em.usn === mark.usn);
        return prisma.studentComponentMark.update({
          where: { id: existingMark!.id },
          data: { marksObtained: mark.marksObtained }
        });
      });

    const inserts = marks.filter(mark => !existingUsns.includes(mark.usn))
      .map(mark => 
        prisma.studentComponentMark.create({
          data: {
            usn: mark.usn,
            componentId,
            marksObtained: mark.marksObtained
          }
        })
      );

    // Execute all operations in a transaction
    const result = await prisma.$transaction([...updates, ...inserts]);

    res.json({
      success: true,
      message: `Successfully processed ${result.length} marks (${updates.length} updated, ${inserts.length} inserted)`,
      data: {
        componentId,
        updatedCount: updates.length,
        insertedCount: inserts.length,
        totalCount: result.length
      }
    });
  } catch (error) {
    console.error('Bulk upload marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get marks for a student
 */
export const getStudentMarks = async (req: Request, res: Response) => {
  try {
    const { usn } = req.params;
    const { subjectId, academicYear, semester } = req.query;

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { usn },
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

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Build filter conditions for subject
    const subjectFilterConditions: any = {};
    
    if (subjectId) {
      subjectFilterConditions.id = parseInt(subjectId as string);
    }

    if (semester) {
      subjectFilterConditions.semester = parseInt(semester as string);
    }

    // Get subjects for the student's department
    const subjects = await prisma.subject.findMany({
      where: {
        ...subjectFilterConditions,
        departmentId: student.departmentId
      },
      include: {
        examComponents: {
          include: {
            studentMarks: {
              where: {
                usn: student.usn
              }
            }
          }
        }
      }
    });

    // Format the response data
    const marksData = subjects.map(subject => {
      // Calculate total and percentage for each subject
      let totalMarksObtained = 0;
      let totalMaxMarks = 0;
      
      const componentMarks = subject.examComponents.map(component => {
        const studentMark = component.studentMarks[0] || null;
        const marksObtained = studentMark ? studentMark.marksObtained : 0;
        
        totalMarksObtained += marksObtained;
        totalMaxMarks += component.maxMarks;
        
        return {
          component: {
            id: component.id,
            name: component.name,
            type: component.componentType,
            maxMarks: component.maxMarks
          },
          mark: studentMark ? {
            id: studentMark.id,
            marksObtained: studentMark.marksObtained,
            percentage: (studentMark.marksObtained / component.maxMarks) * 100
          } : null
        };
      });
      
      const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
      
      return {
        subject: {
          id: subject.id,
          code: subject.code,
          name: subject.name,
          semester: subject.semester
        },
        components: componentMarks,
        summary: {
          totalObtained: totalMarksObtained,
          totalMaxMarks: totalMaxMarks,
          percentage: parseFloat(percentage.toFixed(2))
        }
      };
    });

    res.json({
      success: true,
      data: {
        student: {
          usn: student.usn,
          name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`,
          department: student.department,
          semester: student.semester,
          section: student.section,
          batch: student.batch
        },
        marks: marksData
      }
    });
  } catch (error) {
    console.error('Get student marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// New function to get all marks for a specific component
export const getComponentMarks = async (req: Request, res: Response) => {
  try {
    const { componentId } = req.params;
    const componentIdNum = parseInt(componentId);

    if (isNaN(componentIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid component ID'
      });
    }

    // Check if component exists (optional, but good practice)
    const component = await prisma.examComponent.findUnique({
      where: { id: componentIdNum }
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Exam component not found'
      });
    }

    // Fetch all marks for this component
    const marks = await prisma.studentComponentMark.findMany({
      where: { componentId: componentIdNum },
      include: {
        student: {
          select: {
            usn: true,
            firstName: true,
            lastName: true,
            section: true
          }
        }
      },
      orderBy: {
        student: {
          usn: 'asc' // Order by USN
        }
      }
    });

    res.json({
      success: true,
      data: marks
    });
  } catch (error) {
    console.error('Get component marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Generate and download an Excel template for marks entry
 */
export const downloadMarksTemplate = async (req: Request, res: Response) => {
  try {
    const { componentId } = req.params;
    const componentIdNum = parseInt(componentId);

    if (isNaN(componentIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid component ID'
      });
    }

    // Get component details to determine structure
    const component = await prisma.examComponent.findUnique({
      where: { id: componentIdNum },
      include: {
        subject: {
          select: {
            id: true,
            semester: true,
            departmentId: true,
            // Need section info, maybe from faculty mapping?
            // For now, get all students in the semester/dept
          }
        },
        iaConfigs: true // Fetch IA configs if they exist
      }
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Exam component not found'
      });
    }

    // Fetch students associated with the component's subject/semester/dept
    // Note: This might need refinement if sections are strictly enforced
    const students = await prisma.student.findMany({
      where: {
        semester: component.subject.semester,
        departmentId: component.subject.departmentId
        // section: component.subject.section // Add section if available
      },
      select: {
        usn: true,
        firstName: true,
        lastName: true
      },
      orderBy: { usn: 'asc' }
    });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Marks Entry');

    // Define columns
    const columns = [
      { header: 'USN', key: 'usn', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
    ];

    // Add component-specific columns
    if (component.componentType === 'CIE' && component.iaConfigs.length > 0) {
      // Sort configs for consistent column order
      component.iaConfigs.sort((a, b) => {
          if (a.questionNumber !== b.questionNumber) {
              return a.questionNumber - b.questionNumber;
          }
          return (a.subpart || '').localeCompare(b.subpart || '');
      });
      
      component.iaConfigs.forEach(config => {
          const header = `Q${config.questionNumber}${config.subpart || ''} (Max: ${config.maxMarks})`;
          const key = `q${config.questionNumber}${config.subpart || ''}`;
          columns.push({ header, key, width: 15 });
      });
    }
    // TODO: Handle Assignment components if they have specific structures?
    // else if (component.componentType === 'Assignment') { ... }
    else {
      // Simple component: just one marks column
      columns.push({ header: `Marks (Max: ${component.maxMarks})`, key: 'marks', width: 20 });
    }

    worksheet.columns = columns;

    // Add student rows
    students.forEach(student => {
      worksheet.addRow({
        usn: student.usn,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        // Initialize marks columns as empty
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern:'solid',
        fgColor:{argb:'FFD3D3D3'} // Light grey background
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Set response headers for Excel download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Marks_Template_${component.subject.code}_${component.name}.xlsx`
    );

    // Write workbook to response stream
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Download marks template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating template'
    });
  }
}; 
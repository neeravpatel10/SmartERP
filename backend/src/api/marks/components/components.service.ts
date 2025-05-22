import { PrismaClient } from '@prisma/client';
import { EntryPatch, ComponentConfig, GridQuery, TemplateQuery } from './validation';
import { ApiError } from '../../../utils/errors';
import * as Excel from 'exceljs';

const prisma = new PrismaClient();

// Get the list of configured components for a subject
export async function getSubjectComponents(subjectId: number) {
  const components = await prisma.subjectComponentConfig.findMany({
    where: { subjectId },
    orderBy: { component: 'asc' },
  });
  
  return components;
}

// Get students for the grid with pagination
export async function getComponentGrid(query: GridQuery) {
  const { subjectId, component, attemptNo, page, size } = query;
  
  // First check if the component is configured for this subject
  const config = await prisma.subjectComponentConfig.findUnique({
    where: { 
      subjectId_component: { 
        subjectId, 
        component: component as any
      } 
    },
  });
  
  if (!config) {
    throw new ApiError(404, `Component ${component} not configured for subject ID ${subjectId}`);
  }
  
  // Get the subject to determine the department, semester, and section
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { 
      departmentId: true, 
      semester: true,
      sectionId: true,
      section: true
    }
  });
  
  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }
  
  // Get all students from this department/semester/section
  const skip = (page - 1) * size;
  
  // Query students with existing marks for this component
  const studentsWithMarks = await prisma.$transaction(async (tx) => {
    // Find all students in the department for this semester and section
    const students = await tx.student.findMany({
      where: {
        departmentId: subject.departmentId,
        semester: subject.semester,
        ...(subject.section && { section: subject.section })
      },
      select: {
        usn: true,
        firstName: true,
        middleName: true,
        lastName: true,
      },
      orderBy: { usn: 'asc' },
      skip,
      take: size,
    });
    
    // Get total count for pagination
    const totalCount = await tx.student.count({
      where: {
        departmentId: subject.departmentId,
        semester: subject.semester,
        ...(subject.section && { section: subject.section })
      },
    });
    
    // Get marks for these students if any exist
    const studentUsns = students.map(s => s.usn);
    const marks = await tx.studentComponentMarks.findMany({
      where: {
        studentUsn: { in: studentUsns },
        subjectId,
        component: component as any,
        attemptNo,
      },
    });
    
    // Merge the data
    const result = students.map(student => {
      const mark = marks.find(m => m.studentUsn === student.usn);
      const fullName = [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(' ');
        
      return {
        usn: student.usn,
        name: fullName,
        marks: mark ? Number(mark.marks) : null,
        maxMarks: config.maxMarks,
      };
    });
    
    return { data: result, totalCount };
  });
  
  return {
    data: studentsWithMarks.data,
    pagination: {
      page,
      size,
      totalCount: studentsWithMarks.totalCount,
      totalPages: Math.ceil(studentsWithMarks.totalCount / size),
    },
    maxMarks: config.maxMarks,
  };
}

// Upsert a single component mark entry
export async function upsertComponentMark(input: EntryPatch) {
  // 1. Validate against SubjectComponentConfig max
  const cfg = await prisma.subjectComponentConfig.findUnique({
    where: { 
      subjectId_component: { 
        subjectId: input.subjectId, 
        component: input.component as any 
      } 
    },
  });
  
  if (!cfg) {
    throw new ApiError(400, 'Component not configured for this subject');
  }

  if (input.marks > cfg.maxMarks) {
    throw new ApiError(400, `Marks (${input.marks}) exceed maximum allowed (${cfg.maxMarks})`);
  }

  // 2. Upsert raw mark
  await prisma.studentComponentMarks.upsert({
    where: {
      studentUsn_subjectId_component_attemptNo: {
        studentUsn: input.studentUsn,
        subjectId: input.subjectId,
        component: input.component as any,
        attemptNo: input.attemptNo,
      },
    },
    update: { marks: input.marks },
    create: { 
      studentUsn: input.studentUsn,
      subjectId: input.subjectId,
      component: input.component as any,
      attemptNo: input.attemptNo,
      marks: input.marks,
    },
  });

  // 3. Recalculate overall totals
  await recalcOverallTotals(input.studentUsn, input.subjectId);
  
  return { success: true, message: 'Marks updated successfully' };
}

// Recalculate the overall totals for a student in a subject
export async function recalcOverallTotals(studentUsn: string, subjectId: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Get the CIE total from student_internal_totals
      const cieTotals = await tx.studentInternalTotals.findMany({
        where: { 
          studentUsn, 
          subjectId 
        },
        orderBy: { cieNo: 'asc' },
      });
      
      // Calculate best 2 of 3 CIE totals
      let cieTotal = 0;
      if (cieTotals.length > 0) {
        const sortedTotals = [...cieTotals].sort((a, b) => b.total - a.total);
        const bestTotals = sortedTotals.slice(0, 2); // Take best 2
        cieTotal = bestTotals.reduce((sum, item) => sum + item.total, 0);
        if (bestTotals.length === 1) {
          cieTotal = bestTotals[0].total; // If only one CIE, use that
        }
      }
      
      // Get component marks
      const a1Mark = await tx.studentComponentMarks.findFirst({
        where: { 
          studentUsn, 
          subjectId, 
          component: 'A1',
        },
        orderBy: { marks: 'desc' },
      });
      
      const a2Mark = await tx.studentComponentMarks.findFirst({
        where: { 
          studentUsn, 
          subjectId, 
          component: 'A2',
        },
        orderBy: { marks: 'desc' },
      });
      
      const qzMark = await tx.studentComponentMarks.findFirst({
        where: { 
          studentUsn, 
          subjectId, 
          component: 'QZ',
        },
        orderBy: { marks: 'desc' },
      });
      
      const smMark = await tx.studentComponentMarks.findFirst({
        where: { 
          studentUsn, 
          subjectId, 
          component: 'SM',
        },
        orderBy: { marks: 'desc' },
      });
      
      // Calculate the assignment mark (best of A1 and A2)
      const a1Value = a1Mark ? Number(a1Mark.marks) : 0;
      const a2Value = a2Mark ? Number(a2Mark.marks) : 0;
      const assignmentMark = Math.max(a1Value, a2Value);
      
      // Get the quiz and seminar marks
      const quizMark = qzMark ? Number(qzMark.marks) : 0;
      const seminarMark = smMark ? Number(smMark.marks) : 0;
      
      // Calculate the overall total
      const overallTotal = cieTotal + assignmentMark + quizMark + seminarMark;
      
      // Upsert into student_overall_totals
      await tx.studentOverallTotals.upsert({
        where: {
          studentUsn_subjectId: {
            studentUsn,
            subjectId,
          },
        },
        update: {
          cieTotal,
          assignment: assignmentMark,
          quiz: quizMark,
          seminar: seminarMark,
          overallTotal,
        },
        create: {
          studentUsn,
          subjectId,
          cieTotal,
          assignment: assignmentMark,
          quiz: quizMark,
          seminar: seminarMark,
          overallTotal,
        },
      });
      
      return {
        studentUsn,
        subjectId,
        cieTotal,
        assignment: assignmentMark,
        quiz: quizMark,
        seminar: seminarMark,
        overallTotal,
      };
    });
  } catch (error) {
    console.error('Error in recalcOverallTotals:', error);
    throw new ApiError(500, 'Failed to recalculate totals');
  }
}

// Generate an Excel template for component marks entry
export async function generateTemplate(query: TemplateQuery) {
  const { subjectId, component, attemptNo } = query;
  
  // Validate component is configured for this subject
  const config = await prisma.subjectComponentConfig.findUnique({
    where: { 
      subjectId_component: { 
        subjectId, 
        component: component as any,
      } 
    },
  });
  
  if (!config) {
    throw new ApiError(404, `Component ${component} not configured for subject ID ${subjectId}`);
  }
  
  // Get subject details
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      code: true,
      name: true,
      semester: true,
      departmentId: true,
      section: true,
    },
  });
  
  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }
  
  // Get students for this department/semester/section
  const students = await prisma.student.findMany({
    where: {
      departmentId: subject.departmentId,
      semester: subject.semester,
      ...(subject.section && { section: subject.section }),
    },
    select: {
      usn: true,
      firstName: true,
      middleName: true,
      lastName: true,
    },
    orderBy: { usn: 'asc' },
  });
  
  // Create Excel workbook
  const workbook = new Excel.Workbook();
  const componentLabels: Record<string, string> = {
    'A1': 'Assignment 1',
    'A2': 'Assignment 2',
    'QZ': 'Quiz',
    'SM': 'Seminar',
  };
  
  const worksheet = workbook.addWorksheet(`${component}_Att${attemptNo}`);
  
  // Add headers
  worksheet.columns = [
    { header: 'USN', key: 'usn', width: 15 },
    { header: 'Name', key: 'name', width: 30 },
    { header: `Marks (max ${config.maxMarks})`, key: 'marks', width: 15 },
  ];
  
  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { horizontal: 'center' };
  
  // Add subject info
  worksheet.insertRow(1, [`Subject: ${subject.code} - ${subject.name}`]);
  worksheet.insertRow(2, [`Component: ${componentLabels[component]}, Attempt: ${attemptNo}`]);
  worksheet.insertRow(3, [`Max Marks: ${config.maxMarks}`]);
  worksheet.getRow(1).font = { bold: true, size: 14 };
  worksheet.getRow(2).font = { bold: true };
  worksheet.getRow(3).font = { bold: true };
  
  // Adjust header row
  const headerRowIndex = 4;
  
  // Add students
  students.forEach((student, index) => {
    const fullName = [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(' ');
      
    worksheet.addRow({
      usn: student.usn,
      name: fullName,
      marks: null,
    });
    
    // Add data validation for marks column
    const rowIndex = headerRowIndex + index + 1;
    worksheet.getCell(`C${rowIndex}`).dataValidation = {
      type: 'whole',
      operator: 'between',
      formulae: [0, config.maxMarks],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid marks',
      error: `Marks must be between 0 and ${config.maxMarks}`,
    };
  });
  
  return workbook;
}

// Process an uploaded Excel file for component marks
export async function processUploadedExcel(
  subjectId: number,
  component: string,
  attemptNo: number,
  buffer: Buffer
) {
  // Validate component is configured for this subject
  const config = await prisma.subjectComponentConfig.findUnique({
    where: { 
      subjectId_component: { 
        subjectId, 
        component: component as any,
      } 
    },
  });
  
  if (!config) {
    throw new ApiError(404, `Component ${component} not configured for subject ID ${subjectId}`);
  }
  
  // Load the Excel file
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0]; // Assume first sheet
  
  if (!worksheet) {
    throw new ApiError(400, 'Invalid Excel file: No worksheet found');
  }
  
  // Process the rows
  const results: { success: boolean; usn: string; message?: string }[] = [];
  const updates: Promise<any>[] = [];
  
  // Find the header row and column indices
  let usnColIndex = -1;
  let marksColIndex = -1;
  let headerRowIndex = -1;
  
  worksheet.eachRow((row, rowIndex) => {
    if (headerRowIndex !== -1) return; // Already found header
    
    row.eachCell((cell, colIndex) => {
      const value = cell.value?.toString().toLowerCase();
      if (value === 'usn') {
        usnColIndex = colIndex;
        headerRowIndex = rowIndex;
      } else if (value && value.includes('marks')) {
        marksColIndex = colIndex;
      }
    });
  });
  
  if (headerRowIndex === -1 || usnColIndex === -1 || marksColIndex === -1) {
    throw new ApiError(400, 'Invalid Excel format: Missing required columns (USN, Marks)');
  }
  
  // Process data rows
  for (let rowIndex = headerRowIndex + 1; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    const usn = row.getCell(usnColIndex).value?.toString();
    const marksCell = row.getCell(marksColIndex);
    let marks = typeof marksCell.value === 'number' ? marksCell.value : null;
    
    // Skip empty rows
    if (!usn) continue;
    
    // Validate marks
    if (marks === null) {
      results.push({ success: false, usn, message: 'No marks entered' });
      continue;
    }
    
    if (isNaN(marks) || marks < 0 || marks > config.maxMarks) {
      results.push({ 
        success: false, 
        usn, 
        message: `Invalid marks: ${marks}. Must be between 0 and ${config.maxMarks}` 
      });
      continue;
    }
    
    // Schedule the update
    const updatePromise = upsertComponentMark({
      studentUsn: usn,
      subjectId,
      component: component as any,
      attemptNo,
      marks,
    }).then(() => {
      results.push({ success: true, usn });
    }).catch(error => {
      results.push({ 
        success: false, 
        usn, 
        message: `Error updating marks: ${error.message}` 
      });
    });
    
    updates.push(updatePromise);
  }
  
  // Wait for all updates to complete
  await Promise.all(updates);
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  return {
    totalProcessed: results.length,
    successCount,
    failureCount,
    details: results,
  };
}

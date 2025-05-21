import { PrismaClient, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as htmlPdf from 'html-pdf';
import { ReportGridParams, ReportExportParams } from './report.validation';

// Pass Mark constant - can be moved to settings table in future versions
export const PASS_MARK_PERCENTAGE = 40;

const prisma = new PrismaClient();

// Types for the report grid data
export type MarksRow = {
  usn: string;
  name: string;
  subQuestionMarks: { [key: string]: number | null }; // e.g., '1a': 5, '1b': 4
  bestPartA: number;
  bestPartB: number;
  total: number;
  attendance: number | null; // Placeholder for future attendance integration
};

// Properly define the expected structure of meta object
interface MarksMeta {
  subject: { id: number; name: string; code: string } | null;
  cie: number;
  department?: { id: number; name: string } | null;
  batch?: { id: number; name: string; academicYear: string } | null;
  section?: { id: number; name: string } | null;
  passMark: number;
}

export type MarksGridData = {
  columns: string[];
  rows: MarksRow[];
  meta: MarksMeta
};

/**
 * Get report grid data with marks details
 * Handles different user roles:
 * - Faculty: Only their mapped subjects and sections
 * - Dept Admin: All subjects in their department
 * - Super Admin: All subjects across departments
 * - Students: Only their own marks
 */
export async function getReportGridData(
  params: ReportGridParams,
  userId: number,
  loginType: number
): Promise<MarksGridData> {
  // Ensure params are properly typed with defaults
  const cieNo = Number(params.cieNo || 0);
  const subjectId = Number(params.subjectId || 0);
  // Determine access scope based on login type
  const isSuperAdmin = loginType === 1;
  const isFaculty = loginType === 2;
  const isDeptAdmin = loginType === 3;
  const isStudent = loginType === -1;
  
  // Get the subject details
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId }, // Use the converted number value
    include: { department: true }
  });
  
  if (!subject) {
    console.warn('Subject not found with ID:', subjectId);
    // Return a minimal valid response if subject not found
    return {
      columns: ['USN', 'Name', 'Total'],
      rows: [],
      meta: {
        subject: null,
        cie: cieNo || 0,
        passMark: PASS_MARK_PERCENTAGE
      }
    };
  }
  
  // Get the blueprint for this CIE (defines question structure)
  const blueprint = await prisma.internalexamblueprint.findUnique({
    where: {
      subjectId_cieNo: {
        subjectId: subjectId ? subjectId : 0, // Use the converted number value with default
        cieNo: cieNo ? cieNo : 0 // Use the converted number value with default
      }
    },
    include: {
      subqs: true
    }
  });
  
  // Create a type-safe default for blueprint if null
  if (!blueprint) {
    console.warn('No blueprint found for subject ID:', subjectId, 'and CIE number:', cieNo);
    throw new Error(`Blueprint not found for subject ${params.subjectId}, CIE ${params.cieNo}`);
  }
  
  // For faculty, validate they have access to this subject
  if (isFaculty) {
    const hasAccess = await checkFacultySubjectAccess(userId, params.subjectId);
    if (!hasAccess) {
      throw new Error('You do not have access to this subject');
    }
  }
  
  // For department admins, validate they belong to the subject's department
  if (isDeptAdmin) {
    const faculty = await prisma.faculty.findFirst({
      where: { userId }
    });
    
    if (!faculty || faculty.departmentId !== subject.departmentId) {
      throw new Error('You do not have access to this department');
    }
  }
  
  // For students, only allow access to their own records
  let studentFilter: Prisma.StudentWhereInput = {};
  if (isStudent) {
    const student = await prisma.student.findFirst({
      where: { userId }
    });
    
    if (!student) {
      throw new Error('Student record not found');
    }
    
    studentFilter = { usn: student.usn };
  } else {
    // For faculty and admins, filter by department, batch, section as provided
    studentFilter = {
      departmentId: subject.departmentId,
      semester: subject.semester
    };
    
    // Apply section filter if provided or available from subject
    if (params.sectionId) {
      // Use section name if sectionId is provided
      const section = await prisma.section.findUnique({ 
        where: { id: params.sectionId },
        select: { name: true }
      });
      if (section && section.name) {
        studentFilter.section = section.name;
      }
    } else if (subject.sectionId) {
      // Use section name if subject has sectionId
      const section = await prisma.section.findUnique({
        where: { id: subject.sectionId },
        select: { name: true }
      });
      if (section && section.name) {
        studentFilter.section = section.name;
      }
    } else if (subject.section) {
      // Directly use section name if available
      studentFilter.section = subject.section;
    }
    
    // Apply batch filter if provided
    if (params.batchId) {
      // Convert batchId to string since Prisma schema expects string IDs
      const batchIdStr = String(params.batchId);
      console.log(`Looking up batch details with ID (as string): ${batchIdStr}`);
      
      try {
        const batch = await prisma.batch.findUnique({
          where: { id: batchIdStr },
          select: { name: true }
        });
        
        if (batch) {
          console.log(`Found batch: ${batch.name}`);
          // Use the batchId relation as a string as expected by Prisma
          studentFilter.batchId = params.batchId ? String(params.batchId) : undefined;
        }
      } catch (error) {
        console.error('Error fetching batch name:', error);
      }
    }
  }
  
  // Get students based on filters
  const students = await prisma.student.findMany({
    where: studentFilter,
    orderBy: { usn: 'asc' }
  });
  
  // Define the expected structure for blueprint.subqs
  interface SubQuestion {
    id: number;
    questionLabel: string;
    questionNo: number;
    maxMarks: number;
    label: string;
  }
  
  // Ensure blueprint.subqs is treated as an array of SubQuestion objects
  const blueprintSubQs: SubQuestion[] = (blueprint?.subqs as unknown as SubQuestion[]) || [];
  
  // Create column headers based on the blueprint
  const subqColumns = blueprintSubQs
    .sort((a: SubQuestion, b: SubQuestion) => {
      // Sort by question number first, then by label
      if (a.questionNo !== b.questionNo) {
        return a.questionNo - b.questionNo;
      }
      // If question numbers are the same, sort by label
      return a.label.localeCompare(b.label);
    })
    .map((sq: SubQuestion) => sq.label);
  
  // Full column set for faculty and admins
  const fullColumns = ['USN', 'Name', ...subqColumns, 'Best Part A', 'Best Part B', 'Total', 'Attendance'];
  
  // Limited column set for students
  const studentColumns = ['USN', 'Name', 'Total', 'Attendance'];
  
  // Choose column set based on role
  const columns = isStudent ? studentColumns : fullColumns;
  
  // Get sub-question marks for each student
  const rows = await Promise.all(students.map(async (student) => {
    // Get marks for this student's sub-questions
    const studentMarks = await prisma.studentsubquestionmarks.findMany({
      where: {
        studentUsn: student.usn,
        subqId: {
          in: blueprintSubQs.map((sq: SubQuestion) => sq.id)
        }
      }
      // Remove the empty include which causes Prisma validation error
    });
    
    // Map marks to sub-question labels
    const subQuestionMarks: { [key: string]: number | null } = {};
    
    // Initialize all sub-questions with null
    blueprintSubQs.forEach(sq => {
      subQuestionMarks[sq.label] = null;
    });
    
    // Fill in actual marks where available
    // Process each mark and match with subquestions
    for (const mark of studentMarks) {
      // Get the subquestion for this mark
      const subq = blueprintSubQs.find(sq => sq.id === mark.subqId);
      if (subq) {
        subQuestionMarks[subq.label] = Number(mark.marks);
      }
    }
    
    // Group marks by question number for calculating best parts
    const marksByQuestion = new Map<number, number>();
    
    // Group marks by question number for calculating totals
    for (const mark of studentMarks) {
      // Find the corresponding subquestion
      const subq = blueprintSubQs.find(sq => sq.id === mark.subqId);
      if (subq) {
        // Use the actual questionNo property
        const questionNo = subq.questionNo;
        const currentTotal = marksByQuestion.get(questionNo) || 0;
        marksByQuestion.set(questionNo, currentTotal + Number(mark.marks));
      }
    }
    
    // Calculate best scores for Part A and Part B
    const partA1 = marksByQuestion.get(1) || 0;
    const partA2 = marksByQuestion.get(2) || 0;
    const bestPartA = Math.max(partA1, partA2);
    
    const partB3 = marksByQuestion.get(3) || 0;
    const partB4 = marksByQuestion.get(4) || 0;
    const bestPartB = Math.max(partB3, partB4);
    
    // Calculate total
    const total = Math.round(bestPartA + bestPartB);
    
    // Attendance placeholder - will be integrated with attendance module in future
    const attendance = null;
    
    return {
      usn: student.usn,
      name: `${student.firstName} ${student.lastName || ''}`.trim(),
      subQuestionMarks,
      bestPartA,
      bestPartB,
      total,
      attendance
    };
  }));
  
  // Prepare metadata for the response
  const meta: {
    subject: { id: number; name: string; code: string } | null;
    cie: number;
    department?: { id: number; name: string } | null;
    batch?: { id: number; name: string; academicYear: string } | null;
    section?: { id: number; name: string } | null;
    passMark: number;
  } = {
    subject: {
      id: Number(subject.id), // Ensure numeric ID
      name: subject.name,
      code: subject.code
    },
    cie: Number(params.cieNo || 0), // Ensure numeric type with default
    department: subject.department ? {
      id: Number(subject.department.id), // Ensure numeric ID
      name: subject.department.name
    } : null,
    passMark: PASS_MARK_PERCENTAGE
  };
  
  // If batch and section params were provided, include their details
  // Add batch info if provided
  if (params.batchId) {
    // Convert batchId to string since Prisma schema expects string IDs
    const batchIdStr = String(params.batchId);
    console.log(`Looking up batch details with ID (as string): ${batchIdStr}`);
    
    try {
      const batch = await prisma.batch.findUnique({
        where: { id: batchIdStr },
        select: { id: true, name: true, academicYear: true }
      });
      
      if (batch) {
        console.log(`Found batch: ID: ${batch.id}, Name: ${batch.name}`);
        meta.batch = {
          id: Number(batch.id), // Convert back to number for the meta object
          name: batch.name || '',  // Ensure non-null string
          academicYear: batch.academicYear || '' // Ensure non-null string
        };
      }
    } catch (error) {
      console.error('Error finding batch:', error);
    }
  }
  
  // Add section info if provided
  if (params.sectionId) {
    // Convert sectionId to integer for Prisma (section model expects integer ID)
    const sectionIdInt = Number(params.sectionId);
    console.log(`Looking up section details with ID (as integer): ${sectionIdInt}`);
    
    try {
      const section = await prisma.section.findUnique({
        where: { id: sectionIdInt },
        select: { id: true, name: true }
      });
      
      // Log the result of the section lookup
      console.log(`Found section:`, section ? `ID: ${section.id}, Name: ${section.name}` : 'Not found');
      
      if (section) {
        // Convert section ID to number for the metadata
        const numericSectionId = Number(section.id || 0); // Ensure we have a number
        const nameStr = section.name || ''; // Ensure name is a string and not null
        console.log(`Converted section ID to number: ${numericSectionId}, Name: ${nameStr}`);
        
        meta.section = {
          id: numericSectionId, 
          name: nameStr
        };
      }
    } catch (error) {
      console.error('Error finding section:', error);
    }
  }
  
  return {
    columns,
    rows,
    meta
  };
}

/**
 * Export marks data in various formats (XLSX, CSV, PDF)
 */
export async function exportReportData(
  params: ReportExportParams,
  userId: number,
  loginType: number
): Promise<{ buffer: Buffer, filename: string, mimeType: string }> {
  // Get the grid data first
  const gridData = await getReportGridData(
    {
      departmentId: params.departmentId,
      batchId: params.batchId,
      sectionId: params.sectionId,
      subjectId: params.subjectId,
      cieNo: params.cieNo
    },
    userId,
    loginType
  );
  
  // Create filename with metadata
  const subjectCode = gridData.meta.subject?.code || 'subject';
  const cieNo = String(gridData.meta.cie);
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `marks_report_${subjectCode}_CIE${cieNo}_${timestamp}`;
  
  // Call appropriate export function based on format
  switch (params.format) {
    case 'xlsx':
      return buildXlsxReport(gridData, baseFilename);
    case 'csv':
      return buildCsvReport(gridData, baseFilename);
    case 'pdf':
      return buildPdfReport(gridData, baseFilename);
    default:
      throw new Error(`Unsupported export format: ${params.format}`);
  }
}

/**
 * Helper function to build XLSX report
 */
function buildXlsxReport(data: MarksGridData, baseFilename: string): { buffer: Buffer, filename: string, mimeType: string } {
  // Prepare worksheet data
  const wsData = data.rows.map(row => {
    const excelRow: Record<string, any> = {
      'USN': row.usn,
      'Name': row.name
    };
    
    // Add sub-question marks
    Object.keys(row.subQuestionMarks).forEach(label => {
      excelRow[label] = row.subQuestionMarks[label];
    });
    
    // Add calculated fields
    excelRow['Best Part A'] = row.bestPartA;
    excelRow['Best Part B'] = row.bestPartB;
    excelRow['Total'] = row.total;
    excelRow['Attendance'] = row.attendance !== null ? row.attendance : 'N/A';
    
    return excelRow;
  });
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(wsData);
  
  // Apply styling (cell formatting for pass/fail)
  // Note: Basic XLSX doesn't support styles; this would require a more advanced library
  
  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks Report');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return {
    buffer,
    filename: `${baseFilename}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}

/**
 * Helper function to build CSV report
 */
function buildCsvReport(data: MarksGridData, baseFilename: string): { buffer: Buffer, filename: string, mimeType: string } {
  // Prepare CSV data
  const header = data.columns.join(',');
  
  const rows = data.rows.map(row => {
    const csvRow = [
      row.usn,
      `"${row.name}"` // Quote the name to handle commas
    ];
    
    // Add sub-question marks if they're in the columns
    if (data.columns.includes('1a')) { // Check if we have subquestion columns
      Object.keys(row.subQuestionMarks).forEach(label => {
        if (data.columns.includes(label)) {
          csvRow.push(row.subQuestionMarks[label]?.toString() || '');
        }
      });
      
      // Add calculated fields if they're in the columns
      if (data.columns.includes('Best Part A')) csvRow.push(row.bestPartA.toString());
      if (data.columns.includes('Best Part B')) csvRow.push(row.bestPartB.toString());
    }
    
    // All users see the total
    csvRow.push(row.total.toString());
    
    // Add attendance if it's in the columns
    if (data.columns.includes('Attendance')) {
      csvRow.push(row.attendance !== null ? row.attendance.toString() : 'N/A');
    }
    
    return csvRow.join(',');
  });
  
  // Combine header and rows
  const csv = [header, ...rows].join('\n');
  
  return {
    buffer: Buffer.from(csv, 'utf-8'),
    filename: `${baseFilename}.csv`,
    mimeType: 'text/csv'
  };
}

/**
 * Helper function to build PDF report using html-pdf
 */
function buildPdfReport(data: MarksGridData, baseFilename: string): { buffer: Buffer, filename: string, mimeType: string } {
  // Extract metadata
  const subjectName = data.meta.subject ? data.meta.subject.name : 'All Subjects';
  const subjectCode = data.meta.subject ? data.meta.subject.code : '';
  const departmentName = data.meta.department ? data.meta.department.name : 'All Departments';
  const batchName = data.meta.batch ? `${data.meta.batch.name} (${data.meta.batch.academicYear})` : '';
  const sectionName = data.meta.section ? data.meta.section.name : '';

  // Generate CSS styles for the PDF
  const styles = `
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { text-align: center; color: #333; margin-bottom: 10px; }
      .info { margin-bottom: 20px; }
      .info p { margin: 5px 0; }
      table { width: 100%; border-collapse: collapse; }
      th { background-color: #444; color: white; padding: 8px; text-align: center; }
      td { padding: 8px; border: 1px solid #ddd; text-align: center; }
      tr:nth-child(even) { background-color: #f2f2f2; }
      .student-name, .usn { text-align: left; }
      .pass { color: #006400; }
      .fail { color: #8B0000; }
      .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
  `;

  // Build header content
  const header = `
    <h1>Marks Report - ${subjectName} - CIE ${data.meta.cie}</h1>
    <div class="info">
      ${data.meta.department ? `<p><strong>Department:</strong> ${departmentName}</p>` : ''}
      ${data.meta.batch ? `<p><strong>Batch:</strong> ${batchName}</p>` : ''}
      ${data.meta.section ? `<p><strong>Section:</strong> ${sectionName}</p>` : ''}
      <p><strong>Subject:</strong> ${subjectName} ${subjectCode ? `(${subjectCode})` : ''}</p>
      <p><strong>Pass Mark:</strong> ${data.meta.passMark}%</p>
      <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
    </div>
  `;

  // Start table with headers
  let tableContent = `
    <table>
      <thead>
        <tr>
  `;

  // Add column headers
  data.columns.forEach(column => {
    tableContent += `<th>${column}</th>`;
  });

  tableContent += `
        </tr>
      </thead>
      <tbody>
  `;

  // Add rows
  data.rows.forEach(row => {
    tableContent += '<tr>';
    
    // Add cells for each column
    data.columns.forEach(column => {
      if (column === 'USN') {
        tableContent += `<td class="usn">${row.usn}</td>`;
      }
      else if (column === 'Name') {
        tableContent += `<td class="student-name">${row.name}</td>`;
      }
      else if (column === 'Total') {
        const passMark = data.meta.passMark;
        const total = row.total;
        const passed = total >= passMark;
        tableContent += `<td class="${passed ? 'pass' : 'fail'}">${total}</td>`;
      }
      else if (column === 'Best Part A') {
        tableContent += `<td>${row.bestPartA}</td>`;
      }
      else if (column === 'Best Part B') {
        tableContent += `<td>${row.bestPartB}</td>`;
      }
      else if (column === 'Attendance') {
        tableContent += `<td>${row.attendance !== null ? row.attendance : 'N/A'}</td>`;
      }
      else {
        // Handle subquestion marks
        const mark = row.subQuestionMarks[column];
        tableContent += `<td>${mark !== null ? mark : ''}</td>`;
      }
    });
    
    tableContent += '</tr>';
  });

  // Close table
  tableContent += `
      </tbody>
    </table>
  `;

  // Add footer
  const footer = `
    <div class="footer">
      Generated by SmartERP - ${new Date().toLocaleString()}
    </div>
  `;

  // Combine all HTML parts
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Marks Report - ${subjectName}</title>
      ${styles}
    </head>
    <body>
      ${header}
      ${tableContent}
      ${footer}
    </body>
    </html>
  `;

  // Define PDF generation options
  const options = {
    format: 'A4',
    orientation: 'landscape',
    border: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    },
    timeout: 30000 // Increase timeout to 30 seconds to handle large reports
  };

  // Create and return a promise that resolves to the PDF buffer
  return new Promise<{ buffer: Buffer, filename: string, mimeType: string }>((resolve, reject) => {
    htmlPdf.create(htmlContent, options).toBuffer((err, buffer) => {
      if (err) {
        console.error('Error generating PDF:', err);
        // Fallback to simple text if PDF generation fails
        const fallbackBuffer = Buffer.from(
          `Error generating PDF. Please try Excel or CSV format instead.\n\nError: ${err.message}`,
          'utf-8'
        );
        resolve({
          buffer: fallbackBuffer,
          filename: `${baseFilename}.pdf`,
          mimeType: 'application/pdf'
        });
      } else {
        resolve({
          buffer,
          filename: `${baseFilename}.pdf`,
          mimeType: 'application/pdf'
        });
      }
    });
  });
}

/**
 * Helper function to check if a faculty member has access to a subject
 */
async function checkFacultySubjectAccess(userId: number, subjectId: number): Promise<boolean> {
  // Get faculty record from user ID
  const faculty = await prisma.faculty.findFirst({
    where: { userId }
  });
  
  if (!faculty) {
    return false;
  }
  
  // Look for a mapping between this faculty and the subject
  const mapping = await prisma.facultysubjectmapping.findFirst({
    where: {
      facultyId: faculty.id,
      subjectId: subjectId,
      active: true // Only check active mappings
    }
  });
  
  // Always include a guaranteed valid parameter to ensure the backend never receives an empty parameter set
  // This prevents "Invalid subject ID format" errors (from memory)
  return !!mapping;
}

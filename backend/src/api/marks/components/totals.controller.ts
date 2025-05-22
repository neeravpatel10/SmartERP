import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { totalsQuerySchema } from './validation';
import { ApiError } from '../../../utils/errors';
import * as Excel from 'exceljs';

const prisma = new PrismaClient();

// Get the overall totals grid
export async function grid(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = totalsQuerySchema.safeParse(req.query);
    
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid request parameters', parsed.error.errors);
    }
    
    const { subjectId, page, size } = parsed.data;
    const skip = (page - 1) * size;
    
    // Get the subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        code: true,
        name: true,
        departmentId: true,
        semester: true,
        section: true,
      },
    });
    
    if (!subject) {
      throw new ApiError(404, 'Subject not found');
    }
    
    // Get students for this subject's department/semester/section
    const result = await prisma.$transaction(async (tx) => {
      // Find all students in the department for this semester and section
      const students = await tx.student.findMany({
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
        skip,
        take: size,
      });
      
      // Get total count for pagination
      const totalCount = await tx.student.count({
        where: {
          departmentId: subject.departmentId,
          semester: subject.semester,
          ...(subject.section && { section: subject.section }),
        },
      });
      
      // Get overall totals for these students
      const studentUsns = students.map(s => s.usn);
      const totals = await tx.studentOverallTotals.findMany({
        where: {
          studentUsn: { in: studentUsns },
          subjectId,
        },
      });
      
      // Merge the data
      const data = students.map(student => {
        const total = totals.find(t => t.studentUsn === student.usn);
        const fullName = [student.firstName, student.middleName, student.lastName]
          .filter(Boolean)
          .join(' ');
          
        return {
          usn: student.usn,
          name: fullName,
          cieTotal: total?.cieTotal ?? 0,
          assignment: total?.assignment ?? 0,
          quiz: total?.quiz ?? 0,
          seminar: total?.seminar ?? 0,
          overallTotal: total?.overallTotal ?? 0,
        };
      });
      
      return { data, totalCount };
    });
    
    return res.json({
      success: true,
      message: 'Overall totals retrieved successfully',
      data: {
        subject: {
          id: subjectId,
          code: subject.code,
          name: subject.name,
        },
        grid: result.data,
        pagination: {
          page,
          size,
          totalCount: result.totalCount,
          totalPages: Math.ceil(result.totalCount / size),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// Export the overall totals
export async function exportData(req: Request, res: Response, next: NextFunction) {
  try {
    const { subjectId, format = 'xlsx' } = req.query;
    
    if (!subjectId) {
      throw new ApiError(400, 'Subject ID is required');
    }
    
    // Get the subject details
    const subject = await prisma.subject.findUnique({
      where: { id: Number(subjectId) },
      select: {
        code: true,
        name: true,
        departmentId: true,
        semester: true,
        section: true,
      },
    });
    
    if (!subject) {
      throw new ApiError(404, 'Subject not found');
    }
    
    // Get all students and their totals
    const data = await prisma.$transaction(async (tx) => {
      // Find all students in the department for this semester and section
      const students = await tx.student.findMany({
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
      
      // Get overall totals for these students
      const studentUsns = students.map(s => s.usn);
      const totals = await tx.studentOverallTotals.findMany({
        where: {
          studentUsn: { in: studentUsns },
          subjectId: Number(subjectId),
        },
      });
      
      // Merge the data
      return students.map(student => {
        const total = totals.find(t => t.studentUsn === student.usn);
        const fullName = [student.firstName, student.middleName, student.lastName]
          .filter(Boolean)
          .join(' ');
          
        return {
          usn: student.usn,
          name: fullName,
          cieTotal: total?.cieTotal ?? 0,
          assignment: total?.assignment ?? 0,
          quiz: total?.quiz ?? 0,
          seminar: total?.seminar ?? 0,
          overallTotal: total?.overallTotal ?? 0,
        };
      });
    });
    
    // Handle different export formats
    switch (format) {
      case 'xlsx':
        return exportToExcel(res, data, subject);
        
      case 'csv':
        return exportToCSV(res, data, subject);
        
      case 'pdf':
        return exportToPDF(res, data, subject);
        
      default:
        throw new ApiError(400, 'Invalid export format. Supported formats: xlsx, csv, pdf');
    }
  } catch (error) {
    next(error);
  }
}

// Helper function to export to Excel
async function exportToExcel(res: Response, data: any[], subject: any) {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet('Overall Totals');
  
  // Add title and subject info
  worksheet.addRow([`${subject.code} - ${subject.name} (Overall Totals)`]);
  worksheet.addRow([`Semester: ${subject.semester}, Section: ${subject.section || 'All'}`]);
  worksheet.addRow([]);
  
  // Style the title
  worksheet.getCell('A1').font = { bold: true, size: 14 };
  worksheet.getCell('A2').font = { bold: true };
  
  // Add headers
  worksheet.addRow(['USN', 'Name', 'CIE Total', 'Assignment', 'Quiz', 'Seminar', 'Overall Total']);
  const headerRow = worksheet.getRow(4);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center' };
  
  // Add data
  data.forEach(item => {
    worksheet.addRow([
      item.usn,
      item.name,
      item.cieTotal,
      item.assignment,
      item.quiz,
      item.seminar,
      item.overallTotal,
    ]);
  });
  
  // Set column widths
  worksheet.getColumn(1).width = 15;
  worksheet.getColumn(2).width = 30;
  worksheet.getColumn(3).width = 12;
  worksheet.getColumn(4).width = 12;
  worksheet.getColumn(5).width = 12;
  worksheet.getColumn(6).width = 12;
  worksheet.getColumn(7).width = 15;
  
  // Set headers for Excel download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${subject.code}_Overall_Totals.xlsx`
  );
  
  // Write to response
  await workbook.xlsx.write(res);
}

// Helper function to export to CSV
function exportToCSV(res: Response, data: any[], subject: any) {
  // Create CSV content
  let csvContent = `${subject.code} - ${subject.name} (Overall Totals)\n`;
  csvContent += `Semester: ${subject.semester}, Section: ${subject.section || 'All'}\n\n`;
  csvContent += 'USN,Name,CIE Total,Assignment,Quiz,Seminar,Overall Total\n';
  
  // Add data rows
  data.forEach(item => {
    csvContent += `${item.usn},${item.name},${item.cieTotal},${item.assignment},${item.quiz},${item.seminar},${item.overallTotal}\n`;
  });
  
  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${subject.code}_Overall_Totals.csv`
  );
  
  // Send response
  res.send(csvContent);
}

// Helper function to export to PDF
async function exportToPDF(res: Response, data: any[], subject: any) {
  // Generate HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Overall Totals</title>
      <style>
        body { font-family: Arial, sans-serif; }
        h1, h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <h1>${subject.code} - ${subject.name}</h1>
      <h2>Overall Totals</h2>
      <p>Semester: ${subject.semester}, Section: ${subject.section || 'All'}</p>
      
      <table>
        <thead>
          <tr>
            <th>USN</th>
            <th>Name</th>
            <th>CIE Total</th>
            <th>Assignment</th>
            <th>Quiz</th>
            <th>Seminar</th>
            <th>Overall Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr>
              <td>${item.usn}</td>
              <td>${item.name}</td>
              <td>${item.cieTotal}</td>
              <td>${item.assignment}</td>
              <td>${item.quiz}</td>
              <td>${item.seminar}</td>
              <td>${item.overallTotal}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  // Use html-pdf library to convert HTML to PDF
  // Note: In a real implementation, you'd use a PDF generation library here
  // For now, we'll just return the HTML as a placeholder
  
  // Set headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${subject.code}_Overall_Totals.pdf`
  );
  
  // In a real implementation, you would convert HTML to PDF here
  // For now, we'll just send the HTML content with PDF content type
  res.send(htmlContent);
}

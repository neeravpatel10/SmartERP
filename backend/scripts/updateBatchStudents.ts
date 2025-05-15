import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();
const FILE_PATH = './scripts/2023-2027 (1).xlsx'; // Source Excel file
const LOG_DIR = './logs';
const LOG_FILE = path.join(LOG_DIR, `batch-update-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);

// Debug flag to print more information
const DEBUG = false;

// Format date as YYYY-MM-DD without time information
function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Excel date conversion - Excel dates are stored as days since 1/1/1900
function excelDateToJSDate(excelDate: number): Date {
  // Excel's epoch starts on 1/1/1900, but Excel incorrectly treats 1900 as a leap year
  // So we need to adjust for this error after 2/28/1900
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  let jsDate = new Date(Math.round((excelDate - 25569) * millisecondsPerDay)); // 25569 is the number of days between 1/1/1900 and 1/1/1970
  
  // Set to midnight to remove time information
  jsDate.setHours(0, 0, 0, 0);
  
  return jsDate;
}

// Helper to parse dates safely
function safelyParseDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  
  if (DEBUG) console.log(`Trying to parse date: ${dateStr} (type: ${typeof dateStr})`);
  
  // Handle Excel numeric dates (most common case in Excel files)
  if (typeof dateStr === 'number') {
    try {
      const jsDate = excelDateToJSDate(dateStr);
      if (DEBUG) console.log(`Converted Excel date ${dateStr} to JS date: ${jsDate.toISOString()}`);
      return jsDate;
    } catch (error) {
      console.log(`Error converting Excel date: ${dateStr}, error: ${error}`);
    }
  }
  
  // Try to handle DD-MM-YYYY format
  if (typeof dateStr === 'string') {
    // Check if it matches DD-MM-YYYY format
    const dateParts = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (dateParts) {
      const day = parseInt(dateParts[1], 10);
      const month = parseInt(dateParts[2], 10) - 1; // Months are 0-indexed in JS
      const year = parseInt(dateParts[3], 10);
      
      if (DEBUG) console.log(`Parsed date parts: day=${day}, month=${month+1}, year=${year}`);
      
      // Create date with the correct year, month, and day
      const date = new Date(year, month, day);
      
      // Verify the date was created correctly
      if (DEBUG) console.log(`Created date: ${date.toISOString()}`);
      
      return date;
    }
  }
  
  // Fallback to standard date parsing
  try {
    const parsedDate = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      console.log(`Invalid date format: ${dateStr}, using null instead`);
      return null;
    }
    
    if (DEBUG) console.log(`Parsed date using standard method: ${parsedDate.toISOString()}`);
    return parsedDate;
  } catch (error) {
    console.log(`Error parsing date: ${dateStr}, error: ${error}`);
    return null;
  }
}

// Initialize log file
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

fs.writeFileSync(
  LOG_FILE,
  'USN,Operation,Status,Details\n'
);

// Log operation to CSV file
function logOperation(usn: string, operation: string, status: string, details: string) {
  fs.appendFileSync(
    LOG_FILE,
    `${usn},${operation},${status},"${details}"\n`
  );
  console.log(`${usn} - ${operation}: ${status} ${details ? '- ' + details : ''}`);
}

async function updateBatchStudents() {
  try {
    console.log('Starting batch update for 2023 students...');
    
    // 1. First update all 2023 batch students to 4th semester
    const updateResult = await prisma.student.updateMany({
      where: {
        batchId: '2023',
      },
      data: {
        semester: 4,
      },
    });
    
    console.log(`Updated ${updateResult.count} students to 4th semester`);
    
    // 2. Now read Excel file to get correct DOB values
    console.log(`Reading Excel file from: ${FILE_PATH}`);
    const workbook = XLSX.readFile(FILE_PATH);
    
    if (!workbook.SheetNames.includes('Students Info')) {
      console.error('Error: Sheet "Students Info" not found in the Excel file.');
      return;
    }
    
    const sheet = workbook.Sheets['Students Info'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    
    // Create a map of USN to DOB for faster lookups
    const dobMap = new Map<string, any>();
    for (const row of rows) {
      const usn = row['USN']?.toString().trim();
      if (usn && row['Date of Birth ']) {
        dobMap.set(usn, row['Date of Birth ']);
      }
    }
    
    // 3. Get all 2023 batch students
    const students = await prisma.student.findMany({
      where: {
        batchId: '2023',
      },
      select: {
        usn: true,
        dob: true,
      },
    });
    
    console.log(`Found ${students.length} students in 2023 batch to update DOB`);
    
    // 4. Update each student's DOB if needed
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const student of students) {
      try {
        const excelDob = dobMap.get(student.usn);
        if (!excelDob) {
          logOperation(student.usn, 'UPDATE_DOB', 'SKIPPED', 'No DOB found in Excel');
          skippedCount++;
          continue;
        }
        
        const parsedDob = safelyParseDate(excelDob);
        if (!parsedDob) {
          logOperation(student.usn, 'UPDATE_DOB', 'SKIPPED', `Invalid DOB format: ${excelDob}`);
          skippedCount++;
          continue;
        }
        
        // Always update the DOB regardless of current value
        if (student.dob) {
          const currentDob = new Date(student.dob);
          console.log(`${student.usn} - Current DOB: ${formatDateOnly(currentDob)}, New DOB: ${formatDateOnly(parsedDob)}`);
        } else {
          console.log(`${student.usn} - No current DOB, New DOB: ${formatDateOnly(parsedDob)}`);
        }
        
        try {
          // Update the DOB
          await prisma.student.update({
            where: { usn: student.usn },
            data: { dob: parsedDob },
          });
          
          logOperation(student.usn, 'UPDATE_DOB', 'SUCCESS', `Updated to ${formatDateOnly(parsedDob)}`);
          updatedCount++;
        } catch (error: any) {
          logOperation(student.usn, 'UPDATE_DOB', 'ERROR', `Update failed: ${error?.message || 'Unknown error'}`);
          errorCount++;
        }
      } catch (error: any) {
        logOperation(student.usn, 'UPDATE_DOB', 'ERROR', `Error: ${error?.message || 'Unknown error'}`);
        errorCount++;
      }
    }
    
    console.log(`

DOB Update Summary: ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`);
    console.log(`Update completed. See log file for details: ${LOG_FILE}`);
    
  } catch (error: any) {
    console.error('Error updating batch students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateBatchStudents()
  .then(() => console.log('Batch update completed'))
  .catch(e => console.error('Error running batch update:', e));

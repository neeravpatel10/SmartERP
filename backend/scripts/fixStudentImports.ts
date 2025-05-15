import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const FILE_PATH = './scripts/2023-2027 (1).xlsx'; // Same Excel file as the original import
const LOG_DIR = './logs';
const LOG_FILE = path.join(LOG_DIR, `fix-imports-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);

// Helper to ensure string type for fields
function ensureString(value: any): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

// Helper to parse dates safely
function safelyParseDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  
  // Try to handle DD-MM-YYYY format
  if (typeof dateStr === 'string') {
    // Check if it matches DD-MM-YYYY format
    const dateParts = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (dateParts) {
      const day = parseInt(dateParts[1], 10);
      const month = parseInt(dateParts[2], 10) - 1; // Months are 0-indexed in JS
      const year = parseInt(dateParts[3], 10);
      
      console.log(`Parsing date: ${dateStr} as ${day}-${month+1}-${year}`);
      return new Date(year, month, day);
    }
  }
  
  // Fallback to standard date parsing
  const parsedDate = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(parsedDate.getTime())) {
    console.log(`Invalid date format: ${dateStr}, using null instead`);
    return null;
  }
  
  return parsedDate;
}

// Initialize log file with headers
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

fs.writeFileSync(
  LOG_FILE,
  'USN,Operation,Status,Details\n'
);

// List of USNs with issues to fix
const failedImports = ['4AL23CS138']; // Failed due to middleName issue
const partialImports = [
  '4AL23CS008', '4AL23CS124', '4AL23CS172', 
  '4AL24CS400', '4AL24CS404', '4AL24CS405', 
  '4AL24CS410', '4AL24CS411', '4AL24CS412',
  '4AL23CS900'
]; // Partial imports - supplementary data missing

async function fixStudentImports() {
  try {
    console.log(`Reading Excel file from: ${FILE_PATH}`);
    const workbook = XLSX.readFile(FILE_PATH);
    
    if (!workbook.SheetNames.includes('Students Info')) {
      console.error('Error: Sheet "Students Info" not found in the Excel file.');
      return;
    }
    
    const sheet = workbook.Sheets['Students Info'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Found ${rows.length} students in Excel. Processing only those with issues.`);
    
    // Process each row in the Excel file
    for (const row of rows) {
      const usn = row['USN']?.toString().trim();
      if (!usn) continue;
      
      // Only process students in our lists
      if (!failedImports.includes(usn) && !partialImports.includes(usn)) continue;
      
      console.log(`Processing student with USN: ${usn}`);
      
      // Special case for 4AL23CS138 (Sandeep GT) - Fix the failed student creation
      if (usn === '4AL23CS138') {
        await fixFailedStudent(usn, row);
      } 
      // For partial imports, add the missing supplementary data
      else if (partialImports.includes(usn)) {
        await addSupplementaryData(usn, row);
      }
    }
    
    console.log(`Fix operation completed. See log file for details: ${LOG_FILE}`);
  } catch (error: any) {
    console.error('Error processing students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fix the failed student (Sandeep GT) by removing the problematic middleName
async function fixFailedStudent(usn: string, row: any) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username: usn }
    });
    
    if (!user) {
      logOperation(usn, 'CREATE_USER', 'FAILED', 'User not found');
      return;
    }
    
    // Check if student already exists (shouldn't, but let's be safe)
    const existingStudent = await prisma.student.findUnique({
      where: { usn }
    });
    
    if (existingStudent) {
      logOperation(usn, 'CREATE_STUDENT', 'SKIPPED', 'Student already exists');
      // Still proceed to add supplementary data
      await addSupplementaryData(usn, row);
      return;
    }
    
    // Create student with NULL middleName (fixing the issue)
    await prisma.student.create({
      data: {
        usn,
        firstName: row['First Name'] || '',
        middleName: null, // Set to null instead of the problematic value
        lastName: row['Last Name (leave Blank space if no)'] || '',
        email: row['Email ID'] || row['Email Address'] || `${usn}@college.edu`,
        phone: ensureString(row['Student Mobile Number(WhatsApp)']) || '',
        dob: safelyParseDate(row['Date of Birth ']),
        gender: ensureString(row['Gender']),
        batchId: '2023',
        departmentId: 3,
        semester: 4, // 4th semester for 2023 batch
        section: 'A',
        admissionYear: 2023,
        userId: user.id,
      },
    });
    
    logOperation(usn, 'CREATE_STUDENT', 'SUCCESS', 'Fixed by setting middleName to null');
    
    // Now add supplementary data
    await addSupplementaryData(usn, row);
    
  } catch (error: any) {
    console.error(`Error fixing student ${usn}:`, error);
    logOperation(usn, 'FIX_STUDENT', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
  }
}

// Add supplementary data for students that already exist
async function addSupplementaryData(usn: string, row: any) {
  try {
    // Guardian - Mother
    try {
      await prisma.studentGuardian.create({
        data: {
          usn,
          type: 'mother',
          name: ensureString(row['mother_name '] || row['mother_name .1']),
          contact: ensureString(row['mother_mob_no '] || row['mother_mob_no .1']),
          aadhar: ensureString(row['mother_aadhar ']),
          panCard: ensureString(row['mother_pan_card ']),
          occupation: ensureString(row['mother_occupation ']),
        },
      });
      logOperation(usn, 'ADD_MOTHER', 'SUCCESS', '');
    } catch (error: any) {
      logOperation(usn, 'ADD_MOTHER', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
    }

    // Guardian - Father
    try {
      await prisma.studentGuardian.create({
        data: {
          usn,
          type: 'father',
          name: ensureString(row['father_name '] || row['father_name .1']),
          contact: ensureString(row['father_mob_no '] || row['father_mob_no .1']),
          aadhar: ensureString(row['father_aadhar ']),
          panCard: ensureString(row['father_pan_cad ']),
          occupation: ensureString(row['father_occupation ']),
        },
      });
      logOperation(usn, 'ADD_FATHER', 'SUCCESS', '');
    } catch (error: any) {
      logOperation(usn, 'ADD_FATHER', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
    }

    // Address - Present
    try {
      await prisma.studentAddress.create({
        data: {
          usn,
          type: 'present',
          state: ensureString(row['Present State']),
          district: ensureString(row['Present District']),
          houseName: ensureString(row['Present_house_no/name(Do not write Hostel address)']),
          village: ensureString(row['Present Village Name/City Name']),
          pincode: ensureString(row['Present PIN Code']),
        },
      });
      logOperation(usn, 'ADD_PRESENT_ADDRESS', 'SUCCESS', '');
    } catch (error: any) {
      logOperation(usn, 'ADD_PRESENT_ADDRESS', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
    }

    // Address - Permanent
    try {
      await prisma.studentAddress.create({
        data: {
          usn,
          type: 'permanent',
          state: ensureString(row['Parmanent State']),
          district: ensureString(row['Permanent District']),
          houseName: ensureString(row['Permanent house_no/name(Do not write Hostel address)']),
          village: ensureString(row['Permanent post name or village name']),
          pincode: ensureString(row['Permanent Pincode ']),
        },
      });
      logOperation(usn, 'ADD_PERMANENT_ADDRESS', 'SUCCESS', '');
    } catch (error: any) {
      logOperation(usn, 'ADD_PERMANENT_ADDRESS', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
    }

    // Entrance Exams
    try {
      await prisma.studentEntranceExam.create({
        data: {
          usn,
          kcetRank: ensureString(row['KCET Rank(Karnataka CET)']),
          comedkRank: ensureString(row['COMEDK Rank(if any)']),
          jeeRank: ensureString(row['JEE Rank(if any)']),
        },
      });
      logOperation(usn, 'ADD_ENTRANCE_EXAMS', 'SUCCESS', '');
    } catch (error: any) {
      logOperation(usn, 'ADD_ENTRANCE_EXAMS', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
    }

    // SSLC Record
    try {
      await prisma.studentSslcRecord.create({
        data: {
          usn,
          school: ensureString(row['10th STD /SSLC School Name with Place Name']),
          boardUniversity: ensureString(row['10th STD or SSLC Board Name']),
          regNo: ensureString(row['10thStd SSLC Reg_no ']),
          year: ensureString(row['10th Std SSLC Year of Passing']),
          maxMarks: ensureString(row['10th Std or SSLC Maximum Marks']),
          obtainedMarks: ensureString(row['10th Std or SSLC Obtained Marks']),
          percentage: ensureString(row['10th Std /sslc_percentage or CGPA']),
        },
      });
      logOperation(usn, 'ADD_SSLC_RECORD', 'SUCCESS', '');
    } catch (error: any) {
      logOperation(usn, 'ADD_SSLC_RECORD', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
    }

    // PUC Record
    try {
      await prisma.studentPucRecord.create({
        data: {
          usn,
          school: ensureString(row['12th or PUC School Name with Place Name']),
          boardUniversity: ensureString(row['12th Std or PUC Board Name']),
          regNo: ensureString(row['12th/ PUC Register Number']),
          year: ensureString(row['12th Std/ PUC Year of Passing']),
          maxMarks: ensureString(row['12th Std or PUC Maximum Marks']),
          obtainedMarks: ensureString(row['12th Std or PUC Obtained Marks']),
          percentage: ensureString(row['12th Std /PUC_percentage or CGPA']),
          subTotalMarks: ensureString(row['12th or PUC Total Obtained Marks']),
          physicsMax: ensureString(row['12th or PUC Physics Max Marks']),
          physicsObtained: ensureString(row['12th or PUC Physics Obtained Marks']),
          mathsMax: ensureString(row['12th or PUC Maths Max Marks']),
          mathsObtained: ensureString(row['12th or PUC Maths Obtained Marks']),
          chemMax: ensureString(row['12th or PUC Chemistry Max Marks']),
          chemObtained: ensureString(row['12th or PUC Chemistry Obtained Marks']),
          electiveMax: ensureString(row['12th or PUC Bio/CS/Eln/Stat/Other Subject Max Marks']),
          electiveObtained: ensureString(row['12th or PUC Bio/CS/Eln/Stat Obtained Marks']),
          englishMax: ensureString(row['12th or PUC English Max Marks']),
          englishObtained: ensureString(row['12th or PUC English Obtained Marks']),
        },
      });
      logOperation(usn, 'ADD_PUC_RECORD', 'SUCCESS', '');
    } catch (error: any) {
      logOperation(usn, 'ADD_PUC_RECORD', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
    }
    
  } catch (error: any) {
    console.error(`Error adding supplementary data for ${usn}:`, error);
    logOperation(usn, 'ADD_SUPPLEMENTARY_DATA', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
  }
}

// Log operation to CSV file
function logOperation(usn: string, operation: string, status: string, details: string) {
  fs.appendFileSync(
    LOG_FILE,
    `${usn},${operation},${status},"${details}"\n`
  );
  console.log(`${usn} - ${operation}: ${status} ${details ? '- ' + details : ''}`);
}

// Run the script
fixStudentImports()
  .then(() => console.log('Fix script completed'))
  .catch(e => console.error('Error running fix script:', e));

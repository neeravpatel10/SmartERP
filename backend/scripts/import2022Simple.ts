import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const FILE_PATH = './scripts/2022-2026 (1).xlsx'; // Excel file for 2022 batch
const BATCH_ID = '2022';
const DEPARTMENT_ID = 3; // CSE department ID as specified
const SECTION = 'A';
const SEMESTER = 6; // 6th semester for 2022 batch

// Create log directory if it doesn't exist
const LOG_DIR = './logs';
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Create unique log file name with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_FILE = path.join(LOG_DIR, `import-2022-simple-${timestamp}.csv`);

// Initialize log file with headers
fs.writeFileSync(
  LOG_FILE,
  'USN,Status,Details\n'
);

// Helper to ensure string type for fields
function ensureString(value: any): string | null {
  if (value === undefined || value === null) return null;
  return String(value).trim();
}

// Excel date conversion - Excel dates are stored as days since 1/1/1900
function excelDateToJSDate(excelDate: number): Date | null {
  if (!excelDate) return null;
  
  // Excel's epoch starts on 1/1/1900, but Excel incorrectly treats 1900 as a leap year
  // So we need to adjust for this error after 2/28/1900
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  let jsDate = new Date(Math.round((excelDate - 25569) * millisecondsPerDay)); // 25569 is the number of days between 1/1/1900 and 1/1/1970
  
  // Set to midnight to remove time information
  jsDate.setHours(0, 0, 0, 0);
  
  return jsDate;
}

// Helper to parse dates safely - improved version to handle multiple formats
function safelyParseDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  
  // Handle Excel numeric dates (most common case in Excel files)
  if (typeof dateStr === 'number') {
    try {
      return excelDateToJSDate(dateStr);
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
      
      console.log(`Parsed date parts: day=${day}, month=${month+1}, year=${year}`);
      
      // Create date with the correct year, month, and day
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0); // Remove time information
      
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
    
    // Remove time information
    parsedDate.setHours(0, 0, 0, 0);
    return parsedDate;
  } catch (error) {
    console.log(`Error parsing date: ${dateStr}, error: ${error}`);
    return null;
  }
}

// Format date for logging
function formatDate(date: Date | null): string {
  if (!date) return 'null';
  return date.toISOString().split('T')[0];
}

// Log operation to CSV file
function logOperation(usn: string, status: string, details: string) {
  fs.appendFileSync(
    LOG_FILE,
    `${usn},${status},"${details}"\n`
  );
  console.log(`${usn} - ${status}: ${details}`);
}

async function importBatch2022Students() {
  try {
    console.log(`Reading Excel file from: ${FILE_PATH}`);
    const workbook = XLSX.readFile(FILE_PATH);
    
    // Check if sheet exists
    if (!workbook.SheetNames.includes('Students Info')) {
      console.error('Error: Sheet "Students Info" not found in the Excel file.');
      console.log('Available sheets:', workbook.SheetNames.join(', '));
      return;
    }
    
    const sheet = workbook.Sheets['Students Info'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Found ${rows.length} students to import`);

    let successCount = 0;
    let partialCount = 0;
    let failedCount = 0;

    for (const row of rows) {
      try {
        const usn = row['USN']?.toString().trim();
        if (!usn) {
          console.log('Skipping row with no USN');
          continue;
        }
        
        console.log(`Processing student with USN: ${usn}`);

        // Check if student already exists
        const existingStudent = await prisma.student.findUnique({
          where: { usn }
        });
        
        if (existingStudent) {
          logOperation(usn, 'SKIPPED', 'Student already exists');
          partialCount++;
          continue;
        }

        // Parse name from the Name field
        const fullName = ensureString(row['Name']) || '';
        const nameParts = fullName.split(' ');
        let firstName = nameParts[0] || '';
        let middleName: string | null = null;
        let lastName = '';
        
        if (nameParts.length === 2) {
          lastName = nameParts[1];
        } else if (nameParts.length > 2) {
          middleName = nameParts.slice(1, -1).join(' ');
          lastName = nameParts[nameParts.length - 1];
        }

        // Prepare email using the correct column name
        let email = ensureString(row['email_id']) || `${usn.toLowerCase()}@alvas.org`;

        // Check if user already exists
        let existingUser = await prisma.user.findUnique({
          where: { username: usn }
        });

        // Also check by email
        if (!existingUser) {
          existingUser = await prisma.user.findUnique({
            where: { email }
          });
        }

        let userId: number;
        
        if (!existingUser) {
          try {
            // Create a new user
            const hashedPassword = await bcrypt.hash(usn, 10);
            
            const user = await prisma.user.create({
              data: {
                username: usn,
                email,
                passwordHash: hashedPassword,
                loginType: -1,
                departmentId: DEPARTMENT_ID,
                isActive: true,
                firstLogin: true,
              },
            });
            
            userId = user.id;
            console.log(`Created user with ID: ${userId}`);
          } catch (error: any) {
            logOperation(usn, 'FAILED', `User creation failed: ${error?.message || 'Unknown error'}`);
            failedCount++;
            continue;
          }
        } else {
          userId = existingUser.id;
          console.log(`Using existing user with ID: ${userId}`);
        }
        
        // Parse DOB safely with improved handling
        const dobValue = row['dob'];
        const dob = safelyParseDate(dobValue);
        
        if (dob) {
          console.log(`Parsed DOB for ${usn}: ${formatDate(dob)}`);
        } else {
          console.log(`Could not parse DOB for ${usn} from value: ${dobValue}`);
        }
        
        try {
          // Insert student with reference to the user
          await prisma.student.create({
            data: {
              usn,
              firstName,
              middleName,
              lastName,
              email,
              phone: ensureString(row['mob_no']) || '',
              dob,
              gender: ensureString(row['gender']),
              batchId: BATCH_ID,
              departmentId: DEPARTMENT_ID,
              semester: SEMESTER,
              section: SECTION,
              admissionYear: 2022,
              userId,
            },
          });
          
          logOperation(usn, 'SUCCESS', `Created student record with name: ${firstName} ${middleName || ''} ${lastName}`);
          successCount++;
        } catch (error: any) {
          logOperation(usn, 'FAILED', `Student creation failed: ${error?.message || 'Unknown error'}`);
          failedCount++;
        }
      } catch (error: any) {
        logOperation(row['USN'] || 'UNKNOWN', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
        failedCount++;
      }
    }
    
    console.log(`\nImport Summary:`);
    console.log(`Total Students: ${rows.length}`);
    console.log(`Successfully Imported: ${successCount}`);
    console.log(`Skipped (Already Exists): ${partialCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`\nLog file saved to: ${LOG_FILE}`);
    
    console.log('2022 Batch student import completed');
  } catch (error: any) {
    console.error('Error reading Excel file or processing students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importBatch2022Students();

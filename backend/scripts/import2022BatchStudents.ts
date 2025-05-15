import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const FILE_PATH = './scripts/2022-2026 (1).xlsx'; // Source Excel file
const LOG_DIR = './logs';
const LOG_FILE = path.join(LOG_DIR, `import-2022-batch-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
const SUMMARY_FILE = path.join(LOG_DIR, `import-2022-batch-summary-${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`);

// Constants for batch 2022
const BATCH_ID = '2022';
const DEPARTMENT_ID = 3; // CS Department
const SECTION = 'A';
// Password will be the student's USN

// Initialize log file
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

fs.writeFileSync(
  LOG_FILE,
  'USN,Status,Details,SupplementaryDataStatus\n'
);

// Log operation to CSV file
function logOperation(usn: string, status: 'SUCCESS' | 'PARTIAL' | 'FAILED', details: string, supplementaryStatus: string = '') {
  fs.appendFileSync(
    LOG_FILE,
    `${usn},${status},"${details}","${supplementaryStatus}"\n`
  );
  console.log(`${usn} - ${status}: ${details}`);
}

// Helper to ensure string values
function ensureString(value: any): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
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

// Helper to parse dates safely
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
    const dateParts = dateStr.match(/(\\d{1,2})[-\\/](\\d{1,2})[-\\/](\\d{4})/);
    if (dateParts) {
      const day = parseInt(dateParts[1], 10);
      const month = parseInt(dateParts[2], 10) - 1; // Months are 0-indexed in JS
      const year = parseInt(dateParts[3], 10);
      
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

// Format date as YYYY-MM-DD without time information
function formatDateOnly(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

async function importStudents() {
  try {
    console.log(`Reading Excel file from: ${FILE_PATH}`);
    const workbook = XLSX.readFile(FILE_PATH);
    
    if (!workbook.SheetNames.includes('Students Info')) {
      console.error('Error: Sheet "Students Info" not found in the Excel file.');
      return;
    }
    
    const sheet = workbook.Sheets['Students Info'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Found ${rows.length} students to import.`);
    
    // Statistics for summary
    let totalStudents = rows.length;
    let successCount = 0;
    let partialCount = 0;
    let failedCount = 0;
    
    for (const row of rows) {
      const usn = row['USN']?.toString().trim();
      
      if (!usn) {
        console.log('Skipping row with no USN');
        continue;
      }
      
      try {
        // Check if student already exists
        const existingStudent = await prisma.student.findUnique({
          where: { usn }
        });
        
        if (existingStudent) {
          logOperation(usn, 'PARTIAL', 'Student already exists', 'Not attempted');
          partialCount++;
          continue;
        }
        
        // Process email
        let email = row['email_id'];
        if (!email) {
          // Generate email from USN if not provided
          email = `${usn.toLowerCase()}@alvas.org`;
        }
        
        // Check if user with this email or username already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              { username: usn.toLowerCase() }
            ]
          }
        });
        
        let userId;
        
        if (existingUser) {
          userId = existingUser.id;
          console.log(`Using existing user with ID ${userId} for student ${usn}`);
        } else {
          // Create new user with USN as password
          const passwordHash = await bcrypt.hash(usn, 10);
          
          // Generate a unique username by adding a timestamp if needed
          const timestamp = new Date().getTime();
          const username = `${usn.toLowerCase()}_${timestamp}`;
          
          const newUser = await prisma.user.create({
            data: {
              username,
              email,
              passwordHash,
              loginType: 2, // Student login type
              departmentId: DEPARTMENT_ID,
              isActive: true,
            },
          });
          
          userId = newUser.id;
          console.log(`Created new user with ID ${userId} for student ${usn}`);
        }
        
        // Parse date of birth
        const dob = safelyParseDate(row['dob']);
        console.log(`Parsed DOB for ${usn}: ${formatDateOnly(dob)}`);
        
        // Parse name into first, middle, and last names
        const fullName = row['Name'] || '';
        const nameParts = fullName.split(' ');
        let firstName = nameParts[0] || '';
        let middleName = null;
        let lastName = '';
        
        if (nameParts.length === 2) {
          lastName = nameParts[1];
        } else if (nameParts.length > 2) {
          middleName = nameParts.slice(1, -1).join(' ');
          lastName = nameParts[nameParts.length - 1];
        }
        
        // Insert student with reference to the user
        await prisma.student.create({
          data: {
            usn,
            firstName,
            middleName: ensureString(middleName),
            lastName,
            email: email,
            phone: ensureString(row['mob_no']) || '',
            dob,
            gender: ensureString(row['gender']),
            batchId: BATCH_ID,
            departmentId: DEPARTMENT_ID,
            semester: 6, // 6th semester for 2022 batch
            section: SECTION,
            admissionYear: 2022,
            userId,
          },
        });
        
        // Now add supplementary data
        let supplementaryStatus: string[] = [];
        
        // 1. Add guardian information
        try {
          // Father details
          if (row['father_name']) {
            await prisma.studentGuardian.create({
              data: {
                usn,
                type: 'father',
                name: ensureString(row['father_name']),
                contact: ensureString(row['father_mob_no']),
                occupation: ensureString(row['father_occupation']),
                aadhar: ensureString(row['father_aadhar']),
                panCard: ensureString(row['father_pan_cad']),
              },
            });
            supplementaryStatus.push('Father: Success');
          }
          
          // Mother details
          if (row['mother_name']) {
            await prisma.studentGuardian.create({
              data: {
                usn,
                type: 'mother',
                name: ensureString(row['mother_name']),
                contact: ensureString(row['mother_mob_no']),
                occupation: ensureString(row['mother_occupation']),
                aadhar: ensureString(row['mother_aadhar']),
                panCard: ensureString(row['mother_pan_card']),
              },
            });
            supplementaryStatus.push('Mother: Success');
          }
        } catch (error: any) {
          supplementaryStatus.push(`Guardian: Failed - ${error.message}`);
        }
        
        // 2. Add address information
        try {
          // Present address
          await prisma.studentAddress.create({
            data: {
              usn,
              type: 'present',
              state: ensureString(row['present_state']),
              district: ensureString(row['present_dist']),
              houseName: ensureString(row['present_house_no_name']),
              village: ensureString(row['present_post_village']),
              pincode: ensureString(row['present_pincode']),
            },
          });
          supplementaryStatus.push('Present Address: Success');
          
          // Permanent address
          await prisma.studentAddress.create({
            data: {
              usn,
              type: 'permanent',
              state: ensureString(row['permanent_state']),
              district: ensureString(row['permanent_dist']),
              houseName: ensureString(row['permanent_house_no_name']),
              village: ensureString(row['permanent_post_village']),
              pincode: ensureString(row['permanent_pin_code']),
            },
          });
          supplementaryStatus.push('Permanent Address: Success');
        } catch (error: any) {
          supplementaryStatus.push(`Address: Failed - ${error.message}`);
        }
        
        // 3. Add entrance exam information
        try {
          await prisma.studentEntranceExam.create({
            data: {
              usn,
              kcetRank: ensureString(row['kcet']),
              comedkRank: null, // Not in the columns
              jeeRank: null, // Not in the columns
            },
          });
          supplementaryStatus.push('Entrance Exam: Success');
        } catch (error: any) {
          supplementaryStatus.push(`Entrance Exam: Failed - ${error.message}`);
        }
        
        // 4. Add SSLC (10th) information
        try {
          await prisma.studentSslcRecord.create({
            data: {
              usn,
              school: ensureString(row['sslc_school']),
              boardUniversity: ensureString(row['sslc_board_university']),
              regNo: ensureString(row['sslc_reg_no']),
              year: ensureString(row['sslc_year']),
              maxMarks: ensureString(row['sslc_max_marks']),
              obtainedMarks: ensureString(row['sslc_obtained_marks']),
              percentage: ensureString(row['sslc_percentage']),
            },
          });
          supplementaryStatus.push('SSLC: Success');
        } catch (error: any) {
          supplementaryStatus.push(`SSLC: Failed - ${error.message}`);
        }
        
        // 5. Add PUC (12th) information
        try {
          await prisma.studentPucRecord.create({
            data: {
              usn,
              school: ensureString(row['puc_school']),
              boardUniversity: ensureString(row['puc_board_university']),
              regNo: ensureString(row['puc_reg_no']),
              year: ensureString(row['puc_year']),
              maxMarks: ensureString(row['puc_max_marks']),
              obtainedMarks: ensureString(row['puc_obtained_marks']),
              percentage: ensureString(row['puc_percentage']),
              physicsMax: ensureString(row['puc_phy_max_marks']),
              physicsObtained: ensureString(row['puc_phy_obtained_marks']),
              mathsMax: ensureString(row['puc_maths_max_marks']),
              mathsObtained: ensureString(row['puc_maths_obtained_marks']),
              chemMax: ensureString(row['puc_che_max_marks']),
              chemObtained: ensureString(row['puc_che_obtained_marks']),
              electiveMax: ensureString(row['puc_elective_max_marks']),
              electiveObtained: ensureString(row['puc_elective_obtained_marks']),
              subTotalMarks: ensureString(row['puc_sub_total_marks']),
              englishMax: ensureString(row['puc_eng_max_marks']),
              englishObtained: ensureString(row['puc_eng_obtained_marks']),
            },
          });
          supplementaryStatus.push('PUC: Success');
        } catch (error: any) {
          supplementaryStatus.push(`PUC: Failed - ${error.message}`);
        }
        
        logOperation(usn, 'SUCCESS', 'Student imported successfully', supplementaryStatus.join(', '));
        successCount++;
      } catch (error: any) {
        console.error(`Error importing student ${usn}:`, error);
        logOperation(usn, 'FAILED', `Error: ${error.message}`, 'Not attempted');
        failedCount++;
      }
    }
    
    // Create summary workbook
    const summaryWb = XLSX.utils.book_new();
    const summaryData = [
      ['Import Summary for 2022 Batch'],
      ['Date', new Date().toISOString()],
      [''],
      ['Total Students', totalStudents],
      ['Successfully Imported', successCount],
      ['Partially Imported', partialCount],
      ['Failed Import', failedCount],
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(summaryWb, summaryWs, 'Summary');
    XLSX.writeFile(summaryWb, SUMMARY_FILE);
    
    console.log(`
Import completed:
- Total students: ${totalStudents}
- Successfully imported: ${successCount}
- Partially imported: ${partialCount}
- Failed imports: ${failedCount}

Log file: ${LOG_FILE}
Summary file: ${SUMMARY_FILE}
    `);
  } catch (error) {
    console.error('Error importing students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importStudents()
  .then(() => console.log('Import process completed'))
  .catch(e => console.error('Error running import process:', e));

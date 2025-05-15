import * as XLSX from 'xlsx';
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const FILE_PATH = './scripts/2023-2027 (1).xlsx'; // Updated file path to your Excel file
const BATCH_ID = '2023';
const DEPARTMENT_ID = 3;
const SECTION = 'A';

// Create log directory if it doesn't exist
const LOG_DIR = './logs';
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Create unique log file name with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_FILE = path.join(LOG_DIR, `import-log-${timestamp}.csv`);
const LOG_SUMMARY_FILE = path.join(LOG_DIR, `import-summary-${timestamp}.xlsx`);

// Initialize log file with headers
fs.writeFileSync(
  LOG_FILE,
  'USN,Status,User Created,Student Created,Mother Created,Father Created,Present Address,Permanent Address,Entrance Exams,SSLC Record,PUC Record,Error Message\n'
);

// Log entry interface
interface LogEntry {
  usn: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  userCreated: boolean;
  studentCreated: boolean;
  motherCreated: boolean;
  fatherCreated: boolean;
  presentAddressCreated: boolean;
  permanentAddressCreated: boolean;
  entranceExamsCreated: boolean;
  sslcRecordCreated: boolean;
  pucRecordCreated: boolean;
  errorMessage?: string;
}

// Summary statistics
interface ImportSummary {
  totalProcessed: number;
  fullSuccess: number;
  partialSuccess: number;
  failed: number;
  userCreated: number;
  studentCreated: number;
  motherCreated: number;
  fatherCreated: number;
  presentAddressCreated: number;
  permanentAddressCreated: number;
  entranceExamsCreated: number;
  sslcRecordCreated: number;
  pucRecordCreated: number;
}

const summary: ImportSummary = {
  totalProcessed: 0,
  fullSuccess: 0,
  partialSuccess: 0,
  failed: 0,
  userCreated: 0,
  studentCreated: 0,
  motherCreated: 0,
  fatherCreated: 0,
  presentAddressCreated: 0,
  permanentAddressCreated: 0,
  entranceExamsCreated: 0,
  sslcRecordCreated: 0,
  pucRecordCreated: 0,
};

// Function to log entry to CSV file
function logEntry(entry: LogEntry): void {
  // Update summary
  summary.totalProcessed++;
  
  if (entry.status === 'SUCCESS') {
    summary.fullSuccess++;
  } else if (entry.status === 'PARTIAL') {
    summary.partialSuccess++;
  } else {
    summary.failed++;
  }
  
  if (entry.userCreated) summary.userCreated++;
  if (entry.studentCreated) summary.studentCreated++;
  if (entry.motherCreated) summary.motherCreated++;
  if (entry.fatherCreated) summary.fatherCreated++;
  if (entry.presentAddressCreated) summary.presentAddressCreated++;
  if (entry.permanentAddressCreated) summary.permanentAddressCreated++;
  if (entry.entranceExamsCreated) summary.entranceExamsCreated++;
  if (entry.sslcRecordCreated) summary.sslcRecordCreated++;
  if (entry.pucRecordCreated) summary.pucRecordCreated++;
  
  // Write to CSV file
  fs.appendFileSync(
    LOG_FILE,
    `${entry.usn},${entry.status},${entry.userCreated},${entry.studentCreated},${entry.motherCreated},${entry.fatherCreated},${entry.presentAddressCreated},${entry.permanentAddressCreated},${entry.entranceExamsCreated},${entry.sslcRecordCreated},${entry.pucRecordCreated},"${entry.errorMessage || ''}"\n`
  );
}

// Function to generate summary Excel file
function generateSummaryExcel(): void {
  const workbook = XLSX.utils.book_new();
  
  // Create summary worksheet
  const summaryData = [
    ['Import Summary', ''],
    ['Timestamp', new Date().toISOString()],
    ['Source File', FILE_PATH],
    ['', ''],
    ['Metric', 'Count'],
    ['Total Students Processed', summary.totalProcessed],
    ['Fully Successful Imports', summary.fullSuccess],
    ['Partial Imports', summary.partialSuccess],
    ['Failed Imports', summary.failed],
    ['', ''],
    ['Entity', 'Successfully Created'],
    ['Users', summary.userCreated],
    ['Students', summary.studentCreated],
    ['Mother Guardians', summary.motherCreated],
    ['Father Guardians', summary.fatherCreated],
    ['Present Addresses', summary.presentAddressCreated],
    ['Permanent Addresses', summary.permanentAddressCreated],
    ['Entrance Exams', summary.entranceExamsCreated],
    ['SSLC Records', summary.sslcRecordCreated],
    ['PUC Records', summary.pucRecordCreated],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, ws, 'Summary');
  
  // Write to file
  XLSX.writeFile(workbook, LOG_SUMMARY_FILE);
  console.log(`Summary Excel file created: ${LOG_SUMMARY_FILE}`);
}

// Helper to ensure string type for fields
function ensureString(value: any): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

// Helper to parse dates safely
function safelyParseDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  
  const parsedDate = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(parsedDate.getTime())) {
    console.log(`Invalid date format: ${dateStr}, using null instead`);
    return null;
  }
  
  return parsedDate;
}

async function importStudents() {
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

    for (const row of rows) {
      // Initialize log entry for this student
      const logData: LogEntry = {
        usn: '',
        status: 'FAILED',
        userCreated: false,
        studentCreated: false,
        motherCreated: false,
        fatherCreated: false,
        presentAddressCreated: false,
        permanentAddressCreated: false,
        entranceExamsCreated: false,
        sslcRecordCreated: false,
        pucRecordCreated: false
      };
      
      try {
        const usn = row['USN']?.toString().trim();
        if (!usn) {
          console.log('Skipping row with no USN');
          continue;
        }
        
        logData.usn = usn; // Set USN for log entry
        console.log(`Processing student with USN: ${usn}`);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { username: usn }
        });

        // Check if student already exists
        const existingStudent = await prisma.student.findUnique({
          where: { usn }
        });
        
        let skipStudent = false;
        
        if (existingUser) {
          console.log(`User with username ${usn} already exists. Using existing user...`);
          logData.userCreated = true; // Consider existing user as created
          
          if (!existingStudent) {
            console.log(`Student record for ${usn} does not exist, creating...`);
            // Continue with student creation using existing user
          } else {
            console.log(`Student record for ${usn} already exists. Skipping...`);
            logData.studentCreated = true; // Consider existing student as created
            logData.status = 'PARTIAL';
            logData.errorMessage = 'Student record already exists, skipped';
            logEntry(logData);
            continue; // Skip this student entirely
          }
        }

        // Prepare email
        let email = row['Email ID'] || row['Email Address'] || `${usn}@college.edu`;

        let userId: number;
        
        if (!existingUser) {
          try {
            // Check if email already exists
            const userWithEmail = await prisma.user.findUnique({
              where: { email: email }
            });

            if (userWithEmail) {
              console.log(`User with email ${email} already exists. Using a modified email...`);
              // Use modified email by appending a random string
              const randomSuffix = Math.random().toString(36).substring(7);
              email = `${usn}_${randomSuffix}@college.edu`;
            }

            console.log(`Creating user with username: ${usn}, email: ${email}`);

            // First create the user
            const user = await prisma.user.create({
              data: {
                username: usn,
                email: email,
                passwordHash: await bcrypt.hash(usn, 10),
                loginType: -1,
                departmentId: DEPARTMENT_ID,
                isActive: true,
                firstLogin: true,
              },
            });
            
            userId = user.id;
            logData.userCreated = true;
            console.log(`Created user with ID: ${userId}`);
          } catch (error: any) {
            console.error(`Failed to create user for ${usn}:`, error);
            logData.errorMessage = `User creation failed: ${error?.message || 'Unknown error'}`;
            logEntry(logData);
            continue; // Skip to next student
          }
        } else {
          userId = existingUser.id;
          console.log(`Using existing user with ID: ${userId}`);
        }
        
        if (!existingStudent) {
          try {
            // Parse DOB safely
            const dob = safelyParseDate(row['Date of Birth ']);
            
            // Insert student with reference to the user
            await prisma.student.create({
              data: {
                usn,
                firstName: row['First Name'] || '',
                middleName: row['Middle Name(leave Blank space if no)'] || null,
                lastName: row['Last Name (leave Blank space if no)'] || '',
                email: email,
                phone: ensureString(row['Student Mobile Number(WhatsApp)']) || '',
                dob,
                gender: ensureString(row['Gender']),
                batchId: BATCH_ID,
                departmentId: DEPARTMENT_ID,
                semester: 4, // Updated to 4th semester for 2023 batch
                section: SECTION,
                admissionYear: 2023,
                userId, // Connect to the user
              },
            });
            
            logData.studentCreated = true;
            console.log(`Created student record for ${usn}`);
          } catch (error: any) {
            console.error(`Failed to create student record for ${usn}:`, error);
            logData.errorMessage = `Student creation failed: ${error?.message || 'Unknown error'}`;
            logEntry(logData);
            continue; // Skip to next student
          }
        } else {
          logData.studentCreated = true;
        }

        try {
          // Guardian - Mother
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
          logData.motherCreated = true;
          console.log(`Added mother guardian for ${usn}`);
        } catch (error) {
          console.error(`Error adding mother guardian for ${usn}:`, error);
        }

        try {
          // Guardian - Father
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
          logData.fatherCreated = true;
          console.log(`Added father guardian for ${usn}`);
        } catch (error) {
          console.error(`Error adding father guardian for ${usn}:`, error);
        }

        try {
          // Address - Present
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
          logData.presentAddressCreated = true;
          console.log(`Added present address for ${usn}`);
        } catch (error) {
          console.error(`Error adding present address for ${usn}:`, error);
        }

        try {
          // Address - Permanent
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
          logData.permanentAddressCreated = true;
          console.log(`Added permanent address for ${usn}`);
        } catch (error) {
          console.error(`Error adding permanent address for ${usn}:`, error);
        }

        try {
          // Entrance Exams
          await prisma.studentEntranceExam.create({
            data: {
              usn,
              kcetRank: ensureString(row['KCET Rank(Karnataka CET)']),
              comedkRank: ensureString(row['COMEDK Rank(if any)']),
              jeeRank: ensureString(row['JEE Rank(if any)']),
            },
          });
          logData.entranceExamsCreated = true;
          console.log(`Added entrance exams for ${usn}`);
        } catch (error) {
          console.error(`Error adding entrance exams for ${usn}:`, error);
        }

        try {
          // SSLC Record
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
          logData.sslcRecordCreated = true;
          console.log(`Added SSLC record for ${usn}`);
        } catch (error) {
          console.error(`Error adding SSLC record for ${usn}:`, error);
        }

        try {
          // PUC Record
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
          logData.pucRecordCreated = true;
          console.log(`Added PUC record for ${usn}`);
        } catch (error) {
          console.error(`Error adding PUC record for ${usn}:`, error);
        }
        
        // Determine overall status - if user and student were created but some supplementary data failed
        if (logData.userCreated && logData.studentCreated) {
          if (logData.motherCreated && logData.fatherCreated && 
              logData.presentAddressCreated && logData.permanentAddressCreated && 
              logData.entranceExamsCreated && logData.sslcRecordCreated && logData.pucRecordCreated) {
            logData.status = 'SUCCESS';
            console.log(`Successfully imported all data for student: ${usn}`);
          } else {
            logData.status = 'PARTIAL';
            logData.errorMessage = 'Core data imported but some supplementary data failed';
            console.log(`Partially imported student ${usn}: core data OK but some supplementary data failed`);
          }
        } else {
          logData.status = 'FAILED';
          logData.errorMessage = 'Failed to create core student data';
          console.log(`Failed to import core data for student: ${usn}`);
        }
        
        // Log the final result
        logEntry(logData);
      } catch (error: any) {
        // Log any unhandled error
        logData.errorMessage = `Unhandled error: ${error?.message || 'Unknown error'}`;
        logData.status = 'FAILED';
        logEntry(logData);
        console.error(`Error importing USN ${row['USN']}:`, error);
      }
    }
    
    // Generate summary at the end
    console.log(`Import summary: ${summary.fullSuccess} students successfully imported, ${summary.partialSuccess} partially imported, ${summary.failed} failed.`);
    
    // Generate detailed Excel summary report
    try {
      generateSummaryExcel();
      console.log(`Detailed log file saved to: ${LOG_FILE}`);
    } catch (error) {
      console.error('Error generating summary Excel:', error);
    }

    console.log('Student import completed');
  } catch (error) {
    console.error('Error reading Excel file or processing students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importStudents();

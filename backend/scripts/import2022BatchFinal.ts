import * as XLSX from 'xlsx';
import { PrismaClient, Prisma, GuardianType, AddressType } from '@prisma/client';
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
const LOG_FILE = path.join(LOG_DIR, `import-2022-batch-${timestamp}.csv`);
const LOG_SUMMARY_FILE = path.join(LOG_DIR, `import-2022-summary-${timestamp}.xlsx`);

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
    ['Entrance Exam Records', summary.entranceExamsCreated],
    ['SSLC Records', summary.sslcRecordCreated],
    ['PUC Records', summary.pucRecordCreated],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Write to file
  XLSX.writeFile(workbook, LOG_SUMMARY_FILE);
  console.log(`Summary Excel file saved to: ${LOG_SUMMARY_FILE}`);
}

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
              email = `${usn}_${randomSuffix}@alvas.org`;
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
            // Parse DOB safely with improved handling
            const dobValue = row['dob'];
            const dob = safelyParseDate(dobValue);
            
            if (dob) {
              console.log(`Parsed DOB for ${usn}: ${formatDate(dob)}`);
            } else {
              console.log(`Could not parse DOB for ${usn} from value: ${dobValue}`);
            }
            
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
            
            logData.studentCreated = true;
            console.log(`Created student record for ${usn}`);
            
            // Now add supplementary information
            
            // Father Guardian
            if (row['father_name']) {
              try {
                await prisma.studentGuardian.create({
                  data: {
                    usn,
                    type: GuardianType.father,
                    name: ensureString(row['father_name']),
                    contact: ensureString(row['father_mob_no']),
                    aadhar: ensureString(row['father_aadhar']),
                    panCard: ensureString(row['father_pan_card']),
                    occupation: ensureString(row['father_occupation']),
                  },
                });
                logData.fatherCreated = true;
                console.log(`Added father guardian for ${usn}`);
              } catch (error) {
                console.error(`Error adding father guardian for ${usn}:`, error);
              }
            }
            
            // Mother Guardian
            if (row['mother_name']) {
              try {
                await prisma.studentGuardian.create({
                  data: {
                    usn,
                    type: GuardianType.mother,
                    name: ensureString(row['mother_name']),
                    contact: ensureString(row['mother_mob_no']),
                    aadhar: ensureString(row['mother_aadhar']),
                    panCard: ensureString(row['mother_pan_card']),
                    occupation: ensureString(row['mother_occupation']),
                  },
                });
                logData.motherCreated = true;
                console.log(`Added mother guardian for ${usn}`);
              } catch (error) {
                console.error(`Error adding mother guardian for ${usn}:`, error);
              }
            }
            
            // Present Address
            if (row['present_state'] || row['present_dist'] || row['present_house_no_name']) {
              try {
                await prisma.studentAddress.create({
                  data: {
                    usn,
                    type: AddressType.present,
                    state: ensureString(row['present_state']) || '',
                    district: ensureString(row['present_dist']) || '',
                    houseName: ensureString(row['present_house_no_name']) || '',
                    village: ensureString(row['present_post_village']) || '',
                    pincode: ensureString(row['present_pincode']) || '',
                  },
                });
                logData.presentAddressCreated = true;
                console.log(`Added present address for ${usn}`);
              } catch (error) {
                console.error(`Error adding present address for ${usn}:`, error);
              }
            }
            
            // Permanent Address
            if (row['permanent_state'] || row['permanent_dist'] || row['permanent_house_no_name']) {
              try {
                await prisma.studentAddress.create({
                  data: {
                    usn,
                    type: AddressType.permanent,
                    state: ensureString(row['permanent_state']) || '',
                    district: ensureString(row['permanent_dist']) || '',
                    houseName: ensureString(row['permanent_house_no_name']) || '',
                    village: ensureString(row['permanent_post_village']) || '',
                    pincode: ensureString(row['permanent_pincode']) || '',
                  },
                });
                logData.permanentAddressCreated = true;
                console.log(`Added permanent address for ${usn}`);
              } catch (error) {
                console.error(`Error adding permanent address for ${usn}:`, error);
              }
            }
            
            // Entrance Exams
            try {
              await prisma.studentEntranceExam.create({
                data: {
                  usn,
                  kcetRank: ensureString(row['kcet']) || null,
                  comedkRank: ensureString(row['comedk']) || null,
                  jeeRank: ensureString(row['jee']) || null,
                },
              });
              logData.entranceExamsCreated = true;
              console.log(`Added entrance exam records for ${usn}`);
            } catch (error) {
              console.error(`Error adding entrance exam records for ${usn}:`, error);
            }
            
            // SSLC Record
            try {
              await prisma.studentSslcRecord.create({
                data: {
                  usn,
                  school: ensureString(row['sslc_school']) || null,
                  boardUniversity: ensureString(row['sslc_board_university']) || null,
                  regNo: ensureString(row['sslc_reg_no']) || null,
                  yearOfPassing: ensureString(row['sslc_year']) || null,
                  maxMarks: ensureString(row['sslc_max_marks']) || null,
                  obtainedMarks: ensureString(row['sslc_obtained_marks']) || null,
                  percentage: ensureString(row['sslc_percentage']) || null,
                },
              });
              logData.sslcRecordCreated = true;
              console.log(`Added SSLC record for ${usn}`);
            } catch (error) {
              console.error(`Error adding SSLC record for ${usn}:`, error);
            }
            
            // PUC Record
            try {
              await prisma.studentPucRecord.create({
                data: {
                  usn,
                  school: ensureString(row['puc_school']) || null,
                  boardUniversity: ensureString(row['puc_board_university']) || null,
                  regNo: ensureString(row['puc_reg_no']) || null,
                  yearOfPassing: ensureString(row['puc_year']) || null,
                  maxMarks: ensureString(row['puc_max_marks']) || null,
                  obtainedMarks: ensureString(row['puc_obtained_marks']) || null,
                  percentage: ensureString(row['puc_percentage']) || null,
                  physicsMax: ensureString(row['puc_phy_max_marks']) || null,
                  physicsObtained: ensureString(row['puc_phy_obtained_marks']) || null,
                  mathsMax: ensureString(row['puc_maths_max_marks']) || null,
                  mathsObtained: ensureString(row['puc_maths_obtained_marks']) || null,
                  chemMax: ensureString(row['puc_che_max_marks']) || null,
                  chemObtained: ensureString(row['puc_che_obtained_marks']) || null,
                  electiveMax: ensureString(row['puc_elective_max_marks']) || null,
                  electiveObtained: ensureString(row['puc_elective_obtained_marks']) || null,
                  subTotalMarks: ensureString(row['puc_sub_total_marks']) || null,
                  englishMax: ensureString(row['puc_eng_max_marks']) || null,
                  englishObtained: ensureString(row['puc_eng_obtained_marks']) || null,
                },
              });
              logData.pucRecordCreated = true;
              console.log(`Added PUC record for ${usn}`);
            } catch (error) {
              console.error(`Error adding PUC record for ${usn}:`, error);
            }
            
            // Custom fields (optional)
            try {
              // Store custom fields if needed
              console.log(`Processed custom fields for ${usn}: sc_st=${row['sc_st']}, caste=${row['caste']}, annual_income=${row['annual_income']}, place_of_birth=${row['place_of_birth']}`);
            } catch (error) {
              console.error(`Error processing custom fields for ${usn}:`, error);
            }
            
            // Determine overall status
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
          } catch (error: any) {
            console.error(`Failed to create student record for ${usn}:`, error);
            logData.errorMessage = `Student creation failed: ${error?.message || 'Unknown error'}`;
          }
        } else {
          logData.studentCreated = true;
          console.log(`Using existing student record for ${usn}`);
          logData.status = 'PARTIAL';
          logData.errorMessage = 'Student record already exists';
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
      console.log(`Summary report saved to: ${LOG_SUMMARY_FILE}`);
    } catch (error) {
      console.error('Error generating summary Excel:', error);
    }

    console.log('2022 Batch student import completed');
  } catch (error) {
    console.error('Error reading Excel file or processing students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importBatch2022Students();

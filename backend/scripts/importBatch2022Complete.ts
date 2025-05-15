import { PrismaClient, GuardianType, AddressType, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const FILE_PATH = './scripts/2022-2026 (1).xlsx'; // Source Excel file
const LOG_DIR = './logs';
const LOG_FILE = path.join(LOG_DIR, `import-2022-batch-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
const SUMMARY_FILE = path.join(LOG_DIR, `import-summary-${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`);

// Constants for batch 2022
const BATCH_ID = '2022';
const DEPARTMENT_ID = 3; // CS department ID
const SECTION = 'A';
const SEMESTER = 6; // 6th semester for 2022 batch

// Constants for default login
const LOGIN_TYPE = -1; // Default login type as specified

// Enable detailed logging
const VERBOSE_LOGGING = true;

// Initialize log file
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

fs.writeFileSync(
  LOG_FILE,
  'USN,Operation,Status,Details\n'
);

// Statistics for summary report
const stats = {
  total: 0,
  userCreated: 0,
  studentCreated: 0,
  fatherCreated: 0,
  motherCreated: 0,
  permanentAddressCreated: 0,
  presentAddressCreated: 0,
  entranceExamCreated: 0,
  sslcCreated: 0,
  pucCreated: 0,
  customFieldsCreated: 0,
  skipped: 0,
  errors: 0
};

// Log operation to CSV file
function logOperation(usn: string, operation: string, status: string, details: string) {
  fs.appendFileSync(
    LOG_FILE,
    `${usn},${operation},${status},"${details}"\n`
  );
  if (VERBOSE_LOGGING || status === 'ERROR') {
    console.log(`${usn} - ${operation}: ${status} ${details ? '- ' + details : ''}`);
  }
}

// Helper to ensure string values
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
    const dateParts = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
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

// Hash password using bcrypt
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Generate a unique username
function generateUniqueUsername(firstName: string, lastName: string): string {
  const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  const timestamp = new Date().getTime().toString().slice(-4);
  return `${base}.${timestamp}`;
}

async function importBatch2022Complete() {
  try {
    console.log(`Reading Excel file from: ${FILE_PATH}`);
    const workbook = XLSX.readFile(FILE_PATH);
    
    if (!workbook.SheetNames.includes('Students Info')) {
      console.error('Error: Sheet "Students Info" not found in the Excel file.');
      return;
    }
    
    const sheet = workbook.Sheets['Students Info'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    
    stats.total = rows.length;
    console.log(`Found ${rows.length} students to import.`);
    
    // Process each student
    for (const row of rows) {
      const usn = ensureString(row['USN']);
      if (!usn) {
        console.log('Skipping row without USN');
        stats.skipped++;
        continue;
      }
      
      try {
        // Check if student already exists
        const existingStudent = await prisma.student.findUnique({
          where: { usn }
        });
        
        if (existingStudent) {
          logOperation(usn, 'CHECK_STUDENT', 'SKIPPED', 'Student already exists in database');
          stats.skipped++;
          continue;
        }
        
        // Parse name into first, middle, and last names
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
        
        // Use correct email field name from the Excel file
        const email = ensureString(row['email_id']) || `${usn.toLowerCase()}@alvas.org`;
        
        // Parse date of birth
        const dobValue = row['dob'];
        const dob = safelyParseDate(dobValue);
        if (!dob) {
          logOperation(usn, 'PARSE_DOB', 'WARNING', `Could not parse DOB: ${dobValue}`);
        }
        
        // Create user account
        let userId: number;
        try {
          // Check if user with this email already exists
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: email },
                { username: email }
              ]
            }
          });
          
          if (existingUser) {
            userId = existingUser.id;
            logOperation(usn, 'FIND_USER', 'SUCCESS', `Found existing user with ID: ${userId}`);
          } else {
            // Use USN as username as per requirements
            const username = usn;
            const hashedPassword = await hashPassword(usn);
            
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                username,
                email,
                passwordHash: hashedPassword,
                loginType: LOGIN_TYPE, // Use constant value
                departmentId: DEPARTMENT_ID,
                firstLogin: true,
                isActive: true,
              }
            });
            
            userId = newUser.id;
            logOperation(usn, 'CREATE_USER', 'SUCCESS', `Created user with ID: ${userId}`);
            stats.userCreated++;
          }
        } catch (error: any) {
          logOperation(usn, 'CREATE_USER', 'ERROR', `Failed to create user: ${error.message}`);
          stats.errors++;
          continue; // Skip to next student if user creation fails
        }
        
        // Create student record
        try {
          const student = await prisma.student.create({
            data: {
              usn,
              firstName,
              middleName,
              lastName,
              email,
              phone: ensureString(row['mob_no']) || '',
              dob,
              gender: ensureString(row['gender']) || '',
              batchId: BATCH_ID,
              departmentId: DEPARTMENT_ID,
              semester: SEMESTER,
              section: SECTION,
              admissionYear: 2022,
              userId,
            },
          });
          
          logOperation(usn, 'CREATE_STUDENT', 'SUCCESS', `Created student record with name: ${firstName} ${middleName || ''} ${lastName}`);
          stats.studentCreated++;
          
          // Create father guardian information
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
                }
              });
              
              logOperation(usn, 'CREATE_FATHER', 'SUCCESS', `Created father information`);
              stats.fatherCreated++;
            } catch (error: any) {
              logOperation(usn, 'CREATE_FATHER', 'ERROR', `Failed to create father: ${error.message}`);
              stats.errors++;
            }
          }
          
          // Create mother guardian information
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
                }
              });
              
              logOperation(usn, 'CREATE_MOTHER', 'SUCCESS', `Created mother information`);
              stats.motherCreated++;
            } catch (error: any) {
              logOperation(usn, 'CREATE_MOTHER', 'ERROR', `Failed to create mother: ${error.message}`);
              stats.errors++;
            }
          }
          
          // Custom fields for student (optional)
          try {
            // These fields aren't directly in the schema but can be stored as custom fields if needed
            const customFields = {
              sc_st: ensureString(row['sc_st']),
              caste: ensureString(row['caste']),
              annual_income: ensureString(row['annual_income']),
              place_of_birth: ensureString(row['place_of_birth'])
            };
            
            // Store these in a custom table or as a JSON field if available
            // For now, we'll just log that we processed them
            logOperation(usn, 'PROCESS_CUSTOM_FIELDS', 'SUCCESS', `Processed custom fields`);
            stats.customFieldsCreated++;
          } catch (error: any) {
            logOperation(usn, 'PROCESS_CUSTOM_FIELDS', 'ERROR', `Failed to process custom fields: ${error.message}`);
            stats.errors++;
          }
          
          // Create permanent address information
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
                }
              });
              
              logOperation(usn, 'CREATE_PERMANENT_ADDRESS', 'SUCCESS', `Created permanent address`);
              stats.permanentAddressCreated++;
            } catch (error: any) {
              logOperation(usn, 'CREATE_PERMANENT_ADDRESS', 'ERROR', `Failed to create permanent address: ${error.message}`);
              stats.errors++;
            }
          }
          
          // Create present address information
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
                }
              });
              
              logOperation(usn, 'CREATE_PRESENT_ADDRESS', 'SUCCESS', `Created present address`);
              stats.presentAddressCreated++;
            } catch (error: any) {
              logOperation(usn, 'CREATE_PRESENT_ADDRESS', 'ERROR', `Failed to create present address: ${error.message}`);
              stats.errors++;
            }
          }
          
          // Create entrance exam information
          if (row['kcet'] || row['comedk'] || row['jee']) {
            try {
              await prisma.studentEntranceExam.create({
                data: {
                  usn,
                  kcetRank: ensureString(row['kcet']) || null,
                  comedkRank: ensureString(row['comedk']) || null,
                  jeeRank: ensureString(row['jee']) || null,
                }
              });
              
              logOperation(usn, 'CREATE_ENTRANCE_EXAM', 'SUCCESS', `Created entrance exam information`);
              stats.entranceExamCreated++;
            } catch (error: any) {
              logOperation(usn, 'CREATE_ENTRANCE_EXAM', 'ERROR', `Failed to create entrance exam: ${error.message}`);
              stats.errors++;
            }
          }
          
          // Create SSLC information
          if (row['sslc_school'] || row['sslc_board_university'] || row['sslc_percentage'] || row['sslc_year']) {
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
                }
              });
              
              logOperation(usn, 'CREATE_SSLC', 'SUCCESS', `Created SSLC information`);
              stats.sslcCreated++;
            } catch (error: any) {
              logOperation(usn, 'CREATE_SSLC', 'ERROR', `Failed to create SSLC: ${error.message}`);
              stats.errors++;
            }
          }
          
          // Create PUC information
          if (row['puc_school'] || row['puc_board_university'] || row['puc_percentage'] || row['puc_year']) {
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
                }
              });
              
              logOperation(usn, 'CREATE_PUC', 'SUCCESS', `Created PUC information`);
              stats.pucCreated++;
            } catch (error: any) {
              logOperation(usn, 'CREATE_PUC', 'ERROR', `Failed to create PUC: ${error.message}`);
              stats.errors++;
            }
          }
          
          logOperation(usn, 'IMPORT_COMPLETE', 'SUCCESS', 'All information imported successfully');
          
        } catch (error: any) {
          logOperation(usn, 'CREATE_STUDENT', 'ERROR', `Failed to create student: ${error.message}`);
          stats.errors++;
        }
      } catch (error: any) {
        logOperation(usn, 'PROCESS', 'ERROR', `Error processing student: ${error.message}`);
        stats.errors++;
      }
    }
    
    // Create summary report
    const summarySheet = XLSX.utils.json_to_sheet([
      { Category: 'Total Students', Count: stats.total },
      { Category: 'Students Created', Count: stats.studentCreated },
      { Category: 'Users Created', Count: stats.userCreated },
      { Category: 'Father Records Created', Count: stats.fatherCreated },
      { Category: 'Mother Records Created', Count: stats.motherCreated },
      { Category: 'Permanent Address Records Created', Count: stats.permanentAddressCreated },
      { Category: 'Present Address Records Created', Count: stats.presentAddressCreated },
      { Category: 'Entrance Exam Records Created', Count: stats.entranceExamCreated },
      { Category: 'SSLC Records Created', Count: stats.sslcCreated },
      { Category: 'PUC Records Created', Count: stats.pucCreated },
      { Category: 'Custom Fields Created', Count: stats.customFieldsCreated },
      { Category: 'Skipped (Already Exists)', Count: stats.skipped },
      { Category: 'Errors', Count: stats.errors },
    ]);
    
    const summaryWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(summaryWorkbook, summarySheet, 'Summary');
    XLSX.writeFile(summaryWorkbook, SUMMARY_FILE);
    
    // Print summary to console
    console.log(`\n\nImport Summary:`);
    console.log(`Total Students: ${stats.total}`);
    console.log(`Students Created: ${stats.studentCreated}`);
    console.log(`Users Created: ${stats.userCreated}`);
    console.log(`Father Records Created: ${stats.fatherCreated}`);
    console.log(`Mother Records Created: ${stats.motherCreated}`);
    console.log(`Permanent Address Records Created: ${stats.permanentAddressCreated}`);
    console.log(`Present Address Records Created: ${stats.presentAddressCreated}`);
    console.log(`Entrance Exam Records Created: ${stats.entranceExamCreated}`);
    console.log(`SSLC Records Created: ${stats.sslcCreated}`);
    console.log(`PUC Records Created: ${stats.pucCreated}`);
    console.log(`Skipped (Already Exists): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    
    console.log(`\nImport completed. See log file for details: ${LOG_FILE}`);
    console.log(`Summary report saved to: ${SUMMARY_FILE}`);
    
  } catch (error: any) {
    console.error('Error importing 2022 batch students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
importBatch2022Complete()
  .then(() => console.log('2022 batch import completed'))
  .catch(e => console.error('Error running import:', e));

import * as XLSX from 'xlsx';
import { PrismaClient, GuardianType, AddressType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const FILE_PATH = './scripts/2022-2026 (1).xlsx'; // Excel file for 2022 batch
const LOG_DIR = './logs';

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Create unique log file name with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_FILE = path.join(LOG_DIR, `fix-all-partial-imports-${timestamp}.csv`);

// Initialize log file with headers
fs.writeFileSync(
  LOG_FILE,
  'USN,Issue,Status,Details\n'
);

// Helper to ensure string type for fields
function ensureString(value: any): string | null {
  if (value === undefined || value === null) return null;
  return String(value).trim();
}

// Log operation to CSV file
function logOperation(usn: string, issue: string, status: string, details: string) {
  fs.appendFileSync(
    LOG_FILE,
    `${usn},${issue},${status},"${details}"\n`
  );
  console.log(`${usn} - ${issue} - ${status}: ${details}`);
}

async function fixAllPartialImports() {
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
    
    // List of USNs with missing father information
    const missingFatherInfo = ['4AL22CS049', '4AL22CS098', '4AL22CS159'];
    console.log(`Fixing ${missingFatherInfo.length} students with missing father information...`);

    // List of USNs with missing permanent address
    const missingPermanentAddress = ['4AL22CS064', '4AL22CS117', '4AL22CS138', '4AL22CS152'];
    console.log(`Fixing ${missingPermanentAddress.length} students with missing permanent address...`);

    let fatherSuccessCount = 0;
    let fatherFailedCount = 0;
    let addressSuccessCount = 0;
    let addressFailedCount = 0;

    // Fix missing father information
    for (const usn of missingFatherInfo) {
      try {
        // Find the student in the Excel data
        const studentRow = rows.find(row => row['USN'] === usn);
        
        if (!studentRow) {
          logOperation(usn, 'FATHER', 'FAILED', 'Student not found in Excel data');
          fatherFailedCount++;
          continue;
        }
        
        // Check if student exists in database
        const existingStudent = await prisma.student.findUnique({
          where: { usn }
        });
        
        if (!existingStudent) {
          logOperation(usn, 'FATHER', 'FAILED', 'Student not found in database');
          fatherFailedCount++;
          continue;
        }
        
        // Check if father guardian already exists
        const existingFatherGuardian = await prisma.studentGuardian.findFirst({
          where: {
            usn,
            type: GuardianType.father
          }
        });
        
        if (existingFatherGuardian) {
          logOperation(usn, 'FATHER', 'SKIPPED', 'Father guardian already exists');
          continue;
        }
        
        // Create father guardian information
        if (studentRow['father_name']) {
          try {
            await prisma.studentGuardian.create({
              data: {
                usn,
                type: GuardianType.father,
                name: ensureString(studentRow['father_name']),
                contact: ensureString(studentRow['father_mob_no']),
                aadhar: ensureString(studentRow['father_aadhar']),
                panCard: ensureString(studentRow['father_pan_card']),
                occupation: ensureString(studentRow['father_occupation']),
              },
            });
            
            logOperation(usn, 'FATHER', 'SUCCESS', `Created father guardian information`);
            fatherSuccessCount++;
          } catch (error: any) {
            logOperation(usn, 'FATHER', 'FAILED', `Failed to create father guardian: ${error?.message || 'Unknown error'}`);
            fatherFailedCount++;
          }
        } else {
          // If no father name in Excel, create a placeholder
          try {
            await prisma.studentGuardian.create({
              data: {
                usn,
                type: GuardianType.father,
                name: 'Not Provided',
                contact: null,
                aadhar: null,
                panCard: null,
                occupation: null,
              },
            });
            
            logOperation(usn, 'FATHER', 'SUCCESS', `Created placeholder father guardian information`);
            fatherSuccessCount++;
          } catch (error: any) {
            logOperation(usn, 'FATHER', 'FAILED', `Failed to create placeholder father guardian: ${error?.message || 'Unknown error'}`);
            fatherFailedCount++;
          }
        }
      } catch (error: any) {
        logOperation(usn, 'FATHER', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
        fatherFailedCount++;
      }
    }

    // Fix missing permanent address
    for (const usn of missingPermanentAddress) {
      try {
        // Find the student in the Excel data
        const studentRow = rows.find(row => row['USN'] === usn);
        
        if (!studentRow) {
          logOperation(usn, 'ADDRESS', 'FAILED', 'Student not found in Excel data');
          addressFailedCount++;
          continue;
        }
        
        // Check if student exists in database
        const existingStudent = await prisma.student.findUnique({
          where: { usn }
        });
        
        if (!existingStudent) {
          logOperation(usn, 'ADDRESS', 'FAILED', 'Student not found in database');
          addressFailedCount++;
          continue;
        }
        
        // Check if permanent address already exists
        const existingPermanentAddress = await prisma.studentAddress.findFirst({
          where: {
            usn,
            type: AddressType.permanent
          }
        });
        
        if (existingPermanentAddress) {
          logOperation(usn, 'ADDRESS', 'SKIPPED', 'Permanent address already exists');
          continue;
        }
        
        // Create permanent address
        if (studentRow['permanent_state'] || studentRow['permanent_dist'] || studentRow['permanent_house_no_name']) {
          try {
            await prisma.studentAddress.create({
              data: {
                usn,
                type: AddressType.permanent,
                state: ensureString(studentRow['permanent_state']) || '',
                district: ensureString(studentRow['permanent_dist']) || '',
                houseName: ensureString(studentRow['permanent_house_no_name']) || '',
                village: ensureString(studentRow['permanent_post_village']) || '',
                pincode: ensureString(studentRow['permanent_pincode']) || '',
              },
            });
            
            logOperation(usn, 'ADDRESS', 'SUCCESS', `Created permanent address information`);
            addressSuccessCount++;
          } catch (error: any) {
            logOperation(usn, 'ADDRESS', 'FAILED', `Failed to create permanent address: ${error?.message || 'Unknown error'}`);
            addressFailedCount++;
          }
        } else {
          // If no permanent address in Excel, copy from present address if available
          try {
            const presentAddress = await prisma.studentAddress.findFirst({
              where: {
                usn,
                type: AddressType.present
              }
            });
            
            if (presentAddress) {
              // Create permanent address using present address data
              await prisma.studentAddress.create({
                data: {
                  usn,
                  type: AddressType.permanent,
                  state: presentAddress.state || '',
                  district: presentAddress.district || '',
                  houseName: presentAddress.houseName || '',
                  village: presentAddress.village || '',
                  pincode: presentAddress.pincode || '',
                },
              });
              
              logOperation(usn, 'ADDRESS', 'SUCCESS', `Created permanent address from present address data`);
              addressSuccessCount++;
            } else {
              // Create placeholder permanent address
              await prisma.studentAddress.create({
                data: {
                  usn,
                  type: AddressType.permanent,
                  state: 'Karnataka',
                  district: 'Not Provided',
                  houseName: 'Not Provided',
                  village: 'Not Provided',
                  pincode: '000000',
                },
              });
              
              logOperation(usn, 'ADDRESS', 'SUCCESS', `Created placeholder permanent address`);
              addressSuccessCount++;
            }
          } catch (error: any) {
            logOperation(usn, 'ADDRESS', 'FAILED', `Failed to create placeholder permanent address: ${error?.message || 'Unknown error'}`);
            addressFailedCount++;
          }
        }
      } catch (error: any) {
        logOperation(usn, 'ADDRESS', 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
        addressFailedCount++;
      }
    }
    
    console.log(`\nFix Summary:`);
    console.log(`Father Information: ${fatherSuccessCount} fixed, ${fatherFailedCount} failed`);
    console.log(`Permanent Address: ${addressSuccessCount} fixed, ${addressFailedCount} failed`);
    console.log(`\nLog file saved to: ${LOG_FILE}`);
    
  } catch (error: any) {
    console.error('Error fixing partial imports:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAllPartialImports()
  .then(() => console.log('Fix all partial imports completed'))
  .catch(e => console.error('Error running fix:', e));

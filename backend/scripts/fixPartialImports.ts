import * as XLSX from 'xlsx';
import { PrismaClient, GuardianType } from '@prisma/client';
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
const LOG_FILE = path.join(LOG_DIR, `fix-partial-imports-${timestamp}.csv`);

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

// Log operation to CSV file
function logOperation(usn: string, status: string, details: string) {
  fs.appendFileSync(
    LOG_FILE,
    `${usn},${status},"${details}"\n`
  );
  console.log(`${usn} - ${status}: ${details}`);
}

async function fixPartialImports() {
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
    
    // List of USNs with partial imports to fix
    const partialImports = ['4AL22CS049', '4AL22CS159'];
    console.log(`Fixing ${partialImports.length} partial imports...`);

    let successCount = 0;
    let failedCount = 0;

    for (const usn of partialImports) {
      try {
        // Find the student in the Excel data
        const studentRow = rows.find(row => row['USN'] === usn);
        
        if (!studentRow) {
          logOperation(usn, 'FAILED', 'Student not found in Excel data');
          failedCount++;
          continue;
        }
        
        // Check if student exists in database
        const existingStudent = await prisma.student.findUnique({
          where: { usn }
        });
        
        if (!existingStudent) {
          logOperation(usn, 'FAILED', 'Student not found in database');
          failedCount++;
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
          logOperation(usn, 'SKIPPED', 'Father guardian already exists');
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
            
            logOperation(usn, 'SUCCESS', `Created father guardian information`);
            successCount++;
          } catch (error: any) {
            logOperation(usn, 'FAILED', `Failed to create father guardian: ${error?.message || 'Unknown error'}`);
            failedCount++;
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
            
            logOperation(usn, 'SUCCESS', `Created placeholder father guardian information`);
            successCount++;
          } catch (error: any) {
            logOperation(usn, 'FAILED', `Failed to create placeholder father guardian: ${error?.message || 'Unknown error'}`);
            failedCount++;
          }
        }
      } catch (error: any) {
        logOperation(usn, 'FAILED', `Error: ${error?.message || 'Unknown error'}`);
        failedCount++;
      }
    }
    
    console.log(`\nFix Summary:`);
    console.log(`Total Partial Imports: ${partialImports.length}`);
    console.log(`Successfully Fixed: ${successCount}`);
    console.log(`Failed to Fix: ${failedCount}`);
    console.log(`\nLog file saved to: ${LOG_FILE}`);
    
  } catch (error: any) {
    console.error('Error fixing partial imports:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixPartialImports()
  .then(() => console.log('Fix partial imports completed'))
  .catch(e => console.error('Error running fix:', e));

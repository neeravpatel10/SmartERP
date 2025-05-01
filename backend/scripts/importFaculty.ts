import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt'; // Re-enabled for password hashing

const prisma = new PrismaClient();
const saltRounds = 10; // Re-enabled for bcrypt hashing

// --- Add Type Definition for parsed SQL record ---
interface FacultySqlRecord {
    faculty_id: string | null;
    faculty_name: string | null;
    faculty_desg: string | null;
    faculty_dept: string | null;
    faculty_qulfy: string | null;
    faculty_yoj: string | null;
    faculty_dob: string | null;
    faculty_email: string | null;
    faculty_contact: string | null;
    faculty_parmenent_address: string | null;
    faculty_present_address: string | null;
    faculty_teaching_exp: string | null;
    faculty_industry_exp: string | null;
    faculty_aicte_id: string | null;
    inactive: string | null; // Keep as string initially from SQL parse
}

// Function to parse faculty name and extract prefix
const parseFacultyName = (fullName: string | null): { prefix: string | null, firstName: string, lastName: string } => {
    if (!fullName) {
        return { prefix: null, firstName: 'Unknown', lastName: 'Faculty' };
    }
    const nameParts = fullName.trim().split(' ');
    let prefix: string | null = null;
    const prefixes = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.']; // Add more if needed

    if (prefixes.includes(nameParts[0])) {
        prefix = nameParts.shift() || null; // Remove and store prefix
    }
    
    const firstName = nameParts.shift() || 'Unknown'; // First remaining part
    const lastName = nameParts.join(' '); // Rest of the parts

    return { prefix, firstName, lastName: lastName || ' ' }; // Ensure lastName is not empty
};

// Function to safely parse SQL values (handles NULL and escapes)
const parseSqlValue = (value: string): string | null => {
    value = value.trim();
    if (value === 'NULL' || value === "''" || value === '""') {
        return null;
    }
    // Remove surrounding single quotes if present
    if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
    }
    // Basic unescaping for common SQL escapes like \'
    return value.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
};

// Function to find the SQL file in multiple potential locations
function findSqlFile(filename: string): string | null {
    const possiblePaths = [
        path.join(__dirname, '..', '..', 'documents', filename),
        path.join(__dirname, '..', '..', filename),
        path.join(__dirname, '..', filename),
        path.join(__dirname, filename),
        path.join(process.cwd(), 'documents', filename),
        path.join(process.cwd(), filename),
    ];

    for (const filePath of possiblePaths) {
        console.log(`Checking for SQL file at: ${filePath}`);
        if (fs.existsSync(filePath)) {
            console.log(`Found SQL file at: ${filePath}`);
            return filePath;
        }
    }
    
    return null;
}

async function importData() {
    console.log('Starting faculty data import (Update Mode)...');

    try {
        // --- 1. Clear Existing Faculty-Specific Data (Not Users) ---
        console.log('Clearing existing Faculty and related mapping data...');
        await prisma.facultySubjectMapping.deleteMany({}); 
        await prisma.department.updateMany({ where: { hodId: { not: null } }, data: { hodId: null } }); // Clear HOD refs before deleting faculty
        await prisma.faculty.deleteMany({});
        console.log('Existing Faculty data cleared.');

        // --- 2. Fetch Departments ---
        console.log('Fetching departments...');
        const departments = await prisma.department.findMany({ select: { id: true, name: true } });
        const departmentMap = new Map<string, number>();
        departments.forEach(dept => {
            departmentMap.set(dept.name.toLowerCase(), dept.id); // Use lowercase for robust matching
        });
        console.log(`Fetched ${departmentMap.size} departments.`);

        // --- 3. Read and Parse SQL File ---
        const sqlFilePath = findSqlFile('faculty_details.sql');
        if (!sqlFilePath) {
            throw new Error('SQL file not found in any of the expected locations. Please place faculty_details.sql in the documents directory or project root.');
        }
        
        console.log(`Reading SQL file from: ${sqlFilePath}`);
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

        const insertRegex = /INSERT INTO `faculty_details`.*?VALUES\s*\((.*?)\);/gs;
        let match;
        const facultyRecords: FacultySqlRecord[] = [];

        console.log('Parsing INSERT statements...');
        while ((match = insertRegex.exec(sqlContent)) !== null) {
            const valuesString = match[1];
            const values: (string | null)[] = [];
            let currentVal = '';
            let inQuotes = false;
            for (let i = 0; i < valuesString.length; i++) {
                const char = valuesString[i];
                if (char === "'" && (i === 0 || valuesString[i-1] !== '\\')) {
                    inQuotes = !inQuotes;
                }
                if (char === ',' && !inQuotes) {
                    values.push(parseSqlValue(currentVal));
                    currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            values.push(parseSqlValue(currentVal));

            if (values.length >= 30) { 
                 facultyRecords.push({
                    faculty_id: values[0],
                    faculty_name: values[1],
                    faculty_desg: values[2],
                    faculty_dept: values[3],
                    faculty_qulfy: values[4],
                    faculty_yoj: values[5],
                    faculty_dob: values[6],
                    faculty_email: values[7],
                    faculty_contact: values[8],
                    faculty_parmenent_address: values[9],
                    faculty_present_address: values[10],
                    faculty_teaching_exp: values[11],
                    faculty_industry_exp: values[12],
                    faculty_aicte_id: values[13],
                    inactive: values[29], // Keep as string | null 
                 });
            } else {
                 console.warn(`Skipping row with insufficient columns: ${values.join(', ')}`);
            }
        }
        console.log(`Parsed ${facultyRecords.length} faculty records from SQL.`);

        // --- 4. Process and Insert/Link Records ---
        let createdCount = 0;
        let skippedCount = 0;
        let updatedUserCount = 0;
        let createdUserCount = 0;

        for (const record of facultyRecords) {
            if (!record.faculty_id || typeof record.faculty_id !== 'string') {
                 console.warn(`Skipping record due to missing or invalid Faculty ID: ${record.faculty_id}`);
                 skippedCount++;
                 continue;
            }
            if (!record.faculty_email || typeof record.faculty_email !== 'string') {
                console.warn(`Skipping record due to missing or invalid Email for Faculty ID ${record.faculty_id}`);
                skippedCount++;
                continue;
            }
            
            const facultyId = record.faculty_id;
            const facultyEmail = record.faculty_email;

            try {
                 const existingFaculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
                 if (existingFaculty) {
                     console.log(`Faculty with ID ${facultyId} already exists. Skipping.`);
                     skippedCount++;
                     continue;
                 }

                // Find existing user by email
                let existingUser = await prisma.user.findUnique({ where: { email: facultyEmail } });

                // If user doesn't exist, we'll create one
                if (!existingUser) {
                    console.log(`User with email ${facultyEmail} not found. Creating new user for faculty ID ${facultyId}.`);
                    
                    // Generate default password
                    const defaultPassword = `${facultyId}@aiet`;
                    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);
                    
                    // Create the user
                    existingUser = await prisma.user.create({
                        data: {
                            username: facultyId, // Use faculty ID as username
                            email: facultyEmail,
                            passwordHash: passwordHash,
                            loginType: 2, // Faculty type
                            firstLogin: true,
                            isActive: true,
                        }
                    });
                    
                    createdUserCount++;
                    console.log(`Created new user with ID ${existingUser.id} and username ${existingUser.username}`);
                } else {
                    // Update existing user's loginType to be Faculty
                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: { loginType: 2 }
                    });
                    updatedUserCount++;
                }

                const { prefix, firstName, lastName } = parseFacultyName(record.faculty_name);
                const departmentNameLower = record.faculty_dept?.toLowerCase();
                const departmentId = departmentNameLower ? departmentMap.get(departmentNameLower) : null;
                
                const inactiveValue = record.inactive ? parseInt(record.inactive, 10) : 0;
                const isActive = isNaN(inactiveValue) ? true : inactiveValue === 0;

                if (departmentNameLower && !departmentId) {
                    console.warn(`Department '${record.faculty_dept}' not found for faculty ID ${facultyId}. Setting departmentId to null for Faculty record.`);
                }

                // Update department if we found one
                if (departmentId !== null && existingUser) {
                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            departmentId: departmentId,
                            isActive: isActive,
                        }
                    });
                }

                // Create Faculty record with safe handling of nullable fields
                await prisma.faculty.create({
                    data: {
                        id: facultyId,
                        prefix: prefix,
                        firstName: firstName || '', 
                        lastName: lastName || '', 
                        email: facultyEmail, 
                        phone: record.faculty_contact || '',
                        designation: record.faculty_desg || '',
                        dateOfBirth: record.faculty_dob,
                        qualification: record.faculty_qulfy,
                        yearOfJoining: record.faculty_yoj,
                        permanentAddress: record.faculty_parmenent_address,
                        presentAddress: record.faculty_present_address,
                        teachingExperience: record.faculty_teaching_exp,
                        industryExperience: record.faculty_industry_exp,
                        aicteId: record.faculty_aicte_id,
                        isActive: isActive,
                        departmentId: departmentId, 
                        userId: existingUser.id, 
                    },
                });
                createdCount++;
                console.log(`Created faculty for ID: ${facultyId}`);

            } catch (error: any) {
                console.error(`Failed to import record for faculty ID ${facultyId}:`, error.message);
                skippedCount++;
            }
        }

        console.log(`\nImport finished.`);
        console.log(`Successfully created/linked: ${createdCount} faculty records.`);
        console.log(`Updated: ${updatedUserCount} existing user records.`);
        console.log(`Created: ${createdUserCount} new user records.`);
        console.log(`Skipped (duplicates/errors/user not found): ${skippedCount}`);

    } catch (error) {
        console.error('An error occurred during the import process:', error);
    } finally {
        await prisma.$disconnect();
        console.log('Database connection closed.');
    }
}

importData(); 
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const saltRounds = 10;

// --- User record type definition ---
interface UserRecord {
    id: string | null;
    username: string | null;
    email: string | null;
    passwordHash: string | null;
    loginType: number;
    departmentName: string | null;
}

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

// Function to map role string to loginType number
function mapRoleToLoginType(role: string | null): number {
    if (!role) return 2; // Default to Faculty (2)
    
    const roleLower = role.toLowerCase();
    if (roleLower.includes('super') || roleLower.includes('admin')) return 1; // Admin = 1
    if (roleLower.includes('student')) return -1; // Student = -1
    if (roleLower.includes('faculty')) return 2; // Faculty = 2
    if (roleLower.includes('hod') || roleLower.includes('dept')) return 3; // Department Admin = 3
    
    return 2; // Default to Faculty (2)
}

async function importUsers() {
    console.log('Starting users import...');

    try {
        // --- 1. Fetch Departments ---
        console.log('Fetching departments...');
        const departments = await prisma.department.findMany({ select: { id: true, name: true, code: true } });
        const departmentMapByName = new Map<string, number>();
        const departmentMapByCode = new Map<string, number>();
        
        departments.forEach(dept => {
            departmentMapByName.set(dept.name.toLowerCase(), dept.id);
            departmentMapByCode.set(dept.code.toLowerCase(), dept.id);
        });
        console.log(`Fetched ${departments.length} departments.`);

        // --- 2. Read and Parse SQL File ---
        const sqlFilePath = findSqlFile('users.sql');
        if (!sqlFilePath) {
            throw new Error('SQL file not found in any of the expected locations. Please place users.sql in the documents directory or project root.');
        }
        
        console.log(`Reading SQL file from: ${sqlFilePath}`);
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

        // Use a regex that captures the whole INSERT statement
        // For MySQL dumps that might have multi-line inserts
        const insertRegex = /INSERT INTO [`']?users[`']?\s*\([^)]+\)\s*VALUES\s*\(([^)]+)\)/g;
        let match;
        const userRecords: UserRecord[] = [];

        console.log('Parsing INSERT statements...');
        let matchCount = 0;
        
        // First try regular MySQL INSERT format
        while ((match = insertRegex.exec(sqlContent)) !== null) {
            matchCount++;
            if (matchCount % 100 === 0) {
                console.log(`Processed ${matchCount} INSERT statements...`);
            }
            
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
            
            if (currentVal) {
                values.push(parseSqlValue(currentVal));
            }
            
            // Try to parse the values
            // For users table: Determine column indices based on CREATE TABLE statement
            if (values.length >= 3) { // At minimum we need username, email, password
                userRecords.push({
                    id: values[0],
                    username: values[1] || values[0], // Use ID as username if not defined
                    email: values[2],
                    passwordHash: values[3] || 'password123', // Default password if none
                    loginType: values[4] ? parseInt(values[4], 10) || 2 : 2, // Default to Faculty (2)
                    departmentName: values[5]
                });
            }
        }

        // If no regular INSERT statements found, try alternative format with CREATE TABLE + INSERT
        if (matchCount === 0) {
            console.log('No standard INSERT statements found. Trying to extract CREATE TABLE structure...');
            
            // Extract column names from CREATE TABLE statement
            const createTableMatch = /CREATE TABLE [`']?users[`']?\s*\(([\s\S]+?)\)/i.exec(sqlContent);
            if (createTableMatch) {
                const tableDefinition = createTableMatch[1];
                const columnRegex = /[`']?(\w+)[`']?\s+\w+/g;
                const columns: string[] = [];
                let colMatch;
                
                while ((colMatch = columnRegex.exec(tableDefinition)) !== null) {
                    columns.push(colMatch[1]);
                }
                
                console.log(`Found columns: ${columns.join(', ')}`);
                
                // Now try to find INSERT statements
                const insertRegex2 = /INSERT INTO [`']?users[`']?\s*VALUES\s*\(([^)]+)\)/g;
                while ((match = insertRegex2.exec(sqlContent)) !== null) {
                    matchCount++;
                    if (matchCount % 100 === 0) {
                        console.log(`Processed ${matchCount} INSERT statements...`);
                    }
                    
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
                    
                    if (currentVal) {
                        values.push(parseSqlValue(currentVal));
                    }
                    
                    // Map values to column names
                    const record: Record<string, any> = {};
                    for (let i = 0; i < Math.min(columns.length, values.length); i++) {
                        record[columns[i]] = values[i];
                    }
                    
                    // Process the record into our expected format
                    if (record.username || record.usn || record.id) {
                        userRecords.push({
                            id: record.id || record.usn,
                            username: record.username || record.usn || record.id,
                            email: record.email || `${record.username || record.usn || record.id}@example.com`,
                            passwordHash: record.password || 'password123',
                            loginType: record.role ? 
                                mapRoleToLoginType(record.role) : 
                                (record.loginType ? parseInt(record.loginType, 10) || 2 : 2),
                            departmentName: record.department
                        });
                    }
                }
            }
        }

        console.log(`Parsed ${userRecords.length} user records from SQL.`);

        // --- 3. Process and Insert/Update Records ---
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const record of userRecords) {
            try {
                // Basic validation
                if (!record.email || !record.username) {
                    console.warn(`Skipping user record: Missing email or username.`);
                    skippedCount++;
                    continue;
                }
                
                // Check if user already exists by email or username
                const existingUser = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: record.email },
                            { username: record.username }
                        ]
                    }
                });
                
                // Find department ID if provided
                let departmentId: number | undefined = undefined;
                if (record.departmentName) {
                    const deptLower = record.departmentName.toLowerCase();
                    const deptId = departmentMapByName.get(deptLower) || departmentMapByCode.get(deptLower);
                    
                    if (deptId) {
                        departmentId = deptId;
                    } else {
                        console.warn(`Department '${record.departmentName}' not found for user ${record.username}.`);
                    }
                }
                
                // Hash password if not hashed (simple check)
                let passwordHash = record.passwordHash;
                if (passwordHash && passwordHash.length < 20) {
                    // This doesn't look like a bcrypt hash - hash it
                    passwordHash = await bcrypt.hash(passwordHash, saltRounds);
                }
                
                // Update or create the user
                if (existingUser) {
                    // Update existing user
                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            loginType: record.loginType,
                            departmentId,
                            // Only update password if provided
                            ...(passwordHash ? { passwordHash } : {})
                        }
                    });
                    console.log(`Updated user: ${record.username}`);
                    updatedCount++;
                } else {
                    // Create new user
                    if (passwordHash) {
                        await prisma.user.create({
                            data: {
                                username: record.username,
                                email: record.email,
                                passwordHash,
                                loginType: record.loginType,
                                departmentId,
                                firstLogin: false // Since password is preserved
                            }
                        });
                        console.log(`Created user: ${record.username}`);
                        createdCount++;
                    } else {
                        console.warn(`Skipping user ${record.username}: Missing password hash`);
                        skippedCount++;
                    }
                }
            } catch (error: any) {
                console.error(`Failed to import user ${record.username}:`, error.message);
                skippedCount++;
            }
        }

        console.log(`\nUsers import finished.`);
        console.log(`Created: ${createdCount} users`);
        console.log(`Updated: ${updatedCount} users`);
        console.log(`Skipped: ${skippedCount} users`);

    } catch (error) {
        console.error('An error occurred during the users import process:', error);
    } finally {
        await prisma.$disconnect();
        console.log('Database connection closed.');
    }
}

importUsers(); 



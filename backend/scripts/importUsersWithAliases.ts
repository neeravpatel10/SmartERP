import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const saltRounds = 10;

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
    if (!role) return 3; // Default to Faculty Admin (3)
    
    const roleLower = role.toLowerCase();
    if (roleLower.includes('super') || roleLower.includes('admin')) return 1; // SuperAdmin
    if (roleLower.includes('faculty')) return 2; // Faculty
    if (roleLower.includes('hod') || roleLower.includes('dept')) return 3; // Department Admin
    if (roleLower.includes('student')) return -1; // Student
    
    return 2; // Default to Faculty (2)
}

async function importUsers() {
    console.log('Starting users import with department alias support...');

    try {
        // --- 1. Fetch Departments ---
        console.log('Fetching departments...');
        const departments = await prisma.department.findMany({ select: { id: true, name: true, code: true } });
        
        // Create standard department maps
        const departmentMapByName = new Map<string, number>();
        const departmentMapByCode = new Map<string, number>();
        
        // Fill standard maps
        departments.forEach(dept => {
            departmentMapByName.set(dept.name.toLowerCase(), dept.id);
            departmentMapByCode.set(dept.code.toLowerCase(), dept.id);
        });
        
        // Create department alias map for better matching
        const departmentAliasMap = new Map([
            // Computer Science Engineering (CSE)
            ["computer science engineering", "CSE"],
            ["cse", "CSE"],
            ["computer science and engineering", "CSE"],
            ["computer science", "CSE"],
            
            // Information Science Engineering (ISE)
            ["information science engineering", "ISE"],
            ["ise", "ISE"],
            ["information science and engineering", "ISE"],
            ["information science", "ISE"],
            
            // Electronics and Communication Engineering (ECE)
            ["electronics and communication engineering", "ECE"],
            ["ece", "ECE"],
            ["electronics & communication", "ECE"],
            ["e&c", "ECE"],
            ["ec", "ECE"],
            
            // Electrical and Electronics Engineering (EEE)
            ["electrical and electronics engineering", "EEE"],
            ["eee", "EEE"],
            ["electrical & electronics", "EEE"],
            ["e&e", "EEE"],
            ["ee", "EEE"],
            
            // Mechanical Engineering (ME)
            ["mechanical engineering", "ME"],
            ["me", "ME"],
            ["mechanical", "ME"],
            ["mech", "ME"],
            
            // Civil Engineering (CV)
            ["civil engineering", "CV"],
            ["cv", "CV"],
            ["civil", "CV"],
            ["ce", "CV"],
            
            // Aerospace Engineering (AE)
            ["aerospace engineering", "AE"],
            ["ae", "AE"],
            ["aerospace", "AE"],
            ["aeronautical engineering", "AE"],
            
            // Chemical Engineering (CHE)
            ["chemical engineering", "CHE"],
            ["che", "CHE"],
            ["chemical", "CHE"],
            ["chem e", "CHE"],
            
            // Agricultural Engineering (AGR)
            ["agricultural engineering", "AGR"],
            ["agr", "AGR"],
            ["agriculture", "AGR"],
            ["agriculture engineering", "AGR"],
            ["agri", "AGR"],
            
            // Mathematics (MATH)
            ["mathematics", "MATH"],
            ["math", "MATH"],
            ["maths", "MATH"],
            ["mathematics department", "MATH"],
            
            // Physics (PHY)
            ["physics", "PHY"],
            ["phy", "PHY"],
            ["physics department", "PHY"],
            
            // Chemistry (CHEM)
            ["chemistry", "CHEM"],
            ["chem", "CHEM"],
            ["chemistry department", "CHEM"],
            
            // Management Studies (MGMT)
            ["management studies", "MGMT"],
            ["mgmt", "MGMT"],
            ["mba", "MGMT"],
            ["management", "MGMT"],
            ["business administration", "MGMT"],
            
            // Humanities (HUM)
            ["humanities", "HUM"],
            ["hum", "HUM"],
            ["social sciences", "HUM"],
            ["arts", "HUM"]
        ]);
        
        console.log(`Fetched ${departments.length} departments and created alias map with ${departmentAliasMap.size} entries.`);

        // Helper function to find department ID using all maps
        function findDepartmentId(departmentName: string | null): number | undefined {
            if (!departmentName) return undefined;
            const deptLower = departmentName.toLowerCase();
            
            // Direct match by name or code
            const directMatchById = departmentMapByName.get(deptLower);
            if (directMatchById !== undefined) return directMatchById;
            
            const directMatchByCode = departmentMapByCode.get(deptLower);
            if (directMatchByCode !== undefined) return directMatchByCode;
            
            // Try to find by alias
            const aliasCode = departmentAliasMap.get(deptLower);
            if (aliasCode) {
                const matchByAlias = departmentMapByCode.get(aliasCode.toLowerCase());
                if (matchByAlias !== undefined) return matchByAlias;
            }
            
            return undefined;
        }

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
        const userRecords: any[] = [];

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
            // This is a simplification - adjust to your actual data format
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
                    const record: any = {};
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
                
                // Find department ID using improved matching with aliases
                let departmentId = undefined;
                if (record.departmentName) {
                    departmentId = findDepartmentId(record.departmentName);
                    
                    if (departmentId === undefined) {
                        console.warn(`Department '${record.departmentName}' not found for user ${record.username}, even with alias matching.`);
                    } else {
                        console.log(`Matched department '${record.departmentName}' to ID ${departmentId} for user ${record.username}`);
                    }
                }

                // Hash password if not hashed (simple check)
                let passwordHash = record.passwordHash;
                if (passwordHash && passwordHash.length < 20) {
                    // This doesn't look like a bcrypt hash - hash it
                    passwordHash = await bcrypt.hash(passwordHash, saltRounds);
                }

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
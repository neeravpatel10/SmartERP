/**
 * Direct SQL File Import Script
 * Extracts user data from users.sql file and imports it directly into Prisma database
 * This avoids the need for a direct connection to the legacy MySQL database
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../../.env' });

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration
const SQL_FILE_PATH = path.resolve(__dirname, '../../../documents/users.sql');
const BATCH_SIZE = 100;

/**
 * Create an audit log entry for the migration
 */
async function createAuditLog(userId, action, oldData, newData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: 1, // Assuming 1 is the system admin ID performing the migration
        action: action || 'USER_MIGRATION',
        entityType: 'User',
        entityId: userId.toString(),
        oldValue: JSON.stringify(oldData),
        newValue: JSON.stringify(newData),
        ipAddress: '127.0.0.1',
        userAgent: 'SQL Import Script'
      }
    });
  } catch (error) {
    console.error(`Failed to create audit log for user ${userId}:`, error);
  }
}

/**
 * Maps legacy user role to new role ID
 * For ERP system:
 * 1 = Super Admin
 * 2 = Faculty
 * 3 = Department Admin (HOD)
 * -1 = Student
 */
function mapRole(legacyRole) {
  console.log(`Mapping role: ${legacyRole} (type: ${typeof legacyRole})`);
  
  // Special handling for roles that are already numbers
  if (typeof legacyRole === 'number' || !isNaN(Number(legacyRole))) {
    const numericRole = Number(legacyRole);
    console.log(`Preserving numeric role: ${numericRole}`);
    return numericRole; // Preserve the original role as is
  }
  
  // For string roles that aren't numeric, map to appropriate numbers
  const roleMap = {
    'admin': 1,    // Super Admin
    'super': 1,    // Super Admin
    'hod': 3,      // Department Admin
    'faculty': 2   // Faculty
  };
  
  // Convert to string and lowercase for lookup
  const roleKey = legacyRole?.toString().toLowerCase();
  console.log(`Role key for lookup: ${roleKey}`);
  
  // Get the mapped role, default to student (-1) if unknown
  const mappedRole = roleMap[roleKey] !== undefined ? roleMap[roleKey] : -1;
  console.log(`Mapped role ${roleKey} to ${mappedRole}`);
  
  return mappedRole;
}

/**
 * Builds department mapping
 */
async function buildDepartmentMapping() {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true, code: true }
    });
    
    // Create a mapping of department names/codes to IDs
    const mapping = {};
    departments.forEach(dept => {
      // Convert to lowercase for case-insensitive matching
      mapping[dept.name.toLowerCase()] = dept.id;
      if (dept.code) mapping[dept.code.toLowerCase()] = dept.id;
      
      // Add common abbreviations and special mappings
      if (dept.name.includes('Computer Science & Engineering') && !dept.name.includes('(')) {
        mapping['cse'] = dept.id;
        mapping['computer science'] = dept.id;
        mapping['computer science and engineering'] = dept.id;
        mapping['computer science & engineering'] = dept.id;
        mapping['computer science and engineering-parallel'] = dept.id;
      }
      
      if (dept.name.includes('(IOT & Cyber Security)')) {
        mapping['csec'] = dept.id;
        mapping['iot'] = dept.id;
        mapping['cyber security'] = dept.id;
        mapping['iot and cyber security'] = dept.id;
        mapping['iot & cyber security'] = dept.id;
      }
      
      if (dept.name.includes('(Data Science)')) {
        mapping['csds'] = dept.id;
        mapping['data science'] = dept.id;
        mapping['computer science data science'] = dept.id;
      }
      
      if (dept.name.includes('Computer Science & Design')) {
        mapping['csd'] = dept.id;
        mapping['design'] = dept.id;
        mapping['computer design'] = dept.id;
      }
      
      if (dept.name.includes('Information Science')) {
        mapping['ise'] = dept.id;
        mapping['information science'] = dept.id;
        mapping['information science and engineering'] = dept.id;
        mapping['information science & engineering'] = dept.id;
      }
      
      if (dept.name.includes('Electronics & Communication')) {
        mapping['ece'] = dept.id;
        mapping['electronics'] = dept.id;
        mapping['electronics and communication'] = dept.id;
        mapping['electronics & communication'] = dept.id;
        mapping['electronics and communication engineering'] = dept.id;
        mapping['electronics & communication engineering'] = dept.id;
      }
      
      if (dept.name.includes('Mechanical')) {
        mapping['me'] = dept.id;
        mapping['mechanical'] = dept.id;
        mapping['mechanical engineering'] = dept.id;
      }
      
      if (dept.name.includes('Civil')) {
        mapping['ce'] = dept.id;
        mapping['civil'] = dept.id;
        mapping['civil engineering'] = dept.id;
      }
      
      if (dept.name.includes('Artificial Intelligence')) {
        mapping['ai'] = dept.id;
        mapping['aiml'] = dept.id;
        mapping['artificial intelligence'] = dept.id;
        mapping['machine learning'] = dept.id;
        mapping['artificial intelligence and machine learning'] = dept.id;
        mapping['artificial intelligence & machine learning'] = dept.id;
      }
      
      if (dept.name.includes('Agriculture')) {
        mapping['ag'] = dept.id;
        mapping['agri'] = dept.id;
        mapping['ae'] = dept.id;
        mapping['agriculture'] = dept.id;
        mapping['agricultural'] = dept.id;
        mapping['agriculture engineering'] = dept.id;
        mapping['agricultural engineering'] = dept.id;
      }
      
      if (dept.name.includes('Basic Sciences')) {
        mapping['bsh'] = dept.id;
        mapping['bs&h'] = dept.id;
        mapping['basic sciences'] = dept.id;
        mapping['humanities'] = dept.id;
        mapping['mathematics'] = dept.id;
        mapping['physics'] = dept.id;
        mapping['chemistry'] = dept.id;
        mapping['maths'] = dept.id;
        mapping['math'] = dept.id;
        mapping['phy'] = dept.id;
        mapping['chem'] = dept.id;
      }
    });
    
    // Special cases for departments that might have different names in the legacy system
    mapping['system analyst'] = mapping['cse'] || mapping['ise']; // Map System Analyst to CSE or ISE
    mapping['none'] = null; // Explicitly map "NONE" to null
    mapping['null'] = null; // Explicitly map "NULL" to null
    
    return mapping;
  } catch (error) {
    console.error('Error building department mapping:', error);
    throw error;
  }
}

/**
 * Extracts user data from the SQL file
 */
function extractUsersFromSql(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to match INSERT INTO users statements
    const insertPattern = /INSERT INTO `users`[^(]*\(([^)]*)\) VALUES\s*([^;]*);/g;
    const valuePattern = /\(([^)]*)\)/g;
    
    let insertMatches = [...sqlContent.matchAll(insertPattern)];
    if (insertMatches.length === 0) {
      console.error('No INSERT statements found in the SQL file');
      return [];
    }
    
    // Get column names from the first match
    const columns = insertMatches[0][1].split(',').map(col => 
      col.trim().replace(/`/g, '')
    );
    
    // Extract all user values
    const users = [];
    for (const match of insertMatches) {
      const valueMatches = [...match[2].matchAll(valuePattern)];
      
      for (const valueMatch of valueMatches) {
        const values = valueMatch[1].split(',').map(val => 
          val.trim().replace(/^'|'$/g, '').replace(/''/g, "'")
        );
        
        // Create user object with column names as keys
        const user = {};
        columns.forEach((col, index) => {
          // Handle special case for quotes - if the value has escaped quotes
          let value = values[index] || null;
          if (value && value.startsWith('$2y$10$')) {
            // Don't process bcrypt hashes
            user[col] = value;
          } else if (value) {
            // Remove quotes for everything else
            user[col] = value.replace(/^'|'$/g, '');
          }
        });
        
        users.push(user);
      }
    }
    
    console.log(`Extracted ${users.length} users from SQL file`);
    return users;
  } catch (error) {
    console.error('Error extracting users from SQL file:', error);
    throw error;
  }
}

/**
 * Main import function
 */
async function importUsers() {
  try {
    console.log('Starting user import from SQL file...');
    
    // Check if the SQL file exists
    if (!fs.existsSync(SQL_FILE_PATH)) {
      console.error(`SQL file not found: ${SQL_FILE_PATH}`);
      return;
    }
    
    // Get department mapping
    const departmentMapping = await buildDepartmentMapping();
    console.log('Built department mapping');
    
    // Extract users from SQL file
    const legacyUsers = extractUsersFromSql(SQL_FILE_PATH);
    console.log(`Found ${legacyUsers.length} users to import`);
    
    // Process users in batches
    let migratedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < legacyUsers.length; i += BATCH_SIZE) {
      const batch = legacyUsers.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} (${i + 1} to ${Math.min(i + BATCH_SIZE, legacyUsers.length)})`);
      
      for (const legacyUser of batch) {
        try {
          // Create email - use username as is, no modification
          let email;
          if (legacyUser.email) {
            email = legacyUser.email;
          } else {
            // Don't add domain - just use username as is
            email = legacyUser.username;
          }
          
          // Check if user already exists
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email },
                { username: legacyUser.username }
              ]
            }
          });
          
          if (existingUser) {
            console.log(`User ${legacyUser.username} already exists, skipping`);
            skippedCount++;
            continue;
          }
          
          // Map department
          let departmentId = null;
          if (legacyUser.dept) {
            const deptKey = legacyUser.dept.toLowerCase();
            departmentId = departmentMapping[deptKey] || null;
            
            if (!departmentId) {
              console.warn(`Unknown department "${legacyUser.dept}" for user ${legacyUser.username}`);
            }
          }
          
          // Prepare new user data
          const newUserData = {
            username: legacyUser.username,
            email: email,
            passwordHash: legacyUser.password,
            loginType: mapRole(legacyUser.identity),
            departmentId: departmentId,
            isActive: true,
            firstLogin: false,
            createdAt: legacyUser.created_at ? new Date(legacyUser.created_at) : new Date(),
            updatedAt: new Date()
          };
          
          // Use a transaction to ensure data integrity
          await prisma.$transaction(async (tx) => {
            // Create the user
            const createdUser = await tx.user.create({
              data: newUserData
            });
            
            // Create audit log
            await createAuditLog(createdUser.id, 'USER_IMPORTED', legacyUser, newUserData);
            
            console.log(`Imported user: ${legacyUser.username}`);
            migratedCount++;
          });
        } catch (error) {
          console.error(`Error importing user ${legacyUser.username}:`, error);
          errorCount++;
        }
      }
      
      // Log progress
      const progress = Math.min(i + BATCH_SIZE, legacyUsers.length);
      console.log(`Progress: ${progress}/${legacyUsers.length} (${((progress / legacyUsers.length) * 100).toFixed(2)}%)`);
    }
    
    console.log('\nImport Summary:');
    console.log(`Total users in SQL file: ${legacyUsers.length}`);
    console.log(`Successfully imported: ${migratedCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Success rate: ${((migratedCount / (legacyUsers.length - skippedCount)) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Run the import
importUsers()
  .then(() => console.log('Import script completed'))
  .catch(err => console.error('Fatal error in import script:', err)); 
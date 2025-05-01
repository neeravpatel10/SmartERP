/**
 * User Migration Script
 * Migrates users from legacy MySQL database to new Prisma-based database
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

// Constants
const BATCH_SIZE = 50; // Process users in batches to manage memory usage

// Initialize Prisma client
const prisma = new PrismaClient();

// Configure source database connection
const sourceDbConfig = {
  host: process.env.SOURCE_DB_HOST,
  user: process.env.SOURCE_DB_USER,
  password: process.env.SOURCE_DB_PASSWORD,
  database: process.env.SOURCE_DB_NAME,
};

/**
 * Maps legacy department names to new department IDs
 * This needs to be updated based on your actual department mapping
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
      
      // Add common abbreviations
      if (dept.name.includes('Computer Science')) mapping['cse'] = dept.id;
      if (dept.name.includes('Information Science')) mapping['ise'] = dept.id;
      if (dept.name.includes('Electronic')) mapping['ece'] = dept.id;
      if (dept.name.includes('Mechanical')) mapping['me'] = dept.id;
      if (dept.name.includes('Civil')) mapping['civil'] = dept.id;
    });
    
    return mapping;
  } catch (error) {
    console.error('Error building department mapping:', error);
    throw error;
  }
}

/**
 * Create an audit log entry for the migration
 */
async function createAuditLog(userId, oldData, newData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: 1, // Assuming 1 is the system admin ID performing the migration
        action: 'USER_MIGRATION',
        entityType: 'User',
        entityId: userId.toString(),
        oldValue: JSON.stringify(oldData),
        newValue: JSON.stringify(newData),
        ipAddress: '127.0.0.1',
        userAgent: 'Migration Script'
      }
    });
  } catch (error) {
    console.error(`Failed to create audit log for user ${userId}:`, error);
  }
}

/**
 * Maps legacy user role to new role ID
 */
function mapRole(legacyRole) {
  const roleMap = {
    'admin': 1,       // Super Admin
    'super': 1,       // Super Admin
    'hod': 3,         // Department Admin
    'faculty': 2,     // Faculty
    'student': 4      // Student
  };
  
  // Default to student if unknown role
  return roleMap[legacyRole?.toLowerCase()] || 4;
}

/**
 * Main migration function
 */
async function migrateUsers() {
  let sourceDb = null;
  
  try {
    console.log('Starting user migration...');
    
    // Connect to source database
    sourceDb = await mysql.createConnection(sourceDbConfig);
    console.log('Connected to legacy database');
    
    // Get department mapping
    const departmentMapping = await buildDepartmentMapping();
    console.log('Built department mapping');
    
    // Get total count for progress tracking
    const [countResult] = await sourceDb.execute('SELECT COUNT(*) as total FROM users');
    const totalUsers = countResult[0].total;
    console.log(`Found ${totalUsers} users to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    let offset = 0;
    
    // Process in batches
    while (offset < totalUsers) {
      // Get batch of users from legacy database
      const [users] = await sourceDb.execute(
        'SELECT * FROM users LIMIT ? OFFSET ?',
        [BATCH_SIZE, offset]
      );
      
      console.log(`Processing batch of ${users.length} users (${offset + 1} to ${offset + users.length})`);
      
      // Process each user in the batch
      for (const legacyUser of users) {
        try {
          // Get existing user if already migrated
          const existingUser = await prisma.user.findUnique({ 
            where: { email: legacyUser.email }
          });
          
          if (existingUser) {
            console.log(`User ${legacyUser.email} already exists, skipping`);
            migratedCount++;
            continue;
          }
          
          // Map department
          let departmentId = null;
          if (legacyUser.department) {
            const deptKey = legacyUser.department.toLowerCase();
            departmentId = departmentMapping[deptKey] || null;
            
            if (!departmentId) {
              console.warn(`Unknown department "${legacyUser.department}" for user ${legacyUser.email}`);
            }
          }
          
          // Prepare new user data
          const newUserData = {
            name: legacyUser.name || 'Unknown Name',
            email: legacyUser.email,
            passwordHash: legacyUser.password_hash || null, // Assuming compatible hash format
            role: mapRole(legacyUser.role),
            departmentId: departmentId,
            usn: legacyUser.usn || null,
            isActive: legacyUser.is_active === 1 || legacyUser.is_active === true,
            phoneNumber: legacyUser.phone || null,
            lastLogin: legacyUser.last_login ? new Date(legacyUser.last_login) : null,
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
            await createAuditLog(createdUser.id, legacyUser, newUserData);
            
            console.log(`Migrated user: ${legacyUser.email}`);
            migratedCount++;
          });
        } catch (error) {
          console.error(`Error migrating user ${legacyUser.email}:`, error);
          errorCount++;
        }
      }
      
      offset += BATCH_SIZE;
      console.log(`Progress: ${Math.min(offset, totalUsers)}/${totalUsers} (${((Math.min(offset, totalUsers) / totalUsers) * 100).toFixed(2)}%)`);
    }
    
    console.log('\nMigration Summary:');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Success rate: ${((migratedCount / totalUsers) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Clean up connections
    if (sourceDb) await sourceDb.end();
    await prisma.$disconnect();
    console.log('Database connections closed');
  }
}

// Run the migration
migrateUsers()
  .then(() => console.log('Migration script completed'))
  .catch(err => console.error('Fatal error in migration script:', err)); 
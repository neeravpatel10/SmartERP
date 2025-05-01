/**
 * Migration Verification Script
 * Verifies the successful migration of users from legacy database to Prisma
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

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
 * Main verification function
 */
async function verifyMigration() {
  let sourceDb = null;
  
  try {
    console.log('Starting migration verification...\n');
    
    // Connect to source database
    sourceDb = await mysql.createConnection(sourceDbConfig);
    console.log('Connected to both databases');
    
    // Check user counts in both databases
    await compareUserCounts(sourceDb);
    
    // Sample and compare some records
    await sampleAndCompareRecords(sourceDb);
    
    // Check migration audit logs
    await checkMigrationLogs();
    
    // Identify potential issues
    await identifyPotentialIssues(sourceDb);
    
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    // Clean up connections
    if (sourceDb) await sourceDb.end();
    await prisma.$disconnect();
    console.log('\nDatabase connections closed');
  }
}

/**
 * Compare user counts between source and target databases
 */
async function compareUserCounts(sourceDb) {
  try {
    // Get source count
    const [sourceResult] = await sourceDb.execute('SELECT COUNT(*) as count FROM users');
    const sourceCount = sourceResult[0].count;
    
    // Get target count
    const targetCount = await prisma.user.count();
    
    console.log('=== User Count Comparison ===');
    console.log(`Legacy database: ${sourceCount} users`);
    console.log(`Prisma database: ${targetCount} users`);
    
    const difference = sourceCount - targetCount;
    const migrationRate = ((targetCount / sourceCount) * 100).toFixed(2);
    
    if (difference > 0) {
      console.log(`\n⚠️ Missing ${difference} users in Prisma database (${migrationRate}% migrated)`);
    } else if (difference < 0) {
      console.log(`\n⚠️ Prisma database has ${Math.abs(difference)} more users than source`);
    } else {
      console.log(`\n✅ User counts match perfectly! (100% migrated)`);
    }
  } catch (error) {
    console.error('Error comparing user counts:', error);
  }
}

/**
 * Sample and compare specific records between databases
 */
async function sampleAndCompareRecords(sourceDb) {
  try {
    console.log('\n=== Sample Record Comparison ===');
    
    // Get a sample of users from the source database
    const [sourceUsers] = await sourceDb.execute('SELECT * FROM users ORDER BY RAND() LIMIT 5');
    
    for (const sourceUser of sourceUsers) {
      // Try to find matching user in Prisma
      const targetUser = await prisma.user.findFirst({
        where: { email: sourceUser.email }
      });
      
      console.log(`\nChecking user: ${sourceUser.email || sourceUser.username}`);
      
      if (!targetUser) {
        console.log(`  ❌ Not found in Prisma database`);
        continue;
      }
      
      console.log(`  ✅ Found in Prisma database (ID: ${targetUser.id})`);
      
      // Compare key fields
      const fieldComparisons = [
        { field: 'Name', source: sourceUser.name, target: targetUser.name },
        { field: 'Email', source: sourceUser.email, target: targetUser.email },
        { field: 'Active', source: Boolean(sourceUser.is_active), target: targetUser.isActive },
        { field: 'Phone', source: sourceUser.phone, target: targetUser.phoneNumber },
      ];
      
      for (const comp of fieldComparisons) {
        if (comp.source !== undefined && comp.target !== undefined) {
          const matches = comp.source == comp.target; // Use == for type coercion
          console.log(`  ${matches ? '✅' : '❌'} ${comp.field}: ${comp.source} → ${comp.target}`);
        }
      }
    }
  } catch (error) {
    console.error('Error comparing sample records:', error);
  }
}

/**
 * Check migration audit logs
 */
async function checkMigrationLogs() {
  try {
    console.log('\n=== Recent Migration Audit Logs ===');
    
    // Get recent migration audit logs
    const migrationLogs = await prisma.auditLog.findMany({
      where: { action: 'USER_MIGRATION' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    if (migrationLogs.length === 0) {
      console.log('No migration audit logs found');
      return;
    }
    
    console.log(`Found ${migrationLogs.length} recent migration logs:`);
    
    migrationLogs.forEach((log, index) => {
      const date = log.createdAt.toISOString().split('T')[0];
      const time = log.createdAt.toISOString().split('T')[1].substr(0, 8);
      console.log(`  ${index + 1}. User ${log.entityId} migrated on ${date} at ${time}`);
    });
    
    // Get total migration logs
    const totalLogs = await prisma.auditLog.count({
      where: { action: 'USER_MIGRATION' }
    });
    
    console.log(`\nTotal migration logs: ${totalLogs}`);
  } catch (error) {
    console.error('Error checking migration logs:', error);
  }
}

/**
 * Identify potential migration issues
 */
async function identifyPotentialIssues(sourceDb) {
  try {
    console.log('\n=== Potential Issues ===');
    
    // 1. Check for missing users by sampling
    const [sourceUsers] = await sourceDb.execute(
      'SELECT email FROM users ORDER BY RAND() LIMIT 20'
    );
    
    const sourceEmails = sourceUsers.map(u => u.email).filter(Boolean);
    const targetUsers = await prisma.user.findMany({
      where: { email: { in: sourceEmails } },
      select: { email: true }
    });
    
    const targetEmails = targetUsers.map(u => u.email);
    const missingEmails = sourceEmails.filter(email => !targetEmails.includes(email));
    
    if (missingEmails.length > 0) {
      console.log(`❌ Found ${missingEmails.length} missing users in sample:`);
      missingEmails.forEach(email => console.log(`  - ${email}`));
    } else {
      console.log('✅ All sampled users were found in the Prisma database');
    }
    
    // 2. Check for users with missing departments
    const usersMissingDept = await prisma.user.count({
      where: {
        departmentId: null,
        role: { in: [2, 3] } // Faculty and Department Admin should have departments
      }
    });
    
    if (usersMissingDept > 0) {
      console.log(`\n⚠️ Found ${usersMissingDept} faculty/department admin users with no department assigned`);
    } else {
      console.log('\n✅ All faculty and department admin users have departments assigned');
    }
    
    // 3. Check for invalid email formats
    const invalidEmails = await prisma.user.findMany({
      where: {
        email: { not: { contains: '@' } }
      },
      select: { id: true, email: true },
      take: 5
    });
    
    if (invalidEmails.length > 0) {
      console.log(`\n⚠️ Found ${invalidEmails.length} users with potentially invalid email formats:`);
      invalidEmails.forEach(user => console.log(`  - ID ${user.id}: ${user.email}`));
    } else {
      console.log('\n✅ All users have valid email formats');
    }
    
  } catch (error) {
    console.error('Error identifying potential issues:', error);
  }
}

// Run the verification
verifyMigration()
  .then(() => console.log('\nVerification completed'))
  .catch(err => console.error('Fatal error in verification script:', err)); 
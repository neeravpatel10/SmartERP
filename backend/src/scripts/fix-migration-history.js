// This script fixes the Prisma migration history by marking the problematic migration as applied
// without actually running the migration SQL (which would cause errors)
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

async function main() {
  console.log('Fixing Prisma migration history...');
  
  // Create a Prisma client that can execute raw SQL
  const prisma = new PrismaClient();
  
  try {
    // Check if the migration is already in the history
    const existingMigration = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations
      WHERE migration_name = '20250424210000_add_section_relation_to_subject'
    `;
    
    if (existingMigration && existingMigration.length > 0) {
      console.log('Migration already exists in history table. No action needed.');
      return;
    }
    
    // Generate a random checksum (would normally be generated from the migration file)
    const checksum = crypto.randomBytes(16).toString('hex');
    
    // Insert the migration record directly
    await prisma.$executeRaw`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        UUID(), 
        ${checksum}, 
        NOW(), 
        '20250424210000_add_section_relation_to_subject', 
        'Applied manually via fix script', 
        NULL, 
        NOW(), 
        1
      )
    `;
    
    console.log('Successfully added migration to history!');
    console.log('You can now run "npx prisma migrate dev --name assignment_quiz_marks_tables"');
    
  } catch (error) {
    console.error('Error fixing migration history:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

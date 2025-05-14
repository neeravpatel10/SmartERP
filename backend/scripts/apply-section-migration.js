/**
 * Script to apply section relation migration to subject table
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting section migration process...');

// 1. Check if migration directory exists
const migrationDir = path.join(__dirname, '../prisma/migrations/20250424210000_add_section_relation_to_subject');
if (!fs.existsSync(migrationDir)) {
  console.log('Creating migration directory...');
  fs.mkdirSync(migrationDir, { recursive: true });
}

// 2. Copy migration SQL file
const migrationSqlPath = path.join(migrationDir, 'migration.sql');
if (!fs.existsSync(migrationSqlPath)) {
  console.log('Copying migration SQL...');
  fs.writeFileSync(migrationSqlPath, `-- Add sectionId to subject table
ALTER TABLE \`subject\` ADD COLUMN \`sectionId\` INT NULL;

-- Add foreign key constraint
ALTER TABLE \`subject\` ADD CONSTRAINT \`Subject_sectionId_fkey\` FOREIGN KEY (\`sectionId\`) REFERENCES \`section\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index on sectionId
CREATE INDEX \`Subject_sectionId_fkey\` ON \`subject\`(\`sectionId\`);`);
}

// 3. Apply the migration to the database
console.log('Applying migration to database...');
try {
  execSync('npx prisma migrate resolve --applied 20250424210000_add_section_relation_to_subject', { stdio: 'inherit' });
  console.log('Migration applied successfully.');
} catch (error) {
  console.error('Error applying migration:', error.message);
  process.exit(1);
}

// 4. Regenerate Prisma client
console.log('Regenerating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client regenerated successfully.');
} catch (error) {
  console.error('Error regenerating Prisma client:', error.message);
  process.exit(1);
}

console.log('Section migration process completed successfully!');
console.log('Restart your server to apply the changes.'); 
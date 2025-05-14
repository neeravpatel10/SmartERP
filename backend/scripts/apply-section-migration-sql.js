/**
 * Script to apply section relation migration to subject table directly with SQL
 */
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Parse database URL from environment
const parseDbUrl = (url) => {
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('Invalid database URL format');
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5]
  };
};

// Migration SQL
const migrationSql = `
-- Add sectionId to subject table if it doesn't exist
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'subject' 
AND COLUMN_NAME = 'sectionId';

SET @sqlStatement = IF(@columnExists = 0, 
  'ALTER TABLE \`subject\` ADD COLUMN \`sectionId\` INT NULL;', 
  'SELECT "Column sectionId already exists, skipping."');
PREPARE stmt FROM @sqlStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if it doesn't exist
SET @constraintExists = 0;
SELECT COUNT(*) INTO @constraintExists 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'subject' 
AND CONSTRAINT_NAME = 'Subject_sectionId_fkey';

SET @sqlStatement = IF(@constraintExists = 0, 
  'ALTER TABLE \`subject\` ADD CONSTRAINT \`Subject_sectionId_fkey\` FOREIGN KEY (\`sectionId\`) REFERENCES \`section\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;', 
  'SELECT "Constraint Subject_sectionId_fkey already exists, skipping."');
PREPARE stmt FROM @sqlStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index on sectionId if it doesn't exist
SET @indexExists = 0;
SELECT COUNT(*) INTO @indexExists 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'subject' 
AND INDEX_NAME = 'Subject_sectionId_fkey';

SET @sqlStatement = IF(@indexExists = 0, 
  'CREATE INDEX \`Subject_sectionId_fkey\` ON \`subject\`(\`sectionId\`);', 
  'SELECT "Index Subject_sectionId_fkey already exists, skipping."');
PREPARE stmt FROM @sqlStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
`;

async function main() {
  console.log('Starting section migration process...');
  
  try {
    // Parse database URL
    const dbConfig = parseDbUrl(process.env.DATABASE_URL);
    console.log(`Connecting to database: ${dbConfig.host}/${dbConfig.database}`);
    
    // Create connection
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
      multipleStatements: true // Required for running multiple SQL statements
    });
    
    console.log('Connected to database, applying migration...');
    
    // Execute the migration SQL
    await connection.query(migrationSql);
    
    console.log('Migration applied successfully!');
    console.log('The following changes were made (if they didn\'t already exist):');
    console.log('1. Added sectionId column to subject table');
    console.log('2. Added foreign key constraint to link subjects with sections');
    console.log('3. Created index on sectionId for better performance');
    
    // Close the connection
    await connection.end();
    
    console.log('\nSection migration completed successfully!');
    console.log('Restart your server to apply the changes.');
  } catch (error) {
    console.error('Error applying migration:', error.message);
    process.exit(1);
  }
}

// Run the migration
main(); 
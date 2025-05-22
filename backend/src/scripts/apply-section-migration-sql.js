// This script applies the section-subject relation directly to the database
// It bypasses Prisma's migration system to avoid shadow database issues
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  console.log('Starting direct database migration for section-subject relation...');
  
  // Read database connection from environment
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable not found');
    process.exit(1);
  }
  
  // Parse DATABASE_URL to get connection details
  // Format: mysql://username:password@host:port/database
  const dbUrlRegex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = dbUrl.match(dbUrlRegex);
  
  if (!match) {
    console.error('Invalid DATABASE_URL format');
    process.exit(1);
  }
  
  const [, user, password, host, port, database] = match;
  
  // Create connection
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port: parseInt(port, 10),
      user,
      password,
      database,
      multipleStatements: true // Important for running multiple SQL statements
    });
    
    console.log(`Connected to database: ${database}`);
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'apply-section-migration.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute SQL
    console.log('Executing SQL script...');
    const [results] = await connection.query(sql);
    
    console.log('SQL script executed successfully');
    console.log('Results:', results);
    
    console.log('\nMigration completed successfully!');
    console.log('You can now proceed with other Prisma migrations.');
    
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();

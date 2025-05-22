 // This script runs the SQL file to create Assignment & Quiz tables directly
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  console.log('Starting direct table creation for Assignment & Quiz module...');
  
  // Read database connection from environment
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable not found');
    process.exit(1);
  }
  
  console.log('Database URL:', dbUrl);
  
  // Handle both formats:
  // - mysql://username:password@host:port/database
  // - mysql://username@host:port/database (no password)
  let user, password, host, port, database;
  
  if (dbUrl.includes(':@')) {
    // Format with empty password
    const passwordMatch = dbUrl.match(/mysql:\/\/([^:@]+):@([^:]+):(\d+)\/(.+)/);
    if (passwordMatch) {
      [, user, host, port, database] = passwordMatch;
      password = '';
    }
  } else if (dbUrl.includes('@') && !dbUrl.includes(':@')) {
    // Format without password
    const noPasswordMatch = dbUrl.match(/mysql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (noPasswordMatch) {
      [, user, host, port, database] = noPasswordMatch;
      password = '';
    }
  } else {
    // Standard format with password
    const standardMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (standardMatch) {
      [, user, password, host, port, database] = standardMatch;
    }
  }
  
  if (!user || !host || !port || !database) {
    console.error('Could not parse DATABASE_URL correctly');
    console.error('Parsed values:', { user, host, port, database });
    process.exit(1);
  }
  
  console.log('Connecting with:', { user, host, port, database });
  
  // Create connection
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port: parseInt(port, 10),
      user,
      password: password || '', // Use empty string if password is undefined
      database,
      multipleStatements: true // Important for running multiple SQL statements
    });
    
    console.log(`Connected to database: ${database}`);
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'create-assignment-quiz-tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute SQL
    console.log('Executing SQL script to create Assignment & Quiz tables...');
    const [results] = await connection.query(sql);
    
    console.log('Tables created successfully!');
    console.log('You can now continue development of the Assignment & Quiz module.');
    
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();

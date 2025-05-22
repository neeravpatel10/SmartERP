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

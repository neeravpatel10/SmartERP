/**
 * Department Seeding Script
 * Seeds the database with the initial departments needed for the ERP system
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '../../.env' });

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * List of departments to seed
 * These are based on the departments found in the image
 */
const departments = [
  { code: 'AG', name: 'Agriculture Engineering' },
  { code: 'AIML', name: 'Artificial Intelligence and Machine Learning' },
  { code: 'CSE', name: 'Computer Science & Engineering' },
  { code: 'CSD', name: 'Computer Science & Design' },
  { code: 'CSEC', name: 'Computer Science & Engineering (IOT & Cyber Security)' },
  { code: 'CSDS', name: 'Computer Science & Engineering (Data Science)' },
  { code: 'CE', name: 'Civil Engineering' },
  { code: 'ECE', name: 'Electronics & Communication Engineering' },
  { code: 'ISE', name: 'Information Science & Engineering' },
  { code: 'ME', name: 'Mechanical Engineering' },
  { code: 'BSH', name: 'Basic Sciences & Humanities (BS&H)' }
];

/**
 * Main function to seed departments
 */
async function seedDepartments() {
  try {
    console.log('Starting department seeding process...');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const department of departments) {
      try {
        // Check if department already exists
        const existing = await prisma.department.findFirst({
          where: {
            OR: [
              { code: department.code },
              { name: department.name }
            ]
          }
        });
        
        if (existing) {
          console.log(`Department ${department.code} (${department.name}) already exists, skipping`);
          skippedCount++;
          continue;
        }
        
        // Create the department
        const created = await prisma.department.create({
          data: {
            code: department.code,
            name: department.name
          }
        });
        
        console.log(`Created department: ${created.code} - ${created.name}`);
        createdCount++;
      } catch (error) {
        console.error(`Error creating department ${department.code}:`, error);
      }
    }
    
    console.log('\nDepartment Seeding Summary:');
    console.log(`Total departments: ${departments.length}`);
    console.log(`Created: ${createdCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    
  } catch (error) {
    console.error('Department seeding failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Run the seeding function
seedDepartments()
  .then(() => console.log('Department seeding completed'))
  .catch(err => console.error('Fatal error in department seeding:', err)); 
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data import process...');

  // Create a direct database connection to run the SQL scripts
  // Parse DATABASE_URL from env
  const dbUrl = process.env.DATABASE_URL;
  const connection = await mysql.createConnection(dbUrl);

  try {
    console.log('Reading data from existing tables...');

    // Get data from display_pic table
    const [displayPicRows] = await connection.query('SELECT * FROM display_pic');
    console.log(`Found ${displayPicRows.length} display pic records`);

    // Get data from faculty_details table
    const [facultyRows] = await connection.query('SELECT * FROM faculty_details');
    console.log(`Found ${facultyRows.length} faculty detail records`);

    // Import display pics to Prisma DisplayPic model
    console.log('Importing display picture data to Prisma model...');
    let displayPicSuccessCount = 0;
    let displayPicErrorCount = 0;

    for (const picRow of displayPicRows) {
      try {
        // Find user by username
        const user = await prisma.user.findUnique({
          where: { username: picRow.username }
        });

        if (user) {
          // Check if user already has a display pic
          const existingPic = await prisma.displayPic.findUnique({
            where: { userId: user.id }
          });

          if (existingPic) {
            // Update existing pic
            await prisma.displayPic.update({
              where: { userId: user.id },
              data: { 
                filePath: picRow.dp,
                isActive: true,
                uploadedAt: new Date()
              }
            });
            displayPicSuccessCount++;
          } else {
            // Create new pic
            await prisma.displayPic.create({
              data: {
                user: { connect: { id: user.id } },
                filePath: picRow.dp,
                isActive: true,
                uploadedAt: new Date()
              }
            });
            displayPicSuccessCount++;
          }
        } else {
          console.log(`User not found: ${picRow.username}`);
          displayPicErrorCount++;
        }
      } catch (err) {
        console.error(`Error processing display pic for ${picRow.username}:`, err);
        displayPicErrorCount++;
      }
    }

    console.log(`Successfully processed ${displayPicSuccessCount} display pics, ${displayPicErrorCount} errors`);

    // Import faculty details to Prisma Faculty model
    console.log('Importing faculty data to Prisma model...');
    let facultySuccessCount = 0;
    let facultyErrorCount = 0;

    for (const facultyRow of facultyRows) {
      try {
        // Parse faculty name (assuming format is FirstName MiddleName LastName)
        const nameParts = (facultyRow.faculty_name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

        // Find department
        let departmentId = 1; // Default department ID
        if (facultyRow.faculty_dept) {
          const department = await prisma.department.findFirst({
            where: {
              OR: [
                { code: facultyRow.faculty_dept },
                { name: { contains: facultyRow.faculty_dept } }
              ]
            }
          });
          
          if (department) {
            departmentId = department.id;
          }
        }

        // Find if faculty already exists by email or ID
        const existingFaculty = facultyRow.faculty_email ? 
          await prisma.faculty.findFirst({
            where: { email: facultyRow.faculty_email }
          }) : null;

        if (existingFaculty) {
          // Update existing faculty
          await prisma.faculty.update({
            where: { id: existingFaculty.id },
            data: {
              firstName,
              middleName: middleName || null,
              lastName,
              designation: facultyRow.faculty_desg || existingFaculty.designation,
              qualification: facultyRow.faculty_qulfy || existingFaculty.qualification,
              phone: facultyRow.faculty_contact || existingFaculty.phone,
              // Parse DOB if in a valid format
              dob: facultyRow.faculty_dob ? new Date(facultyRow.faculty_dob) : existingFaculty.dob,
              department: { connect: { id: departmentId } }
            }
          });
          facultySuccessCount++;
        } else {
          // Create new faculty
          const email = facultyRow.faculty_email || `${facultyRow.faculty_id}@placeholder.edu`;
          
          await prisma.faculty.create({
            data: {
              firstName,
              middleName: middleName || null,
              lastName,
              email,
              phone: facultyRow.faculty_contact || '0000000000',
              designation: facultyRow.faculty_desg || 'Faculty',
              qualification: facultyRow.faculty_qulfy,
              dob: facultyRow.faculty_dob ? new Date(facultyRow.faculty_dob) : null,
              department: { connect: { id: departmentId } }
            }
          });
          facultySuccessCount++;
        }
      } catch (err) {
        console.error(`Error processing faculty ${facultyRow.faculty_id}:`, err);
        facultyErrorCount++;
      }
    }

    console.log(`Successfully processed ${facultySuccessCount} faculty records, ${facultyErrorCount} errors`);
    console.log('Data migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await connection.end();
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 
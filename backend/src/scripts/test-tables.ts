import { PrismaClient } from '@prisma/client';

// Create a new Prisma client instance
const prisma = new PrismaClient();

async function testTables() {
  try {
    console.log('Testing database tables...');

    // First, check which tables exist
    console.log('\nListing all tables:');
    const tablesResult = await prisma.$queryRaw`SHOW TABLES;`;
    console.log(tablesResult);
    
    // Try both naming conventions for tables
    try {
      console.log('\nChecking SubjectComponentConfig table:');
      const componentConfigResult = await prisma.$queryRaw`
        SHOW COLUMNS FROM SubjectComponentConfig;
      `;
      console.log(componentConfigResult);
    } catch (error) {
      console.log('\nTrying alternate name: subject_component_config');
      try {
        const componentConfigResult = await prisma.$queryRaw`
          SHOW COLUMNS FROM subject_component_config;
        `;
        console.log(componentConfigResult);
      } catch (innerError) {
        console.error('Could not find subject component config table with either naming convention');
      }
    }

    try {
      console.log('\nChecking StudentComponentMarks table:');
      const componentMarksResult = await prisma.$queryRaw`
        SHOW COLUMNS FROM StudentComponentMarks;
      `;
      console.log(componentMarksResult);
    } catch (error) {
      console.log('\nTrying alternate name: student_component_marks');
      try {
        const componentMarksResult = await prisma.$queryRaw`
          SHOW COLUMNS FROM student_component_marks;
        `;
        console.log(componentMarksResult);
      } catch (innerError) {
        console.error('Could not find student component marks table with either naming convention');
      }
    }

    try {
      console.log('\nChecking StudentOverallTotals table:');
      const overallTotalsResult = await prisma.$queryRaw`
        SHOW COLUMNS FROM StudentOverallTotals;
      `;
      console.log(overallTotalsResult);
    } catch (error) {
      console.log('\nTrying alternate name: student_overall_totals');
      try {
        const overallTotalsResult = await prisma.$queryRaw`
          SHOW COLUMNS FROM student_overall_totals;
        `;
        console.log(overallTotalsResult);
      } catch (innerError) {
        console.error('Could not find student overall totals table with either naming convention');
      }
    }

    console.log('\nTable check completed');
  } catch (error) {
    console.error('Error testing tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTables();

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function createTestInternalMarksData() {
  try {
    console.log('Starting test data creation...');
    
    // Check if subject with id 1 exists
    const subject = await prisma.subject.findUnique({
      where: { id: 1 }
    });
    
    if (!subject) {
      console.log('Subject with ID 1 not found. Please create a subject first.');
      return;
    }
    
    // Check if blueprint already exists
    const existingBlueprint = await prisma.internalexamblueprint.findFirst({
      where: { 
        subjectId: 1,
        cieNo: 1
      }
    });
    
    if (existingBlueprint) {
      console.log(`Blueprint already exists with ID: ${existingBlueprint.id}`);
      // Now check for subquestions
      const subqs = await prisma.internalsubquestion.findMany({
        where: { blueprintId: existingBlueprint.id }
      });
      
      console.log(`Found ${subqs.length} subquestions`);
      
      if (subqs.length > 0) {
        console.log('Test data already exists. Skipping creation.');
        return;
      }
    }
    
    // Find an existing user to use as the creator
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { loginType: 1 }, // Admin
          { loginType: 2 }  // Faculty
        ]
      },
      select: { id: true }
    });
    
    if (!existingUser) {
      console.log('No admin or faculty user found in the database. Please create a user first.');
      return;
    }
    
    console.log(`Using user ID ${existingUser.id} as blueprint creator`);
    
    // Create blueprint if it doesn't exist
    const blueprint = existingBlueprint || await prisma.internalexamblueprint.create({
      data: {
        subjectId: 1,
        cieNo: 1,
        createdBy: existingUser.id
      }
    });
    
    console.log(`Using blueprint with ID: ${blueprint.id}`);
    
    // Create subquestions
    const subqs = await Promise.all([
      prisma.internalsubquestion.create({
        data: {
          blueprintId: blueprint.id,
          questionNo: 1,
          label: 'Q1',
          maxMarks: new Decimal(5),
        }
      }),
      prisma.internalsubquestion.create({
        data: {
          blueprintId: blueprint.id,
          questionNo: 2,
          label: 'Q2',
          maxMarks: new Decimal(5),
        }
      }),
      prisma.internalsubquestion.create({
        data: {
          blueprintId: blueprint.id,
          questionNo: 3,
          label: 'Q3',
          maxMarks: new Decimal(10),
        }
      })
    ]);
    
    console.log(`Created ${subqs.length} subquestions`);
    
    // Get a few students to add test marks
    const students = await prisma.student.findMany({
      take: 3
    });
    
    if (students.length === 0) {
      console.log('No students found. Please create students first.');
      return;
    }
    
    console.log(`Found ${students.length} students for test data`);
    
    // Add sample marks for each student
    for (const student of students) {
      for (const subq of subqs) {
        const randomMark = Math.floor(Math.random() * Number(subq.maxMarks));
        
        await prisma.studentsubquestionmarks.create({
          data: {
            subqId: subq.id,
            studentUsn: student.usn,
            marks: new Decimal(randomMark)
          }
        });
      }
      console.log(`Added marks for student ${student.usn}`);
    }
    
    console.log('Test data creation complete!');
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestInternalMarksData();

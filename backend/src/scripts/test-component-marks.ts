import { PrismaClient, ComponentEnum } from '@prisma/client';

// Create a new Prisma client instance
const prisma = new PrismaClient();

// Simple function to test component marks database operations
async function testComponentMarks() {
  try {
    console.log('Running component marks database test...');
    
    // First, check if we have any existing subjects
    const subjects = await prisma.subject.findMany({ take: 5 });
    console.log('Available subjects:', subjects.map(s => ({ id: s.id, name: s.name })));
    
    if (!subjects.length) {
      console.log('No subjects found in the database. Please create at least one subject first.');
      return;
    }
    
    // Choose the first subject for testing
    const subjectId = subjects[0].id;
    console.log(`Using subject ID ${subjectId} for testing.`);
    
    // Check if we have any students
    const students = await prisma.student.findMany({ take: 5 });
    console.log('Available students:', students.map(s => ({ usn: s.usn, name: s.firstName + ' ' + (s.lastName || '') })));
    
    if (!students.length) {
      console.log('No students found in the database. Please create at least one student first.');
      return;
    }
    
    // Choose the first student for testing
    const studentUsn = students[0].usn;
    console.log(`Using student USN ${studentUsn} for testing.`);
    
    // 1. Test creating a component configuration
    try {
      const config = await prisma.subjectComponentConfig.create({
        data: {
          subjectId,
          component: ComponentEnum.A1, // Assignment 1
          maxMarks: 20,
          attemptCount: 2
        }
      });
      console.log('Created component config:', config);
    } catch (error: any) {
      console.log('Error creating component config:', error.message || String(error));
      console.log('Trying to find existing component config...');
      
      const existingConfig = await prisma.subjectComponentConfig.findFirst({
        where: { subjectId, component: ComponentEnum.A1 }
      });
      
      if (existingConfig) {
        console.log('Found existing config:', existingConfig);
      } else {
        console.log('No existing config found.');
      }
    }
    
    // 2. Test querying component configs
    const components = await prisma.subjectComponentConfig.findMany({
      where: { subjectId }
    });
    console.log(`Found ${components.length} components for subject ID ${subjectId}:`, components);
    
    // 3. Test creating a student mark
    try {
      const studentMark = await prisma.studentComponentMarks.create({
        data: {
          studentUsn,
          subjectId,
          component: ComponentEnum.A1,
          attemptNo: 1,
          marks: 18
        }
      });
      console.log('Created student mark:', studentMark);
    } catch (error: any) {
      console.log('Error creating student mark:', error.message || String(error));
      console.log('Trying to find or update existing mark...');
      
      const existingMark = await prisma.studentComponentMarks.findFirst({
        where: { studentUsn, subjectId, component: ComponentEnum.A1, attemptNo: 1 }
      });
      
      if (existingMark) {
        console.log('Found existing mark:', existingMark);
        
        // Update the mark
        const updatedMark = await prisma.studentComponentMarks.update({
          where: { id: existingMark.id },
          data: { marks: 19 }
        });
        
        console.log('Updated mark:', updatedMark);
      } else {
        console.log('No existing mark found.');
      }
    }
    
    // 4. Test querying student marks
    const marks = await prisma.studentComponentMarks.findMany({
      where: { 
        studentUsn,
        subjectId 
      }
    });
    console.log(`Found ${marks.length} marks for student ${studentUsn} in subject ${subjectId}:`, marks);
    
    // 5. Test calculating and storing overall totals
    // Calculate the assignment total from all marks
    const assignmentMarks = marks.filter(m => 
      m.component === ComponentEnum.A1 || m.component === ComponentEnum.A2
    );
    
    const assignmentTotal = assignmentMarks.reduce((sum, mark) => 
      sum + Number(mark.marks), 0
    );
    
    // Get quiz marks
    const quizMarks = marks.filter(m => m.component === ComponentEnum.QZ);
    const quizTotal = quizMarks.reduce((sum, mark) => 
      sum + Number(mark.marks), 0
    );
    
    console.log(`Assignment total: ${assignmentTotal}, Quiz total: ${quizTotal}`);
    
    try {
      // 5. Test storing overall totals
      const overallTotal = await prisma.studentOverallTotals.upsert({
        where: {
          studentUsn_subjectId: {
            studentUsn,
            subjectId
          }
        },
        create: {
          studentUsn,
          subjectId,
          cieTotal: 0,
          assignment: assignmentTotal,
          quiz: quizTotal,
          seminar: 0,
          overallTotal: assignmentTotal + quizTotal
        },
        update: {
          assignment: assignmentTotal,
          quiz: quizTotal,
          overallTotal: assignmentTotal + quizTotal
        }
      });
      console.log('Created/updated overall total:', overallTotal);
      
      // 6. Test querying overall totals
      const totals = await prisma.studentOverallTotals.findMany({
        where: {
          studentUsn,
          subjectId
        }
      });
      console.log(`Found ${totals.length} overall totals for student ${studentUsn} in subject ${subjectId}:`, totals);
    } catch (error: any) {
      console.log('Error with overall totals:', error.message || String(error));
    }
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testComponentMarks();

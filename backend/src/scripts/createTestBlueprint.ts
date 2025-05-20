import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestBlueprint() {
  try {
    // 1. Check if a test blueprint already exists
    const existingBlueprint = await prisma.internalexamblueprint.findUnique({
      where: {
        subjectId_cieNo: {
          subjectId: 1,
          cieNo: 1
        }
      }
    });

    if (existingBlueprint) {
      console.log('Test blueprint already exists:', existingBlueprint);
      return;
    }

    // 2. Create a test blueprint
    const blueprint = await prisma.internalexamblueprint.create({
      data: {
        subjectId: 1,
        cieNo: 1,
        createdBy: 1  // Assuming user ID 1 exists
      }
    });

    console.log('Created test blueprint:', blueprint);

    // 3. Create test sub-questions
    const subQuestions = [];
    
    // Create 4 questions with 2 subquestions each
    // Question 1
    const subQ1A = await prisma.internalsubquestion.create({
      data: {
        blueprintId: blueprint.id,
        questionNo: 1,
        label: 'Q1(a)',
        maxMarks: 5
      }
    });
    subQuestions.push(subQ1A);

    const subQ1B = await prisma.internalsubquestion.create({
      data: {
        blueprintId: blueprint.id,
        questionNo: 1,
        label: 'Q1(b)',
        maxMarks: 5
      }
    });
    subQuestions.push(subQ1B);

    // Question 2
    const subQ2A = await prisma.internalsubquestion.create({
      data: {
        blueprintId: blueprint.id,
        questionNo: 2,
        label: 'Q2(a)',
        maxMarks: 5
      }
    });
    subQuestions.push(subQ2A);

    const subQ2B = await prisma.internalsubquestion.create({
      data: {
        blueprintId: blueprint.id,
        questionNo: 2,
        label: 'Q2(b)',
        maxMarks: 5
      }
    });
    subQuestions.push(subQ2B);

    // Question 3
    const subQ3A = await prisma.internalsubquestion.create({
      data: {
        blueprintId: blueprint.id,
        questionNo: 3,
        label: 'Q3(a)',
        maxMarks: 5
      }
    });
    subQuestions.push(subQ3A);

    const subQ3B = await prisma.internalsubquestion.create({
      data: {
        blueprintId: blueprint.id,
        questionNo: 3,
        label: 'Q3(b)',
        maxMarks: 5
      }
    });
    subQuestions.push(subQ3B);

    // Question 4
    const subQ4A = await prisma.internalsubquestion.create({
      data: {
        blueprintId: blueprint.id,
        questionNo: 4,
        label: 'Q4(a)',
        maxMarks: 5
      }
    });
    subQuestions.push(subQ4A);

    const subQ4B = await prisma.internalsubquestion.create({
      data: {
        blueprintId: blueprint.id,
        questionNo: 4,
        label: 'Q4(b)',
        maxMarks: 5
      }
    });
    subQuestions.push(subQ4B);

    console.log('Created test sub-questions:', subQuestions);
    console.log('Test data setup complete!');

  } catch (error) {
    console.error('Error creating test blueprint:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createTestBlueprint()
  .then(() => console.log('Done!'))
  .catch(console.error);

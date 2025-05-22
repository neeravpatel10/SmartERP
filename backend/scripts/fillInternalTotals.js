// Script to populate the student_internal_totals table from existing marks
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate best marks for Part A and Part B and insert into student_internal_totals
 */
async function calculateAndInsertTotals() {
  console.log('Starting to populate student_internal_totals table...');
  
  try {
    // 1. Get all unique combinations of subjectId and cieNo from blueprints
    const blueprints = await prisma.internalexamblueprint.findMany({
      select: {
        id: true,
        subjectId: true,
        cieNo: true
      }
    });
    
    console.log(`Found ${blueprints.length} blueprints to process`);
    
    for (const blueprint of blueprints) {
      console.log(`Processing blueprint for subject ${blueprint.subjectId}, CIE ${blueprint.cieNo}`);
      
      // 2. Get all subquestions for this blueprint with their question numbers
      const subquestions = await prisma.internalsubquestion.findMany({
        where: { blueprintId: blueprint.id },
        select: {
          id: true,
          questionNo: true,
          maxMarks: true
        }
      });
      
      // 3. Get all students who have marks for this blueprint
      const studentMarksData = await prisma.studentsubquestionmarks.findMany({
        where: {
          subqId: { in: subquestions.map(sq => sq.id) }
        },
        select: {
          studentUsn: true,
          subqId: true,
          marks: true
        },
        distinct: ['studentUsn']
      });
      
      const studentUsns = [...new Set(studentMarksData.map(m => m.studentUsn))];
      console.log(`Found ${studentUsns.length} students with marks`);
      
      // Create a map of subquestion IDs to their question numbers
      const subqIdToQuestionNo = {};
      subquestions.forEach(sq => {
        subqIdToQuestionNo[sq.id] = sq.questionNo;
      });
      
      // 4. For each student, calculate totals and insert/update records
      for (const studentUsn of studentUsns) {
        // Get all marks for this student for this blueprint
        const studentMarks = await prisma.studentsubquestionmarks.findMany({
          where: {
            studentUsn,
            subqId: { in: subquestions.map(sq => sq.id) }
          }
        });
        
        // Group marks by question number
        const marksByQuestion = new Map();
        for (let i = 1; i <= 4; i++) {
          marksByQuestion.set(i, 0);
        }
        
        // Sum marks for each question
        studentMarks.forEach(mark => {
          const questionNo = subqIdToQuestionNo[mark.subqId] || 0;
          if (questionNo > 0) {
            const currentTotal = marksByQuestion.get(questionNo) || 0;
            marksByQuestion.set(questionNo, currentTotal + Number(mark.marks));
          }
        });
        
        // Calculate best scores for Part A (questions 1-2) and Part B (questions 3-4)
        const partA1 = marksByQuestion.get(1) || 0;
        const partA2 = marksByQuestion.get(2) || 0;
        const bestPartA = Math.max(partA1, partA2);
        
        const partB3 = marksByQuestion.get(3) || 0;
        const partB4 = marksByQuestion.get(4) || 0;
        const bestPartB = Math.max(partB3, partB4);
        
        // Calculate and round the total
        const totalRaw = bestPartA + bestPartB;
        const total = Math.round(totalRaw);
        
        // Insert or update record in StudentInternalTotals
        await prisma.studentInternalTotals.upsert({
          where: {
            student_subject_cie_unique: {
              studentUsn,
              subjectId: blueprint.subjectId,
              cieNo: blueprint.cieNo
            }
          },
          update: {
            bestPartA,
            bestPartB,
            total
          },
          create: {
            studentUsn,
            subjectId: blueprint.subjectId,
            cieNo: blueprint.cieNo,
            bestPartA,
            bestPartB,
            total
          }
        });
        
        console.log(`Updated totals for student ${studentUsn}, subject ${blueprint.subjectId}, CIE ${blueprint.cieNo}: bestPartA=${bestPartA}, bestPartB=${bestPartB}, total=${total}`);
      }
    }
    
    console.log('Completed populating student_internal_totals table successfully');
  } catch (error) {
    console.error('Error populating student_internal_totals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
calculateAndInsertTotals()
  .then(() => console.log('Done!'))
  .catch(error => console.error('Script execution failed:', error));

import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Calculates the internal exam totals for a student based on the "best of Part A & Part B" rule
 * Part A includes questions 1 and 2
 * Part B includes questions 3 and 4
 * The algorithm takes the best score from each part, then adds them and rounds to the nearest integer
 */
export async function calculateInternalTotals(
  tx: Prisma.TransactionClient,
  userId: number,
  subjectId: number,
  cieNo: number
): Promise<void> {
  // Get the blueprint for this subject and CIE
  const blueprint = await tx.internalexamblueprint.findUnique({
    where: { 
      subjectId_cieNo: { 
        subjectId: subjectId,
        cieNo: cieNo 
      } 
    },
    include: {
      subqs: true
    }
  });

  if (!blueprint) {
    throw new Error(`Blueprint not found for subject ${subjectId}, CIE ${cieNo}`);
  }

  // Find student by userId
  const student = await tx.student.findFirst({
    where: { userId: userId }
  });

  if (!student) {
    throw new Error(`Student not found for user ID ${userId}`);
  }

  // Get all subquestions for this blueprint
  const subquestions = await tx.internalsubquestion.findMany({
    where: { blueprintId: blueprint.id }
  });

  // Create a map of subquestion IDs to their question numbers
  const subqIdToQuestionNo = new Map<number, number>();
  subquestions.forEach(sq => {
    subqIdToQuestionNo.set(sq.id, sq.questionNo);
  });

  // Get marks for this student
  const studentMarks = await tx.studentsubquestionmarks.findMany({
    where: {
      studentUsn: student.usn,
      subqId: { in: subquestions.map(sq => sq.id) }
    }
  });

  // Group marks by question number
  const marksByQuestion = new Map<number, number>();
  
  // Initialize with zero for all questions 1-4
  for (let i = 1; i <= 4; i++) {
    marksByQuestion.set(i, 0);
  }

  // Sum marks for each question
  studentMarks.forEach(mark => {
    const questionNo = subqIdToQuestionNo.get(mark.subqId) || 0;
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

  // Store the calculated totals in a more accessible format for reporting
  // We'll use a custom table or field in the future, but for now
  // let's just log the results for debugging
  console.log(`Total marks for student ${student.usn} in subject ${subjectId}, CIE ${cieNo}:`, {
    bestPartA,
    bestPartB,
    total
  });
  
  // Future implementation using Prisma models instead of raw SQL
  /*
  await tx.studentInternalTotals.upsert({
    where: {
      studentUsn_subjectId_cieNo: {
        studentUsn: student.usn,
        subjectId: subjectId,
        cieNo: cieNo
      }
    },
    update: {
      bestPartA: bestPartA,
      bestPartB: bestPartB,
      total: total
    },
    create: {
      studentUsn: student.usn,
      subjectId: subjectId,
      cieNo: cieNo,
      bestPartA: bestPartA,
      bestPartB: bestPartB,
      total: total
    }
  });
  */
  
  /* Commented out because model doesn't exist in schema
  await tx.studentinternaltotals.upsert({
    where: {
      studentId_subjectId_cieNo: {
        studentId: studentId,
        subjectId: subjectId,
        cieNo: cieNo
      }
    },
    update: {
      bestPartA: Math.round(bestPartA), // Storing as integers for display consistency
      bestPartB: Math.round(bestPartB),
      total: total
    },
    create: {
      studentId,
      subjectId: subjectId,
      cieNo: cieNo,
      bestPartA: Math.round(bestPartA),
      bestPartB: Math.round(bestPartB),
      total: total
    }
  });
  */
}

/**
 * Test cases for the calculateInternalTotals function:
 * 
 * 1. Normal case:
 *    - Q1: 7.5, Q2: 6.0, Q3: 8.0, Q4: 7.0
 *    - Expected: bestPartA = 7.5, bestPartB = 8.0, total = 16 (rounded from 15.5)
 * 
 * 2. One part missing:
 *    - Q1: 7.5, Q2: 6.0, Q3: 0, Q4: 0
 *    - Expected: bestPartA = 7.5, bestPartB = 0, total = 8 (rounded from 7.5)
 * 
 * 3. Marks at max limit:
 *    - Q1: 7.5, Q2: 7.5, Q3: 7.5, Q4: 7.5
 *    - Expected: bestPartA = 7.5, bestPartB = 7.5, total = 15
 * 
 * 4. Decimal rounding:
 *    - Q1: 6.4, Q2: 6.5, Q3: 7.4, Q4: 7.5
 *    - Expected: bestPartA = 6.5, bestPartB = 7.5, total = 14
 */

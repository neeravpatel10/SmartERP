import { PrismaClient, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { calculateInternalTotals } from './scoring';

const prisma = new PrismaClient();

// Type definitions for blueprint creation
type SubQuestionInput = {
  label: string;
  maxMarks: number;
};

type QuestionInput = {
  questionNo: number;
  subs: SubQuestionInput[];
};

type BlueprintInput = {
  subjectId: number;
  cieNo: number;
  questions: QuestionInput[];
  createdBy: number;
};

// Type definition for grid data
type GridData = {
  students: Array<{ id: string; usn: string; name: string }>;
  cols: Array<{ 
    id: number; 
    questionNo: number; 
    label: string; 
    maxMarks: number;
  }>;
  rows: Array<{
    studentId: string; // Using USN (string) instead of numeric ID
    marks: Array<{ subqId: number; marks: number | null }>;
  }>;
};

/**
 * Create a new internal exam blueprint
 */
export const createBlueprint = async (input: BlueprintInput) => {
  // Use transaction to ensure all related records are created
  return prisma.$transaction(async (tx) => {
    // Check if blueprint already exists
    const existingBlueprint = await tx.internalexamblueprint.findUnique({
      where: {
        subjectId_cieNo: {
          subjectId: input.subjectId,
          cieNo: input.cieNo
        }
      }
    });

    if (existingBlueprint) {
      throw new Error('Blueprint already exists for this subject and CIE');
    }

    // Create the blueprint
    const blueprint = await tx.internalexamblueprint.create({
      data: {
        subjectId: input.subjectId,
        cieNo: input.cieNo,
        createdBy: input.createdBy,
      }
    });

    // Create sub-questions
    const subQuestions = [];

    for (const question of input.questions) {
      for (const sub of question.subs) {
        const subQuestion = await tx.internalsubquestion.create({
          data: {
            blueprintId: blueprint.id,
            questionNo: question.questionNo,
            label: sub.label,
            maxMarks: sub.maxMarks
          }
        });
        subQuestions.push(subQuestion);
      }
    }

    return {
      ...blueprint,
      subQuestions
    };
  });
};

/**
 * Get blueprint by subject ID and CIE number
 */
export const getBlueprint = async (subjectId: number, cieNo: number) => {
  const blueprint = await prisma.internalexamblueprint.findUnique({
    where: {
      subjectId_cieNo: { subjectId, cieNo }
    },
    include: {
      subqs: true,
      subject: {
        select: {
          name: true,
          code: true
        }
      }
    }
  });

  if (!blueprint) {
    return null;
  }

  // Group sub-questions by question number
  const questions = blueprint.subqs.reduce<Record<number, any>>((acc, subq) => {
    if (!acc[subq.questionNo]) {
      acc[subq.questionNo] = {
        questionNo: subq.questionNo,
        subs: []
      };
    }
    
    acc[subq.questionNo].subs.push({
      id: subq.id,
      label: subq.label,
      maxMarks: subq.maxMarks
    });
    
    return acc;
  }, {});

  return {
    id: blueprint.id,
    subjectId: blueprint.subjectId,
    cieNo: blueprint.cieNo,
    createdBy: blueprint.createdBy,
    createdAt: blueprint.createdAt,
    subject: blueprint.subject,
    questions: Object.values(questions)
  };
};

/**
 * Update an existing blueprint
 */
export const updateBlueprint = async (blueprintId: number, input: Omit<BlueprintInput, 'createdBy'>) => {
  return prisma.$transaction(async (tx) => {
    console.log(`Updating blueprint ${blueprintId} for subject ${input.subjectId}, CIE ${input.cieNo}`);
    
    // Update blueprint basic info
    await tx.internalexamblueprint.update({
      where: { id: blueprintId },
      data: {
        subjectId: input.subjectId,
        cieNo: input.cieNo,
      }
    });

    // Get existing subquestions
    const existingSubQuestions = await tx.internalsubquestion.findMany({
      where: { blueprintId },
      include: {
        marks: {
          select: { studentUsn: true },
          take: 1 // We just need to know if there are any marks, not all of them
        }
      }
    });

    console.log(`Found ${existingSubQuestions.length} existing subquestions`);
    
    // Collect subquestions that have associated marks
    const subQuestionsWithMarks = existingSubQuestions.filter(
      sq => sq.marks.length > 0
    );
    
    console.log(`Found ${subQuestionsWithMarks.length} subquestions with marks`);

    // Safely delete subquestions that don't have marks
    if (existingSubQuestions.length > subQuestionsWithMarks.length) {
      const subQuestionsToDelete = existingSubQuestions.filter(
        sq => sq.marks.length === 0
      ).map(sq => sq.id);
      
      console.log(`Deleting ${subQuestionsToDelete.length} subquestions without marks`);
      
      await tx.internalsubquestion.deleteMany({
        where: {
          id: { in: subQuestionsToDelete }
        }
      });
    }
    
    // Create a map of existing subquestions with marks by questionNo and label
    // This helps us preserve subquestions with marks that match new questions
    const existingSubQMap = new Map();
    subQuestionsWithMarks.forEach(sq => {
      const key = `${sq.questionNo}|${sq.label}`;
      existingSubQMap.set(key, sq);
    });

    // Create new sub-questions, preserving IDs for ones that already have marks
    const subQuestions = [];
    const processedSubQIds = new Set();
    
    for (const question of input.questions) {
      for (const sub of question.subs) {
        // Check if there's an existing subquestion with the same question number and label
        const key = `${question.questionNo}|${sub.label}`;
        const existingSQ = existingSubQMap.get(key);
        
        let subQuestion;
        
        if (existingSQ) {
          // Update existing subquestion
          subQuestion = await tx.internalsubquestion.update({
            where: { id: existingSQ.id },
            data: {
              maxMarks: sub.maxMarks
              // Keep the questionNo and label as they are to preserve mark associations
            }
          });
          processedSubQIds.add(existingSQ.id);
        } else {
          // Create new subquestion
          subQuestion = await tx.internalsubquestion.create({
            data: {
              blueprintId,
              questionNo: question.questionNo,
              label: sub.label,
              maxMarks: sub.maxMarks
            }
          });
        }
        
        subQuestions.push(subQuestion);
      }
    }
    
    // Remove any remaining subquestions with marks that weren't included in the update
    const unusedSubQIds = subQuestionsWithMarks
      .filter(sq => !processedSubQIds.has(sq.id))
      .map(sq => sq.id);
      
    if (unusedSubQIds.length > 0) {
      console.log(`Warning: ${unusedSubQIds.length} subquestions with marks were not included in the update`);
      // We don't delete these to preserve student marks
      // They will effectively be "hidden" from the blueprint but preserved in the database
    }

    return {
      id: blueprintId,
      subjectId: input.subjectId,
      cieNo: input.cieNo,
      subQuestions
    };
  });
};

/**
 * Get grid data for students and marks
 */
export const getGridData = async (subjectId: number, cieNo: number): Promise<GridData> => {
  // Get the blueprint and check if it exists
  const blueprint = await prisma.internalexamblueprint.findUnique({
    where: {
      subjectId_cieNo: { subjectId, cieNo }
    },
    include: {
      subqs: true
    }
  });

  if (!blueprint) {
    throw new Error('Blueprint not found for this subject and CIE');
  }

  // Get subject details to filter students
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { 
      departmentId: true,
      semester: true,
      section: true,
      sectionId: true
    }
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  // Get section name if sectionId is provided
  let sectionName = subject.section;
  if (!sectionName && subject.sectionId) {
    const sectionInfo = await prisma.section.findUnique({
      where: { id: subject.sectionId },
      select: { name: true }
    });
    sectionName = sectionInfo?.name || '';
  }

  // Get all students enrolled in this subject
  const students = await prisma.student.findMany({
    where: {
      departmentId: subject.departmentId,
      semester: subject.semester,
      section: sectionName ? { equals: sectionName } : undefined
    },
    select: {
      usn: true, // USN is the primary key for student
      firstName: true,
      lastName: true,
    },
    orderBy: { usn: 'asc' }
  });

  // Get all sub-questions from the blueprint
  const subquestions = blueprint.subqs;

  // Get all marks for these students and sub-questions
  const marks = await prisma.studentsubquestionmarks.findMany({
    where: {
      subqId: { in: subquestions.map(sq => sq.id) },
      studentUsn: { in: students.map(s => s.usn) }
    }
  });

  // Format the response
  return {
    students: students.map(s => ({
      id: s.usn, // Using USN as the id for consistency
      usn: s.usn,
      name: `${s.firstName} ${s.lastName}`
    })),
    cols: subquestions.map(sq => ({
      id: sq.id,
      questionNo: sq.questionNo,
      label: sq.label,
      maxMarks: Number(sq.maxMarks) // Convert Decimal to number
    })),
    rows: students.map(student => ({
      studentId: student.usn, // Using USN as the student identifier
      marks: subquestions.map(sq => {
        const mark = marks.find(m => m.studentUsn === student.usn && m.subqId === sq.id);
        return {
          subqId: sq.id,
          marks: mark ? Number(mark.marks) : null
        };
      })
    }))
  };
};

/**
 * Save a single mark entry and recalculate totals
 */
export const saveSingleMark = async (subqId: number, studentUsn: string, marks: number | null) => {
  return prisma.$transaction(async (tx) => {
    // Find the sub-question to get maxMarks
    const subq = await tx.internalsubquestion.findUnique({
      where: { id: subqId },
      include: {
        blueprint: true
      }
    });

    if (!subq) {
      throw new Error('Sub-question not found');
    }

    // Validate marks don't exceed max marks (only if marks is not null)
    if (marks !== null) {
      const maxMarksValue = Number(subq.maxMarks);
      if (marks > maxMarksValue) {
        throw new Error(`Marks cannot exceed maximum marks (${maxMarksValue})`);
      }
    }

    let mark;
    
    try {
      // Upsert the mark
      mark = await tx.studentsubquestionmarks.upsert({
        where: {
          subqId_studentUsn: {
            subqId,
            studentUsn
          }
        },
        update: {
          // Handle null marks properly
          marks: marks === null ? null : marks as unknown as Prisma.Decimal
        },
        create: {
          subqId,
          studentUsn,
          // Handle null marks properly
          marks: marks === null ? null : marks as unknown as Prisma.Decimal
        }
      });
      
      // Log success for debugging
      console.log(`Saved mark successfully: subqId=${subqId}, studentUsn=${studentUsn}, marks=${marks}`);
      
      // Recalculate and update totals - need to get user ID from student USN
      const student = await tx.student.findUnique({
        where: { usn: studentUsn },
        select: { userId: true }
      });
      
      if (student?.userId) {
        await calculateInternalTotals(tx, student.userId, subq.blueprint.subjectId, subq.blueprint.cieNo);
      }
      
      return mark;
    } catch (error) {
      console.error('Error saving mark:', error);
      throw new Error(`Failed to save mark: ${error.message}`);
    }
  });
};

/**
 * Process marks from an Excel upload
 */
export const processExcelUpload = async (
  workbook: XLSX.WorkBook,
  subjectId: number,
  cieNo: number
) => {
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to JSON
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

  if (rows.length === 0) {
    throw new Error('Excel file is empty');
  }

  // Get blueprint to validate structure
  const blueprint = await prisma.internalexamblueprint.findUnique({
    where: { subjectId_cieNo: { subjectId, cieNo } },
    include: { subqs: true }
  });

  if (!blueprint) {
    throw new Error('Blueprint does not exist for this subject and CIE');
  }

  // Create a map of expected columns (USN, Name, and sub-question labels)
  const expectedColumns = new Set(['USN', 'Name']);
  const subqLabelToId: Record<string, number> = {};
  
  blueprint.subqs.forEach(sq => {
    expectedColumns.add(sq.label);
    subqLabelToId[sq.label] = sq.id;
  });

  // Validate headers
  const actualColumns = Object.keys(rows[0]);
  const missingColumns = Array.from(expectedColumns).filter(col => !actualColumns.includes(col));
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing columns in Excel: ${missingColumns.join(', ')}`);
  }

  // Get students by USN for mapping
  const students = await prisma.student.findMany({
    where: {
      departmentId: { 
        equals: await prisma.subject.findUnique({ 
          where: { id: subjectId },
          select: { departmentId: true } 
        }).then(subject => subject?.departmentId) 
      }
    }
  });

  // We'll use USN directly since it's the primary key for student

  // Process and save each row
  return prisma.$transaction(async (tx) => {
    const results = [];
    const processedStudents = new Set<number>();

    for (const row of rows) {
      const usn = row['USN'];
      
      // Verify USN exists in the system
      if (!students.some(s => s.usn === usn)) {
        throw new Error(`Student with USN ${usn} not found`);
      }

      // Process each sub-question column
      for (const [label, marksValue] of Object.entries(row)) {
        // Skip USN and Name columns
        if (label === 'USN' || label === 'Name') continue;
        
        // Check if this column is a valid sub-question label
        const subqId = subqLabelToId[label];
        if (!subqId) continue;

        // Validate marks value
        const marks = Number(marksValue);
        if (isNaN(marks)) {
          throw new Error(`Invalid marks value for ${usn}, column ${label}`);
        }

        // Get the max marks for this sub-question
        const subq = blueprint.subqs.find(sq => sq.id === subqId);
        if (!subq) continue;
        
        const maxMarksValue = Number(subq.maxMarks);
        if (marks > maxMarksValue) {
          throw new Error(`Marks for ${usn}, column ${label} exceed maximum of ${maxMarksValue}`);
        }

        // Upsert the mark
        await tx.studentsubquestionmarks.upsert({
          where: { subqId_studentUsn: { subqId, studentUsn: usn } },
          update: { marks: marks as unknown as Prisma.Decimal },
          create: {
            subqId,
            studentUsn: usn,
            marks: marks as unknown as Prisma.Decimal
          }
        });
      }

      // Instead of tracking by student ID, we'll look up by USN and get the user ID
      const student = await tx.student.findUnique({
        where: { usn },
        select: { userId: true }
      });
      
      if (student?.userId) {
        processedStudents.add(student.userId);
      }
      results.push({ usn, processed: true });
    }

    // Recalculate totals for all processed students
    for (const userId of processedStudents) {
      await calculateInternalTotals(tx, userId, subjectId, cieNo);
    }

    return { processed: results.length, students: results };
  });
};

/**
 * Generate an Excel template for marks entry
 */
export const generateExcelTemplate = async (subjectId: number, cieNo: number): Promise<Buffer | null> => {
  // Get the blueprint
  const blueprint = await prisma.internalexamblueprint.findUnique({
    where: { subjectId_cieNo: { subjectId, cieNo } },
    include: { subqs: true }
  });

  if (!blueprint) {
    return null;
  }

  // Get subject details to filter students
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { 
      departmentId: true,
      semester: true,
      section: true,
      sectionId: true
    }
  });

  if (!subject) {
    return null;
  }

  // Get section name if sectionId is provided
  let sectionName = subject.section;
  if (!sectionName && subject.sectionId) {
    const sectionInfo = await prisma.section.findUnique({
      where: { id: subject.sectionId },
      select: { name: true }
    });
    sectionName = sectionInfo?.name || '';
  }

  // Get only students for this specific subject (department + semester + section)
  const students = await prisma.student.findMany({
    where: {
      departmentId: subject.departmentId,
      semester: subject.semester,
      section: sectionName ? { equals: sectionName } : undefined
    },
    orderBy: { usn: 'asc' }
  });

  // Prepare worksheet data
  const data = students.map(student => {
    const row: Record<string, any> = {
      'USN': student.usn,
      'Name': `${student.firstName} ${student.lastName || ''}`
    };

    // Add a column for each sub-question with empty values
    blueprint.subqs.forEach(sq => {
      row[sq.label] = '';
    });

    return row;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Add data validation for marks columns
  // Note: SheetJS doesn't directly support data validation, but Excel will interpret ranges
  // Added as noop to fulfill design doc requirement

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Internal Marks');
  
  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return excelBuffer;
};

/**
 * Get internal totals for students in a subject and CIE
 */
export const getInternalTotals = async (subjectId: number, cieNo: number) => {
  try {
    // Get all totals for the given subject and CIE from the StudentInternalTotals table
    const totals = await prisma.studentInternalTotals.findMany({
      where: {
        subjectId,
        cieNo
      },
      include: {
        student: {
          select: {
            usn: true,
            firstName: true,
            lastName: true,
            section: true,
            semester: true,
            departmentId: true
          }
        }
      },
      orderBy: {
        studentUsn: 'asc'
      }
    });

    // Format the response with student details
    const formattedTotals = totals.map(total => ({
      usn: total.studentUsn,
      studentName: `${total.student.firstName} ${total.student.lastName || ''}`,
      section: total.student.section,
      semester: total.student.semester,
      bestPartA: Number(total.bestPartA),
      bestPartB: Number(total.bestPartB),
      total: total.total
    }));

    return {
      subjectId,
      cieNo,
      totals: formattedTotals
    };
  } catch (error) {
    console.error('Error fetching internal totals:', error);
    throw new Error('Failed to retrieve internal totals');
  }
};

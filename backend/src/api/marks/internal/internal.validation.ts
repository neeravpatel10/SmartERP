import { z } from 'zod';

// Schema for the sub-questions within a blueprint
const subQuestionSchema = z.object({
  label: z.string().max(10),
  maxMarks: z.number().int().positive()
});

// Schema for the questions within a blueprint
const questionSchema = z.object({
  questionNo: z.number().int().min(1).max(4),
  subs: z.array(subQuestionSchema)
});

// Schema for blueprint creation/update
export const blueprintSchema = z.object({
  subjectId: z.number().int().positive(),
  cieNo: z.number().int().min(1).max(3),
  questions: z.array(questionSchema).min(1)
});

// Schema for single mark entry
export const singleMarkEntrySchema = z.object({
  subqId: z.number().int().positive(),
  studentUsn: z.string().min(1), // Changed from studentId (number) to studentUsn (string)
  marks: z.union([
    z.number().nonnegative().max(100),
    z.null()
  ])
});

// Schema for query params for blueprint & grid endpoints
export const internalBlueprintParams = z.object({
  subjectId: z.string().or(z.number()).transform(val => Number(val)),
  cieNo: z.string().or(z.number()).transform(val => Number(val))
});

// Schema for validating Excel upload structure
export const excelUploadRowSchema = z.object({
  USN: z.string(),
  Name: z.string(),
  // Dynamic columns for sub-questions will be validated in the service
});

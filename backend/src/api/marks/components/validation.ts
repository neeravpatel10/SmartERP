import { z } from 'zod';

export const gridQuerySchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  component: z.enum(['A1', 'A2', 'QZ', 'SM']),
  attemptNo: z.coerce.number().int().min(1).max(2),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(200).default(50),
});
export type GridQuery = z.infer<typeof gridQuerySchema>;

export const entryPatchSchema = z.object({
  studentUsn: z.string().min(1),
  subjectId: z.number().int().positive(),
  component: z.enum(['A1', 'A2', 'QZ', 'SM']),
  attemptNo: z.number().int().min(1).max(2),
  marks: z.coerce.number().min(0),
});
export type EntryPatch = z.infer<typeof entryPatchSchema>;

export const configSchema = z.object({
  subjectId: z.number().int().positive(),
  component: z.enum(['A1', 'A2', 'QZ', 'SM']),
  maxMarks: z.number().int().positive(),
  attemptCount: z.number().int().min(1).max(2),
});
export type ComponentConfig = z.infer<typeof configSchema>;

export const templateQuerySchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  component: z.enum(['A1', 'A2', 'QZ', 'SM']),
  attemptNo: z.coerce.number().int().min(1).max(2),
});
export type TemplateQuery = z.infer<typeof templateQuerySchema>;

export const totalsQuerySchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(200).default(50),
});
export type TotalsQuery = z.infer<typeof totalsQuerySchema>;

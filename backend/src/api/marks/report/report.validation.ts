import { z } from 'zod';

// Helper function to handle both string and number inputs
const stringOrNumber = (required = true) => {
  const base = z.union([
    z.string(),
    z.number().transform(val => String(val))
  ]);
  
  return required 
    ? base.transform(val => Number(val))
    : base.optional().transform(val => val ? Number(val) : undefined);
};

// Validation schema for the grid endpoint query parameters
export const reportGridParamsSchema = z.object({
  departmentId: stringOrNumber(false),
  batchId: stringOrNumber(false),
  sectionId: stringOrNumber(false),
  subjectId: stringOrNumber(true),
  cieNo: stringOrNumber(true)
});

// Validation schema for the export endpoint query parameters
export const reportExportParamsSchema = z.object({
  departmentId: stringOrNumber(false),
  batchId: stringOrNumber(false),
  sectionId: stringOrNumber(false),
  subjectId: stringOrNumber(true),
  cieNo: stringOrNumber(true),
  format: z.enum(['xlsx', 'csv', 'pdf'])
});

// Extract the parameter types for use in service functions
export type ReportGridParams = z.infer<typeof reportGridParamsSchema>;
export type ReportExportParams = z.infer<typeof reportExportParamsSchema>;

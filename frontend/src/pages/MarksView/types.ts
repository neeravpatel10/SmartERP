// Type definitions for Marks View & Download module

// Filter parameters for the marks report
export interface FilterParams {
  departmentId?: string;
  batchId?: string;
  sectionId?: string;
  subjectId?: string;
  cieId?: string;
}

// Structure of a single marks row in the grid
export interface MarksRow {
  usn: string;
  name: string;
  subQuestionMarks: { [key: string]: number | null };  // e.g., '1a': 5, '1b': 4
  bestPartA: number;
  bestPartB: number;
  total: number;
  attendance: number | null;  // Placeholder for future attendance integration
}

// Metadata about the current view
export interface MarksMeta {
  subject: { id: number; name: string; code: string } | null;
  cie: number;
  department?: { id: number; name: string } | null;
  batch?: { id: number; name: string; academicYear: string } | null;
  section?: { id: number; name: string } | null;
  passMark: number;
}

// Complete data structure for the grid
export interface MarksGridData {
  columns: string[];  // Column headers: 'USN', 'Name', '1a', '1b', etc.
  rows: MarksRow[];
  meta: MarksMeta;
}

// Department structure
export interface Department {
  id: number;
  name: string;
  code?: string;
}

// Batch structure
export interface Batch {
  id: number;
  name: string;
  academicYear: string;
}

// Section structure
export interface Section {
  id: number;
  name: string;
}

// Subject structure
export interface Subject {
  id: number;
  name: string;
  code: string;
  semester?: number;
  departmentId?: number;
}

// CIE structure
export interface CIE {
  id: number;
  name: string;  // "CIE 1", "CIE 2", "CIE 3"
}

// Student marks for student view
export interface StudentMarks {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  cieNo: number;
  total: number;
  passMark: number;
  isPassing: boolean;
}

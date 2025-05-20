import { calculateInternalTotals } from '../scoring';
import { Prisma } from '@prisma/client';

// Mock the Prisma TransactionClient
const mockPrismaTransaction = {
  internalExamBlueprint: {
    findUnique: jest.fn(),
  },
  studentSubquestionMarks: {
    findMany: jest.fn(),
  },
  studentInternalTotals: {
    upsert: jest.fn(),
  }
} as unknown as Prisma.TransactionClient;

describe('calculateInternalTotals', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for blueprint
    mockPrismaTransaction.internalExamBlueprint.findUnique.mockResolvedValue({
      id: 1,
      subjectId: 100,
      cieNo: 1,
      createdBy: 1,
      createdAt: new Date(),
      subqs: [
        { id: 1, blueprintId: 1, questionNo: 1, label: '1a', maxMarks: 5 },
        { id: 2, blueprintId: 1, questionNo: 1, label: '1b', maxMarks: 5 },
        { id: 3, blueprintId: 1, questionNo: 2, label: '2a', maxMarks: 5 },
        { id: 4, blueprintId: 1, questionNo: 2, label: '2b', maxMarks: 5 },
        { id: 5, blueprintId: 1, questionNo: 3, label: '3a', maxMarks: 5 },
        { id: 6, blueprintId: 1, questionNo: 3, label: '3b', maxMarks: 5 },
        { id: 7, blueprintId: 1, questionNo: 4, label: '4a', maxMarks: 5 },
        { id: 8, blueprintId: 1, questionNo: 4, label: '4b', maxMarks: 5 },
      ]
    });
    
    // Default mock for upsert
    mockPrismaTransaction.studentInternalTotals.upsert.mockResolvedValue({
      id: 1,
      studentId: 1,
      subjectId: 100,
      cieNo: 1,
      bestPartA: 0,
      bestPartB: 0,
      total: 0
    });
  });
  
  test('should calculate totals correctly for normal case', async () => {
    // Normal case: Q1: 7.5, Q2: 6.0, Q3: 8.0, Q4: 7.0
    mockPrismaTransaction.studentSubquestionMarks.findMany.mockResolvedValue([
      { id: 1, subqId: 1, studentId: 1, marks: new Prisma.Decimal(4.0), subq: { questionNo: 1 } },
      { id: 2, subqId: 2, studentId: 1, marks: new Prisma.Decimal(3.5), subq: { questionNo: 1 } }, // Q1 total = 7.5
      { id: 3, subqId: 3, studentId: 1, marks: new Prisma.Decimal(3.0), subq: { questionNo: 2 } },
      { id: 4, subqId: 4, studentId: 1, marks: new Prisma.Decimal(3.0), subq: { questionNo: 2 } }, // Q2 total = 6.0
      { id: 5, subqId: 5, studentId: 1, marks: new Prisma.Decimal(4.0), subq: { questionNo: 3 } },
      { id: 6, subqId: 6, studentId: 1, marks: new Prisma.Decimal(4.0), subq: { questionNo: 3 } }, // Q3 total = 8.0
      { id: 7, subqId: 7, studentId: 1, marks: new Prisma.Decimal(3.5), subq: { questionNo: 4 } },
      { id: 8, subqId: 8, studentId: 1, marks: new Prisma.Decimal(3.5), subq: { questionNo: 4 } }, // Q4 total = 7.0
    ]);
    
    await calculateInternalTotals(mockPrismaTransaction, 1, 100, 1);
    
    // Best of Part A = max(7.5, 6.0) = 7.5
    // Best of Part B = max(8.0, 7.0) = 8.0
    // Total = 7.5 + 8.0 = 15.5, rounded to 16
    expect(mockPrismaTransaction.studentInternalTotals.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          bestPartA: 8, // Rounded to nearest integer
          bestPartB: 8, // Rounded to nearest integer
          total: 16    // Rounded to nearest integer
        })
      })
    );
  });
  
  test('should handle when one part is missing', async () => {
    // One part missing: Q1: 7.5, Q2: 6.0, Q3: 0, Q4: 0
    mockPrismaTransaction.studentSubquestionMarks.findMany.mockResolvedValue([
      { id: 1, subqId: 1, studentId: 1, marks: new Prisma.Decimal(4.0), subq: { questionNo: 1 } },
      { id: 2, subqId: 2, studentId: 1, marks: new Prisma.Decimal(3.5), subq: { questionNo: 1 } }, // Q1 total = 7.5
      { id: 3, subqId: 3, studentId: 1, marks: new Prisma.Decimal(3.0), subq: { questionNo: 2 } },
      { id: 4, subqId: 4, studentId: 1, marks: new Prisma.Decimal(3.0), subq: { questionNo: 2 } }, // Q2 total = 6.0
      // No marks for Q3 and Q4
    ]);
    
    await calculateInternalTotals(mockPrismaTransaction, 1, 100, 1);
    
    // Best of Part A = max(7.5, 6.0) = 7.5
    // Best of Part B = max(0, 0) = 0
    // Total = 7.5 + 0 = 7.5, rounded to 8
    expect(mockPrismaTransaction.studentInternalTotals.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          bestPartA: 8, // Rounded to nearest integer
          bestPartB: 0,
          total: 8    // Rounded to nearest integer
        })
      })
    );
  });
  
  test('should handle marks at max limit', async () => {
    // Marks at max limit: Q1: 7.5, Q2: 7.5, Q3: 7.5, Q4: 7.5
    mockPrismaTransaction.studentSubquestionMarks.findMany.mockResolvedValue([
      { id: 1, subqId: 1, studentId: 1, marks: new Prisma.Decimal(3.75), subq: { questionNo: 1 } },
      { id: 2, subqId: 2, studentId: 1, marks: new Prisma.Decimal(3.75), subq: { questionNo: 1 } }, // Q1 total = 7.5
      { id: 3, subqId: 3, studentId: 1, marks: new Prisma.Decimal(3.75), subq: { questionNo: 2 } },
      { id: 4, subqId: 4, studentId: 1, marks: new Prisma.Decimal(3.75), subq: { questionNo: 2 } }, // Q2 total = 7.5
      { id: 5, subqId: 5, studentId: 1, marks: new Prisma.Decimal(3.75), subq: { questionNo: 3 } },
      { id: 6, subqId: 6, studentId: 1, marks: new Prisma.Decimal(3.75), subq: { questionNo: 3 } }, // Q3 total = 7.5
      { id: 7, subqId: 7, studentId: 1, marks: new Prisma.Decimal(3.75), subq: { questionNo: 4 } },
      { id: 8, subqId: 8, studentId: 1, marks: new Prisma.Decimal(3.75), subq: { questionNo: 4 } }, // Q4 total = 7.5
    ]);
    
    await calculateInternalTotals(mockPrismaTransaction, 1, 100, 1);
    
    // Best of Part A = max(7.5, 7.5) = 7.5
    // Best of Part B = max(7.5, 7.5) = 7.5
    // Total = 7.5 + 7.5 = 15
    expect(mockPrismaTransaction.studentInternalTotals.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          bestPartA: 8, // Rounded to nearest integer
          bestPartB: 8, // Rounded to nearest integer
          total: 15    // Since it should be 15, not 16 (15.0 with direct rounding)
        })
      })
    );
  });
  
  test('should handle decimal rounding correctly', async () => {
    // Decimal rounding: Q1: 6.4, Q2: 6.5, Q3: 7.4, Q4: 7.5
    mockPrismaTransaction.studentSubquestionMarks.findMany.mockResolvedValue([
      { id: 1, subqId: 1, studentId: 1, marks: new Prisma.Decimal(3.2), subq: { questionNo: 1 } },
      { id: 2, subqId: 2, studentId: 1, marks: new Prisma.Decimal(3.2), subq: { questionNo: 1 } }, // Q1 total = 6.4
      { id: 3, subqId: 3, studentId: 1, marks: new Prisma.Decimal(3.25), subq: { questionNo: 2 } },
      { id: 4, subqId: 4, studentId: 1, marks: new Prisma.Decimal(3.25), subq: { questionNo: 2 } }, // Q2 total = 6.5
      { id: 5, subqId: 5, studentId: 1, marks: new Prisma.Decimal(3.7), subq: { questionNo: 3 } },
      { id: 6, subqId: 6, studentId: 1, marks: new Prisma.Decimal(3.7), subq: { questionNo: 3 } }, // Q3 total = 7.4
      { id: 7, subqId: 7, studentId: 1, marks: new Prisma.Decimal(3.75), subq: { questionNo: 4 } },
      { id: 8, subqId: 8, studentId: 1, marks: new Prisma.Decimal(3.75), subq: { questionNo: 4 } }, // Q4 total = 7.5
    ]);
    
    await calculateInternalTotals(mockPrismaTransaction, 1, 100, 1);
    
    // Best of Part A = max(6.4, 6.5) = 6.5
    // Best of Part B = max(7.4, 7.5) = 7.5
    // Total = 6.5 + 7.5 = 14.0
    expect(mockPrismaTransaction.studentInternalTotals.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          bestPartA: 7, // Rounded to nearest integer
          bestPartB: 8, // Rounded to nearest integer
          total: 14    // 14.0 (rounded properly)
        })
      })
    );
  });
  
  test('should handle missing blueprint gracefully', async () => {
    // Simulate blueprint not found
    mockPrismaTransaction.internalExamBlueprint.findUnique.mockResolvedValue(null);
    
    await expect(calculateInternalTotals(mockPrismaTransaction, 1, 100, 1))
      .rejects.toThrow('Blueprint not found for subject 100, CIE 1');
  });
  
  test('should handle empty marks gracefully', async () => {
    // Simulate no marks found
    mockPrismaTransaction.studentSubquestionMarks.findMany.mockResolvedValue([]);
    
    await calculateInternalTotals(mockPrismaTransaction, 1, 100, 1);
    
    // All zeros since no marks were found
    expect(mockPrismaTransaction.studentInternalTotals.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          bestPartA: 0,
          bestPartB: 0,
          total: 0
        })
      })
    );
  });
});

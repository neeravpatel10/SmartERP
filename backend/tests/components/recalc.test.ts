import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { recalcOverallTotals, upsertComponentMark } from '../../src/api/marks/components/components.service';
import { ApiError } from '../../src/utils/errors';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    subjectComponentConfig: {
      findUnique: vi.fn(),
    },
    studentComponentMarks: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
    studentInternalTotals: {
      findMany: vi.fn(),
    },
    studentOverallTotals: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrismaClient)),
  };
  
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('Component Marks Recalculation', () => {
  let prisma: any;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should recalculate overall totals correctly', async () => {
    // Setup mocks
    prisma.studentInternalTotals.findMany.mockResolvedValue([
      { cieNo: 1, total: 25 },
      { cieNo: 2, total: 30 },
      { cieNo: 3, total: 20 },
    ]);
    
    prisma.studentComponentMarks.findFirst
      .mockImplementation((args) => {
        if (args.where.component === 'A1') {
          return Promise.resolve({ marks: 8 });
        } else if (args.where.component === 'A2') {
          return Promise.resolve({ marks: 10 });
        } else if (args.where.component === 'QZ') {
          return Promise.resolve({ marks: 5 });
        } else if (args.where.component === 'SM') {
          return Promise.resolve({ marks: 4 });
        }
        return Promise.resolve(null);
      });
    
    prisma.studentOverallTotals.upsert.mockResolvedValue({
      studentUsn: 'TEST001',
      subjectId: 1,
      cieTotal: 55,
      assignment: 10,
      quiz: 5,
      seminar: 4,
      overallTotal: 74,
    });
    
    // Call the function
    const result = await recalcOverallTotals('TEST001', 1);
    
    // Verify
    expect(prisma.studentInternalTotals.findMany).toHaveBeenCalledWith({
      where: { studentUsn: 'TEST001', subjectId: 1 },
      orderBy: { cieNo: 'asc' },
    });
    
    // Should take best 2 of 3 internal tests (30 + 25 = 55)
    expect(prisma.studentOverallTotals.upsert).toHaveBeenCalledWith({
      where: {
        studentUsn_subjectId: {
          studentUsn: 'TEST001',
          subjectId: 1,
        },
      },
      update: {
        cieTotal: 55,
        assignment: 10, // Max of A1 and A2
        quiz: 5,
        seminar: 4,
        overallTotal: 74, // 55 + 10 + 5 + 4
      },
      create: {
        studentUsn: 'TEST001',
        subjectId: 1,
        cieTotal: 55,
        assignment: 10,
        quiz: 5,
        seminar: 4,
        overallTotal: 74,
      },
    });
    
    // Verify the return value
    expect(result).toEqual({
      studentUsn: 'TEST001',
      subjectId: 1,
      cieTotal: 55,
      assignment: 10,
      quiz: 5,
      seminar: 4,
      overallTotal: 74,
    });
  });
  
  it('should handle missing component marks as 0', async () => {
    // Setup mocks
    prisma.studentInternalTotals.findMany.mockResolvedValue([
      { cieNo: 1, total: 25 },
    ]);
    
    // Only A1 has marks, others are null
    prisma.studentComponentMarks.findFirst
      .mockImplementation((args) => {
        if (args.where.component === 'A1') {
          return Promise.resolve({ marks: 8 });
        }
        return Promise.resolve(null);
      });
    
    prisma.studentOverallTotals.upsert.mockResolvedValue({
      studentUsn: 'TEST001',
      subjectId: 1,
      cieTotal: 25,
      assignment: 8,
      quiz: 0,
      seminar: 0,
      overallTotal: 33,
    });
    
    // Call the function
    const result = await recalcOverallTotals('TEST001', 1);
    
    // Verify
    expect(prisma.studentOverallTotals.upsert).toHaveBeenCalledWith({
      where: {
        studentUsn_subjectId: {
          studentUsn: 'TEST001',
          subjectId: 1,
        },
      },
      update: {
        cieTotal: 25,
        assignment: 8,
        quiz: 0,
        seminar: 0,
        overallTotal: 33, // 25 + 8 + 0 + 0
      },
      create: {
        studentUsn: 'TEST001',
        subjectId: 1,
        cieTotal: 25,
        assignment: 8,
        quiz: 0,
        seminar: 0,
        overallTotal: 33,
      },
    });
    
    // Verify the return value
    expect(result).toEqual({
      studentUsn: 'TEST001',
      subjectId: 1,
      cieTotal: 25,
      assignment: 8,
      quiz: 0,
      seminar: 0,
      overallTotal: 33,
    });
  });
});

describe('Component Mark Upsert', () => {
  let prisma: any;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
    
    // Mock the recalcOverallTotals function
    vi.mock('../../src/api/marks/components/components.service', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        recalcOverallTotals: vi.fn().mockResolvedValue({}),
      };
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should throw error when marks exceed maximum', async () => {
    prisma.subjectComponentConfig.findUnique.mockResolvedValue({
      subjectId: 1,
      component: 'A1',
      maxMarks: 10,
    });
    
    // Attempt to save marks that exceed max
    await expect(upsertComponentMark({
      studentUsn: 'TEST001',
      subjectId: 1,
      component: 'A1',
      attemptNo: 1,
      marks: 15, // Exceeds max of 10
    })).rejects.toThrow('Marks exceed maximum');
  });
  
  it('should throw error when component is not configured', async () => {
    prisma.subjectComponentConfig.findUnique.mockResolvedValue(null);
    
    await expect(upsertComponentMark({
      studentUsn: 'TEST001',
      subjectId: 1,
      component: 'A1',
      attemptNo: 1,
      marks: 8,
    })).rejects.toThrow('Component not configured');
  });
  
  it('should update existing mark correctly', async () => {
    prisma.subjectComponentConfig.findUnique.mockResolvedValue({
      subjectId: 1,
      component: 'A1',
      maxMarks: 10,
    });
    
    prisma.studentComponentMarks.upsert.mockResolvedValue({
      id: 1,
      studentUsn: 'TEST001',
      subjectId: 1,
      component: 'A1',
      attemptNo: 1,
      marks: 8,
    });
    
    const result = await upsertComponentMark({
      studentUsn: 'TEST001',
      subjectId: 1,
      component: 'A1',
      attemptNo: 1,
      marks: 8,
    });
    
    expect(prisma.studentComponentMarks.upsert).toHaveBeenCalledWith({
      where: {
        studentUsn_subjectId_component_attemptNo: {
          studentUsn: 'TEST001',
          subjectId: 1,
          component: 'A1',
          attemptNo: 1,
        },
      },
      update: { marks: 8 },
      create: { 
        studentUsn: 'TEST001',
        subjectId: 1,
        component: 'A1',
        attemptNo: 1,
        marks: 8,
      },
    });
    
    expect(result).toEqual({ success: true, message: 'Marks updated successfully' });
  });
});

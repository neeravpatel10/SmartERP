import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { processUploadedExcel } from '../../src/api/marks/components/components.service';
import * as Excel from 'exceljs';
import { ApiError } from '../../src/utils/errors';

// Mock PrismaClient and Excel
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    subjectComponentConfig: {
      findUnique: vi.fn(),
    },
    studentComponentMarks: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrismaClient)),
  };
  
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

vi.mock('exceljs', () => {
  const mockWorkbook = {
    xlsx: {
      load: vi.fn(),
    },
    worksheets: [],
  };
  
  return {
    Workbook: vi.fn(() => mockWorkbook),
  };
});

// Mock the upsertComponentMark function
vi.mock('../../src/api/marks/components/components.service', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    upsertComponentMark: vi.fn().mockResolvedValue({ success: true }),
  };
});

describe('Excel Upload Processing', () => {
  let prisma: any;
  let mockWorkbook: any;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    mockWorkbook = new Excel.Workbook();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should throw error when component is not configured', async () => {
    prisma.subjectComponentConfig.findUnique.mockResolvedValue(null);
    
    await expect(processUploadedExcel(
      1,
      'A1',
      1,
      Buffer.from('test')
    )).rejects.toThrow('Component not configured');
  });
  
  it('should process a valid Excel file correctly', async () => {
    // Mock component config
    prisma.subjectComponentConfig.findUnique.mockResolvedValue({
      id: 1,
      subjectId: 1,
      component: 'A1',
      maxMarks: 10,
      attemptCount: 1,
    });
    
    // Mock Excel file processing
    const mockRows = [
      { getCell: () => ({ value: 'USN' }), eachCell: vi.fn() },
      { getCell: () => ({ value: 'Marks' }), eachCell: vi.fn() },
      { getCell: vi.fn().mockImplementation((idx) => {
        if (idx === 1) return { value: 'TEST001' };
        if (idx === 3) return { value: 8 };
        return { value: null };
      }), eachCell: vi.fn() },
      { getCell: vi.fn().mockImplementation((idx) => {
        if (idx === 1) return { value: 'TEST002' };
        if (idx === 3) return { value: 9 };
        return { value: null };
      }), eachCell: vi.fn() },
    ];
    
    mockWorkbook.worksheets = [{
      rowCount: 4,
      eachRow: (callback: (row: any, rowIndex: number) => void) => {
        mockRows.forEach((row, index) => callback(row, index + 1));
      },
      getRow: (idx: number) => mockRows[idx - 1],
    }];
    
    const result = await processUploadedExcel(1, 'A1', 1, Buffer.from('test'));
    
    expect(result.totalProcessed).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
  });
  
  it('should validate marks against max marks', async () => {
    // Mock component config with max marks of 10
    prisma.subjectComponentConfig.findUnique.mockResolvedValue({
      id: 1,
      subjectId: 1,
      component: 'A1',
      maxMarks: 10,
      attemptCount: 1,
    });
    
    // Mock Excel file processing with one valid mark and one that exceeds max
    const mockRows = [
      { getCell: () => ({ value: 'USN' }), eachCell: vi.fn() },
      { getCell: () => ({ value: 'Marks' }), eachCell: vi.fn() },
      { getCell: vi.fn().mockImplementation((idx) => {
        if (idx === 1) return { value: 'TEST001' };
        if (idx === 3) return { value: 8 }; // Valid
        return { value: null };
      }), eachCell: vi.fn() },
      { getCell: vi.fn().mockImplementation((idx) => {
        if (idx === 1) return { value: 'TEST002' };
        if (idx === 3) return { value: 15 }; // Exceeds max of 10
        return { value: null };
      }), eachCell: vi.fn() },
    ];
    
    mockWorkbook.worksheets = [{
      rowCount: 4,
      eachRow: (callback: (row: any, rowIndex: number) => void) => {
        mockRows.forEach((row, index) => callback(row, index + 1));
      },
      getRow: (idx: number) => mockRows[idx - 1],
    }];
    
    const { upsertComponentMark } = await import('../../src/api/marks/components/components.service');
    
    // Mock upsertComponentMark to throw for the second student
    (upsertComponentMark as any).mockImplementation((input: any) => {
      if (input.studentUsn === 'TEST002' && input.marks > 10) {
        return Promise.reject(new ApiError(400, 'Marks exceed maximum'));
      }
      return Promise.resolve({ success: true });
    });
    
    const result = await processUploadedExcel(1, 'A1', 1, Buffer.from('test'));
    
    // We should have one success and one failure
    expect(result.totalProcessed).toBe(2);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    
    // The failure should be for TEST002
    const failure = result.details.find((d: any) => !d.success);
    expect(failure?.usn).toBe('TEST002');
    expect(failure?.message).toContain('Invalid marks: ' + 15);
  });
  
  it('should handle non-numeric marks gracefully', async () => {
    // Mock component config
    prisma.subjectComponentConfig.findUnique.mockResolvedValue({
      id: 1,
      subjectId: 1,
      component: 'A1',
      maxMarks: 10,
      attemptCount: 1,
    });
    
    // Mock Excel file processing with one valid mark and one non-numeric
    const mockRows = [
      { getCell: () => ({ value: 'USN' }), eachCell: vi.fn() },
      { getCell: () => ({ value: 'Marks' }), eachCell: vi.fn() },
      { getCell: vi.fn().mockImplementation((idx) => {
        if (idx === 1) return { value: 'TEST001' };
        if (idx === 3) return { value: 8 }; // Valid
        return { value: null };
      }), eachCell: vi.fn() },
      { getCell: vi.fn().mockImplementation((idx) => {
        if (idx === 1) return { value: 'TEST002' };
        if (idx === 3) return { value: 'Not a number' }; // Non-numeric
        return { value: null };
      }), eachCell: vi.fn() },
    ];
    
    mockWorkbook.worksheets = [{
      rowCount: 4,
      eachRow: (callback: (row: any, rowIndex: number) => void) => {
        mockRows.forEach((row, index) => callback(row, index + 1));
      },
      getRow: (idx: number) => mockRows[idx - 1],
    }];
    
    const result = await processUploadedExcel(1, 'A1', 1, Buffer.from('test'));
    
    // We should have one success and one failure
    expect(result.totalProcessed).toBe(2);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    
    // The failure should be for TEST002
    const failure = result.details.find((d: any) => !d.success);
    expect(failure?.usn).toBe('TEST002');
    expect(failure?.message).toContain('Invalid marks');
  });
});

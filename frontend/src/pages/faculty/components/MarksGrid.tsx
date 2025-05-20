import React, { useState, useCallback, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Box,
  Typography,
  FormHelperText
} from '@mui/material';
import { GridData } from '../../../hooks/useInternalMarks';

interface MarksGridProps {
  data: GridData;
  onCellChange: (subqId: number, studentUsn: string, marks: number) => void;
}

const MarksGrid: React.FC<MarksGridProps> = ({ data, onCellChange }) => {
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});
  const [studentTotals, setStudentTotals] = useState<Record<string, { 
    byQuestion: Record<number, number>, 
    bestPartA: number,
    bestPartB: number,
    total: number
  }>>({});

  // Helper to generate a unique key for each cell
  const cellKey = (studentUsn: string, subqId: number) => `${studentUsn}_${subqId}`;

  // Track edited cells to highlight them
  const handleCellChange = (studentUsn: string, subqId: number, value: string) => {
    const key = cellKey(studentUsn, subqId);
    
    // Update edited value
    setEditedCells(prev => ({
      ...prev,
      [key]: value
    }));

    // Validate the input
    const numValue = parseFloat(value);
    const maxMarks = data.cols.find(col => col.id === subqId)?.maxMarks || 0;
    
    if (value === '') {
      // Empty input is allowed (will be treated as null)
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
      return;
    }
    
    if (isNaN(numValue)) {
      setErrors(prev => ({
        ...prev,
        [key]: 'Invalid number'
      }));
      return;
    }
    
    if (numValue < 0) {
      setErrors(prev => ({
        ...prev,
        [key]: 'Marks must be positive'
      }));
      return;
    }
    
    if (numValue > maxMarks) {
      setErrors(prev => ({
        ...prev,
        [key]: `Max is ${maxMarks}`
      }));
      return;
    }
    
    // Clear error if valid
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  // Handle when user completes editing a cell
  const handleCellBlur = useCallback(async (studentUsn: string, subqId: number) => {
    const key = cellKey(studentUsn, subqId);
    const value = editedCells[key];
    
    if (!value) return;
    if (errors[key]) return; // Don't save if there's an error
    
    try {
      // Show loading indicator
      setLoading(prev => ({ ...prev, [key]: true }));
      
      // Get the numeric value
      const numValue = parseFloat(value);
      
      // Save the value - await the Promise
      await onCellChange(subqId, studentUsn, numValue);
      
      // Show success indicator
      setSaveSuccess(prev => ({ ...prev, [key]: true }));
      
      // Update our local state to immediately reflect the changed mark
      // This is crucial for the UI to update without waiting for a server response
      const updatedData = {
        ...data,
        rows: data.rows.map(row => {
          if (row.studentId === studentUsn) {
            return {
              ...row,
              marks: row.marks.some(m => m.subqId === subqId)
                ? row.marks.map(m => m.subqId === subqId ? {...m, marks: numValue} : m)
                : [...row.marks, {subqId, marks: numValue}]
            };
          }
          return row;
        })
      };
      
      // Update the data state locally (optional - if the parent component updates this prop)
      // onDataUpdate?.(updatedData);
      
      // Recalculate the totals with the updated data
      const newTotals = calculateTotals(updatedData);
      setStudentTotals(newTotals);
      
      // Clear success indicator after 1.5 seconds
      setTimeout(() => {
        setSaveSuccess(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      }, 1500);
    } catch (error) {
      // Handle error
      console.error('Error saving marks:', error);
      setErrors(prev => ({ ...prev, [key]: 'Failed to save' }));
    } finally {
      // Hide loading indicator
      setLoading(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  }, [data, editedCells, errors, onCellChange]);

  // Handle key press in cell (Enter to finish editing)
  const handleKeyPress = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter') {
      // Remove focus from the input
      (event.target as HTMLElement).blur();
    }
  };

  // Group columns by question number for the header
  const questionGroups = data.cols.reduce<Record<number, typeof data.cols>>((acc, col) => {
    if (!acc[col.questionNo]) {
      acc[col.questionNo] = [];
    }
    acc[col.questionNo].push(col);
    return acc;
  }, {});

  // Calculate total marks for each student
  const calculateTotals = (currentData = data) => {
    // Create a record to store each student's total marks
    const studentTotals: Record<string, { 
      byQuestion: Record<number, number>, 
      bestPartA: number,
      bestPartB: number,
      total: number
    }> = {};
    
    // Process each student
    currentData.students.forEach(student => {
      const studentId = student.id;
      const row = currentData.rows.find(r => r.studentId === studentId);
      
      if (!row) {
        // If no row data exists for this student, add default values
        studentTotals[studentId] = {
          byQuestion: {},
          bestPartA: 0,
          bestPartB: 0,
          total: 0
        };
        return;
      }
      
      // Calculate total marks for each question
      const byQuestion: Record<number, number> = {};
      
      currentData.cols.forEach(col => {
        if (!byQuestion[col.questionNo]) byQuestion[col.questionNo] = 0;
        
        const mark = row.marks.find(m => m.subqId === col.id);
        if (mark && mark.marks !== null) {
          byQuestion[col.questionNo] += mark.marks;
        }
      });
      
      // Best of Part A (Q1 & Q2)
      const partA1 = byQuestion[1] || 0;
      const partA2 = byQuestion[2] || 0;
      const bestPartA = Math.max(partA1, partA2);
      
      // Best of Part B (Q3 & Q4)
      const partB3 = byQuestion[3] || 0;
      const partB4 = byQuestion[4] || 0;
      const bestPartB = Math.max(partB3, partB4);
      
      // Total with rounding
      const total = Math.round(bestPartA + bestPartB);
      
      // Store the calculated totals for this student
      studentTotals[studentId] = { 
        byQuestion,
        bestPartA,
        bestPartB,
        total
      };
    });
    
    return studentTotals;
  };
  
  // Recalculate totals when data changes or when component mounts
  useEffect(() => {
    const newTotals = calculateTotals();
    setStudentTotals(newTotals);
  }, [data]); // Remove calculateTotals from dependencies to avoid lint warning
  
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          {/* Question group header row */}
          <TableRow>
            <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Student</TableCell>
            
            {Object.entries(questionGroups).map(([qNum, cols]) => (
              <TableCell 
                key={`question-${qNum}`} 
                colSpan={cols.length} 
                align="center"
                sx={{ 
                  fontWeight: 'bold',
                  backgroundColor: '#e3f2fd'
                }}
              >
                Question {qNum}
              </TableCell>
            ))}
            
            {/* Totals columns */}
            <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
              Best A
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
              Best B
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
              Total
            </TableCell>
          </TableRow>
          
          {/* Sub-question header row */}
          <TableRow>
            <TableCell>USN</TableCell>
            <TableCell>Name</TableCell>
            
            {data.cols.map(col => (
              <TableCell 
                key={`col-${col.id}`} 
                align="center" 
                sx={{ 
                  minWidth: '60px',
                  fontWeight: 'bold'
                }}
              >
                {col.label}
                <Typography variant="caption" display="block" sx={{ fontWeight: 'normal' }}>
                  ({col.maxMarks})
                </Typography>
              </TableCell>
            ))}
            
            {/* Totals column headers */}
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Q1/Q2
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Q3/Q4
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Int.
            </TableCell>
          </TableRow>
        </TableHead>
        
        <TableBody>
          {data.students.map(student => {
            const row = data.rows.find(r => r.studentId === student.id);
            const totals = studentTotals[student.id];
            
            return (
              <TableRow key={`student-${student.id}`}>
                <TableCell>{student.usn}</TableCell>
                <TableCell>{student.name}</TableCell>
                
                {data.cols.map(col => {
                  const mark = row?.marks.find(m => m.subqId === col.id);
                  const key = cellKey(student.id, col.id);
                  const hasError = !!errors[key];
                  
                  return (
                    <TableCell key={`cell-${student.id}-${col.id}`} align="center">
                      <Box>
                        <TextField
                          type="text"
                          variant="outlined"
                          size="small"
                          value={editedCells[key] !== undefined ? editedCells[key] : mark?.marks ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCellChange(student.id, col.id, e.target.value)}
                          onBlur={() => handleCellBlur(student.id, col.id)}
                          onKeyPress={(e: React.KeyboardEvent) => handleKeyPress(e)}
                          error={hasError}
                          disabled={loading[key]}
                          sx={{ 
                            width: '60px',
                            '& .MuiOutlinedInput-input': { 
                              textAlign: 'center',
                              py: 1 
                            },
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: saveSuccess[key] ? '#e8f5e9' : 'transparent',
                              transition: 'background-color 0.3s'
                            }
                          }}
                          inputProps={{ 
                            'aria-label': `Marks for ${student.name} sub-question ${col.label}`,
                            'max': col.maxMarks,
                            'min': 0
                          }}
                        />
                        {hasError && (
                          <FormHelperText error>{errors[key]}</FormHelperText>
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
                
                {/* Best of Part A */}
                <TableCell 
                  align="center"
                  sx={{ 
                    fontWeight: 'bold',
                    backgroundColor: '#e8f5e9'
                  }}
                >
                  {totals?.bestPartA?.toFixed(1) || '0.0'}
                </TableCell>
                
                {/* Best of Part B */}
                <TableCell 
                  align="center"
                  sx={{ 
                    fontWeight: 'bold',
                    backgroundColor: '#e8f5e9'
                  }}
                >
                  {totals?.bestPartB?.toFixed(1) || '0.0'}
                </TableCell>
                
                {/* Total (rounded) */}
                <TableCell 
                  align="center"
                  sx={{ 
                    fontWeight: 'bold',
                    backgroundColor: '#e8f5e9'
                  }}
                >
                  {totals?.total || '0'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MarksGrid;

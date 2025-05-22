import React, { useState, useCallback } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress, 
  TextField, 
  Pagination,
  MenuItem,
  Select,
  FormControl
} from '@mui/material';
import useComponentMarks, { ComponentMarksGridData, ComponentType } from '../../../hooks/useComponentMarks';
import debounce from '../../../utils/debounce';

interface ComponentMarksGridProps {
  loading: boolean;
  data: ComponentMarksGridData | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  subjectId: number | null;
  component: ComponentType | null;
  attemptNo: number;
  readOnly?: boolean;
}

const ComponentMarksGrid: React.FC<ComponentMarksGridProps> = ({
  loading,
  data,
  onPageChange,
  onPageSizeChange,
  subjectId,
  component,
  attemptNo,
  readOnly = false
}) => {
  const { updateMark } = useComponentMarks();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Function to start editing a cell
  const startEditing = (usn: string, currentValue: number | null) => {
    if (readOnly) return;
    
    setEditingCell(usn);
    setEditValue(currentValue !== null ? currentValue.toString() : '');
  };

  // Function to save the edit
  const saveEdit = async (usn: string) => {
    if (!subjectId || !component) return;
    
    const marks = parseFloat(editValue);
    if (isNaN(marks)) {
      setEditingCell(null);
      return;
    }
    
    // Validate marks don't exceed max
    const maxMarks = data?.maxMarks || 0;
    if (marks > maxMarks) {
      alert(`Marks cannot exceed maximum value of ${maxMarks}`);
      return;
    }
    
    // Save the mark
    const success = await updateMark({
      studentUsn: usn,
      subjectId,
      component,
      attemptNo,
      marks
    });
    
    if (success) {
      setEditingCell(null);
    }
  };

  // Handle mark change with debounce
  const debouncedSave = useCallback(
    debounce((usn: string) => {
      saveEdit(usn);
    }, 500),
    [subjectId, component, attemptNo, editValue]
  );

  // Handle page change
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render empty state
  if (!data || data.data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {!subjectId || !component
            ? 'Please select a subject and component to view marks'
            : 'No student records found for the selected criteria'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="component marks table">
          <TableHead>
            <TableRow>
              <TableCell>USN</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Marks (Max: {data.maxMarks})</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.data.map((row) => (
              <TableRow key={row.usn} hover>
                <TableCell>{row.usn}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">
                  {editingCell === row.usn ? (
                    <TextField
                      type="number"
                      variant="standard"
                      size="small"
                      value={editValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                      onBlur={() => debouncedSave(row.usn)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          debouncedSave(row.usn);
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      inputProps={{
                        min: 0,
                        max: data.maxMarks,
                        step: 0.5,
                        style: { textAlign: 'right' }
                      }}
                      autoFocus
                    />
                  ) : (
                    <Typography
                      onClick={() => !readOnly && startEditing(row.usn, row.marks)}
                      sx={{
                        cursor: readOnly ? 'default' : 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        '&:hover': {
                          backgroundColor: readOnly ? 'transparent' : '#f5f5f5'
                        }
                      }}
                    >
                      {row.marks !== null ? row.marks : '-'}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={data.pagination.size}
            onChange={(e: React.ChangeEvent<{ value: unknown }>) => onPageSizeChange(Number(e.target.value))}
            displayEmpty
            variant="outlined"
          >
            <MenuItem value={10}>10 rows</MenuItem>
            <MenuItem value={25}>25 rows</MenuItem>
            <MenuItem value={50}>50 rows</MenuItem>
            <MenuItem value={100}>100 rows</MenuItem>
          </Select>
        </FormControl>
        
        <Pagination
          count={data.pagination.totalPages}
          page={data.pagination.page}
          onChange={handlePageChange}
          color="primary"
        />
        
        <Typography variant="body2" color="text.secondary">
          {`${data.pagination.totalCount} total students`}
        </Typography>
      </Box>
    </Box>
  );
};

export default ComponentMarksGrid;

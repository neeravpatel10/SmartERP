import React from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MarksGridData, MarksRow } from './types';

interface MarksGridProps {
  data: MarksGridData;
  passMarkPercentage: number;
}

// Style the cell for marks below the pass percentage
const StyledTableCell = styled(TableCell, {
  shouldForwardProp: (prop: string) => prop !== 'belowPassMark'
})((props: { theme: any; belowPassMark?: boolean }) => {
  const { theme, belowPassMark } = props;
  return {
    ...(belowPassMark && {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
    })
  };
});

const MarksGrid: React.FC<MarksGridProps> = ({ data, passMarkPercentage }) => {

  // Get columns to display based on data
  const getColumns = () => {
    // Always include USN and Name
    const columns = ['USN', 'Name'];
    
    // Add sub-question columns if available (for non-students)
    if (data.columns.includes('1a')) {
      // Get unique sub-question labels
      const subQuestionLabels = data.columns.filter(col => 
        col !== 'USN' && 
        col !== 'Name' && 
        col !== 'Best Part A' && 
        col !== 'Best Part B' && 
        col !== 'Total' && 
        col !== 'Attendance'
      );
      
      // Add sub-question columns
      columns.push(...subQuestionLabels);
      
      // Add Best Part A and Best Part B
      if (data.columns.includes('Best Part A')) {
        columns.push('Best Part A');
      }
      
      if (data.columns.includes('Best Part B')) {
        columns.push('Best Part B');
      }
    }
    
    // Always include Total
    columns.push('Total');
    
    // Include Attendance if available
    if (data.columns.includes('Attendance')) {
      columns.push('Attendance');
    }
    
    return columns;
  };
  
  // Check if a mark is below the passing percentage
  const isBelowPassMark = (marks: number): boolean => {
    const maxMarks = 30; // Typically CIE is out of 30 marks
    const percentage = (marks / maxMarks) * 100;
    return percentage < passMarkPercentage;
  };
  
  // Get cell value based on column and row
  const getCellValue = (row: MarksRow, column: string): string => {
    switch (column) {
      case 'USN':
        return row.usn;
      case 'Name':
        return row.name;
      case 'Best Part A':
        return row.bestPartA.toString();
      case 'Best Part B':
        return row.bestPartB.toString();
      case 'Total':
        return row.total.toString();
      case 'Attendance':
        return row.attendance !== null ? `${row.attendance}%` : 'N/A';
      default:
        // Must be a sub-question column
        return row.subQuestionMarks[column] !== null && row.subQuestionMarks[column] !== undefined
          ? row.subQuestionMarks[column]!.toString()
          : '';
    }
  };
  
  // Display all rows without pagination
  
  // Get columns to display
  const columns = getColumns();
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 370px)' }}>
        <Table stickyHeader aria-label="marks table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column} align={column === 'USN' || column === 'Name' ? 'left' : 'center'}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {column}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.rows.map((row, rowIndex) => (
              <TableRow hover key={row.usn || rowIndex}>
                {columns.map((column) => {
                  // Determine if this cell needs special styling (for Total column)
                  const belowPassMark = column === 'Total' && isBelowPassMark(row.total);
                  
                  return (
                    <StyledTableCell 
                      key={`${row.usn}-${column}`} 
                      align={column === 'USN' || column === 'Name' ? 'left' : 'center'}
                      belowPassMark={belowPassMark}
                    >
                      {getCellValue(row, column)}
                    </StyledTableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Display the total number of records at the bottom */}
      <Typography sx={{ p: 2, textAlign: 'right' }} variant="body2" color="textSecondary">
        Total Records: {data.rows.length}
      </Typography>
    </Paper>
  );
};

export default MarksGrid;

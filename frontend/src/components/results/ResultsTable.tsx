import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography,
  Chip,
  Box,
  LinearProgress
} from '@mui/material';

interface ComponentDetail {
  componentId: number;
  componentName: string;
  maxMarks: number;
  marksObtained: number;
}

interface StudentResult {
  usn: string;
  student: {
    usn: string;
    firstName: string;
    lastName: string;
    section: string;
    semester: number;
  };
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  attendancePercentage: number;
  isEligible: boolean;
  components: ComponentDetail[];
}

interface Subject {
  id: number;
  code: string;
  name: string;
}

interface Component {
  id: number;
  name: string;
  type: string;
  maxMarks: number;
}

interface ResultsTableProps {
  subject: Subject;
  components: Component[];
  results: StudentResult[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ subject, components, results }) => {
  // Determine attendance status color
  const getAttendanceStatusColor = (percentage: number) => {
    if (percentage < 75) return 'error';
    if (percentage < 85) return 'warning';
    return 'success';
  };

  // Format percentage with 2 decimal places
  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(2) + '%';
  };

  // Handle potential undefined or null values
  const safeResults = results || [];
  const safeComponents = components || [];

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {subject?.code || 'No Code'} - {subject?.name || 'No Name'}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Total Students: {safeResults.length}
        </Typography>
      </Box>

      {safeResults.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }} aria-label="results table">
            <TableHead>
              <TableRow>
                <TableCell>USN</TableCell>
                <TableCell>Student Name</TableCell>
                {safeComponents.map((component) => (
                  <TableCell key={component.id} align="center">
                    <Typography variant="caption" display="block">
                      {component.name}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      ({component.maxMarks})
                    </Typography>
                  </TableCell>
                ))}
                <TableCell align="center">Attendance</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Percentage</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {safeResults.map((result) => (
                <TableRow
                  key={result.usn}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {result.usn}
                  </TableCell>
                  <TableCell>
                    {result.student?.firstName || ''} {result.student?.lastName || ''}
                  </TableCell>
                  
                  {/* Component marks */}
                  {safeComponents.map((component) => {
                    const componentDetail = result.components?.find(c => c.componentId === component.id);
                    return (
                      <TableCell key={component.id} align="center">
                        {componentDetail ? componentDetail.marksObtained : '-'}
                      </TableCell>
                    );
                  })}
                  
                  {/* Attendance */}
                  <TableCell align="center">
                    <Chip
                      label={formatPercentage(result.attendancePercentage || 0)}
                      color={getAttendanceStatusColor(result.attendancePercentage || 0)}
                      size="small"
                    />
                  </TableCell>
                  
                  {/* Total marks */}
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {result.totalMarksObtained || 0} / {result.totalMaxMarks || 0}
                    </Typography>
                  </TableCell>
                  
                  {/* Percentage */}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {formatPercentage(result.percentage || 0)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(result.percentage || 0, 100)}
                        sx={{ height: 5, width: '80%', borderRadius: 5, mt: 0.5 }}
                        color={(result.percentage || 0) >= 40 ? "success" : "error"}
                      />
                    </Box>
                  </TableCell>
                  
                  {/* Status */}
                  <TableCell align="center">
                    {result.isEligible ? (
                      <Chip label="Eligible" color="success" size="small" />
                    ) : (
                      <Chip label="Not Eligible" color="error" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No student results available for this subject.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Use the "Calculate Results" button to generate results.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ResultsTable; 
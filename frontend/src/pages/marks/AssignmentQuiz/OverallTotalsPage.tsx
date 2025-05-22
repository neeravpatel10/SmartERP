import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  CircularProgress, 
  Alert,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  ButtonGroup
} from '@mui/material';
import { CloudDownload } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import useSubjects from '../../../hooks/useSubjects';
import useOverallTotals from '../../../hooks/useOverallTotals';

const OverallTotalsPage: React.FC = () => {
  const { user } = useAuth();
  const { loading: subjectsLoading, subjects, fetchSubjects } = useSubjects();
  const {
    loading,
    error,
    gridData,
    getTotalsGrid,
    getExportUrl,
    canExport
  } = useOverallTotals();

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Load subjects based on user role
  useEffect(() => {
    if (user) {
      // For department admin, pass the departmentId
      if (user.loginType === 3 && user.departmentId) {
        fetchSubjects(user.departmentId);
      } else {
        fetchSubjects();
      }
    }
  }, [user, fetchSubjects]);

  // Load grid data when subject changes
  useEffect(() => {
    if (selectedSubject) {
      getTotalsGrid(selectedSubject, page, pageSize);
    }
  }, [selectedSubject, page, pageSize, getTotalsGrid]);

  // Handle subject change
  const handleSubjectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value;
    if (value) {
      setSelectedSubject(Number(value));
      setPage(1); // Reset to first page
    } else {
      setSelectedSubject(null);
    }
  };

  // Handle page change
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Handle page size change
  const handlePageSizeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value;
    if (value) {
      setPageSize(Number(value));
      setPage(1); // Reset to first page
    }
  };

  // Handle export
  const handleExport = (format: 'xlsx' | 'csv' | 'pdf') => {
    if (!selectedSubject) {
      return;
    }
    
    // Open export URL in new tab
    window.open(getExportUrl(selectedSubject, format), '_blank');
  };

  // Determine if student view
  const isStudent = user?.loginType === -1;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Overall Marks Totals
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Subject
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="subject-select-label">Subject</InputLabel>
              <Select
                labelId="subject-select-label"
                id="subject-select"
                value={selectedSubject?.toString() || ''}
                label="Subject"
                onChange={handleSubjectChange}
                disabled={subjectsLoading}
              >
                <MenuItem value="">
                  <em>Select Subject</em>
                </MenuItem>
                {subjects.map((subject: any) => (
                  <MenuItem key={subject.id} value={subject.id.toString()}>
                    {subject.code} - {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {!isStudent && canExport() && selectedSubject && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ButtonGroup variant="outlined">
                  <Button
                    startIcon={<CloudDownload />}
                    onClick={() => handleExport('xlsx')}
                    disabled={!selectedSubject || loading}
                  >
                    Excel
                  </Button>
                  <Button
                    startIcon={<CloudDownload />}
                    onClick={() => handleExport('csv')}
                    disabled={!selectedSubject || loading}
                  >
                    CSV
                  </Button>
                  <Button
                    startIcon={<CloudDownload />}
                    onClick={() => handleExport('pdf')}
                    disabled={!selectedSubject || loading}
                  >
                    PDF
                  </Button>
                </ButtonGroup>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : !gridData ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Please select a subject to view overall totals
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {gridData.subject.code} - {gridData.subject.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall marks totals for all students
                </Typography>
              </Box>

              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader aria-label="overall totals table">
                  <TableHead>
                    <TableRow>
                      <TableCell>USN</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">CIE Total</TableCell>
                      <TableCell align="right">Assignment</TableCell>
                      <TableCell align="right">Quiz</TableCell>
                      <TableCell align="right">Seminar</TableCell>
                      <TableCell align="right">Overall Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gridData.grid.map((row) => (
                      <TableRow key={row.usn} hover>
                        <TableCell>{row.usn}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{row.cieTotal}</TableCell>
                        <TableCell align="right">{row.assignment}</TableCell>
                        <TableCell align="right">{row.quiz}</TableCell>
                        <TableCell align="right">{row.seminar}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            {row.overallTotal}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={pageSize.toString()}
                    onChange={handlePageSizeChange}
                    displayEmpty
                    variant="outlined"
                  >
                    <MenuItem value="10">10 rows</MenuItem>
                    <MenuItem value="25">25 rows</MenuItem>
                    <MenuItem value="50">50 rows</MenuItem>
                    <MenuItem value="100">100 rows</MenuItem>
                  </Select>
                </FormControl>
                
                <Pagination
                  count={gridData.pagination.totalPages}
                  page={gridData.pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                />
                
                <Typography variant="body2" color="text.secondary">
                  {`${gridData.pagination.totalCount} total students`}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default OverallTotalsPage;

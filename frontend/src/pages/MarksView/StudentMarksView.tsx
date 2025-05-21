import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Grid, Card, CardContent, Divider } from '@mui/material';
import API from '../../utils/api';
import { StudentMarks } from './types';

// Constants
const PASS_MARK_PERCENTAGE = 40;

interface StudentMarksViewProps {
  userId: number | undefined;
}

const StudentMarksView: React.FC<StudentMarksViewProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [studentMarks, setStudentMarks] = useState<StudentMarks[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (userId) {
      fetchStudentMarks();
    }
  }, [userId]);
  
  const fetchStudentMarks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always include a guaranteed valid parameter to prevent API errors
      const response = await API.get(`/api/marks/report/student?active=all`);
      
      // Check for nested data structure patterns
      let marksData = [];
      if (response.data?.data?.marks) {
        marksData = response.data.data.marks;
      } else if (response.data?.marks) {
        marksData = response.data.marks;
      } else if (Array.isArray(response.data?.data)) {
        marksData = response.data.data;
      }
      
      // Process the marks data to ensure it has all required properties
      const processedMarks = marksData.map((mark: any) => ({
        subjectId: mark.subjectId,
        subjectName: mark.subjectName || mark.subject?.name || "Unknown Subject",
        subjectCode: mark.subjectCode || mark.subject?.code || "Unknown Code",
        cieNo: mark.cieNo,
        total: mark.total || 0,
        passMark: PASS_MARK_PERCENTAGE,
        isPassing: ((mark.total / 30) * 100) >= PASS_MARK_PERCENTAGE
      }));
      
      setStudentMarks(processedMarks);
    } catch (error) {
      console.error('Error fetching student marks:', error);
      setError('Failed to load your marks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Group marks by subject
  const marksBySubject = studentMarks.reduce((acc, mark) => {
    if (!acc[mark.subjectCode]) {
      acc[mark.subjectCode] = {
        subjectName: mark.subjectName,
        subjectCode: mark.subjectCode,
        cies: []
      };
    }
    
    acc[mark.subjectCode].cies.push({
      cieNo: mark.cieNo,
      total: mark.total,
      isPassing: mark.isPassing
    });
    
    return acc;
  }, {} as Record<string, { subjectName: string; subjectCode: string; cies: Array<{ cieNo: number; total: number; isPassing: boolean }> }>);
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My CIE Marks
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" variant="body1" align="center">
          {error}
        </Typography>
      ) : Object.keys(marksBySubject).length > 0 ? (
        <Grid container spacing={3}>
          {Object.values(marksBySubject).map((subject) => (
            <Grid item xs={12} sm={6} md={4} key={subject.subjectCode}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {subject.subjectCode} - {subject.subjectName}
                  </Typography>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  {subject.cies.length > 0 ? (
                    subject.cies.map((cie) => (
                      <Box key={cie.cieNo} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1">
                          CIE {cie.cieNo}:
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: cie.isPassing ? 'text.primary' : 'error.main'
                          }}
                        >
                          {cie.total} / 30
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No CIE marks available yet.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" color="text.secondary" align="center" py={5}>
          No marks available to display. Check back after your CIE assessments.
        </Typography>
      )}
    </Box>
  );
};

export default StudentMarksView;

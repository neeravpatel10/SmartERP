import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import MainLayout from '../../components/layouts/MainLayout';
import ResultsTable from '../../components/results/ResultsTable';
import { useAuth } from '../../contexts/AuthContext';

// Define appropriate interfaces for better type safety
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
  components: Array<{
    componentId: number;
    componentName: string;
    maxMarks: number;
    marksObtained: number;
  }>;
}

interface ResultsData {
  subject: Subject;
  components: Component[];
  results: StudentResult[];
}

const SubjectResults: React.FC = () => {
  const { subject_id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [data, setData] = useState<ResultsData | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/results/view/${subject_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Ensure data matches expected format for ResultsTable
        const formattedData: ResultsData = {
          subject: response.data.data.subject,
          components: response.data.data.components.map((comp: any) => ({
            id: comp.id,
            name: comp.name,
            type: comp.type || comp.componentType, // Handle different property names
            maxMarks: comp.maxMarks
          })),
          results: response.data.data.results
        };
        setData(formattedData);
      } else {
        setError(response.data.message || 'Failed to load results');
      }
    } catch (error: any) {
      console.error('Error fetching results:', error);
      setError(error.response?.data?.message || 'An error occurred while loading results');
    } finally {
      setLoading(false);
    }
  }, [subject_id, token]);

  useEffect(() => {
    if (subject_id) {
      fetchResults();
    }
  }, [fetchResults, subject_id]);

  const handleCalculateResults = async () => {
    try {
      setCalculating(true);
      setError(null);
      setSuccess(null);
      
      const response = await axios.post(`/results/calculate/${subject_id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess('Results calculated successfully');
        // Refresh results
        fetchResults();
      } else {
        setError(response.data.message || 'Failed to calculate results');
      }
    } catch (error: any) {
      console.error('Error calculating results:', error);
      setError(error.response?.data?.message || 'An error occurred while calculating results');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Subject Results
            </Typography>
            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CalculateIcon />}
                onClick={handleCalculateResults}
                disabled={calculating || loading}
                sx={{
                  backgroundColor: '#b50900',
                  '&:hover': {
                    backgroundColor: '#940800',
                  },
                  mr: 2
                }}
              >
                {calculating ? <CircularProgress size={24} color="inherit" /> : 'Calculate Results'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/marks')}
              >
                Back to Marks
              </Button>
            </Box>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : data ? (
            <ResultsTable 
              subject={data.subject}
              components={data.components}
              results={data.results}
            />
          ) : (
            <Alert severity="info">
              No results available. Click "Calculate Results" to generate new results.
            </Alert>
          )}
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default SubjectResults; 
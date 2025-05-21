import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MarksFilterBar from './MarksFilterBar';
import MarksGrid from './MarksGrid';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import { FilterParams, MarksGridData } from './types';
import StudentMarksView from './StudentMarksView';

// Constants
const PASS_MARK_PERCENTAGE = 40;

const MarksView: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gridData, setGridData] = useState<MarksGridData | null>(null);
  const [filterParams, setFilterParams] = useState<FilterParams>({
    subjectId: '',
    cieId: '1',
  });
  const [exportLoading, setExportLoading] = useState({
    xlsx: false,
    csv: false,
    pdf: false
  });

  // Determine user role - only using isStudent here, others used in useEffect dependencies
  const isStudent = user?.loginType === -1; // Student is login type 4 (not -1)

  // Fetch marks grid data based on filters
  const fetchMarksGridData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Both subjectId and cieId are required by the backend validation
      if (!filterParams.subjectId || !filterParams.cieId) {
        console.log('Missing required parameters for marks grid data:', { 
          subjectId: filterParams.subjectId,
          cieId: filterParams.cieId
        });
        setGridData(null);
        setLoading(false);
        return;
      }
      
      // Construct query parameters
      const params = new URLSearchParams();
      
      // Required parameters - these MUST be included
      params.append('subjectId', String(filterParams.subjectId));
      params.append('cieNo', String(filterParams.cieId)); // Convert cieId to cieNo for backend
      
      // Optional parameters - include if available
      if (filterParams.departmentId) params.append('departmentId', String(filterParams.departmentId));
      if (filterParams.batchId) params.append('batchId', String(filterParams.batchId));
      if (filterParams.sectionId) params.append('sectionId', String(filterParams.sectionId));
      
      // Always include active=all to ensure consistent API patterns
      params.append('active', 'all');
      
      // Use axios directly to avoid API utility issues
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const url = `${baseUrl}/marks/report/grid?${params.toString()}`;
      
      console.log('Fetching marks grid data from URL:', url, 'Params:', {
        subjectId: filterParams.subjectId,
        cieNo: filterParams.cieId,
        departmentId: filterParams.departmentId,
        batchId: filterParams.batchId,
        sectionId: filterParams.sectionId
      });
      
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      });
      
      console.log('Marks grid data response:', response.data);
      
      // Check for nested data structure patterns
      let data = null;
      if (response.data?.data) {
        data = response.data.data;
        
        // Check if data is empty (no rows or empty rows array)
        if (!data.rows || data.rows.length === 0) {
          console.log('No data available for selected filters');
          data = null;
        }
      }
      
      // Always clear previous grid data to avoid showing stale information
      setGridData(data);
    } catch (error: any) {
      console.error('Error fetching marks grid data:', error);
      // Enhanced error logging
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error response:', error.response?.status, error.response?.data);
      }
    } finally {
      setLoading(false);
    }
  }, [filterParams]);
  
  // Load grid data when filter params change
  useEffect(() => {
    // If we have the minimum required filter params, load the grid data
    if (filterParams.subjectId && filterParams.cieId) {
      fetchMarksGridData();
    }
  }, [filterParams, fetchMarksGridData]);

  const handleFilterChange = (name: string, value: string) => {
    // Log the filter change for debugging
    console.log(`Filter changed: ${name} = ${value}`);
    
    // Only clear grid data if we're changing parameters that affect the data display
    // This prevents showing stale data while new data is loading
    if (name === 'subjectId' || name === 'cieId') {
      setGridData(null);
    }
    
    // Update filter parameters
    setFilterParams(prev => {
      // If changing department, also clear batch, section, and subject
      if (name === 'departmentId') {
        return {
          ...prev,
          departmentId: value,
          batchId: '',
          sectionId: '',
          subjectId: ''
        };
      }
      
      // If changing batch, also clear section and subject
      if (name === 'batchId') {
        return {
          ...prev,
          batchId: value,
          sectionId: '',
          subjectId: ''
        };
      }
      
      // If changing section, also clear subject
      if (name === 'sectionId') {
        return {
          ...prev,
          sectionId: value,
          subjectId: ''
        };
      }
      
      // Otherwise just update the specified parameter
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    try {
      // Set loading state for the specific format
      setExportLoading(prev => ({ ...prev, [format]: true }));

      // Construct query params
      const params = new URLSearchParams();
      
      // Always include active=all parameter to prevent API errors
      params.append('active', 'all');
      
      if (filterParams.departmentId) params.append('departmentId', filterParams.departmentId);
      if (filterParams.batchId) params.append('batchId', filterParams.batchId);
      if (filterParams.sectionId) params.append('sectionId', filterParams.sectionId);
      if (filterParams.subjectId) params.append('subjectId', filterParams.subjectId);
      if (filterParams.cieId) params.append('cieNo', filterParams.cieId); // Convert cieId to cieNo for backend
      params.append('format', format);

      // Make request with responseType blob to handle file downloads
      // Get the base URL from environment
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      
      // Log the export URL for debugging
      const exportUrl = `${baseUrl}/marks/report/export?${params.toString()}`;
      console.log('Exporting marks from URL:', exportUrl);
      
      // Direct axios call to ensure correct URL formatting
      const response = await axios.get(exportUrl, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Build filename with metadata
      const subject = gridData?.meta?.subject?.code || 'subject';
      const cie = filterParams.cieId;
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `marks_report_${subject}_CIE${cie}_${timestamp}.${format}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error: any) {
      console.error(`Error exporting marks as ${format}:`, error);
      // Log detailed error information
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Export error details:', {
          status: error.response?.status,
          data: error.response?.data
        });
      }
    } finally {
      setExportLoading(prev => ({ ...prev, [format]: false }));
    }
  };

  // For student users, show a different UI
  if (isStudent) {
    return <StudentMarksView userId={user?.id} />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Marks Report
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <MarksFilterBar 
          filterParams={filterParams}
          onFilterChange={handleFilterChange}
          userType={user?.loginType}
          facultyId={user?.id} // Use user ID directly instead of faculty property
          departmentId={user?.departmentId || undefined} // Use departmentId directly if available
        />
      </Paper>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : gridData ? (
        <>
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExport('xlsx')}
              disabled={exportLoading.xlsx}
            >
              {exportLoading.xlsx ? 'Downloading...' : 'Export XLSX'}
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExport('csv')}
              disabled={exportLoading.csv}
            >
              {exportLoading.csv ? 'Downloading...' : 'Export CSV'}
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExport('pdf')}
              disabled={exportLoading.pdf}
            >
              {exportLoading.pdf ? 'Downloading...' : 'Export PDF'}
            </Button>
          </Box>
          
          {gridData ? (
            <Box mt={3}>
              <MarksGrid data={gridData} passMarkPercentage={PASS_MARK_PERCENTAGE} />
            </Box>
          ) : filterParams.subjectId && filterParams.cieId && !loading ? (
            <Box mt={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No data available for the selected options
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  There may not be any records for CIE {filterParams.cieId} for this subject, or the blueprint may not be set up yet.
                </Typography>
              </Paper>
            </Box>
          ) : null}
        </>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center" py={5}>
          Select filters to load marks data
        </Typography>
      )}
    </Box>
  );
};

export default MarksView;

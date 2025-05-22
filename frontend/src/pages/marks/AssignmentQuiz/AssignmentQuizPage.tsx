import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Button, CircularProgress, Alert } from '@mui/material';
import ComponentFilterBar from './ComponentFilterBar';
import ComponentMarksGrid from './ComponentMarksGrid';
import useComponentMarks, { ComponentType } from '../../../hooks/useComponentMarks';
import { CloudUpload, CloudDownload } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';
import toast from '../../../utils/toast';

const AssignmentQuizPage: React.FC = () => {
  const { user } = useAuth();
  const {
    loading,
    error,
    components,
    gridData,
    getSubjectComponents,
    getComponentGrid,
    getTemplateUrl,
    canEdit
  } = useComponentMarks();

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentType | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<number>(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [uploading, setUploading] = useState(false);

  // Load grid data when filters change
  useEffect(() => {
    if (selectedSubject && selectedComponent) {
      getComponentGrid(
        selectedSubject,
        selectedComponent,
        selectedAttempt,
        page,
        pageSize
      );
    }
  }, [selectedSubject, selectedComponent, selectedAttempt, page, pageSize, getComponentGrid]);

  // Load components when subject changes
  useEffect(() => {
    if (selectedSubject) {
      getSubjectComponents(selectedSubject);
    }
  }, [selectedSubject, getSubjectComponents]);

  // Handle filter changes
  const handleSubjectChange = (subjectId: number | null) => {
    setSelectedSubject(subjectId);
    setSelectedComponent(null); // Reset component when subject changes
  };

  const handleComponentChange = (component: ComponentType | null) => {
    setSelectedComponent(component);
    setPage(1); // Reset to first page
  };

  const handleAttemptChange = (attempt: number) => {
    setSelectedAttempt(attempt);
    setPage(1); // Reset to first page
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page
  };

  // Download template
  const handleDownloadTemplate = () => {
    if (!selectedSubject || !selectedComponent) {
      toast.error('Please select a subject and component first');
      return;
    }

    // Redirect to template download URL
    window.open(
      getTemplateUrl(selectedSubject, selectedComponent, selectedAttempt),
      '_blank'
    );
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSubject || !selectedComponent) {
      toast.error('Please select a subject and component first');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', selectedSubject.toString());
      formData.append('component', selectedComponent);
      formData.append('attemptNo', selectedAttempt.toString());
      
      // Upload file
      const response = await api.post('/api/marks/components/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data?.success) {
        toast.success(`Processed ${response.data.data.totalProcessed} entries with ${response.data.data.successCount} successes`);
        
        // Refresh grid data
        getComponentGrid(
          selectedSubject,
          selectedComponent,
          selectedAttempt,
          page,
          pageSize
        );
      } else {
        toast.error(response.data?.message || 'Failed to upload marks');
      }
    } catch (err: any) {
      console.error('Error uploading marks:', err);
      toast.error(err.response?.data?.message || err.message || 'Error uploading marks');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Determine if student view
  const isStudent = user?.loginType === -1;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Assignment & Quiz Marks
      </Typography>

      <ComponentFilterBar
        onSubjectChange={handleSubjectChange}
        onComponentChange={handleComponentChange}
        onAttemptChange={handleAttemptChange}
        selectedSubject={selectedSubject}
        selectedComponent={selectedComponent}
        selectedAttempt={selectedAttempt}
        components={components}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mt: 3 }}>
        <CardContent>
          {!isStudent && canEdit() && (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 2, 
                mb: 2,
                flexWrap: 'wrap'
              }}
            >
              <Button
                variant="outlined"
                startIcon={<CloudDownload />}
                onClick={handleDownloadTemplate}
                disabled={!selectedSubject || !selectedComponent || loading}
              >
                Download Template
              </Button>
              
              <Button
                variant="contained"
                component="label"
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                disabled={!selectedSubject || !selectedComponent || uploading}
              >
                Upload Marks
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={!selectedSubject || !selectedComponent || uploading}
                />
              </Button>
            </Box>
          )}

          <ComponentMarksGrid
            loading={loading}
            data={gridData}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            subjectId={selectedSubject}
            component={selectedComponent}
            attemptNo={selectedAttempt}
            readOnly={isStudent || !canEdit()}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default AssignmentQuizPage;

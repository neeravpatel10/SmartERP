import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { bulkUploadStudents, resetSuccess, resetError } from '../../store/slices/studentsSlice';
import { RootState, AppDispatch } from '../../store';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const StudentBulkUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, success } = useSelector((state: RootState) => state.students);
  
  useEffect(() => {
    dispatch(resetError());
    dispatch(resetSuccess());
    
    return () => {
      dispatch(resetSuccess());
    };
  }, [dispatch]);
  
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/students');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const files = event.target.files;
    
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Check file type
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
        setErrorMessage('Only CSV or Excel files are allowed');
        return;
      }
      
      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMessage('File size should not exceed 5MB');
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setErrorMessage('Please select a file to upload');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    await dispatch(bulkUploadStudents(formData));
  };
  
  const clearFile = () => {
    setFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/api/students/template', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students_template.csv');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template', error);
      setErrorMessage('Failed to download template. Please try again.');
    }
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bulk Upload Students
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Students successfully uploaded! Redirecting to students list...
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              Upload a CSV or Excel file containing student data. 
              Please ensure that the file follows the required format.
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={downloadTemplate}
              sx={{ mt: 1 }}
            >
              Download Template
            </Button>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                mb: 3,
                backgroundColor: '#f9f9f9'
              }}
            >
              <input
                accept=".csv,.xlsx"
                style={{ display: 'none' }}
                id="upload-file"
                type="file"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              <label htmlFor="upload-file">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={loading}
                >
                  Select File
                </Button>
              </label>
              
              {file && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={clearFile}
                    disabled={loading}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                component={Link}
                to="/students"
                variant="outlined"
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                disabled={!file || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Upload Students'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default StudentBulkUpload; 
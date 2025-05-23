import React, { useState, useRef, useCallback } from 'react';
import { Box, Avatar, Button, LinearProgress, Typography } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';

interface AvatarUploaderProps {
  currentAvatar?: string;
  onAvatarChange: (url: string) => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ 
  currentAvatar, 
  onAvatarChange 
}) => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  // Upload file to server
  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/display-pic/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setUploadProgress(percentCompleted);
        },
      });
      
      if (response.data.success) {
        const imageUrl = response.data.data.url;
        setPreviewUrl(imageUrl);
        onAvatarChange(imageUrl);
        showSuccess('Profile picture uploaded successfully');
      } else {
        showError(response.data.message || 'Failed to upload image');
        // Revert to previous avatar if there was one
        setPreviewUrl(currentAvatar);
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      showError(error.message || 'An error occurred while uploading image');
      setPreviewUrl(currentAvatar);
    } finally {
      setIsUploading(false);
    }
  }, [currentAvatar, onAvatarChange, setIsUploading, setUploadProgress, showError, showSuccess]);

  // Process the selected file
  const handleFile = useCallback((file: File) => {
    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showError('Only JPEG and PNG images are allowed');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('Image size should not exceed 2MB');
      return;
    }

    // Upload the file
    uploadFile(file);
  }, [showError, uploadFile]);

  // Handle file drop
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  // This section has been moved above

  // Handle click to browse files
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box
        sx={{
          position: 'relative',
          width: 96,
          height: 96,
          mb: 2,
        }}
      >
        <Avatar
          src={previewUrl}
          sx={{ 
            width: 96, 
            height: 96,
            border: '2px solid #e0e0e0',
          }}
        />
        
        {isUploading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
            }}
          >
            <Typography variant="caption" color="white" align="center">
              {uploadProgress}%
            </Typography>
          </Box>
        )}
      </Box>
      
      {isUploading && (
        <Box sx={{ width: '100%', maxWidth: 200, mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}
      
      <Box 
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 1,
          p: 2,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
          },
          mb: 2,
          width: '100%',
          maxWidth: 300,
        }}
        onClick={handleClick}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={onDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
        />
        <CloudUploadIcon fontSize="large" color="action" />
        <Typography variant="body2">
          Drag & drop an image here or click to browse
        </Typography>
        <Typography variant="caption" color="textSecondary">
          (JPG or PNG, max 2MB)
        </Typography>
      </Box>
      
      <Button
        variant="contained"
        onClick={handleClick}
        size="small"
        disabled={isUploading}
      >
        Upload Photo
      </Button>
    </Box>
  );
};

export default AvatarUploader;

import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const Loader: React.FC = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%', 
      minHeight: '200px' 
    }}>
      <CircularProgress />
    </Box>
  );
};

export default Loader; 
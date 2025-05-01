import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import MainLayout from '../../components/layouts/MainLayout';

const Students: React.FC = () => {
  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Student Management
          </Typography>
          <Typography variant="body1">
            (Student list and management functionality will be implemented here.)
          </Typography>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default Students; 
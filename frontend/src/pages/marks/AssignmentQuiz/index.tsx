import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AssignmentQuizPage from './AssignmentQuizPage';
import OverallTotalsPage from './OverallTotalsPage';

// This component handles routing between the different Assignment & Quiz pages
const AssignmentQuizRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AssignmentQuizPage />} />
      <Route path="/overall-totals" element={<OverallTotalsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AssignmentQuizRouter;

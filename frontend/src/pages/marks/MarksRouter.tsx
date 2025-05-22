import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Marks from './Marks';
import AssignmentQuizPage from './AssignmentQuiz/AssignmentQuizPage';
import OverallTotalsPage from './AssignmentQuiz/OverallTotalsPage';

// This component handles routing for the entire Marks module
const MarksRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Marks />} />
      <Route path="/internal/*" element={<Navigate to="/marks/internal" replace />} />
      <Route path="/view/*" element={<Navigate to="/marks/view" replace />} />
      <Route path="/assignment-quiz" element={<AssignmentQuizPage />} />
      <Route path="/overall-totals" element={<OverallTotalsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default MarksRouter;

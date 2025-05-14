import React from 'react';
import SubjectList from '../../components/subjects/SubjectList';

const SubjectsPage: React.FC = () => {
  return (
    <div className="subjects-page-container" style={{ padding: '20px' }}>
      <SubjectList />
    </div>
  );
};

export default SubjectsPage; 
import React, { ReactNode } from 'react';
import './custom-components.css';

interface CustomCardProps {
  className?: string;
  children: ReactNode;
}

interface CustomCardHeaderProps {
  className?: string;
  children: ReactNode;
}

interface CustomCardBodyProps {
  className?: string;
  children: ReactNode;
}

const CustomCardHeader: React.FC<CustomCardHeaderProps> = ({ className = '', children }) => {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  );
};

const CustomCardBody: React.FC<CustomCardBodyProps> = ({ className = '', children }) => {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  );
};

const CustomCard: React.FC<CustomCardProps> & {
  Header: typeof CustomCardHeader;
  Body: typeof CustomCardBody;
} = ({ className = '', children }) => {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
};

CustomCard.Header = CustomCardHeader;
CustomCard.Body = CustomCardBody;

export default CustomCard; 
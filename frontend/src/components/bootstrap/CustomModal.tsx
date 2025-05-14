import React, { ReactNode, useState, useEffect } from 'react';
import './custom-components.css';

interface CustomModalProps {
  show: boolean;
  onHide: () => void;
  size?: 'sm' | 'lg' | 'xl';
  className?: string;
  children: ReactNode;
  centered?: boolean;
}

interface CustomModalHeaderProps {
  closeButton?: boolean;
  onHide?: () => void;
  className?: string;
  children: ReactNode;
}

interface CustomModalBodyProps {
  className?: string;
  children: ReactNode;
}

interface CustomModalFooterProps {
  className?: string;
  children: ReactNode;
}

interface CustomModalTitleProps {
  className?: string;
  children: ReactNode;
}

const CustomModalTitle: React.FC<CustomModalTitleProps> = ({ className = '', children }) => {
  return <h5 className={`modal-title ${className}`}>{children}</h5>;
};

const CustomModalHeader: React.FC<CustomModalHeaderProps> = ({ 
  className = '', 
  children, 
  closeButton, 
  onHide 
}) => {
  return (
    <div className={`modal-header ${className}`}>
      {children}
      {closeButton && onHide && (
        <button 
          type="button" 
          className="btn-close" 
          onClick={onHide} 
          aria-label="Close"
        />
      )}
    </div>
  );
};

const CustomModalBody: React.FC<CustomModalBodyProps> = ({ className = '', children }) => {
  return <div className={`modal-body ${className}`}>{children}</div>;
};

const CustomModalFooter: React.FC<CustomModalFooterProps> = ({ className = '', children }) => {
  return <div className={`modal-footer ${className}`}>{children}</div>;
};

const CustomModal: React.FC<CustomModalProps> & {
  Header: typeof CustomModalHeader;
  Title: typeof CustomModalTitle;
  Body: typeof CustomModalBody;
  Footer: typeof CustomModalFooter;
} = ({ show, onHide, size = '', className = '', children, centered = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      document.body.classList.add('modal-open');
    } else {
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
      document.body.classList.remove('modal-open');
    }
  }, [show]);

  if (!isVisible && !show) {
    return null;
  }

  const sizeClass = size ? `modal-${size}` : '';
  const centeredClass = centered ? 'modal-dialog-centered' : '';

  return (
    <>
      {/* Modal backdrop - darkened background */}
      <div 
        className={`modal-backdrop ${show ? 'show' : 'fade'}`} 
        onClick={onHide}
        style={{ 
          display: 'block', 
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1040
        }}
      />
      
      {/* Modal dialog */}
      <div 
        className={`modal ${show ? 'show' : 'fade'}`} 
        tabIndex={-1} 
        role="dialog"
        style={{ 
          display: 'block', 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'auto',
          zIndex: 1050
        }}
        onClick={onHide}
      >
        <div 
          className={`modal-dialog ${sizeClass} ${centeredClass} ${className}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            margin: centered ? '0 auto' : '1.75rem auto',
            transform: 'none',
            maxWidth: size === 'lg' ? '800px' : size === 'xl' ? '1140px' : '500px',
            position: 'relative',
            pointerEvents: 'all',
            boxSizing: 'border-box',
            height: centered ? '100%' : 'auto',
            display: centered ? 'flex' : 'block',
            alignItems: centered ? 'center' : 'initial'
          }}
        >
          <div 
            className="modal-content"
            style={{
              boxShadow: '0 0.5rem 2rem rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '0.5rem',
              width: '100%'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

CustomModal.Header = CustomModalHeader;
CustomModal.Title = CustomModalTitle;
CustomModal.Body = CustomModalBody;
CustomModal.Footer = CustomModalFooter;

export default CustomModal; 
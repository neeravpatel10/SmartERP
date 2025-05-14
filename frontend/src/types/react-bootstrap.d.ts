declare module 'react-bootstrap/Button' {
  import { ButtonProps } from 'react-bootstrap';
  import React from 'react';
  
  const Button: React.FC<ButtonProps>;
  export default Button;
}

declare module 'react-bootstrap/Form' {
  import { FormProps, FormGroupProps, FormLabelProps, FormControlProps, FormSelectProps } from 'react-bootstrap';
  import React from 'react';
  
  interface FormComponent extends React.FC<FormProps> {
    Group: React.FC<FormGroupProps>;
    Label: React.FC<FormLabelProps>;
    Control: React.FC<FormControlProps>;
    Select: React.FC<FormSelectProps>;
    Check: React.FC<any>;
  }
  
  const Form: FormComponent;
  export default Form;
}

declare module 'react-bootstrap/Card' {
  import { CardProps, CardHeaderProps, CardBodyProps } from 'react-bootstrap';
  import React from 'react';
  
  interface CardComponent extends React.FC<CardProps> {
    Header: React.FC<CardHeaderProps>;
    Body: React.FC<CardBodyProps>;
  }
  
  const Card: CardComponent;
  export default Card;
}

declare module 'react-bootstrap/Row' {
  import { RowProps } from 'react-bootstrap';
  import React from 'react';
  
  const Row: React.FC<RowProps>;
  export default Row;
}

declare module 'react-bootstrap/Col' {
  import { ColProps } from 'react-bootstrap';
  import React from 'react';
  
  const Col: React.FC<ColProps>;
  export default Col;
}

declare module 'react-bootstrap/Badge' {
  import { BadgeProps } from 'react-bootstrap';
  import React from 'react';
  
  const Badge: React.FC<BadgeProps>;
  export default Badge;
}

declare module 'react-bootstrap/Table' {
  import { TableProps } from 'react-bootstrap';
  import React from 'react';
  
  const Table: React.FC<TableProps>;
  export default Table;
}

declare module 'react-bootstrap/Spinner' {
  import { SpinnerProps } from 'react-bootstrap';
  import React from 'react';
  
  const Spinner: React.FC<SpinnerProps>;
  export default Spinner;
}

declare module 'react-bootstrap/Alert' {
  import { AlertProps } from 'react-bootstrap';
  import React from 'react';
  
  const Alert: React.FC<AlertProps>;
  export default Alert;
}

declare module 'react-bootstrap/Container' {
  import { ContainerProps } from 'react-bootstrap';
  import React from 'react';
  
  const Container: React.FC<ContainerProps>;
  export default Container;
}

declare module 'react-bootstrap/Modal' {
  import { ModalProps } from 'react-bootstrap';
  import React from 'react';
  
  interface ModalComponent extends React.FC<ModalProps> {
    Header: React.FC<any>;
    Title: React.FC<any>;
    Body: React.FC<any>;
    Footer: React.FC<any>;
  }
  
  const Modal: ModalComponent;
  export default Modal;
}

declare module 'react-bootstrap/ThemeProvider' {
  import React from 'react';
  
  interface ThemeProviderProps {
    children?: React.ReactNode;
    prefixes?: Record<string, string>;
    dir?: string;
  }
  
  const ThemeProvider: React.FC<ThemeProviderProps>;
  export default ThemeProvider;
} 
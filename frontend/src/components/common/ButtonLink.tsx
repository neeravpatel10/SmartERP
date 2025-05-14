import React from 'react';
import { Button, ButtonProps } from 'react-bootstrap';
import { Link, LinkProps } from 'react-router-dom';

// Create a custom ButtonLink component that combines Button and Link
interface ButtonLinkProps extends Omit<ButtonProps, 'as' | 'href'> {
  to: LinkProps['to'];
  children: React.ReactNode;
}

const ButtonLink: React.FC<ButtonLinkProps> = ({ to, children, ...buttonProps }) => {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Button {...buttonProps}>{children}</Button>
    </Link>
  );
};

export default ButtonLink;

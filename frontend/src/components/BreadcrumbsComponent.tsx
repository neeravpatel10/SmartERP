import React from 'react';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface BreadcrumbLink {
  name: string;
  path: string;
}

interface BreadcrumbsComponentProps {
  links: BreadcrumbLink[];
  currentPage: string;
}

const BreadcrumbsComponent: React.FC<BreadcrumbsComponentProps> = ({
  links,
  currentPage,
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        {links.map((link, index) => (
          <Link
            key={index}
            component={RouterLink}
            to={link.path}
            underline="hover"
            color="inherit"
          >
            {link.name}
          </Link>
        ))}
        <Typography color="text.primary">{currentPage}</Typography>
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbsComponent; 
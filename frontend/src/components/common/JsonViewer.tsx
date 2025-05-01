import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  IconButton,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`json-tabpanel-${index}`}
      aria-labelledby={`json-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StyledPre = styled('pre')({
  margin: 0,
  fontSize: '0.9rem',
  maxHeight: '400px',
  overflow: 'auto',
  backgroundColor: '#f5f5f5',
  padding: '16px',
  borderRadius: '4px'
});

interface MetadataDisplayProps {
  data: Record<string, any>;
}

const MetadataDisplay: React.FC<MetadataDisplayProps> = ({ data }) => {
  return (
    <Grid container spacing={2}>
      {Object.entries(data).map(([key, value]) => (
        <React.Fragment key={key}>
          <Grid item xs={4}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2">
              {value === null || value === undefined ? '—' : String(value)}
            </Typography>
          </Grid>
        </React.Fragment>
      ))}
    </Grid>
  );
};

export interface JsonViewerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data: {
    old?: Record<string, unknown>;
    new?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
}

const JsonViewer: React.FC<JsonViewerProps> = ({ open, onClose, title, data }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatJson = (json: Record<string, unknown> | undefined) => {
    if (!json) return 'null';
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      return 'Invalid JSON';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {title}
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="json viewer tabs"
        >
          <Tab label="Metadata" />
          <Tab label="Previous State" disabled={!data.old} />
          <Tab label="New State" disabled={!data.new} />
          <Tab label="Diff" disabled={!data.old || !data.new} />
        </Tabs>
      </Box>

      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          {data.metadata ? (
            <Paper elevation={0} sx={{ p: 2 }}>
              <MetadataDisplay data={data.metadata} />
            </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No metadata available
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {data.old ? (
            <StyledPre>{formatJson(data.old)}</StyledPre>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No previous state available
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {data.new ? (
            <StyledPre>{formatJson(data.new)}</StyledPre>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No new state available
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {data.old && data.new ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Previous State
                </Typography>
                <StyledPre>{formatJson(data.old)}</StyledPre>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  New State
                </Typography>
                <StyledPre>{formatJson(data.new)}</StyledPre>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Cannot display diff because either previous or new state is missing
            </Typography>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JsonViewer; 
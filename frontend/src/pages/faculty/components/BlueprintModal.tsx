import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  IconButton,
  Grid,
  Stack,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
// Import all types directly from useInternalMarks
import { Blueprint, Question, SubQuestion } from '../../../hooks/useInternalMarks';

interface BlueprintModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (blueprint: Blueprint) => void;
  initialData: Blueprint | null;
}

const BlueprintModal: React.FC<BlueprintModalProps> = ({
  open,
  onClose,
  onSave,
  initialData
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expanded, setExpanded] = useState<number | false>(false);

  // Initialize with default questions if no initial data
  useEffect(() => {
    if (initialData && initialData.questions) {
      setQuestions(initialData.questions);
    } else {
      // Create default structure for 4 questions
      const defaultQuestions: Question[] = [];
      for (let i = 1; i <= 4; i++) {
        defaultQuestions.push({
          questionNo: i,
          subs: [{ label: `${i}a`, maxMarks: 5 }]
        });
      }
      setQuestions(defaultQuestions);
      setExpanded(1); // Expand the first question by default
    }
  }, [initialData, open]);

  const handleAccordionChange = (panel: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleAddSubQuestion = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    const lastSub = question.subs[question.subs.length - 1];
    
    // Get the next label (increment the last letter)
    const lastChar = lastSub.label.charAt(lastSub.label.length - 1);
    const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
    const newLabel = question.questionNo + nextChar;
    
    question.subs.push({
      label: newLabel,
      maxMarks: 5
    });
    
    setQuestions(updatedQuestions);
  };

  const handleRemoveSubQuestion = (questionIndex: number, subIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    // Don't allow removing the last sub-question
    if (question.subs.length <= 1) return;
    
    question.subs.splice(subIndex, 1);
    setQuestions(updatedQuestions);
  };

  const handleSubQuestionChange = (questionIndex: number, subIndex: number, field: keyof SubQuestion, value: string | number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    if (field === 'maxMarks') {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) return;
      question.subs[subIndex][field] = numValue;
    } else {
      // Safe to assign string value to the right field
      question.subs[subIndex][field] = value as string;
    }
    
    setQuestions(updatedQuestions);
  };

  const handleSave = () => {
    // Validate questions
    let isValid = true;
    let errorMessage = '';
    
    questions.forEach(question => {
      // Check for duplicate labels within question
      const labels = question.subs.map(sub => sub.label);
      const uniqueLabels = new Set(labels);
      
      if (labels.length !== uniqueLabels.size) {
        isValid = false;
        errorMessage = `Question ${question.questionNo} has duplicate labels`;
      }
      
      // Check for empty labels or zero/negative marks
      question.subs.forEach(sub => {
        if (!sub.label.trim()) {
          isValid = false;
          errorMessage = `Question ${question.questionNo} has empty labels`;
        }
        
        if (sub.maxMarks <= 0) {
          isValid = false;
          errorMessage = `Question ${question.questionNo} has invalid marks`;
        }
      });
    });
    
    if (!isValid) {
      alert(errorMessage);
      return;
    }
    
    // Prepare data for saving
    const blueprint: Blueprint = {
      ...(initialData || {}),
      questions: questions,
      subjectId: initialData?.subjectId || 0,
      cieNo: initialData?.cieNo || 1
    };
    
    onSave(blueprint);
  };

  // Calculate total max marks
  const totalMaxMarks = questions.reduce((total, q) => {
    return total + q.subs.reduce((subTotal, sub) => subTotal + sub.maxMarks, 0);
  }, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Blueprint' : 'Create Blueprint'}
      </DialogTitle>
      
      <DialogContent>
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Define the blueprint structure for each question. Each CIE contains 4 questions.
          </Typography>
          
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Total Max Marks: {totalMaxMarks}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {questions.map((question, questionIndex) => (
          <Accordion 
            key={question.questionNo}
            expanded={expanded === question.questionNo}
            onChange={handleAccordionChange(question.questionNo)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Grid container justifyContent="space-between" alignItems="center">
                <Grid item>
                  <Typography variant="subtitle1">
                    Question {question.questionNo}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body2">
                    {question.subs.length} sub-questions | 
                    Total: {question.subs.reduce((sum, sub) => sum + sub.maxMarks, 0)} marks
                  </Typography>
                </Grid>
              </Grid>
            </AccordionSummary>
            
            <AccordionDetails>
              <Stack spacing={2}>
                {question.subs.map((subq, subIndex) => (
                  <Grid container key={subIndex} spacing={2} alignItems="center">
                    <Grid item xs={4}>
                      <TextField
                        label="Label"
                        fullWidth
                        value={subq.label}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSubQuestionChange(questionIndex, subIndex, 'label', e.target.value)}
                      />
                    </Grid>
                    
                    <Grid item xs={4}>
                      <TextField
                        label="Max Marks"
                        type="number"
                        fullWidth
                        value={subq.maxMarks}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSubQuestionChange(questionIndex, subIndex, 'maxMarks', e.target.value)}
                      />
                    </Grid>
                    
                    <Grid item xs={4}>
                      <IconButton 
                        color="secondary"
                        onClick={() => handleRemoveSubQuestion(questionIndex, subIndex)}
                        disabled={question.subs.length <= 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddSubQuestion(questionIndex)}
                  variant="outlined"
                >
                  Add Sub-question
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save Blueprint
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlueprintModal;

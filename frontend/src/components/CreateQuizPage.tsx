import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  IconButton,
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material'; // Import icons
import { useNavigate } from 'react-router-dom';
import { SetContext } from './App';
import { NavigationBar } from './home-page/NavigationBar';
import { callBackend } from '../helper';

export const CreateQuizPage: React.FC = () => {
  const context = useContext(SetContext);
  if (!context) {
    throw new Error('CreateQuizPage must be used within a SetProvider');
  }

  const { set } = context;
  const navigate = useNavigate();
  const [terms, setTerms] = useState<
    { front: string; back: string; key: string; order: number }[]
  >([]); // Added `order` property

  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: string]: string;
  }>({});
  const [choices, setChoices] = useState<{
    [key: string]: {
      isCorrect: boolean;
      text: string;
      isLLM: boolean;
    }[];
  }>({});
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [freeResponseTerms, setFreeResponseTerms] = useState<Set<string>>(
    new Set()
  );
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(true);
  const [multipleChoiceEnabled, setMultipleChoiceEnabled] = useState(true);
  const [freeResponseEnabled, setFreeResponseEnabled] = useState(false);
  const [quizReady, setQuizReady] = useState(false);

  const shuffleArray = (array: any[]) => array.sort(() => Math.random() - 0.5);

  const handleSettingsConfirm = () => {
    // Simulated data for testing with `order`
    const simulatedTerms = [
      { front: 'Term 1', back: 'Definition 1', key: '1', order: 0 },
      { front: 'Term 2', back: 'Definition 2', key: '2', order: 1 },
      { front: 'Term 3', back: 'Definition 3', key: '3', order: 2 },
    ];
    setTerms(simulatedTerms);
    setIsSettingsModalOpen(false);
    setQuizReady(true);
  };

  const handleReorder = (index: number, direction: 'up' | 'down') => {
    const newTerms = [...terms];
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < terms.length - 1)
    ) {
      const swapIndex = direction === 'up' ? index - 1 : index + 1;

      // Swap the `order` attributes of the two elements
      [newTerms[index].order, newTerms[swapIndex].order] = [
        newTerms[swapIndex].order,
        newTerms[index].order,
      ];

      // Swap the positions of the elements in the array
      [newTerms[index], newTerms[swapIndex]] = [
        newTerms[swapIndex],
        newTerms[index],
      ];

      setTerms(newTerms); // Update state
    }
  };

  const handleAnswerSelect = (termKey: string, selectedAnswer: string) => {
    setSelectedAnswers((prevAnswers) => ({
      ...prevAnswers,
      [termKey]: selectedAnswer,
    }));
  };

  const handleDisplayResults = () => {
    setIsResultsOpen(true);
    setShowFeedback(true);
  };

  const handleCloseResults = () => {
    setIsResultsOpen(false);
  };

  const handleBack = () => {
    navigate('/create-set');
  };

  const correctCount = terms.reduce((count, term) => {
    const userAnswer = selectedAnswers[term.key] || '';
    const isCorrect = freeResponseTerms.has(term.key)
      ? userAnswer.trim().toLowerCase() === term.back.trim().toLowerCase()
      : userAnswer === term.back;
    return isCorrect ? count + 1 : count;
  }, 0);

  return (
    <>
      <NavigationBar />
      <Box
        sx={{
          padding: 2,
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        {/* Settings Modal */}
        <Dialog open={isSettingsModalOpen} onClose={() => {}}>
          <DialogTitle>Choose Question Types</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={multipleChoiceEnabled}
                    onChange={(e) => setMultipleChoiceEnabled(e.target.checked)}
                  />
                }
                label="Multiple Choice"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={freeResponseEnabled}
                    onChange={(e) => setFreeResponseEnabled(e.target.checked)}
                  />
                }
                label="Free Response"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSettingsConfirm} color="primary">
              Start Test
            </Button>
          </DialogActions>
        </Dialog>

        {quizReady ? (
          <>
            <Typography variant="h4" gutterBottom>
              Quiz on {set.name}
            </Typography>
            {terms.length > 0 ? (
              terms.map((term, index) => (
                <Box
                  key={term.key}
                  sx={{
                    width: '100%',
                    marginBottom: 3,
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                    padding: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">
                      {index + 1}: {term.front}
                    </Typography>
                    <Box>
                      <IconButton
                        onClick={() => handleReorder(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUpward />
                      </IconButton>
                      <IconButton
                        onClick={() => handleReorder(index, 'down')}
                        disabled={index === terms.length - 1}
                      >
                        <ArrowDownward />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography>Loading terms...</Typography>
            )}

            <Button
              variant="contained"
              color="success"
              onClick={handleDisplayResults}
              sx={{ marginTop: 3 }}
            >
              Display Results
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={handleBack}
              sx={{ marginTop: 3, marginRight: 64 }}
            >
              Back to Set
            </Button>
          </>
        ) : null}

        {/* Results Modal */}
        <Dialog open={isResultsOpen} onClose={handleCloseResults}>
          <DialogTitle>Quiz Results</DialogTitle>
          <DialogContent>
            <Typography variant="h6" fontWeight="bold">
              {Math.round((100 * correctCount) / terms.length)}%
            </Typography>
            <Typography variant="h6">
              You got {correctCount} out of {terms.length} correct!
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseResults} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel, Switch } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SetContext } from './App';

const path = 'https://cse115a-project.onrender.com/v0';

export const CreateQuizPage: React.FC = () => {
  const context = useContext(SetContext);
  if (!context) {
    throw new Error('CreateQuizPage must be used within a SetProvider');
  }

  const { set } = context;
  const navigate = useNavigate();
  const [terms, setTerms] = useState<{ front: string; back: string; key: string }[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [choices, setChoices] = useState<{ [key: string]: string[] }>({});
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [freeResponseTerms, setFreeResponseTerms] = useState<Set<string>>(new Set());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(true);
  const [multipleChoiceEnabled, setMultipleChoiceEnabled] = useState(true);
  const [freeResponseEnabled, setFreeResponseEnabled] = useState(false);
  const [quizReady, setQuizReady] = useState(false);

  const shuffleArray = (array: any[]) => array.sort(() => Math.random() - 0.5);

  const handleSettingsConfirm = () => {
    setIsSettingsModalOpen(false);
    setQuizReady(true); // Allow the quiz to render only after settings are confirmed

    const freeResponseSet = new Set<string>();
    if (multipleChoiceEnabled && freeResponseEnabled) {
      const startIndexForFreeResponse = Math.floor(terms.length / 2);
      terms.slice(startIndexForFreeResponse).forEach(term => freeResponseSet.add(term.key));
    } else if (freeResponseEnabled) {
      terms.forEach(term => freeResponseSet.add(term.key));
    }
    setFreeResponseTerms(freeResponseSet);

    const initialChoices = terms.reduce((acc, term) => {
      if (freeResponseSet.has(term.key)) {
        acc[term.key] = [];
      } else {
        const otherBacks = terms.map(t => t.back).filter(back => back !== term.back);
        const incorrectAnswers: string[] = [];
        while (incorrectAnswers.length < 3) {
          const randomBack = otherBacks[Math.floor(Math.random() * otherBacks.length)];
          if (!incorrectAnswers.includes(randomBack)) incorrectAnswers.push(randomBack);
        }
        const options = [term.back, ...incorrectAnswers].sort(() => Math.random() - 0.5);
        acc[term.key] = options;
      }
      return acc;
    }, {} as { [key: string]: string[] });

    setChoices(initialChoices);
  };

  const handleMultipleChoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setMultipleChoiceEnabled(true);
    } else if (freeResponseEnabled) {
      setMultipleChoiceEnabled(false);
    }
  };

  const handleFreeResponseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setFreeResponseEnabled(true);
    } else if (multipleChoiceEnabled) {
      setFreeResponseEnabled(false);
    }
  };

  useEffect(() => {
    let accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
      return;
    }
    accessToken = JSON.parse(accessToken);

    if (set.key) {
      fetch(`${path}/card/${set.key}`, {
        method: 'get',
        headers: new Headers({
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }),
      })
      .then(res => {
        if (res.status === 403 || res.status === 401) {
          navigate('/login');
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        const shuffledTerms = shuffleArray(data);
        setTerms(shuffledTerms);
      })
      .catch(error => console.error('Error fetching terms:', error));
    }
  }, [set, navigate]);

  const handleAnswerSelect = (termKey: string, selectedAnswer: string) => {
    setSelectedAnswers(prevAnswers => ({
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

  const correctCount = terms.reduce((count, term) => {
    const userAnswer = selectedAnswers[term.key] || '';
    const isCorrect = freeResponseTerms.has(term.key)
      ? userAnswer.trim().toLowerCase() === term.back.trim().toLowerCase()
      : userAnswer === term.back;
    return isCorrect ? count + 1 : count;
  }, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 2, gap: 2 }}>
      {/* Settings Modal */}
      <Dialog open={isSettingsModalOpen} onClose={() => {}}>
        <DialogTitle>Choose Question Types</DialogTitle>
        <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={<Switch checked={multipleChoiceEnabled} onChange={handleMultipleChoiceChange} />}
            label="Multiple Choice"
          />
          <FormControlLabel
            control={<Switch checked={freeResponseEnabled} onChange={handleFreeResponseChange} />}
            label="Free Response"
          />
        </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsConfirm} color="primary">Start Test</Button>
        </DialogActions>
      </Dialog>

      {quizReady ? (
        <>
          <Typography variant="h4" gutterBottom>
            Quiz on {set.name}
          </Typography>
          {terms.length > 0 ? (
            terms.map((term, index) => {
              const userAnswer = selectedAnswers[term.key] || '';
              const isCorrect = freeResponseTerms.has(term.key)
                ? userAnswer.trim().toLowerCase() === term.back.trim().toLowerCase()
                : userAnswer === term.back;
              const choicesForTerm = choices[term.key];

              return (
                <Box key={term.key} sx={{ width: '100%', marginBottom: 3 }}>
                  <Typography variant="h6">{index + 1}: {term.front}</Typography>
                  {freeResponseTerms.has(term.key) ? (
                    <TextField
                      label="Your Answer"
                      variant="outlined"
                      value={selectedAnswers[term.key] || ''}
                      onChange={(e) => handleAnswerSelect(term.key, e.target.value)}
                      fullWidth
                    />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1 }}>
                      {choicesForTerm.map((choice, choiceIndex) => (
                        <Button
                          key={choiceIndex}
                          variant="contained"
                          onClick={() => handleAnswerSelect(term.key, choice)}
                          sx={{
                            width: '100%',
                            backgroundColor:
                              showFeedback && choice === term.back ? 'green' :
                              showFeedback && choice === selectedAnswers[term.key] && !isCorrect ? 'red' :
                              selectedAnswers[term.key] === choice ? '#1565c0' : 'primary.main',
                            color: selectedAnswers[term.key] === choice || (showFeedback && choice === term.back) ? '#ffffff' : 'inherit',
                            opacity: showFeedback ? 0.8 : 1,
                          }}
                        >
                          {choice}
                        </Button>
                      ))}
                    </Box>
                  )}
                  {showFeedback && !isCorrect && (
                    <Typography variant="body2" color="error" sx={{ marginTop: 1 }}>
                      Incorrect. Correct answer: {term.back}
                    </Typography>
                  )}
                  {showFeedback && isCorrect && (
                    <Typography variant="body2" color="green" sx={{ marginTop: 1 }}>
                      Correct!
                    </Typography>
                  )}
                </Box>
              );
            })
          ) : (
            <Typography>Loading terms...</Typography>
          )}
          <Button variant="contained" color="success" onClick={handleDisplayResults} sx={{ marginTop: 3 }}>
            Display Results
          </Button>
        </>
      ) : null}

      {/* Results Modal */}
      <Dialog open={isResultsOpen} onClose={handleCloseResults}>
        <DialogTitle>Quiz Results</DialogTitle>
        <DialogContent>
          <Typography variant="h6" fontWeight="bold">
            {100 * correctCount / terms.length}%
          </Typography>
          <Typography variant="h6">
            You got {correctCount} out of {terms.length} correct!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResults} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

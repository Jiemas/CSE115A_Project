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
import { useNavigate } from 'react-router-dom';
import { SetContext } from './App';
import { NavigationBar } from './home-page/NavigationBar';
import { callBackend } from '../helper';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
export const CreateQuizPage: React.FC = () => {
  const context = useContext(SetContext);
  if (!context) {
    throw new Error('CreateQuizPage must be used within a SetProvider');
  }

  const { set, setSet } = context;
  const navigate = useNavigate();
  const [terms, setTerms] = useState<
    { front: string; back: string; key: string }[] //; llm: boolean
  >([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: string]: string;
  }>({});
  const [choices, setChoices] = useState<{
    [key: string]: {
      isCorrect: boolean;
      text: string;
      isLLM: boolean;
    }[]; // changed this, used to be string[]
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

  const handleMultipleChoiceChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      setMultipleChoiceEnabled(true);
    } else if (freeResponseEnabled) {
      setMultipleChoiceEnabled(false);
    }
  };

  const handleFreeResponseChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      setFreeResponseEnabled(true);
    } else if (multipleChoiceEnabled) {
      setFreeResponseEnabled(false);
    }
  };

  const getToken = () => {
    let accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    }
    return JSON.parse(accessToken);
  };

  // edited with isLLM property
  const randomlySelect = (
    otherBacks: string[],
    selectNum: number,
    isLLM: boolean
  ) => {
    const incorrectAnswers: { text: string; isLLM: boolean }[] = [];
    while (incorrectAnswers.length < selectNum) {
      const randomBack =
        otherBacks[Math.floor(Math.random() * otherBacks.length)];
      if (!incorrectAnswers.some(answer => answer.text === randomBack)) {
        incorrectAnswers.push({ text: randomBack, isLLM });
      }
    }
    return incorrectAnswers;
  };

  const getSet = () => {
    const storageSet = sessionStorage.getItem('set');
    if (!storageSet) {
      navigate('/login');
    }
    const savedSet = JSON.parse(storageSet);
    if (savedSet.name !== set.name) {
      setSet(savedSet);
    }
    return savedSet;
  };

  const handleSettingsConfirm = () => {
    const accessToken = getToken();
    const savedSet = getSet();
    if (savedSet.key) {
      callBackend('get', `card/${savedSet.key}`, accessToken)
        .then(res => {
          if (res.status === 403 || res.status === 401) {
            navigate('/login');
            throw new Error('Unauthorized');
          }
          return res.json();
        })
        .then(data => {
          // Shuffle terms before setting them in state
          const shuffledTerms = shuffleArray(data);
          const termsCopy = JSON.parse(JSON.stringify(data));
          setTerms(shuffledTerms);
          // Generate choices for each term using unique random options
          const initialChoices = shuffledTerms.reduce(
            (acc, term) => {
              // Filter out the current term's `back` value to avoid duplication
              const otherBacks = termsCopy
                .map((t: { back: any }) => t.back)
                .filter((back: string) => back !== term.back);
              let numLLMTerms = 0;
              const numDesiredLLMTerms = 1;
              let incorrectAnswers: { text: string; isLLM: boolean }[] = [];
              if (term.wrong && term.wrong != 2 && numDesiredLLMTerms > 0) {
                incorrectAnswers = incorrectAnswers.concat(
                  randomlySelect(term.wrong, numDesiredLLMTerms, true)
                );
                numLLMTerms = numDesiredLLMTerms;
              }
              const chanceOfLLMCorrect = 0.75;
              let correctAnswerIsLLM = false;
              if (
                term.correct &&
                term.correct != 2 &&
                Math.random() < chanceOfLLMCorrect &&
                multipleChoiceEnabled &&
                !freeResponseEnabled
              ) {
                term.back = randomlySelect(
                  term.correct,
                  numDesiredLLMTerms,
                  true
                )[0].text;
                correctAnswerIsLLM = true;
              }
              incorrectAnswers = incorrectAnswers.concat(
                randomlySelect(otherBacks, 3 - numLLMTerms, false)
              );
              const options = [
                {
                  text: term.back,
                  isLLM: correctAnswerIsLLM,
                  isCorrect: true,
                },
                ...incorrectAnswers,
              ].sort(() => Math.random() - 0.5);
              acc[term.key] = options;
              return acc;
            },
            // {} as { [key: string]: string[] }
            {} as { [key: string]: { text: string; isLLM: boolean }[] }
          );

          setChoices(initialChoices);
          setIsSettingsModalOpen(false);
          setQuizReady(true); // Allow the quiz to render only after settings are confirmed
          const freeResponseSet = new Set<string>();
          if (multipleChoiceEnabled && freeResponseEnabled) {
            const startIndexForFreeResponse = Math.floor(termsCopy.length / 2);
            termsCopy
              .slice(startIndexForFreeResponse)
              .forEach(term => freeResponseSet.add(term.key));
          } else if (freeResponseEnabled) {
            termsCopy.forEach(term => freeResponseSet.add(term.key));
          }
          setFreeResponseTerms(freeResponseSet);
        })
        .catch(error => console.error('Error fetching terms:', error));
    }
  };

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
                    onChange={handleMultipleChoiceChange}
                  />
                }
                label='Multiple Choice'
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={freeResponseEnabled}
                    onChange={handleFreeResponseChange}
                  />
                }
                label='Free Response'
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSettingsConfirm} color='primary'>
              Start Test
            </Button>
          </DialogActions>
        </Dialog>

        {quizReady ? (
          <>
            <Typography variant='h4' gutterBottom>
              Quiz on {set.name}
            </Typography>
            {terms.length > 0 ? (
              terms.map((term, index) => {
                const userAnswer = selectedAnswers[term.key] || '';
                const isCorrect = freeResponseTerms.has(term.key)
                  ? userAnswer.trim().toLowerCase() ===
                    term.back.trim().toLowerCase()
                  : userAnswer === term.back;
                const choicesForTerm = choices[term.key];

                return (
                  <Box
                    key={term.key}
                    sx={{
                      width: '100%',
                      marginBottom: 3,
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      padding: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        transform: 'translateY(-2px)',
                      },
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <Typography variant='h6'>
                      {index + 1}: {term.front}
                    </Typography>
                    {freeResponseTerms.has(term.key) ? (
                      <TextField
                        multiline
                        label='Your Answer'
                        variant='outlined'
                        value={selectedAnswers[term.key] || ''}
                        onChange={e =>
                          handleAnswerSelect(term.key, e.target.value)
                        }
                        fullWidth
                      />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 2,
                          marginTop: 2,
                        }}
                      >
                        {choicesForTerm.map((choice, choiceIndex) => (
                          <Box
                            key={choiceIndex}
                            sx={{ flexBasis: 'calc(50% - 8px)', flexGrow: 1 }}
                          >
                            <Button
                              key={choiceIndex}
                              variant='outlined'
                              onClick={() =>
                                handleAnswerSelect(term.key, choice.text)
                              }
                              sx={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#FFFFFF',
                                borderWidth: 3,
                                borderStyle: 'solid',
                                textTransform: 'none',
                                borderColor:
                                  showFeedback && choice.text === term.back
                                    ? 'green'
                                    : showFeedback &&
                                        choice.text ===
                                          selectedAnswers[term.key] &&
                                        !isCorrect
                                      ? 'red'
                                      : selectedAnswers[term.key] ===
                                          choice.text
                                        ? '#abdbe3'
                                        : '#FFFFFF',
                                color:
                                  selectedAnswers[term.key] === choice.text ||
                                  (showFeedback && choice.text === term.back)
                                    ? '#000000'
                                    : '#000000',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                opacity: showFeedback ? 0.9 : 1,
                                '&:hover': {
                                  backgroundColor: '#abdbe3', // This will maintain the current background color on hover
                                  opacity: 0.9, // This will slightly dim the button on hover
                                },
                              }}
                            >
                              {choice.text} {choice.isLLM && '(AI)'}
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    )}
                    {showFeedback && !isCorrect && (
                      <Typography
                        variant='body2'
                        color='error'
                        sx={{ marginTop: 1 }}
                      >
                        Incorrect. Correct answer: {term.back}
                      </Typography>
                    )}
                    {showFeedback && isCorrect && (
                      <Typography
                        variant='body2'
                        color='green'
                        sx={{ marginTop: 1 }}
                      >
                        Correct!
                      </Typography>
                    )}
                  </Box>
                );
              })
            ) : (
              <Typography>Loading terms...</Typography>
            )}
            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <IconButton
              variant='contained'
              color='primary'
              onClick={handleBack}
              sx={{ marginTop: 3 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Button
              variant='contained'
              color='success'
              onClick={handleDisplayResults}
              sx={{ marginTop: 3 }}
            >
              Display Results
            </Button>
            </Box>

            
          </>
        ) : null}

        {/* Results Modal */}
        <Dialog open={isResultsOpen} onClose={handleCloseResults}>
          <DialogTitle>Quiz Results</DialogTitle>
          <DialogContent>
            <Typography variant='h6' fontWeight='bold'>
              {(100 * correctCount) / terms.length}%
            </Typography>
            <Typography variant='h6'>
              {Math.round((100 * correctCount) / terms.length)}%
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseResults} color='primary'>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
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

  // Function to shuffle an array
  const shuffleArray = (array: any[]) => {
    return array.sort(() => Math.random() - 0.5);
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

  useEffect(() => {
    const accessToken = getToken();
    if (set.key) {
      callBackend('get', `card/${set.key}`, accessToken)
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
              if (term.wrong && numDesiredLLMTerms > 0) {
                incorrectAnswers = incorrectAnswers.concat(
                  randomlySelect(term.wrong, numDesiredLLMTerms, true)
                );
                numLLMTerms = numDesiredLLMTerms;
              }
              const chanceOfLLMCorrect = 0.25;
              let correctAnswerIsLLM = false;
              if (term.correct && Math.random() < chanceOfLLMCorrect) {
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

  const handleBack = () => {
    navigate('/create-set');
  };

  // Calculate the number of correct answers
  const correctCount = terms.reduce((count, term) => {
    const isCorrect = selectedAnswers[term.key] === term.back;
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
        <Typography variant='h4' gutterBottom>
          Quiz on {set.name}
        </Typography>
        {terms.length > 0 ? (
          terms.map((term, index) => {
            const isCorrect = selectedAnswers[term.key] === term.back;
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
                        variant='contained'
                        onClick={() =>
                          handleAnswerSelect(term.key, choice.text)
                        }
                        // disabled={showFeedback} // Keep button highlighted after display results
                        sx={{
                          height: '100%',
                          width: '100%',
                          backgroundColor:
                            showFeedback && choice.isCorrect
                              ? 'green'
                              : showFeedback &&
                                  choice.text === selectedAnswers[term.key] &&
                                  !isCorrect
                                ? 'red'
                                : selectedAnswers[term.key] === choice.text
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
                        {choice.text} {choice.isLLM && '(LLM)'}
                      </Button>
                    </Box>
                  ))}
                </Box>
                {showFeedback && !isCorrect && (
                  <Typography
                    variant='body2'
                    color='error'
                    sx={{ marginTop: 1 }}
                  >
                    Incorrect. Correct answer: {term.back} Original answer:
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
        <Button
          variant='contained'
          color='primary'
          onClick={handleBack}
          sx={{ marginTop: 3, marginRight: 65}}
        >
          Back to Set
        </Button>
        <Button
          variant='contained'
          color='success'
          onClick={handleDisplayResults}
          sx={{ marginTop: 3}}
        >
          Display Results
        </Button>
        

        {/* Results Modal */}
        <Dialog open={isResultsOpen} onClose={handleCloseResults}>
          <DialogTitle>Quiz Results</DialogTitle>
          <DialogContent>
            <Typography variant='h6' fontWeight='bold'>
              {Math.floor((100 * correctCount) / terms.length)}%
            </Typography>
            <Typography variant='h6'>
              You got {correctCount} out of {terms.length} correct!
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

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
    { front: string; back: string; key: string }[]
  >([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: string]: string;
  }>({});
  const [choices, setChoices] = useState<{ [key: string]: string[] }>({});
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

  const randomlySelect = (otherBacks: string[], selectNum: number) => {
    const incorrectAnswers: string[] = [];
    while (incorrectAnswers.length < selectNum) {
      const randomBack =
        otherBacks[Math.floor(Math.random() * otherBacks.length)];
      if (!incorrectAnswers.includes(randomBack)) {
        incorrectAnswers.push(randomBack);
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
          setTerms(shuffledTerms);

          // Generate choices for each term using unique random options
          const initialChoices = shuffledTerms.reduce(
            (acc, term) => {
              // Filter out the current term's `back` value to avoid duplication
              const otherBacks = shuffledTerms
                .map(t => t.back)
                .filter(back => back !== term.back);
              let numLLMTerms = 0;
              let incorrectAnswers: string[] = [];
              if (term.wrong && term.wrong != 1 && term.wrong != 2) {
                const numDesiredLLMTerms = 1;
                /*
                incorrectAnswers = incorrectAnswers.concat(
                  randomlySelect(['fake', 'fake again', 'doubly fake'], numDesiredLLMTerms)
                );
                */
                // This is the real code, above is just hardcoded for testing
                incorrectAnswers = incorrectAnswers.concat(
                  randomlySelect(term.wrong, numDesiredLLMTerms)
                );
                numLLMTerms = numDesiredLLMTerms;
              }
              const chanceOfLLMCorrect = 0.5;
              if (
                term.correct &&
                term.correct != 1 &&
                Math.random() < chanceOfLLMCorrect
              ) {
                // term.back = randomlySelect(['fake answer', 'this cant be right'], 1)[0];
                // This is the real code, above is just hardcoded for testing
                term.back = randomlySelect(term.correct, 1)[0];
              }
              incorrectAnswers = incorrectAnswers.concat(
                randomlySelect(otherBacks, 3 - numLLMTerms)
              );

              // Combine the correct answer with incorrect answers and shuffle them
              const options = [term.back, ...incorrectAnswers].sort(
                () => Math.random() - 0.5
              );
              acc[term.key] = options;
              return acc;
            },
            {} as { [key: string]: string[] }
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

  const handleLLM = () => {
    const accessToken = getToken();
    if (set.key) {
      callBackend('post', `llm/${set.key}`, accessToken);
    }
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 2,
          gap: 2,
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
              <Box key={term.key} sx={{ width: '100%', marginBottom: 3 }}>
                <Typography variant='h6'>
                  {index + 1}: {term.front}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    marginTop: 1,
                  }}
                >
                  {choicesForTerm.map((choice, choiceIndex) => (
                    <Button
                      key={choiceIndex}
                      variant='contained'
                      onClick={() => handleAnswerSelect(term.key, choice)}
                      // disabled={showFeedback} // Keep button highlighted after display results
                      sx={{
                        width: '100%',
                        backgroundColor:
                          showFeedback && choice === term.back
                            ? 'green'
                            : showFeedback &&
                                choice === selectedAnswers[term.key] &&
                                !isCorrect
                              ? 'red'
                              : selectedAnswers[term.key] === choice
                                ? '#1565c0'
                                : 'primary.main',
                        color:
                          selectedAnswers[term.key] === choice ||
                          (showFeedback && choice === term.back)
                            ? '#ffffff'
                            : '#F2EBE3',
                        opacity: showFeedback ? 0.8 : 1,
                      }}
                    >
                      {choice}
                    </Button>
                  ))}
                </Box>
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
        <Button
          variant='contained'
          color='success'
          onClick={handleDisplayResults}
          sx={{ marginTop: 3 }}
        >
          Display Results
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleLLM}
          sx={{ marginTop: 3 }}
        >
          LLM
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleBack}
          sx={{ marginTop: 3 }}
        >
          Back to Set
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

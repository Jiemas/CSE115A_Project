import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, Typography } from '@mui/material';
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
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [choices, setChoices] = useState<string[]>([]); // Stores multiple-choice options
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

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
        setTerms(data);
      })
      .catch(error => console.error('Error fetching terms:', error));
    }
  }, [set, navigate]);

  // Generate answer choices when the current term changes
  useEffect(() => {
    if (terms.length > 0) {
      // Generate choices with the correct answer and placeholders
      const newChoices = [
        terms[currentTermIndex].back, // Correct answer
        'Wrong answer',
        'Wrong answer',
        'Wrong answer',
      ].sort(() => Math.random() - 0.5); // Shuffle once when the term loads

      setChoices(newChoices); // Set the shuffled choices once
    }
  }, [currentTermIndex, terms]);

  const handleCheckAnswer = (selectedAnswer: string) => {
    const correctAnswer = terms[currentTermIndex].back;
    setIsAnswerCorrect(selectedAnswer === correctAnswer);
  };

  const handleNextTerm = () => {
    setIsAnswerCorrect(null);
    //Currently just cycles infinitely
    setCurrentTermIndex((prevIndex) => (prevIndex + 1) % terms.length);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Quiz on {set.name}
      </Typography>
      {terms.length > 0 ? (
        <>
          <Typography variant="h6">
            Term: {terms[currentTermIndex].front}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2, width: '100%' }}>
            {choices.map((choice, index) => (
              <Button
                key={index}
                variant="contained"
                color="primary"
                onClick={() => handleCheckAnswer(choice)}
                sx={{ width: '100%' }}
              >
                {choice}
              </Button>
            ))}
          </Box>
          {isAnswerCorrect !== null && (
            <Typography variant="body1" color={isAnswerCorrect ? 'success.main' : 'error.main'} sx={{ marginTop: 2 }}>
              {isAnswerCorrect ? 'Correct!' : `Incorrect, the answer is "${terms[currentTermIndex].back}"`}
            </Typography>
          )}
          <Button variant="contained" onClick={handleNextTerm} sx={{ marginTop: 2 }}>
            Next Term
          </Button>
        </>
      ) : (
        <Typography>Loading terms...</Typography>
      )}
    </Box>
  );
};

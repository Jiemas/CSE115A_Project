import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SetContext } from './App';

const path = 'https://cse115a-project.onrender.com/v0';

const CreateQuizPage: React.FC = () => {
  const context = useContext(SetContext);
  if (!context) {
    throw new Error('CreateQuizPage must be used within a SetProvider');
  }
  
  const { set } = context;
  const navigate = useNavigate();
  const [terms, setTerms] = useState<{ front: string; back: string; key: string }[]>([]);
  const [currentTermIndex, setCurrentTermIndex] = useState(0); // Track current term for quizzing
  const [answer, setAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    let accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
      return;
    }
    accessToken = JSON.parse(accessToken);

    // Fetch terms for the quiz
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

  const handleCheckAnswer = () => {
    const correctAnswer = terms[currentTermIndex].back;
    setIsAnswerCorrect(answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase());
  };

  const handleNextTerm = () => {
    setIsAnswerCorrect(null);
    setAnswer('');
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
          <TextField
            label="Your Answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" color="primary" onClick={handleCheckAnswer} sx={{ marginTop: 2 }}>
            Check Answer
          </Button>
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

export default CreateQuizPage;

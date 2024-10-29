import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';

const path = 'http://localhost:3001/v0';
// const path = 'https://cse115a-project.onrender.com/v0';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
  
    fetch(`${path}/login`, {
      method: 'POST',
      body: JSON.stringify({email: username, password: password}),
      headers: {'Content-Type': 'application/json'}
    })
      .then((res) => {
        if (!res.ok) {
          alert('Invalid email or password');
          setLoading(false);
          throw res;
        }
        return res.json();
      })
      .then(async (json) => {
        sessionStorage.setItem('accessToken', JSON.stringify(json.accessToken));
        setLoading(false);
        navigate('/');
      });

  };

  return (
    <Stack alignItems="center">
      <Paper
        elevation={3}
        sx={{
          p: 2.5,
          width: '85%',
          position: 'relative',
          maxWidth: '500px',
        }}
      >
        <Typography variant="h4" mb={1.5} textAlign={'center'}>
          Log In
        </Typography>
        {loading && (
          <Stack
            justifyContent="center"
            alignItems="center"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Stack>
        )}
        <form onSubmit={handleLogin}>
          <Stack
            spacing={1}
            display="flex"
            justifyContent="center"
            alignItems="left"
          >
            <TextField
              label="Email"
              variant="outlined"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              size="medium"
              //required
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              //required
            />
            <Stack display="flex" justifyContent="center" alignItems="center">
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !username || !password ? true : false}
                sx={{ width: '30%' }}
                color="primary"
              >
                Login
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
};
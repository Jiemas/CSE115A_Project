import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import { useAuth, UserRole } from '../auth/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole | ''>('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    /* 
    Backend Task:
    Here, add code to connect to the backend and verify user credentials.
    (additionally need to add functionality to create new users, and 'forgot password'
    -> will require full-stack implementation)
    */

    // simple method to simulate network delay & route to homepage after log in
    setTimeout(async () => {
      if (role !== '') {
        await setUser({ id: '1', role });
        setLoading(false);
        navigate('/home');
      } else {
        setLoading(false);
      }
    }, 1300);
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
              label="Username"
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
            <FormControl sx={{ width: '30%' }} size="small">
              <InputLabel required>User Role</InputLabel>
              <Select
                labelId="role-select-label"
                id="role-select"
                value={role}
                label="User Role"
                onChange={e => setRole(e.target.value as UserRole)}
              >
                <MenuItem value={UserRole.Admin}>Admin</MenuItem>
                <MenuItem value={UserRole.Viewer}>Viewer</MenuItem>
              </Select>
            </FormControl>
            <Stack display="flex" justifyContent="center" alignItems="center">
              <Button
                type="submit"
                variant="contained"
                disabled={!role || loading}
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
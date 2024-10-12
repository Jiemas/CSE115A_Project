import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { Home } from './home-page/HomePage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { LoginPage } from './LoginPage';

export const App: React.FC = ({}) => {
  const theme = createTheme({
    palette: {
      primary: {
        main: '#0b3d91',
      },
      secondary: {
        main: '#FCFCFC',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};
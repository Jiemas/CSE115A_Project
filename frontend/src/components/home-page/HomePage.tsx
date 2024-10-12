import React from 'react';
import { NavigationBar } from './NavigationBar';
import { Box } from '@mui/material';

export const Home: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 0.5,
      }}
    >
      <NavigationBar />
    </Box>
  );
};
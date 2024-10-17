import React from 'react';
import { NavigationBar } from './NavigationBar';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, Button, Stack } from '@mui/material';

// hardcode fake data 
const setArray = [
  {
    card_num: 50,
    description: 'Algebra, Geometry, and more',
    name: 'Math',
    owner: 'User123',
    key: 'set1',
  },
  {
    card_num: 50,
    description: 'Algebra, Geometry, and more',
    name: 'Math',
    owner: 'User123',
    key: 'set1',
  },
  {
    card_num: 50,
    description: 'Algebra, Geometry, and more',
    name: 'Math',
    owner: 'User123',
    key: 'set1',
  },
  {
    card_num: 50,
    description: 'Algebra, Geometry, and more',
    name: 'Math',
    owner: 'User123',
    key: 'set1',
  }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const handleSetClick = (setName: string) => {
    console.log(`Clicked on set: ${setName}`); 
  };
  const handleCreateSet = () => {
    navigate('/create-set');
  };

  const handleImportSet = () => {
    console.log('Import Set button clicked'); 
  };

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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          My Flashcards 
        </Typography>
        <Stack direction="row" spacing={2} sx={{ marginBottom: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateSet}
          >
            Create New Set
          </Button> 
          {/* <Button
            variant="contained"
            color="primary"
            onClick={handleImportSet}
          >
            Import Set
          </Button>  */}
        </Stack>
        <Grid container spacing={2}>
          {setArray.map((set) => (
            <Grid item xs={12} sm={6} md={4} key={set.key}>
              <Button
                onClick={() => handleSetClick(set.name)}
                sx={{
                  textTransform: 'none',  
                  width: '100%',
                }}
              >
                <Card sx={{ minHeight: 150, width: '100%' }}>
                  <CardContent>
                    <Typography variant="h5">{set.name}</Typography>
                    <Typography variant="body2">{set.description}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Cards: {set.card_num} | Owner: {set.owner}
                    </Typography>
                  </CardContent>
                </Card>
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

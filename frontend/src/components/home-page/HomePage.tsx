import React from 'react';
import { NavigationBar } from './NavigationBar';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, Button, Stack } from '@mui/material';

import {SetContext} from '../App';

const path = 'http://localhost:3001/v0';
// const path = 'https://cse115a-project.onrender.com/v0';

let setArray = [
  {
    card_num: 0,
    description: '.',
    name: '.',
    owner: '.',
    key: '.',
  }];

export const Home: React.FC = () => {
  const {setSet} = React.useContext(SetContext);
  const [arraySet, setArraySet] = React.useState(setArray);

  const navigate = useNavigate();
  const handleSetClick = (clicked_set = Object) => {
    setSet(clicked_set);
    navigate('/create-set');
  };
  const handleCreateSet = () => {
    setSet({name: '', description: ''});
    navigate('/create-set');
  };

  const handleImportSet = () => {
    console.log('Import Set button clicked'); 
  };

  React.useEffect(() => {
    fetch(`${path}/set`, {method: 'get'})
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        if (JSON.stringify(setArray) != JSON.stringify(json)) {
          setArraySet(json);
          setArray = arraySet;
        }
      })
  });

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
          <Button
            variant="contained"
            color="primary"
            onClick={handleImportSet}
          >
            Import Set
          </Button> 
        </Stack>
        <Grid container spacing={2}>
          {arraySet.map((set) => (
            <Grid item xs={12} sm={6} md={4} key={set.key}>
              <Button
                onClick={() => handleSetClick(set)}
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

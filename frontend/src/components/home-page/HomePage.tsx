import React from 'react';
import { NavigationBar } from './NavigationBar';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Stack,
} from '@mui/material';
import { SetContext } from '../App';
import { callBackend } from '../../helper';

let setArray = [
  {
    card_num: 0,
    description: '.',
    name: '.',
    owner: '.',
    key: '.',
  },
];
const blankArray = JSON.parse(JSON.stringify(setArray));

export const Home: React.FC = () => {
  const { setSet } = React.useContext(SetContext);
  const [arraySet, setArraySet] = React.useState(setArray);

  const navigate = useNavigate();

  const updateSetThenNavigate = (newSet: object) => {
    setSet(newSet);
    navigate('/create-set');
  };

  const handleSetClick = (clicked_set: object) => {
    if (clicked_set.key == '.') {
      return;
    }
    sessionStorage.setItem('set', JSON.stringify(clicked_set));
    updateSetThenNavigate(clicked_set);
  };

  const handleCreateNewClick = (newSet: object) => {
    sessionStorage.removeItem('set');
    updateSetThenNavigate(newSet);
  };

  React.useEffect(() => {
    const unparsedAccessToken = sessionStorage.getItem('accessToken');
    if (!unparsedAccessToken) {
      navigate('/login');
    }
    const accessToken = JSON.parse(unparsedAccessToken);

    callBackend('get', 'set', accessToken)
      .then(res => {
        if (res.status == 403 || res.status == 401) {
          navigate('/login');
        }
        if (res.status == 404) {
          return blankArray;
        }
        return res.json();
      })
      .then(json => {
        if (JSON.stringify(setArray) != JSON.stringify(json)) {
          setArraySet(json);
          setArray = arraySet;
        }
      });
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
        <Typography variant='h4' gutterBottom>
          My Flashcards
        </Typography>
        <Stack direction='row' spacing={2} sx={{ marginBottom: 4 }}>
          <Button
            variant='contained'
            color='primary'
            onClick={() => handleCreateNewClick({ name: '', description: '' })}
          >
            Create New Set
          </Button>
        </Stack>
        <Grid container spacing={2}>
          {arraySet.map(set =>
            set.name == '.' && set.card_num == 0 ? (
              ''
            ) : (
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
                      <Typography variant='h5'>{set.name}</Typography>
                      <Typography variant='body2'>{set.description}</Typography>
                      <Typography variant='body2' color='textSecondary'>
                        Cards: {set.card_num}
                      </Typography>
                    </CardContent>
                  </Card>
                </Button>
              </Grid>
            )
          )}
        </Grid>
      </Box>
    </Box>
  );
};

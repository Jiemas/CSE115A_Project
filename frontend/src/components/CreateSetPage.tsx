import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from './home-page/NavigationBar';
import {SetContext} from './App';

let terms_copy = [{front: '', back: '', starred: false, key: ''}];

const path = 'http://localhost:3001/v0';
// const path = 'https://cse115a-project.onrender.com/v0';

export const CreateSetPage: React.FC = () => {

  const context = React.useContext(SetContext);
  if (!context) {
    throw new Error('CreateSetPage must be used within a SetProvider');
  }
  const { set, setSet } = context;
  const navigate = useNavigate();
  
  const [changed, setChanged] = useState(false);
  const [confirmSetDelete, setConfirmSetDelete] = useState(false);
  const [setDeleted, setSetDeleted] = useState(false);
  const [setName, setSetName] = useState(set.name);
  const [setDescription, setSetDescription] = useState(set.description);
  const [terms, setTerms] = useState<{ front: string; back: string; starred: boolean;
    key: string; changed: boolean; delete: number; duplicate: boolean }[]>([]); 
  const [error, setError] = useState('');

    const getToken = () => {
      let accessToken = sessionStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/login');
      }
      return JSON.parse(accessToken);
    }

  React.useEffect(() => {
    const accessToken = getToken();

    if (set.name && !setDeleted && !changed) {
      fetch(`${path}/card/${set.key}`, {
        method: 'get',
        headers: new Headers({
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }),
      })
        .then((res) => {
          if (res.status == 403 || res.status == 401) {
            navigate('/login');
            throw res;
          }
          return res.json();
        })
        .then(async (json) => {
          if (JSON.stringify(terms) != JSON.stringify(json) && !changed) {
            await setTerms(json);
          }
        })
    }
  }, [terms]);

  const handleCreateSet = async () => {
    const accessToken = getToken();

    if (!setName || !setDescription) {
      setError('Please fill out all fields');
      return;
    } 
    if (!changed) return;
    setError('');
    const new_set = {description: setDescription, name: setName};
    const answer = await fetch(`${path}/set`, 
      {
        method: 'put',
        headers: new Headers({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        }),
        body: JSON.stringify(new_set)
      }
    )
    const setKey = await answer.json();
    new_set.key = setKey;

    setSetDeleted(true);
    setTimeout(async () => {
      setSet(new_set);
      await fetch(`${path}/card/${new_set.key}`, {
        method: 'get',
        headers: new Headers({
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }),
      })
        .then((res) => res.json())
        .then(async (json) => {
          setTerms(json);
        })
      setSetDeleted(false);
    }, 1300);
  }

  const handleUpdateSet = async () => { 
    const accessToken = getToken();
    setConfirmSetDelete(false);
    if (!setName || !setDescription) {
      setError('Please fill out all fields');
      return;
    } 
    if (!changed) return;
    setError('');
    let setKey = set.key;
    const updated_set = JSON.parse(JSON.stringify(set));
    delete updated_set.key;
    delete updated_set.owner;
    updated_set.name = setName;
    updated_set.description = setDescription;
    updated_set.card_num = terms.filter((term) => term.delete < 2 || !term.delete).length;
    await fetch(`${path}/set/${setKey}`, 
      {
        method: 'put',
        headers: new Headers({
          'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}`,
        }),
        body: JSON.stringify(updated_set)
      }
    );
    
    let err409 = false
    const term_fronts: { [key: string]: number } = {};
    terms.map((term) => {
      if (term_fronts[term.front] && term.delete < 2) {
        term.duplicate = true;
        setError('No duplicate cards allowed');
        err409 = true;
      } else {
        term_fronts[term.front] = 1;
      }
    })

    terms.map((term) => {
      if (term.changed) {
        if (term.delete < 2) {
          const newCard = {front: term.front, back: term.back, starred: term.starred};
          if (term.key) {
            fetch(`${path}/card/${setKey}?cardId=${term.key}`, 
              {
                method: 'post',
                headers: new Headers({
                  'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}`,
                }),
                body: JSON.stringify(newCard)
              }
            )
              .then((answer) => {
                if (!answer.ok) {
                  setError('No duplicate cards allowed');
                }
              })
          } else {
            fetch(`${path}/card/${setKey}`, {
                method: 'put',
                headers: new Headers({
                  'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}`,
                }), body: JSON.stringify(newCard)
              }
            )
              .then((answer) => {
                if (!answer.ok) {
                  setError('No duplicate cards allowed');
                } else {
                  answer.json()
                    .then((res) => {
                      term.key = res;
                    })
                }
              })
          }
        } else {
          if (term.key) {
            fetch(`${path}/card/${set.key}?cardId=${term.key}`, {
              method: 'delete',
              headers: new Headers({
                'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}`,
              }),
            });
          }
        }
      }
    })
    if (!err409) {
      setSetDeleted(true);
      setTimeout(() => {
        setChanged(false);
        setSetDeleted(false);
      }, 1300);
    }
  };

  const handleAddTerm = () => {
    setConfirmSetDelete(false);
    setChanged(true);
    setTerms((prevTerms) => [...prevTerms, { front: '', back: '', starred: false, key: '', changed: true, delete: 0, duplicate: false }]);
  };

  const handleTermChange = (index: number, field: 'front' | 'back', value: string) => {
    setConfirmSetDelete(false);
    setChanged(true);
    const updatedTerms = [...terms];
    updatedTerms[index]['delete'] = 0;
    updatedTerms[index][field] = value;
    updatedTerms[index]['changed'] = true;
    setTerms(updatedTerms);
  };

  const handleDeleteSet = () => {
    const accessToken = getToken();
    if (confirmSetDelete) {
      fetch(`${path}/set/${set.key}`, {
        method: 'delete',
        headers: new Headers({
          'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}`,
        }),
      });
      setSetDeleted(true);
    }
    else {
      setConfirmSetDelete(true);
      setTimeout(() => {
        navigate('/');
      }, 1300);
    }
  }

  const handleDeleteCard = (index: number) => {
    setConfirmSetDelete(false);
    setChanged(true);
    const updatedTerms = [...terms];
    if (!updatedTerms[index]['delete']) {
      updatedTerms[index]['delete'] = 1;
    } else {
      updatedTerms[index]['delete'] += 1;
      updatedTerms[index]['changed'] = true;
    }
    setTerms(updatedTerms);
  }

  return (
    <>
      <NavigationBar /> 
      <Box
        sx={{ display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          {set.name ? 'Edit Flashcard Set' : 'Create New Flashcard Set'}
        </Typography>
        {error && (
          <Typography variant="body2" color="error" sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}
        <TextField
          label="Set Name"
          value={setName}
          onChange={(e) => {
            setSetName(e.target.value);
            setConfirmSetDelete(false);
            setChanged(true);
          }}
          fullWidth
          margin="normal"
          disabled={setDeleted}
        />
        <TextField
          label="Description"
          value={setDescription}
          onChange={(e) => {
            setSetDescription(e.target.value);
            setConfirmSetDelete(false);
            setChanged(true);
          }}
          fullWidth
          margin="normal"
          disabled={setDeleted}
        />  
        {set.name ? '' : 
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateSet}
            sx={{ marginTop: 2 }}
            disabled={setDeleted}
          >
            Create Set
          </Button>
        }
        <Divider> ... </Divider>
        {terms.map((item, index) => (
          !item.delete || item.delete < 2 ?
            <Box key={index} sx={{ display: 'flex', flexDirection: 'row', width: '100%', marginBottom: 1 }}>
              <TextField
                label={`Term ${index + 1}`}
                value={item.front}
                error={item.duplicate}
                color={item.duplicate ? 'warning' : 'primary'}
                onChange={(e) => handleTermChange(index, 'front', e.target.value)}
                fullWidth
                margin="normal"
                disabled={setDeleted}
              />
              <TextField
                label={`Definition ${index + 1}`}
                value={item.back}
                onChange={(e) => handleTermChange(index, 'back', e.target.value)}
                fullWidth
                margin="normal"
                disabled={setDeleted}
              />
              <Button
                variant="contained"
                color={!item.delete ? 'primary' : 'error'}
                onClick={() => handleDeleteCard(index)}
                sx={{ marginTop: 1 }}
                disabled={setDeleted}
              >
                {!item.delete ? 'Delete' : 'Confirm Delete'}
              </Button>
            </Box>
          : ''
        ))}
        {set.name ? 
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddTerm}
              sx={{ marginTop: 1 }}
              disabled={setDeleted}
            >
              Add Another Term
            </Button>
            <Button
              variant="contained"
              color={error ? 'error' : 'success'}
              onClick={handleUpdateSet}
              sx={{ marginTop: 2 }}
              disabled={!changed || setDeleted}
            >
              Update Set
            </Button>
          </>
        : '' }
        {set.name ? 
          <Button
            variant="contained"
            color={confirmSetDelete ? "error" : "primary"}
            onClick={handleDeleteSet}
            sx={{ marginTop: 2 }}
            disabled={setDeleted}
          >
            {confirmSetDelete ? 'Confirm Delete?' : 'Delete Set'}
          </Button>
        : ''}
      </Box>
    </>
  );
};

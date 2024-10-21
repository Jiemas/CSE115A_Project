import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {SetContext} from './App';

let terms_copy = [{front: '', back: '', starred: false, key: ''}];

export const CreateSetPage: React.FC = () => {
  const navigate = useNavigate();
  const {set, setSet} = React.useContext(SetContext);

  const [changed, setChanged] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [setName, setSetName] = useState(set.name);
  const [setDescription, setSetDescription] = useState(set.description);
  const [setCardNum, setSetCardNum] = useState(set.card_num);
  const [terms, setTerms] = useState<{ front: string; back: string; starred: boolean; key: string; changed: boolean }[]>([]); 
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (set.name) {
      fetch(`http://localhost:3010/v0/card/${set.key}`, {method: 'get'})
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          if (JSON.stringify(terms_copy) != JSON.stringify(json) && !changed) {
            setTerms(json);
            terms_copy = json;
          }
        })
    }
  });

  const handleCreateSet = async () => {
    if (!setName || !setDescription) {
      setError('Please fill out all fields');
      return;
    } 
    if (!changed) {
      console.log('nothing changed, no backend involved')
      // navigate('/home'); // This is just stylistic choice
      return;
    }
    // global will have to change from being hardcoded once login integration begins
    const new_set = {description: setDescription, name: setName, owner: 'global'};
    const answer = await fetch('http://localhost:3010/v0/set', 
      {
        method: 'put',
        headers: new Headers({'Content-Type': 'application/json'}),
        body: JSON.stringify(new_set)
      }
    )
    const setKey = await answer.json();
    new_set.key = setKey;
    console.log(new_set);
    setSet(new_set);
  }

  const handleUpdateSet = async () => { 
    setConfirmDelete(false);
    if (!setName || !setDescription) {
      setError('Please fill out all fields');
      return;
    } 
    if (!changed) {
      console.log('nothing changed, no backend involved')
      // navigate('/home'); // This is just stylistic choice
      return;
    }

    let setKey = set.key;
    const updated_set = JSON.parse(JSON.stringify(set));
    delete updated_set.key;
    updated_set.name = setName;
    updated_set.description = setDescription;
    updated_set.card_num = terms.length;
    console.log(updated_set);
    await fetch(`http://localhost:3010/v0/set/${setKey}`, 
      {
        method: 'put',
        headers: new Headers({'Content-Type': 'application/json'}),
        body: JSON.stringify(updated_set)
      }
    );
    terms.map(async (term) => {
      if (term.changed) {
        if (term.key) {
          // Insert Update Endpoint Here
          console.log('nothing here for now');
        } else {
          const newCard = {front: term.front, back: term.back, starred: term.starred};
          const answer = await fetch(`http://localhost:3010/v0/card/${setKey}`, 
            {
              method: 'put',
              headers: new Headers({'Content-Type': 'application/json'}),
              body: JSON.stringify(newCard)
            }
          )
          answer.json()
            .then((res) => {
              term.key = res;
            })
        }
      }
    })
    // navigate('/home')
  };

  const handleAddTerm = () => {
    setConfirmDelete(false);
    setChanged(true);
    setTerms((prevTerms) => [...prevTerms, { front: '', back: '', starred: false, key: '', changed: true }]);
  };

  const handleTermChange = (index: number, field: 'front' | 'back', value: string) => {
    setConfirmDelete(false);
    setChanged(true);
    const updatedTerms = [...terms];
    updatedTerms[index][field] = value;
    updatedTerms[index]['changed'] = true;
    setTerms(updatedTerms);
  };

  const handleImportSet = () => {
    console.log('Import Set button clicked'); 
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 2,
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
          setConfirmDelete(false);
          setChanged(true);
        }}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Description"
        value={setDescription}
        onChange={(e) => {
          setSetDescription(e.target.value);
          setConfirmDelete(false);
          setChanged(true);
        }}
        fullWidth
        margin="normal"
      />  
      {set.name ? '' : 
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateSet}
          sx={{ marginTop: 2 }}
        >
          Create Set
        </Button>
      }
      <Divider> ... </Divider>
      {terms.map((item, index) => (
        <Box key={index} sx={{ display: 'flex', flexDirection: 'row', width: '100%', marginBottom: 1 }}>
          <TextField
            label={`Term ${index + 1}`}
            value={item.front}
            onChange={(e) => handleTermChange(index, 'front', e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label={`Definition ${index + 1}`}
            value={item.back}
            onChange={(e) => handleTermChange(index, 'back', e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button
            variant="contained"
            color="error"
            onClick={() => console.log('delete card')}
            sx={{ marginTop: 1 }}
          >
            Delete
          </Button>
        </Box>
      ))}

      <Button
        variant="contained"
        color="primary"
        onClick={handleAddTerm}
        sx={{ marginTop: 1 }}
      >
        Add Another Term
      </Button>
      <Box sx={{ display: 'flex', gap: 1, marginTop: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateSet}
        >
          Create Set
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleImportSet}
        >
          Import Set
        </Button>
      </Box>

    </Box>
  );
};

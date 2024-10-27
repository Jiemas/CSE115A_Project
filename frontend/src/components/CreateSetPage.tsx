import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {SetContext} from './App';

let terms_copy = [{front: '', back: '', starred: false, key: ''}];

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
  const [setCardNum, setSetCardNum] = useState(set.card_num);
  const [terms, setTerms] = useState<{ front: string; back: string; starred: boolean;
    key: string; changed: boolean; delete: number; duplicate: boolean }[]>([]); 
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (set.name && !setDeleted) {
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
      return;
    }
    setError('');
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
    setSet(new_set);
  }

  const handleUpdateSet = async () => { 
    setConfirmSetDelete(false);
    if (!setName || !setDescription) {
      setError('Please fill out all fields');
      return;
    } 
    if (!changed) {
      // navigate('/home'); // This is just stylistic choice
      return;
    }

    setError('');

    let setKey = set.key;
    const updated_set = JSON.parse(JSON.stringify(set));
    delete updated_set.key;
    updated_set.name = setName;
    updated_set.description = setDescription;
    updated_set.card_num = terms.filter((term) => term.delete < 2 || !term.delete).length;
    await fetch(`http://localhost:3010/v0/set/${setKey}`, 
      {
        method: 'put',
        headers: new Headers({'Content-Type': 'application/json'}),
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
          if (term.key) {
            const updatedCard = {front: term.front, back: term.back, starred: term.starred};
            fetch(`http://localhost:3010/v0/card/${setKey}?cardId=${term.key}`, 
              {
                method: 'post',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify(updatedCard)
              }
            )
              .then((answer) => {
                if (!answer.ok) {
                  setError('No duplicate cards allowed');
                }
              })
          } else {
            const newCard = {front: term.front, back: term.back, starred: term.starred};
            fetch(`http://localhost:3010/v0/card/${setKey}`, 
              {
                method: 'put',
                headers: new Headers({'Content-Type': 'application/json'}),
                body: JSON.stringify(newCard)
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
            fetch(`http://localhost:3010/v0/card/${set.key}?cardId=${term.key}`, {method: 'delete'});
          }
        }
      }
    })
    if (!err409) {
      setChanged(false);
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
    if (confirmSetDelete) {
      fetch(`http://localhost:3010/v0/set/${set.key}`, {method: 'delete'});
      setSetDeleted(true);
    }
    else {
      setConfirmSetDelete(true);
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
    // setTerms(updatedTerms);
  }

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
  );
};

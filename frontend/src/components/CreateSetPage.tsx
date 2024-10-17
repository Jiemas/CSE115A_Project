import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {SetContext} from './App';

export const CreateSetPage: React.FC = () => {
  const navigate = useNavigate();
  const {set = Object} = React.useContext(SetContext);

  const [changed, setChanged] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [setName, setSetName] = useState(set.name);
  const [setDescription, setSetDescription] = useState(set.description);
  const [setCardNum, setSetCardNum] = useState(set.card_num);
  const [terms, setTerms] = useState<{ term: string; definition: string }[]>([]); 
  const [error, setError] = useState('');

  const handleCreateSet = async () => { 
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

    if (set.name) {
      const updated_set = JSON.parse(JSON.stringify(set));
      delete updated_set.key;
      updated_set.name = setName;
      updated_set.description = setDescription
      await fetch(`http://localhost:3010/v0/set/${set.key}`, 
        {
          method: 'put',
          headers: new Headers({'Content-Type': 'application/json'}),
          body: JSON.stringify(updated_set)
        }
      )
    } else {
      // global will have to change from being hardcoded once login integration begins
      const new_set = {description: setDescription, name: setName, owner: 'global'};
      await fetch('http://localhost:3010/v0/set', 
        {
          method: 'put',
          headers: new Headers({'Content-Type': 'application/json'}),
          body: JSON.stringify(new_set)
        }
      )
    }
    // navigate('/home')
  };

  const handleAddTerm = () => {
    setConfirmDelete(false);
    setTerms((prevTerms) => [...prevTerms, { term: '', definition: '' }]);
  };

  const handleTermChange = (index: number, field: 'term' | 'definition', value: string) => {
    setConfirmDelete(false);
    const updatedTerms = [...terms];
    updatedTerms[index][field] = value;
    setTerms(updatedTerms);
  };

  const handleDeleteSet = () => {
    if (confirmDelete) {
      console.log('Deleting set');
      fetch(`http://localhost:3010/v0/set/${set.key}`, {method: 'delete'});
    }
    else {
      setConfirmDelete(true);
    }
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
      {terms.map((item, index) => (
        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 1 }}>
          <TextField
            label={`Term ${index + 1}`}
            value={item.term}
            onChange={(e) => handleTermChange(index, 'term', e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label={`Definition ${index + 1}`}
            value={item.definition}
            onChange={(e) => handleTermChange(index, 'definition', e.target.value)}
            fullWidth
            margin="normal"
          />
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
      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateSet}
        sx={{ marginTop: 2 }}
      >
        {set.name ? 'Update Set' : 'Create Set'}
      </Button>
      {set.name ? 
        <Button
          variant="contained"
          color="primary"
          onClick={handleDeleteSet}
          sx={{ marginTop: 2 }}
        >
          {confirmDelete ? 'Confirm Delete?' : 'Delete Set'}
        </Button>
      : ''}
    </Box>
  );
};

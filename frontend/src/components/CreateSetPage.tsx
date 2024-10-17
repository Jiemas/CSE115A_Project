import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';

export const CreateSetPage: React.FC = () => {
  const [setName, setSetName] = useState('');
  const [setDescription, setSetDescription] = useState('');
  const [setCardNum, setSetCardNum] = useState('');
  const [terms, setTerms] = useState<{ term: string; definition: string }[]>([]); 
  const [error, setError] = useState('');

  const handleCreateSet = () => { 
    if (!setName || !setDescription || !setCardNum || terms.length === 0) {
      setError('Please fill out all fields and add at least one term.');
      return;
    } 
    console.log({
      name: setName,
      description: setSetDescription,
      card_num: setCardNum,
      terms,
    }); 
    setSetName('');
    setSetDescription('');
    setSetCardNum('');
    setTerms([]); 
    setError('');
  };

  const handleAddTerm = () => {
    setTerms((prevTerms) => [...prevTerms, { term: '', definition: '' }]);
  };

  const handleTermChange = (index: number, field: 'term' | 'definition', value: string) => {
    const updatedTerms = [...terms];
    updatedTerms[index][field] = value;
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
        Create New Flashcard Set
      </Typography>
      {error && (
        <Typography variant="body2" color="error" sx={{ marginBottom: 2 }}>
          {error}
        </Typography>
      )}
      <TextField
        label="Set Name"
        value={setName}
        onChange={(e) => setSetName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Description"
        value={setDescription}
        onChange={(e) => setSetDescription(e.target.value)}
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

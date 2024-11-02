import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ImportModal from './ImportModal';

import { SetContext } from './App';

let terms_copy = [{ front: '', back: '', starred: false, key: '' }];

// const path = 'http://localhost:3001/v0';
const path = 'https://cse115a-project.onrender.com/v0';

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
  const [terms, setTerms] = useState<
    {
      front: string;
      back: string;
      starred: boolean;
      key: string;
      changed: boolean;
      delete: number;
      duplicate: boolean;
    }[]
  >([]);
  const [error, setError] = useState('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  React.useEffect(() => {
    let accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    }
    accessToken = JSON.parse(accessToken);

    if (set.name && !setDeleted) {
      fetch(`${path}/card/${set.key}`, {
        method: 'get',
        headers: new Headers({
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }),
      })
        .then(res => {
          console.log(res.status);
          if (res.status == 403 || res.status == 401) {
            navigate('/login');
            throw res;
          }
          return res.json();
        })
        .then(async json => {
          if (JSON.stringify(terms_copy) != JSON.stringify(json) && !changed) {
            await setTerms(json);
            terms_copy = json;
          }
        });
    }
  });

  const handleImport = async (text: string) => {
    setChanged(true);
    let accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
      return;
    }
    accessToken = JSON.parse(accessToken);

    try {
      const response = await fetch(`${path}/import/${set.key}`, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'text/plain',
          Authorization: `Bearer ${accessToken}`,
        }),
        body: text,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Import successful:', data);

      // Reload the page to show the newly imported cards
      setSet(prevSet => ({
        ...prevSet,
        card_num: prevSet.card_num + data.count,
      }));

      // Fetch the newly imported cards
      const cardsResponse = await fetch(`${path}/card/${set.key}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!cardsResponse.ok) {
        throw new Error(`HTTP error! status: ${cardsResponse.status}`);
      }

      const allCards = await cardsResponse.json();

      // Create a set of existing card keys
      const existingCardKeys = new Set(terms.map(term => term.key));

      // Filter out only the new cards
      const newCards = Object.values(allCards).filter(
        card => !existingCardKeys.has(card.key)
      );

      // Add only the new cards to the terms array
      setTerms(prevTerms => [
        ...prevTerms,
        ...newCards.map(card => ({
          ...card,
          changed: true,
          delete: 0,
          duplicate: false,
        })),
      ]);
      
    } catch (error) {
      console.error('Import failed:', error);
      // Handle import error (e.g., show an error message to the user)
    }
  };

  const handleCreateSet = async () => {
    let accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    }
    accessToken = JSON.parse(accessToken);

    if (!setName || !setDescription) {
      setError('Please fill out all fields');
      return;
    }
    if (!changed) {
      return;
    }
    setError('');
    const new_set = { description: setDescription, name: setName };
    const answer = await fetch(`${path}/set`, {
      method: 'put',
      headers: new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      }),
      body: JSON.stringify(new_set),
    });
    const setKey = await answer.json();
    new_set.key = setKey;
    setSet(new_set);
  };

  const handleUpdateSet = async () => {
    let accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    }
    accessToken = JSON.parse(accessToken);

    setConfirmSetDelete(false);
    if (!setName || !setDescription) {
      setError('Please fill out all fields');
      return;
    }
    if (!changed) {
      return;
    }

    setError('');

    const setKey = set.key;
    const updated_set = JSON.parse(JSON.stringify(set));
    delete updated_set.key;
    delete updated_set.owner;
    updated_set.name = setName;
    updated_set.description = setDescription;
    updated_set.card_num = terms.filter(
      term => term.delete < 2 || !term.delete
    ).length;
    await fetch(`${path}/set/${setKey}`, {
      method: 'put',
      headers: new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      }),
      body: JSON.stringify(updated_set),
    });

    let err409 = false;
    const term_fronts: { [key: string]: number } = {};
    terms.map(term => {
      if (term_fronts[term.front] && term.delete < 2) {
        term.duplicate = true;
        setError('No duplicate cards allowed');
        err409 = true;
      } else {
        term_fronts[term.front] = 1;
      }
    });

    terms.map(term => {
      if (term.changed) {
        if (term.delete < 2) {
          if (term.key) {
            const updatedCard = {
              front: term.front,
              back: term.back,
              starred: term.starred,
            };
            fetch(`${path}/card/${setKey}?cardId=${term.key}`, {
              method: 'post',
              headers: new Headers({
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              }),
              body: JSON.stringify(updatedCard),
            }).then(answer => {
              if (!answer.ok) {
                setError('No duplicate cards allowed');
              }
            });
          } else {
            const newCard = {
              front: term.front,
              back: term.back,
              starred: term.starred,
            };
            fetch(`${path}/card/${setKey}`, {
              method: 'put',
              headers: new Headers({
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              }),
              body: JSON.stringify(newCard),
            }).then(answer => {
              if (!answer.ok) {
                setError('No duplicate cards allowed');
              } else {
                answer.json().then(res => {
                  term.key = res;
                });
              }
            });
          }
        } else {
          if (term.key) {
            fetch(`${path}/card/${set.key}?cardId=${term.key}`, {
              method: 'delete',
              headers: new Headers({
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              }),
            });
          }
        }
      }
    });
    if (!err409) {
      setChanged(false);
    }
  };

  const handleAddTerm = () => {
    setConfirmSetDelete(false);
    setChanged(true);
    setTerms(prevTerms => [
      ...prevTerms,
      {
        front: '',
        back: '',
        starred: false,
        key: '',
        changed: true,
        delete: 0,
        duplicate: false,
      },
    ]);
  };

  const handleTermChange = (
    index: number,
    field: 'front' | 'back',
    value: string
  ) => {
    setConfirmSetDelete(false);
    setChanged(true);
    const updatedTerms = [...terms];
    updatedTerms[index]['delete'] = 0;
    updatedTerms[index][field] = value;
    updatedTerms[index]['changed'] = true;
    setTerms(updatedTerms);
  };

  const handleDeleteSet = () => {
    let accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    }
    accessToken = JSON.parse(accessToken);
    if (confirmSetDelete) {
      fetch(`${path}/set/${set.key}`, {
        method: 'delete',
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        }),
      });
      setSetDeleted(true);
    } else {
      setConfirmSetDelete(true);
    }
  };

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
        onChange={e => {
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
        onChange={e => {
          setSetDescription(e.target.value);
          setConfirmSetDelete(false);
          setChanged(true);
        }}
        fullWidth
        margin="normal"
        disabled={setDeleted}
      />
      {set.name ? (
        ''
      ) : (
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateSet}
          sx={{ marginTop: 2 }}
          disabled={setDeleted}
        >
          Create Set
        </Button>
      )}
      <Divider> ... </Divider>
      {terms.map((item, index) =>
        !item.delete || item.delete < 2 ? (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              marginBottom: 1,
            }}
          >
            <TextField
              label={`Term ${index + 1}`}
              value={item.front}
              error={item.duplicate}
              color={item.duplicate ? 'warning' : 'primary'}
              onChange={e => handleTermChange(index, 'front', e.target.value)}
              fullWidth
              margin="normal"
              disabled={setDeleted}
            />
            <TextField
              label={`Definition ${index + 1}`}
              value={item.back}
              onChange={e => handleTermChange(index, 'back', e.target.value)}
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
        ) : (
          ''
        )
      )}
      {set.name ? (
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
          <div>
            {/* Your existing create set form */}
            <Button
              variant="contained"
              color="primary"
              sx={{ marginTop: 1 }}
              onClick={() => setIsImportModalOpen(true)}
            >
              Import Cards
            </Button>
            <ImportModal
              isOpen={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
              onImport={handleImport}
            />
          </div>
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
      ) : (
        ''
      )}
      {/* <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)}>
        <div className="modal-content">
          <h2>Import Cards</h2>
          <TextField
            label="Paste your cards here"
            multiline
            rows={10}
            variant="outlined"
            fullWidth
            value={plaintext}
            onChange={e => setPlaintext(e.target.value)}
          />
          <div className="modal-actions">
            <Button
              onClick={() => setImportModalOpen(false)}
              style={{ marginRight: '10px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleImportSet}
            >
              Import
            </Button>
          </div>
        </div>
      </Modal> */}
      {set.name ? (
        <Button
          variant="contained"
          color={confirmSetDelete ? 'error' : 'primary'}
          onClick={handleDeleteSet}
          sx={{ marginTop: 2 }}
          disabled={setDeleted}
        >
          {confirmSetDelete ? 'Confirm Delete?' : 'Delete Set'}
        </Button>
      ) : (
        ''
      )}
    </Box>
  );
};

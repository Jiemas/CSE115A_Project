import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from './home-page/NavigationBar';
import { SetContext } from './App';
import ImportModal from './ImportModal';
import { callBackend, waitTime } from '../helper';

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

  const getToken = () => {
    let accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    }
    return JSON.parse(accessToken);
  };

  React.useEffect(() => {
    const accessToken = getToken();
    if (set.name && !setDeleted && !changed) {
      callBackend('get', `card/${set.key}`, accessToken)
        .then(res => {
          if (res.status == 403 || res.status == 401) {
            navigate('/login');
          }
          return res.json();
        })
        .then(async json => {
          if (JSON.stringify(terms) != JSON.stringify(json) && !changed) {
            setTerms(json);
          }
        });
    }
  }, [terms]);

  const handleImport = async (text: string) => {
    setChanged(true);
    const accessToken = getToken();

    const response = await callBackend(
      'POST',
      `import/${set.key}`,
      accessToken,
      text,
      'text/plain'
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && Object.keys(data.count).length) {
      const termsCopy = terms;
      const newTerms = termsCopy.concat(
        Object.entries(data.count).map(elem => elem[1])
      );
      setTerms(newTerms);
      const setCopy = set;
      setCopy.card_num = newTerms.length;
      setSet(setCopy);
    }
  };

  const handleCreateSet = async () => {
    const accessToken = getToken();
    if (!setName || !setDescription) {
      setError('Please fill out all fields');
      return;
    }
    if (!changed) {
      return;
    }
    setError('');
    const new_set = { description: setDescription, name: setName };
    const answer = await callBackend('put', 'set', accessToken, new_set);
    const setKey = await answer.json();
    new_set.key = setKey;
    setSetDeleted(true);
    setTimeout(async () => {
      setSet(new_set);
      await callBackend('get', `card/${new_set.key}`, accessToken)
        .then(res => res.json())
        .then(async json => {
          setTerms(json);
        });
      setSetDeleted(false);
    }, waitTime);
  };

  const updateSet = async (accessToken: string) => {
    const updated_set = {
      name: setName,
      description: setDescription,
      card_num: terms.filter(term => term.delete < 2 || !term.delete).length,
    };
    await callBackend('put', `set/${set.key}`, accessToken, updated_set);
    updated_set.key = set.key;
    updated_set.owner = set.owner;
    setSet(updated_set);
  };

  const checkForDuplicates = () => {
    let duplicateFound = false;
    const term_fronts: { [key: string]: number } = {};
    terms.map(term => {
      if (term_fronts[term.front] && term.delete < 2) {
        term.duplicate = true;
        setError('No duplicate cards allowed');
        duplicateFound = true;
      } else {
        term_fronts[term.front] = 1;
        term.duplicate = false;
      }
    });
    return duplicateFound;
  };

  const handleUpdateSet = async () => {
    const accessToken = getToken();
    setConfirmSetDelete(false);

    // Check name and description of set are not empty
    if (!setName || !setDescription) {
      setError('Please fill out all fields');
      return;
    }
    if (!changed) {
      return;
    }

    setError('');
    await updateSet(accessToken);
    const err409 = checkForDuplicates();

    terms.map(term => {
      if (term.changed) {
        if (term.delete < 2) {
          const newCard = {
            front: term.front,
            back: term.back,
            starred: term.starred,
          };
          if (term.key) {
            callBackend(
              'post',
              `card/${set.key}?cardId=${term.key}`,
              accessToken,
              newCard
            ).then(answer => {
              if (!answer.ok) {
                setError('No duplicate cards allowed');
              }
            });
          } else {
            callBackend('put', `card/${set.key}`, accessToken, newCard).then(
              answer => {
                if (!answer.ok) {
                  setError('No duplicate cards allowed');
                } else {
                  answer.json().then(res => (term.key = res));
                }
              }
            );
          }
        } else {
          if (term.key) {
            callBackend(
              'delete',
              `card/${set.key}?cardId=${term.key}`,
              accessToken
            );
            // NEED TO ADD METHOD TO REMOVE TERM FROM TERMS ARRAY THEN UPDATE TERMS
            // OR MAYBE NOT?? KINDA LAZY
          }
        }
      }
    });
    if (!err409) {
      setSetDeleted(true);
      setTimeout(() => {
        setChanged(false);
        setSetDeleted(false);
      }, waitTime);
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

  const handleQuizMe = () => {
    setConfirmSetDelete(false);
    navigate(`/quiz/`);
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
    if (confirmSetDelete) {
      const accessToken = getToken();
      callBackend('delete', `set/${set.key}`, accessToken);
      setSetDeleted(true);
      setTimeout(() => navigate('/'), waitTime);
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
  };

  const handleLLM = () => {
    const accessToken = getToken();
    if (set.key) {
      callBackend('post', `llm/${set.key}`, accessToken);
    }
  };

  return (
    <>
      <NavigationBar />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 2,
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <Typography variant='h4' gutterBottom>
          {set.name ? 'Edit Flashcard Set' : 'Create New Flashcard Set'}
        </Typography>
        {error && (
          <Typography variant='body2' color='error' sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}
        <TextField
          label='Set Name'
          value={setName}
          onChange={e => {
            setSetName(e.target.value);
            setConfirmSetDelete(false);
            setChanged(true);
          }}
          fullWidth
          margin='normal'
          multiline
          disabled={setDeleted}
        />
        <TextField
          label='Description'
          value={setDescription}
          onChange={e => {
            setSetDescription(e.target.value);
            setConfirmSetDelete(false);
            setChanged(true);
          }}
          fullWidth
          margin='normal'
          multiline
          disabled={setDeleted}
        />
        {set.name ? (
          ''
        ) : (
          <Button
            variant='contained'
            color='primary'
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
                marginBottom: 4,
                borderRadius: 1,
                padding: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  transform: 'translateY(-2px)',
                },
                backgroundColor: '#ffffff',
              }}
            >
              <TextField
                label={`Term ${index + 1}`}
                value={item.front}
                error={item.duplicate}
                color={item.duplicate ? 'warning' : 'primary'}
                onChange={e => handleTermChange(index, 'front', e.target.value)}
                fullWidth
                margin='normal'
                sx={{ marginRight: 2 }} // Add this line to increase space
                multiline
                disabled={setDeleted}
              />
              <TextField
                label={`Definition ${index + 1}`}
                value={item.back}
                onChange={e => handleTermChange(index, 'back', e.target.value)}
                fullWidth
                margin='normal'
                multiline
                disabled={setDeleted}
              />
              <Tooltip title={!item.delete ? 'Delete' : 'Confirm Delete'}>
                <span>
                  <IconButton
                    color={!item.delete ? 'primary' : 'error'}
                    onClick={() => handleDeleteCard(index)}
                    sx={{ marginTop: 1 }}
                    disabled={setDeleted}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          ) : (
            ''
          )
        )}

        {set.name ? (
          <>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'left',
                width: '100%',
              }}
            >
              <Button
                variant='contained'
                color='primary'
                onClick={handleAddTerm}
                sx={{ marginTop: 1, marginRight: 2 }}
                disabled={setDeleted}
              >
                Add Another Term
              </Button>
              <div>
                {/* Your existing create set form */}
                <Button
                  variant='contained'
                  color='primary'
                  sx={{ marginTop: 1 }}
                  onClick={() => setIsImportModalOpen(true)}
                  disabled={setDeleted}
                >
                  Import Cards
                </Button>
                <Button
                  variant='contained'
                  color={error ? 'error' : 'success'}
                  onClick={handleUpdateSet}
                  sx={{ marginTop: 1, marginLeft: 2 }}
                  disabled={!changed || setDeleted}
                >
                  Update Set
                </Button>
              </div>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'right',
                gap: 2,
                width: '100%',
              }}
            >
              {set.card_num && set.card_num > 3 ? (
                <>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleQuizMe}
                    sx={{ marginTop: 1 }}
                    disabled={setDeleted}
                  >
                    Quiz Me
                  </Button>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleLLM}
                    sx={{ marginTop: 1 }}
                    disabled={
                      setDeleted || (set.card_num && set.card_num > 10)
                        ? true
                        : false
                    }
                  >
                    LLM
                  </Button>
                </>
              ) : (
                ''
              )}
            </Box>
          </>
        ) : (
          ''
        )}
        {set.name ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'right',
              gap: 2,
              width: '100%',
            }}
          >
            <Button
              variant='contained'
              color={confirmSetDelete ? 'error' : 'primary'}
              onClick={handleDeleteSet}
              sx={{ marginTop: 1 }}
              disabled={setDeleted}
            >
              {confirmSetDelete ? 'Confirm Delete?' : 'Delete Set'}
            </Button>
          </Box>
        ) : (
          ''
        )}
      </Box>
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </>
  );
};

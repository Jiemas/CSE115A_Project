import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from './home-page/NavigationBar';
import { SetContext } from './App';
import ImportModal from './ImportModal';
import { callBackend, waitTime } from '../helper';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';


const blankSet = {
  name: '',
  description: '',
  card_num: 0,
  key: '',
  owner: '',
};

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

  const getSet = () => {
    const storageSet = sessionStorage.getItem('set');
    if (!storageSet) {
      return set;
    }
    const savedSet = JSON.parse(storageSet);
    if (savedSet.name !== set.name) {
      setSet(savedSet);
      setSetName(savedSet.name);
      setSetDescription(savedSet.description);
    }
    return savedSet;
  };

  React.useEffect(() => {
    const savedSet = getSet();
    if (savedSet.name && !setDeleted && !changed) {
      const accessToken = getToken();
      callBackend('get', `card/${savedSet.key}`, accessToken)
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
  });

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
    if (!answer.ok) {
      setError('Set name already used');
    }
    const setKey = await answer.json();
    new_set.key = setKey;
    new_set.card_num = 1;
    setSetDeleted(true);
    setTimeout(async () => {
      setSet(new_set);
      sessionStorage.setItem('set', JSON.stringify(new_set));
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
      card_num: terms.filter(
        term => (term.delete < 2 || !term.delete) && !term.duplicate
      ).length,
    };
    const answer = await callBackend(
      'put',
      `set/${set.key}`,
      accessToken,
      updated_set
    );
    if (!answer.ok) {
      return true;
    }
    updated_set.key = set.key;
    updated_set.owner = set.owner;
    setSet(updated_set);
    return false;
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
    const err409 = checkForDuplicates();
    setError('');
    if (await updateSet(accessToken)) {
      setError('Set name already used');
      return;
    }
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

  const deleteSet = () => {
    const accessToken = getToken();
    callBackend('delete', `set/${set.key}`, accessToken);
    setSet(blankSet);
    sessionStorage.removeItem('set');
    setSetDeleted(true);
    setTimeout(() => navigate('/'), waitTime);
  };

  const handleDeleteSet = () => {
    if (confirmSetDelete) {
      deleteSet();
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
      console.log(set);
      if (set.card_num == 1) {
        deleteSet();
      }
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

  const handleBack = () => {
    navigate('/');
  };

  const back = (
    <IconButton color='primary' onClick={handleBack} sx={{ marginTop: 1 }}>
      <ArrowBackIcon />
    </IconButton>
  );

  return (
    <>
      <NavigationBar />
      {back}
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
        <Box display='flex' alignItems='center' width='100%' marginTop={1}>
          {set.card_num ? (
            <>
              <Box display='flex' alignItems='center' gap={2}>
                {set.card_num > 3 ? (
                  <>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={handleQuizMe}
                      sx={{ marginTop: 1, marginRight: 2 }}
                      disabled={setDeleted}
                    >
                      Quiz Me
                    </Button>
                    <Tooltip
                      title="This button allows AI to generate tests from your existing set. After clicking, wait 5 minutes before clicking 'Quiz Me' to generate a test."
                      placement='top'
                    >
                      <Button
                        variant='contained'
                        color='primary'
                        onClick={handleLLM}
                        sx={{ marginTop: 1, marginRight: 2 }}
                        disabled={
                          setDeleted || (set.card_num && set.card_num > 10)
                            ? true
                            : false
                        }
                      >
                        AI
                      </Button>
                    </Tooltip>
                  </>
                ) : (
                  ''
                )}
                <Button
                  variant='contained'
                  color='primary'
                  sx={{ marginTop: 1, marginRight: 2 }}
                  onClick={() => setIsImportModalOpen(true)}
                  disabled={setDeleted}
                >
                  Import Cards
                </Button>
              </Box>

              <Box marginLeft={'auto'} display={'flex'} gap={2}>
                <Button
                  variant='contained'
                  color={error ? 'error' : 'success'}
                  onClick={handleUpdateSet}
                  sx={{ marginTop: 1, marginLeft: 25 }}
                  disabled={!changed || setDeleted}
                >
                  Update Set
                </Button>
                <Button
                  variant='contained'
                  color={confirmSetDelete ? 'error' : 'primary'}
                  onClick={handleDeleteSet}
                  sx={{ marginTop: 1, marginLeft: 'auto' }}
                  disabled={setDeleted}
                >
                  {confirmSetDelete ? 'Confirm Delete?' : 'Delete Set'}
                </Button>
              </Box>
            </>
          ) : (
            ''
          )}
        </Box>

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
              display='flex'
              justifyContent='space-between'
              alignItems='center'
              width='100%'
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

              <Box marginLeft={'auto'} display={'flex'} gap={2}>

                <Button
                  variant='contained'
                  color={error ? 'error' : 'success'}
                  onClick={handleUpdateSet}
                  sx={{ marginTop: 1 }}
                  disabled={!changed || setDeleted}
                >
                  Update Set
                </Button>

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
            </Box>
          </>
        ) : (
          ''
        )}
      </Box>
      {back}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </>
  );
};

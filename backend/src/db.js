const crypto = require('crypto');

const rootPath = 'https://rapid-review-4255a-default-rtdb.firebaseio.com';

const callDatabase = async (method, pathExtension, requestBody=null) => {
  const fetchObject = {
    method: `${method}`,
  };
  if (requestBody) {
    fetchObject['body'] = JSON.stringify(requestBody);
    fetchObject['headers'] = {'Content-Type': 'application/json'};
  }
  const completePath = `${rootPath}/${pathExtension}`;
  return (await fetch(completePath, fetchObject)).json();
};

exports.getAllSets = async (userKey) => {
  const path = `set.json?orderBy="owner"&equalTo="${userKey}"`;
  const sets = await callDatabase('get', path);

  // If response is empty, return null. Otherwise, return array of set objects
  return JSON.stringify(sets) == JSON.stringify({}) ? null :
    Object.entries(sets).map((elem) => elem[1]);
};

// BUG ADDING NEW SET CHECKS ALL SETS NAME, EVEN IF USER DOESNT OWN THE SET
exports.getSet_name = async (name) => {
  const path = `set.json?orderBy="name"&equalTo="${name}"`;
  const set = await callDatabase('get', path);
  return set ? Object.entries(set).map((elem) => elem[1]) : null;
};

exports.getSet_id = async (id) => {
  const set = await callDatabase('get', `set/${id}.json`);
  return set;
};

exports.addSet = async (newObj, setId) => {
  await callDatabase('PATCH', 'set.json', newObj);

  // If no setId provided, just return
  if (setId == null) {
    return;
  }

  // If code reaches point, this means we are adding a brand new set
  const firstCardId = crypto.randomUUID();
  const cardObj = {};
  cardObj[firstCardId] = {
    back: '', front: '', key: firstCardId, starred: false,
  };
  const setObj = {};
  setObj[setId] = cardObj;
  await callDatabase('PATCH', 'card.json', setObj);
};

exports.deleteSet = async (id) => {
  callDatabase('DELETE', `set/${id}.json`);
  callDatabase('DELETE', `card/${id}.json`);
};

exports.getCard_front = async (front, setId) => {
  const cards = await callDatabase('GET', `card/${setId}.json`);
  // If cards is not empty, find and return card with specified front
  // If cards is empty, return null
  return cards ? Object.entries(cards).map((elem) => elem[1])
    .find((elem) => elem.front == front) : null;
};

exports.getCard_id = async (setId, cardId) => {
  const card = await callDatabase('GET', `card/${setId}/${cardId}.json`);
  // If card is not null, return card object. Otherwise, return null
  return card ? card : null;
};

exports.addCard = async (newObj, setId) => {
  await callDatabase('PATCH', `card/${setId}.json`, newObj);
};

exports.getAllCards = async (setId) => {
  const cards = await callDatabase('GET', `card/${setId}.json`);
  // If cards is not null, return array of card objects. Otherwise, return null
  return cards ? Object.entries(cards).map((elem) => elem[1]) : null;
};

exports.updateCard = async (cardBody, setId, cardId) => {
  await callDatabase('PUT', `card/${setId}/${cardId}.json`, cardBody);
};

exports.overwriteCards = async (cardBody, setId) => {
  await callDatabase('PUT', `card/${setId}.json`, cardBody);
};

exports.deleteCard = async (setId, cardId) => {
  await callDatabase('DELETE', `card/${setId}/${cardId}.json`);
};

exports.getUser = async (email) => {
  const path = `user.json?orderBy="email"&equalTo="${email}"`;
  const users = await callDatabase('GET', path);

  // If users is empty, return null. Otherwise, return user object
  return JSON.stringify(users) == JSON.stringify({}) ? null :
    Object.entries(users).map((elem) => elem[1])[0];
};

exports.addUser = async (user) => {
  await callDatabase('PATCH', 'user.json', user);
};

exports.deleteUser = async (key) => {
  await callDatabase('DELETE', `user/${key}.json`);
};

exports.addLLM = async (setId, cardId, llmData, responseType) => {
  const llmObj = {};
  llmObj[responseType] = llmData;
  await callDatabase('PATCH', `card/${setId}/${cardId}.json`, llmObj);
};

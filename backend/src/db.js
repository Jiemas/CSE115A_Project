const crypto = require('crypto');

const rootPath = 'https://rapid-review-4255a-default-rtdb.firebaseio.com';

exports.getAllSets = async () => {
  const answer = await fetch(
    `${rootPath}/set.json?orderBy="owner"&equalTo="global"`, {method: 'GET'});
  const json = await answer.json();

  // When users create new account, they won't have any sets to their name
  // Will need to add code to account for this scenario
  return JSON.stringify(json) == JSON.stringify({}) ? null :
    Object.entries(json).map((elem) => elem[1]);
};

exports.getSet_name = async (name) => {
  const answer = await fetch(
    `${rootPath}/set.json?orderBy="name"&equalTo="${name}"`, {method: 'GET'});
  const duplicate = await answer.json();
  return Object.entries(duplicate).map((elem) => elem[1]);
};

exports.getSet_id = async (id) => {
  const answer = await fetch(`${rootPath}/set/${id}.json`,
    {method: 'GET'});
  const duplicate = await answer.json();
  return duplicate == null ? null :
    Object.entries(duplicate).map((elem) => elem[1]);
};

exports.addSet = async (newObj, setId) => {
  await fetch(`${rootPath}/set.json`,
    {method: 'PATCH',
      body: JSON.stringify(newObj),
      headers: {'Content-Type': 'application/json'}});

  // addSet used to create new set and update set
  // Only want to set up a new set in card object of db if creating new set
  if (setId == null) {
    return;
  }

  const firstCardId = crypto.randomUUID();
  const cardObj = {};
  cardObj[firstCardId] =
    {back: 'Put definition here', front: 'Put term here',
      key: firstCardId, starred: false,
    };
  const setObj = {};
  setObj[setId] = cardObj;
  await fetch(`${rootPath}/card.json`,
    {method: 'PATCH',
      body: JSON.stringify(setObj),
      headers: {'Content-Type': 'application/json'},
    });
};

exports.deleteSet = async (id) => {
  await fetch(`${rootPath}/set/${id}.json`, {method: 'DELETE'});
  await fetch(`${rootPath}/card/${id}.json`, {method: 'DELETE'});
};

exports.getCard_front = async (front, setId) => {
  const answer = await fetch(`${rootPath}/card/${setId}.json`, {method: 'GET'});
  const json = await answer.json();
  return Object.entries(json).map((elem) => elem[1])
    .find((elem) => elem.front == front);
};

exports.getCard_id = async (setId, cardId) => {
  const answer = await fetch(`${rootPath}/card/${setId}/${cardId}` + '.json',
    {method: 'GET'});
  const card = await answer.json();
  return card == null ? null : Object.entries(card).map((elem) => elem[1]);
};

exports.addCard = async (newObj, setId) => {
  await fetch(`${rootPath}/card/${setId}.json`,
    {method: 'PATCH',
      body: JSON.stringify(newObj),
      headers: {'Content-Type': 'application/json'},
    });
};

exports.getAllCards = async (setId) => {
  const answer = await fetch(`${rootPath}/card/${setId}.json`,
    {method: 'GET'});
  const json = await answer.json();
  return !json ? json : Object.entries(json).map((elem) => elem[1]);
};

exports.updateCard = async (cardBody, setId, cardId) => {
  await fetch(`${rootPath}/card/${setId}/${cardId}.json`,
    {method: 'PUT',
      body: JSON.stringify(cardBody),
      headers: {'Content-Type': 'application/json'},
    });
};

exports.deleteCard = async (setId, cardId) => {
  await fetch(`${rootPath}/card/${setId}/${cardId}` + '.json',
    {method: 'DELETE'});
};

exports.getUser = async (email) => {
  const answer = await fetch(
    `${rootPath}/user.json?orderBy="email"&equalTo="${email}"`,
    {method: 'GET'},
  );
  const json = await answer.json();
  return JSON.stringify(json) == JSON.stringify({}) ? null :
    Object.entries(json).map((elem) => elem[1])[0];
};

exports.addUser = async (user) => {
  await fetch(`${rootPath}/user.json`,
    {method: 'PATCH',
      body: JSON.stringify(user),
      headers: {'Content-Type': 'application/json'}});
};

exports.deleteUser = async (key) => {
  await fetch(`${rootPath}/user/${key}.json`, {method: 'DELETE'});
};

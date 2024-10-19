const crypto = require('crypto');

exports.getAllSets = async () => {
  const answer = await fetch(
    'https://rapid-review-4255a-default-rtdb.firebaseio.com/set.json?orderBy="owner"&equalTo="global"',
    {method: 'GET'});
  const json = await answer.json();
  return Object.entries(json).map((elem) => elem[1]);
};

exports.getSet_name = async (name) => {
  const answer = await fetch(
    'https://rapid-review-4255a-default-rtdb.firebaseio.com/set.json?orderBy="name"&equalTo="' + name +'"',
    {method: 'GET'});
  const duplicate = await answer.json();
  return Object.entries(duplicate).map((elem) => elem[1]);
};

exports.getSet_id = async (id) => {
  const answer = await fetch(
    'https://rapid-review-4255a-default-rtdb.firebaseio.com/set/' + id + '.json',
    {method: 'GET'});
  const duplicate = await answer.json();
  if (duplicate == null) {
    return null;
  }
  return Object.entries(duplicate).map((elem) => elem[1]);
};

exports.addSet = async (newObj, setId) => {
  await fetch('https://rapid-review-4255a-default-rtdb.firebaseio.com/set.json',
    {method: 'PATCH',
      body: JSON.stringify(newObj),
      headers: {'Content-Type': 'application/json'}});

  if (setId == null) {
    return;
  }

  firstCardId = crypto.randomUUID();
  cardObj = {};
  cardObj[firstCardId] =
    {back: 'Put definition here',
      front: 'Put term here',
      key: firstCardId,
      starred: false,
    };
  setObj = {};
  setObj[setId] = cardObj;
  await fetch('https://rapid-review-4255a-default-rtdb.firebaseio.com/card.json',
    {method: 'PATCH',
      body: JSON.stringify(setObj),
      headers: {'Content-Type': 'application/json'},
    });
};

exports.deleteSet = async (id) => {
  // curl -X DELETE 'https://rapid-review-4255a-default-rtdb.firebaseio.com/set/fourth_set.json'
  await fetch('https://rapid-review-4255a-default-rtdb.firebaseio.com/set/' + id + '.json',
    {method: 'DELETE'});
  await fetch('https://rapid-review-4255a-default-rtdb.firebaseio.com/card/' + id + '.json',
    {method: 'DELETE'});
};

exports.getCard_front = async (front, setId) => {
  const answer = await fetch(
    'https://rapid-review-4255a-default-rtdb.firebaseio.com/card/' + setId + '.json',
    {method: 'GET'});
  const json = await answer.json();
  return Object.entries(json).map((elem) => elem[1])
    .find((elem) => elem.front == front);
};

exports.addCard = async (newObj, setId) => {
  await fetch('https://rapid-review-4255a-default-rtdb.firebaseio.com/card/' + setId +'.json',
    {method: 'PATCH',
      body: JSON.stringify(newObj),
      headers: {'Content-Type': 'application/json'},
    });
};

exports.getAllCards = async (setId) => {
  const answer = await fetch(
    'https://rapid-review-4255a-default-rtdb.firebaseio.com/card/' + setId + '.json',
    {method: 'GET'});
  const json = await answer.json();
  return Object.entries(json).map((elem) => elem[1]);
};

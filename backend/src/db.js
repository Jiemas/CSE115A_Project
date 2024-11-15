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

// DB functions to access and add wrong/correct answers to cards

// card ->set_key -> card_key -> wrong_answers
// and
// card ->set_key -> card_key -> correct_answers

exports.getWrongAnswers = async (setId, cardId) => {
  const answer = await fetch(`${rootPath}/card/${setId}/${cardId}
    /wrong_answers.json`, {
    method: 'GET',
  });
  const wrongAnswers = await answer.json();
  return wrongAnswers ? wrongAnswers : [];
};

exports.getCorrectAnswers = async (setId, cardId) => {
  const answer = await fetch(`${rootPath}/card/${setId}/${cardId}
    /correct_answers.json`, {
    method: 'GET',
  });
  const correctAnswers = await answer.json();
  return correctAnswers ? correctAnswers : [];
};

exports.addWrongAnswers = async (setId, cardId, wrongAnswersList) => {
  const wrongAnswersObj = {wrong: wrongAnswersList};
  await fetch(`${rootPath}/card/${setId}/${cardId}.json`, {
    method: 'PATCH',
    body: JSON.stringify(wrongAnswersObj),
    headers: {'Content-Type': 'application/json'},
  });
};

exports.addCorrectAnswers = async (setId, cardId, correctAnswersList) => {
  const correctAnswersObj = {correct: correctAnswersList};
  await fetch(`${rootPath}/card/${setId}/${cardId}.json`, {
    method: 'PATCH',
    body: JSON.stringify(correctAnswersObj),
    headers: {'Content-Type': 'application/json'},
  });
};


// ---------------- TEST VERSIONS ---------------------------------

// For LLM Test Function:
// Currently setting the obj label to be the front of test card
// FUTURE: path should be wrong_answers/setId/cardId etc.
// exports.getWrongAnswers = async (front) => {
//   const answer = await fetch(`${rootPath}/Test_LLM_responses/
//     ${front}/wrong_answers.json`, {
//     method: 'GET',
//   });
//   const wrongAnswers = await answer.json();
//   return wrongAnswers ? wrongAnswers : [];
// };
// // get functions need auth.
// exports.getCorrectAnswers = async (front) => {
//   const answer = await fetch(`${rootPath}/Test_LLM_responses/
//     ${front}/correct_answers.json`, {
//     method: 'GET',
//   });

//   // console.log('fetching answer: ' + answer);
//   if (!answer.ok) {
//     console.error('Failed to fetch correct answers:', answer.statusText);
//     return [];
//   }

//   const correctAnswers = await answer.json();
//   return correctAnswers ? correctAnswers : [];
// };

// exports.addWrongAnswers = async (front, wrongAnswersList) => {
//   const wrongAnswersObj = {wrong_answers: wrongAnswersList};
//   await fetch(`${rootPath}/Test_LLM_responses/${front}.json`, {
//     method: 'PATCH',
//     body: JSON.stringify(wrongAnswersObj),
//     headers: {'Content-Type': 'application/json'},
//   });
// };

// exports.addCorrectAnswers = async (front, correctAnswersList) => {
//   const correctAnswersObj = {correct_answers: correctAnswersList};
//   await fetch(`${rootPath}/Test_LLM_responses/${front}.json`, {
//     method: 'PATCH',
//     body: JSON.stringify(correctAnswersObj),
//     headers: {'Content-Type': 'application/json'},
//   });
// };

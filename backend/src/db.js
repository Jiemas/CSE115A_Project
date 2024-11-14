const crypto = require('crypto');

const rootPath = 'https://rapid-review-4255a-default-rtdb.firebaseio.com';

exports.getAllSets = async (userKey) => {
  const answer = await fetch(
    `${rootPath}/set.json?orderBy="owner"&equalTo="${userKey}"`,
    {method: 'GET'});
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
  return !duplicate ? null : Object.entries(duplicate).map((elem) => elem[1]);
};

exports.getSet_id = async (id) => {
  const answer = await fetch(`${rootPath}/set/${id}.json`,
    {method: 'GET'});
  const duplicate = await answer.json();
  return duplicate;
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
    {back: '', front: '',
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
  return !json ? null : Object.entries(json).map((elem) => elem[1])
    .find((elem) => elem.front == front);
};

exports.getCard_id = async (setId, cardId) => {
  const answer = await fetch(`${rootPath}/card/${setId}/${cardId}` + '.json',
    {method: 'GET'});
  const card = await answer.json();
  return card ? card : null;
  // return card == null ? null : Object.entries(card).map((elem) => elem[1]);
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
  const wrongAnswersObj = {wrong_answers: wrongAnswersList};
  await fetch(`${rootPath}/card/${setId}/${cardId}
    /wrong_answers.json`, {
    method: 'PATCH',
    body: JSON.stringify(wrongAnswersObj),
    headers: {'Content-Type': 'application/json'},
  });
};

exports.addCorrectAnswers = async (setId, cardId, correctAnswersList) => {
  const correctAnswersObj = {correct_answers: correctAnswersList};
  await fetch(`${rootPath}/card/${setId}/${cardId}
    /correct_answers.json`, {
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

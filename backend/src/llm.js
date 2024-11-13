const db = require('./db');
const OpenAI = require('openai');

// https://openrouter.ai/meta-llama/llama-3.2-1b-instruct:free/api
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.API_KEY,
});

exports.llm_test = async (req, res) => {
  const setName = 'CSE 115A: Test 1';
  const front = 'time-boxed';
  const back = 'it ends when time is up, whether or not goal is reached';
  // const sendContent = `In a test about ${setName}, a multiple choice` +
  //   ` question "${front}" has the correct answer "${back}". Generate 9` +
  //   ' unique incorrect answers in a similar style to the correct answer' +
  //   ' in only JSON.';

  // Adjusted the LLM prompt to avoid instances where it sends the JSON ticks
  const sendContent = `In a test about ${setName}, the multiple-choice ` +
    `question "${front}" has the correct answer "${back}".` +
    `Generate exactly 9 unique incorrect answers similar in style to the ` +
    `correct answer, and respond with only the JSON object without any ` +
    `surrounding text, quotes, or backticks.`; // The format should be: ` +
    // `{"incorrect_answers": ["answer1", "answer2", ...]}`;

  // console.log(sendContent);
  const completion = await openai.chat.completions.create({
    model: 'meta-llama/llama-3.2-1b-instruct:free',
    messages: [
      {
        'role': 'user',
        'content': sendContent,
      },
    ],
  });
  console.log(completion.choices[0].message.content);

  // --- Parse LLM response into a List of answers ---
  const responses = JSON.parse(completion.choices[0].message.content);
  const responsesList = [];

  for (const r in responses) {
    if (responses.hasOwnProperty(r)) {
      for (const item in responses[r]) {
        if (item != null) {
          responsesList.push(responses[r][item]);
        }
      }
    }
  }

  // --- Alternative: Parse LLM output into JSON object ---
  // const responses = JSON.parse(completion.choices[0].message.content);

  // // create obj to store the array of LLM responses
  // const responsesObj = {};

  // // prints out a list of objects, each object is one of LLM's wrong answers
  // for (const i in responses) {
  //   if (responses.hasOwnProperty(i)) {
  //     // console.log(responses[i]);

  //     for (const r in responses[i]) {
  //       if (responses[i][r] != null) {
  //         responsesObj[r] = responses[i][r];
  //       } else {
  //         res.status(500).send('couldnt LLM parse into JSON obj properly');
  //       }
  //     }
  //   }
  // }
  // console.log(responsesObj);
  // ------------------------------------------------------

  console.log(responsesList);

  // Test function to add the list of WRONG answers to DB
  db.addWrongAnswers(front, responsesList);
  const answer = db.getWrongAnswers();
  console.log('from the db: ' + answer);


  // Test adding CORRECT answers to DB
  const sendContent2 = `In a test about ${setName}, the multiple-choice ` +
    `question "${front}" has the correct answer "${back}".` +
    `Generate exactly 9 unique correct answers similar in style to the ` +
    `correct answer, and respond with only the JSON object without any ` +
    `surrounding text, quotes, or backticks.`; // The format should be: ` +
    // `{"incorrect_answers": ["answer1", "answer2", ...]}`;

  const completion2 = await openai.chat.completions.create({
    model: 'meta-llama/llama-3.2-1b-instruct:free',
    messages: [
      {
        'role': 'user',
        'content': sendContent2,
      },
    ],
  });
  // console.log(completion.choices[0].message.content);

  // Parse LLM response into a List of answers
  const responses2 = JSON.parse(completion2.choices[0].message.content);
  const responsesList2 = [];

  for (const r2 in responses2) {
    if (responses2.hasOwnProperty(r2)) {
      for (const item2 in responses2[r2]) {
        if (item2 != null) {
          responsesList2.push(responses2[r2][item2]);
        }
      }
    }
  }

  db.addCorrectAnswers(front, responsesList2);
  console.log('finished adding correct answers to db');

  res.status(200).send();
};

// IGNORE THIS ONE!
// --- Generates wrong answers for 1 card from a specified set ---
// exports.llm_generate = async (req, res) => {
//   // trying to test with a set from mail@email.com account..
//   const setId = 'db3a7b47-c716-473a-9a3a-aa28cb0b67e2';
//   // const cardId = req.path.cardId;
//   // '77ed52f0-ae87-4870-8b71-5eb439f0550';

//   console.log('setid: ' + setId);
//   // console.log('cardid: ' + cardId);

//   const set = await db.setDetails(setId);
//   if (set == null) {
//     res.status(404).send('no set name found');
//   }

//   console.log('set name: ' + set.name);
//   console.log('set card num: ' + set.card_num);
//   console.log('set key: ' + set.key);

//   // const card = await db.cardDetails(setId, cardId);
//   // if (card == null) {
//   //   // res.status(404).send('no card/set info found');
//   // }
//   // console.log('card: ' + card);

//   const cards = await db.getAllCards(setId);
//   console.log('all cards: ' + cards);

//   // console.log('card.front' + card.front);
//   // console.log('card.back' + card.back);

//   // return res.status(200).send('end of llm_generate');
//   res.status(200).send('end of llm_generate');
// };

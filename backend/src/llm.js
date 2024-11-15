const db = require('./db');
const OpenAI = require('openai');
const myQueue = require('./jobQueue');

// https://openrouter.ai/meta-llama/llama-3.2-1b-instruct:free/api

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.API_KEY,
});

// Helper functions for myQueue.process()
const llmPromptWrongAnswers = async (setName, front, back) => {
  const sendContent = `In a test about ${setName}, the multiple-choice ` +
    `question "${front}" has the correct answer "${back}".` +
    `Generate exactly 9 unique incorrect answers similar in style to the ` +
    `correct answer, and respond with only the JSON object without any ` +
    `surrounding text, quotes, or backticks.`;

  const completion = await openai.chat.completions.create({
    model: 'meta-llama/llama-3.2-1b-instruct:free',
    messages: [
      {
        'role': 'user',
        'content': sendContent,
      },
    ],
  });
  return completion.choices[0].message.content;
};

const llmPromptCorrectAnswers = async (setName, front, back) => {
  const sendContent = `In a test about ${setName}, the multiple-choice ` +
    `question "${front}" has the correct answer "${back}".` +
    `Generate exactly 9 unique correct answers similar in style to the ` +
    `correct answer, and respond with only the JSON object without any ` +
    `surrounding text, quotes, or backticks.`;

  const completion = await openai.chat.completions.create({
    model: 'meta-llama/llama-3.2-1b-instruct:free',
    messages: [
      {
        'role': 'user',
        'content': sendContent,
      },
    ],
  });
  return completion.choices[0].message.content;
};

const llmParseResponse = async (response) => {
  let parsedResponse;
  const responsesList = [];
  try {
    parsedResponse = JSON.parse(response);
  } catch (error) {
    return responsesList;
  }

  for (r in parsedResponse) {
    if (parsedResponse.hasOwnProperty(r)) {
      for (i in parsedResponse[r]) {
        if (i != null) {
          responsesList.push(parsedResponse[r][i]);
        }
      }
    }
  }
  return responsesList;
};

// ----- From MH1 task 1 ------
const isSetIdValidAndAllowed = async (setId, userKey, res) => {
  const set = await db.getSet_id(setId);
  if (!set) {
    res.status(404).send();
    return false;
  }
  if (set.owner !== userKey) {
    res.status(403).send();
    return false;
  }
  return set;
};

exports.llm_queue = async (req, res) => {
  const setId = req.params.setId;
  if (! (await isSetIdValidAndAllowed(setId, req.user.key, res))) return;
  const cards = await db.getAllCards(setId);
  let requestsAdded = 0;
  for (card of cards) {
    if (card.wrong && card.correct) continue;
    await myQueue.add({cardId: card.key, setId: setId});
    requestsAdded++;
  }
  res.status(201).json(requestsAdded);
};

myQueue.process(async (job) => {
  // Get card info using key in job.data
  const {cardId, setId} = job.data;
  const set = await db.getSet_id(setId);
  if (!set) return;
  const card = await db.getCard_id(setId, cardId);
  if (!card) return;

  const name = set.name;
  const front = card.front;
  const back = card.back;
  db.addWrongAnswers(setId, cardId, ['list', 'of', 'wrong', 'answers']);
  db.addCorrectAnswers(setId, cardId, ['list', 'of', 'correct', 'answers']);
  console.log(front, back);
  /*
  // Prompt LLM using Card Info
  const wrongResponses = await llmPromptWrongAnswers(name, front, back);
  const correctResponses = await llmPromptCorrectAnswers(name, front, back);

  // Parse the output from the LLM
  const wrongList = llmParseResponse(wrongResponses);
  const correctList = llmParseResponse(correctResponses);
  console.log('finished discussion');
  console.log(wrongList, correctList);
  */
  /*
  // Update the card in the db using card key
  db.addWrongAnswers(setId, cardId, wrongList);
  db.addCorrectAnswers(setId, cardId, correctList);
  */
});


//
//
// --------------------------------------------------------------------------
// exports.llm_test = async (req, res) => {
//   const setName = 'CSE 115A: Test 1';
//   const front = 'time-boxed';
//   const back = 'it ends when time is up, whether or not goal is reached';
//   // const sendContent = `In a test about ${setName}, a multiple choice` +
//   //   ` question "${front}" has the correct answer "${back}". Generate 9` +
//   //   ' unique incorrect answers in a similar style to the correct answer' +
//   //   ' in only JSON.';

//   // Adjusted the LLM prompt to avoid instances where it sends the JSON ticks
//   const sendContent = `In a test about ${setName}, the multiple-choice ` +
//     `question "${front}" has the correct answer "${back}".` +
//     `Generate exactly 9 unique incorrect answers similar in style to the ` +
//     `correct answer, and respond with only the JSON object without any ` +
//     `surrounding text, quotes, or backticks.`;

//   // console.log(sendContent);
//   const completion = await openai.chat.completions.create({
//     model: 'meta-llama/llama-3.2-1b-instruct:free',
//     messages: [
//       {
//         'role': 'user',
//         'content': sendContent,
//       },
//     ],
//   });
//   console.log(completion.choices[0].message.content);


//   res.status(200).send();
// };

// --- Generates wrong answers for 1 card from a specified set ---
// exports.llm_generate = async (req, res) => {
//   // trying to test with a set from mail@email.com account..
//   const setId = req.params.setId;
//   // 'db3a7b47-c716-473a-9a3a-aa28cb0b67e2';
//   const cardId = '77ed52f0-ae87-4870-8b71-5eb439f0550c';
//   // req.params.cardId;

//   console.log('setid: ' + setId);
//   console.log('cardid: ' + cardId);

//   const set = await db.setDetails(setId);
//   if (set == null) {
//     res.status(404).send('no set name found');
//   }
//   console.log('set info: ' + set);
//   console.log('set name: ' + set.name);
//   console.log('set card num: ' + set.card_num);
//   console.log('set key: ' + set.key);

//   const card = await db.getCard_id(setId, cardId);
//   if (card == null) {
//     res.status(404).send('no card/set info found');
//   }
//   console.log('card: ' + card);
//   console.log('card.key: ' + card.key);
//   console.log('card.front: ' + card.front);
//   console.log('card.back: ' + card.back);

//   res.status(200).send('end of llm_generate');
// };

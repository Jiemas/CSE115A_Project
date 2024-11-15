const db = require('./db');
const OpenAI = require('openai');
const myQueue = require('./jobQueue');

// https://openrouter.ai/meta-llama/llama-3.2-1b-instruct:free/api

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.API_KEY,
});

numOfAnswers = 9;

// Leaving these functions separate until prompt is finalized
const wrongAnswerPrompt = (setName, front, back) => {
  return `In a multiple-choice/free-response quiz on ${setName}, ` +
    `the question is: "${front}" and the correct answer is "${back}". ` +
    `Generate exactly ${numOfAnswers} unique incorrect answers similar in ` +
    'style to the correct answer, similar in length and complexity, but ' +
    'distinct from the correct answer. Ensure the JSON is complete and ' +
    'properly formatted, with no surrounding text, quotes, or backticks ' +
    'and the JSON should have the following structure:' +
    `
    {
      "incorrect_answers": [
        "First incorrect answer",
        "Second incorrect answer",
        "Third incorrect answer", ...
      ]
    }`;
};

const correctAnswerPrompt = (setName, front, back) => {
  return `In a multiple-choice/free-response quiz on ${setName}, ` +
    `the question is: "${front}" and the correct answer is "${back}". ` +
    `Generate exactly ${numOfAnswers} unique correct answers similar in ` +
    'style to the correct answer, similar in length and complexity, but ' +
    'distinct from the correct answer. Ensure the JSON is complete and ' +
    'properly formatted, with no surrounding text, quotes, or backticks ' +
    'and the JSON should have the following structure:' +
    `
    {
      "incorrect_answers": [
        "First incorrect answer",
        "Second incorrect answer",
        "Third incorrect answer", ...
      ]
    }`;
};

/* THINGS TO DO:
3. Add a delete LLM data endpoint (Future Sprint?)
4. More clearly indicate in frontend when an answer option has been LLM gen
*/

const promptLLM = async (prompt) => {
  const completion = await openai.chat.completions.create({
    model: 'meta-llama/llama-3.2-1b-instruct:free',
    messages: [
      {
        'role': 'user',
        'content': prompt,
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
    return 2;
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
  return responsesList.length <= 2 * numOfAnswers ? responsesList : 2;
};

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

const doesCardHaveLLM = (LLM) => {
  return !LLM || LLM == 2;
};

const pushToQueue = async (card, setId, type) => {
  await myQueue.add({cardId: card.key, setId: setId, requestType: type});
  return 1;
};

exports.llm_queue = async (req, res) => {
  const setId = req.params.setId;
  if (! (await isSetIdValidAndAllowed(setId, req.user.key, res))) return;
  const cards = await db.getAllCards(setId);
  let requestsAdded = 0;
  newCards = {};
  for (card of cards) {
    newCards[card.key] = card;
    if (doesCardHaveLLM(card.wrong)) {
      requestsAdded += pushToQueue(card, setId, 'wrong');
      card.wrong = 1;
    }
    if (doesCardHaveLLM(card.correct)) {
      requestsAdded += pushToQueue(card, setId, 'correct');
      card.correct = 1;
    }
  }
  console.log(newCards);
  db.overwriteCards(newCards, setId);
  res.status(201).json(requestsAdded);
};

myQueue.process(async (job) => {
  const {cardId, setId, requestType} = job.data;
  const set = await db.getSet_id(setId);
  if (!set) return;
  const card = await db.getCard_id(setId, cardId);
  if (!card) return;

  const name = set.name;
  const {front, back} = card;
  const prompt = requestType == 'wrong' ?
    wrongAnswerPrompt(name, front, back) :
    correctAnswerPrompt(name, front, back);
  const response = await promptLLM(prompt);
  console.log(response);
  const parsedResponse = await llmParseResponse(response);
  db.addLLM(setId, cardId, parsedResponse, requestType);
});

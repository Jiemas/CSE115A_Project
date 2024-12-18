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
  const prompt = `In a multiple-choice/free-response quiz on ${setName}, ` +
    `the question is: "${front}" and the correct answer is "${back}". ` +
    `Generate exactly ${Math.floor(numOfAnswers / 2)} INCORRECT answers ` +
    'that MUST be completely distinct from eachother, be factually wrong ' +
    'and contradict the correct answer, never be synonymous or partially ' +
    `correct versions of "${back}", and maintain similar length and ` +
    `complexity to "${back}". Ensure the JSON is complete and properly ` +
    'formatted, with no surrounding text, quotes, or backticks, ' +
    'properly formatted, with no surrounding text, quotes, or backticks, ' +
    'and the JSON should have the following structure:' +
    `
    {
      "incorrect_answers": [
        "First incorrect answer",
        "Second incorrect answer",
        "Third incorrect answer", ...
      ]
    }`;
  return prompt;
};

const correctAnswerPrompt = (setName, front, back) => {
  const prompt = `In a multiple-choice/free-response quiz on ${setName}, ` +
    `the question is: "${front}" and the correct answer is "${back}". ` +
    `Generate exactly ${Math.floor(numOfAnswers / 3)} alternative correct ` +
    'answers that must be semantically equivalent to the original correct ' +
    'answer, different in wording but expressing the same concept, similar ' +
    'in length and complexity to the original answer, and still maintaining ' +
    'the same level of technical accuracy. Ensure each answer rephrases the ' +
    'same correct concept in a unique way. Also, ensure the JSON is ' +
    'complete and properly formatted, with no surrounding text, quotes, or ' +
    'backticks and the JSON should have the following structure:' +
    `
    {
      "correct_answers": [
        "First correct answer",
        "Second correct answer",
        "Third correct answer", ...
      ]
    }`;
  return prompt;
};

const promptLLM = async (prompt) => {
  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.2-1b-instruct:free',
      messages: [
        {
          'role': 'user',
          'content': prompt,
        },
      ],
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.log(error);
    return null;
  }
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
  return responsesList.length <= 2 * numOfAnswers ?
    Array.from(new Set(responsesList)) :
    2;
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
      requestsAdded += await pushToQueue(card, setId, 'wrong');
      card.wrong = 1;
    }
    if (doesCardHaveLLM(card.correct)) {
      requestsAdded += await pushToQueue(card, setId, 'correct');
      card.correct = 1;
    }
  }
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
  if (!front || !back) return;
  const prompt = requestType == 'wrong' ?
    wrongAnswerPrompt(name, front, back) :
    correctAnswerPrompt(name, front, back);
  const response = await promptLLM(prompt);
  const parsedResponse = await llmParseResponse(response);
  db.addLLM(setId, cardId, parsedResponse, requestType);
});

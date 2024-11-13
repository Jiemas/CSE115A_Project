const db = require('./db');
const OpenAI = require('openai');
const myQueue = require('./JobQueue');

// https://openrouter.ai/meta-llama/llama-3.2-1b-instruct:free/api

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.API_KEY,
});

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

  console.log('sending request to queue');
  for (let i = 0; i < 20; i++) {
    await myQueue.add({
      message: setId,
    });
  }
  res.status(201).send();
};

myQueue.process(async (job) => {
  console.log(job.data);
});

exports.llm_test = async (req, res) => {
  const setName = 'CSE 115A: Test 1';
  const front = 'time-boxed';
  const back = 'it ends when time is up, whether or not goal is reached';
  const sendContent = `In a test about ${setName}, a multiple choice` +
    ` question "${front}" has the correct answer "${back}". Generate 9` +
    ' unique incorrect answers in a similar style to the correct answer' +
    ' in only JSON.';
  console.log(sendContent);
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
  res.status(200).send();
};

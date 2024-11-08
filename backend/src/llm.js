// const db = require('./db');
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

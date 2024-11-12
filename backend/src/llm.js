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
  // console.log(completion.choices[0].message.content);

  // Parse LLM response into a ist of wrong answers
  const responses = JSON.parse(completion.choices[0].message.content);
  const responsesList = [];
  // console.log(responses);

  for (const r in responses) {
    if (responses.hasOwnProperty(r)) {
      for (const item in responses[r]) {
        if (item != null) {
          responsesList.push(responses[r][item]);
        }
      }
    }
  }

  console.log(responsesList);

  res.status(200).send();
};

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

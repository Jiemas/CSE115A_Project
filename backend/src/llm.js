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
  // console.log(completion.choices[0].message.content);

  // ----- my edits -----------
  // parse LLM output into JSON object
  const responses = JSON.parse(completion.choices[0].message.content);

  // create obj to store the array of LLM responses
  const responsesObj = {};

  // prints out a list of objects, each object is one of the LLM's wrong answers
  for (const i in responses) {
    if (responses.hasOwnProperty(i)) {
      // console.log(responses[i]);

      for (const r in responses[i]) {
        if (responses[i][r] != null) {
          responsesObj[r] = responses[i][r];
        } else {
          res.status(500).send('couldnt LLM parse into JSON obj properly');
        }
      }
    }
  }
  console.log(responsesObj);

  res.status(200).send();
};


// when test answers need to be generated
exports.llm_generate = async (req, res) => {
  // trying to test with a set from mail@email.com account..
  const setId = 'db3a7b47-c716-473a-9a3a-aa28cb0b67e2';
  // req.params.setId;
  const allCards = db.getAllCards(setId);

  console.log('setid: ' + setId);
  console.log('all cards in set: ' + allCards);

  // for (const card in allCards) {
  //   if (card != null) {
  //     const setName = 'Concepts for Midterm 1 of CSE102';
  //     const front = card.front;
  //     const back = card.back;

  //     const sendContent = `In a test about ${setName}, a multiple choice` +
  //     ` question "${front}" has the correct answer "${back}". Generate 9` +
  //     ' unique incorrect answers in a similar style to the correct answer' +
  //     ' in only JSON.';
  //     console.log(sendContent);
  //     const completion = await openai.chat.completions.create({
  //       model: 'meta-llama/llama-3.2-1b-instruct:free',
  //       messages: [
  //         {
  //           'role': 'user',
  //           'content': sendContent,
  //         },
  //       ],
  //     });

  //     const responses = JSON.parse(completion.choices[0].message.content);
  //     const responsesObj = {};
  //     for (const i in responses) {
  //       if (responses.hasOwnProperty(i)) {
  //         // console.log(responses[i]);
  //         for (const r in responses[i]) {
  //           if (responses[i][r] != null) {
  //             responsesObj[r] = responses[i][r];
  //           } else {
  //             res.status(500).send('couldnt parse into JSON obj properly');
  //           }
  //         }
  //       }
  //     }
  //     console.log(responsesObj);
  //   }
  // }

  res.status(200).send('end of llm_genereate');
};

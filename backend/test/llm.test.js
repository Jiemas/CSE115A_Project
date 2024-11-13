const supertest = require('supertest');
const http = require('http');
require('dotenv').config();
const app = require('../src/app');
const myQueue = require('../src/JobQueue');
let server;

setKey = 'bd24a693-5256-4414-9321-c4a3480ad96g';
otherSetKey = '0293ada7-ca0b-4983-8baa-b07e1f50980f';
path = `/v0/llm/${setKey}`;

// https://www.sitepoint.com/delay-sleep-pause-wait/
/**
 *
 * @param {int} ms
 * @return {Object}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeAll(() => {
  server = http.createServer(app);
  server.listen();
  request = supertest(server);
});

afterAll((done) => {
  server.close(done);
  myQueue.close();
});

test('LLM, no set_id, expect 404', async () => {
  await request.post('/v0/llm')
    .expect(404);
});

test('LLM, no token, expect 401',
  async () => {
    await request.post(path)
      .expect(401);
  });

test('LLM, invalid token, expect 403',
  async () => {
    await request.post(path)
      .set('Authorization', `Bearer random`)
      .expect(403);
  });

let accessToken;
test('Getting accessToken', async () => {
  await request.post('/v0/login')
    .send({password: 'bacon', email: 'mail@email.com'})
    .then(async (data) => {
      accessToken = data.body.accessToken;
    });
});

test('LLM, valid token, invalid set, expect 404',
  async () => {
    await request.post('/v0/llm/random')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

test('LLM, valid token, not-owned set, expect 404',
  async () => {
    await request.post(`/v0/llm/${otherSetKey}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

test('LLM, valid token, valid set, expect 201',
  async () => {
    await request.put('/v0/set')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({description: 'this is a test', name: 'llmTest1'})
      .then(async (data) => {
        key = data.body;
        await sleep(600).then(async () => {
          await request.post(`/v0/llm/${key}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(201)
            .then(async () => {
              await request.delete(`/v0/set/${key}`)
                .set('Authorization', `Bearer ${accessToken}`);
            });
        });
      });
  });

test('LLM, valid token, valid set, expect returned data is integer',
  async () => {
    await request.put('/v0/set')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({description: 'this is a test', name: 'llmTest2'})
      .then(async (data) => {
        key = data.body;
        await sleep(600).then(async () => {
          await request.post(`/v0/llm/${key}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .then(async (data) => {
              expect(data.body).toBe(1);
              await sleep(1100).then(async () => {
                await request.delete(`/v0/set/${key}`)
                  .set('Authorization', `Bearer ${accessToken}`);
              });
            });
        });
      });
  });

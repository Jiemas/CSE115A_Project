const supertest = require('supertest');
const http = require('http');
require('dotenv').config();
const app = require('../src/app');
const myQueue = require('../src/jobQueue');
const db = require('../src/db').dbFunctions;
const dbCopy = require('../src/db');
let server;

const encryptedPassword = '$2b$10$FV0WLutpqF9nVrWdbPiUW.tt7caFz5hbhawa1y1ZKG/vlV1J6bPKO';

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
  db.getUser = dbCopy.getUser;
});

setKey = 'bd24a693-5256-4414-9321-c4a3480ad96g';
otherSetKey = '0293ada7-ca0b-4983-8baa-b07e1f50980f';
path = `/v0/card/${setKey}`;

test('GET, no set_id, expect 404', async () => {
  await request.get('/v0/card')
    .expect(404);
});

let accessToken;

test('GET, existing set_id, expect 200', async () => {
  db.getUser = () => (
    {password: encryptedPassword, key: 1234, email: 'mail@email.com'}
  );
  db.getSet_id = () => ({owner: 1234});
  await request.post('/v0/login')
    .send({password: 'bacon', email: 'mail@email.com'})
    .then(async (data) => {
      accessToken = data.body.accessToken;
      await request.get(path)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
});

test('GET, expect 403, valid body, valid token, not owned set',
  async () => {
    db.getSet_id = () => ({owner: 910});
    await request.get(`/v0/card/${otherSetKey}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

test('GET, random set_id, expect 404', async () => {
  db.getSet_id = () => null;
  await request.get('/v0/card/random')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(404);
});

test('GET, expect data\'s body is an array', async () => {
  db.getSet_id = () => ({owner: 1234});
  db.getAllCards = () => ([
    {
      'front': 'string',
      'back': 'string',
      'starred': true,
      'key': 'string',
    },
  ]);
  await request.get(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .then((data) => {
      expect(Array.isArray(data.body)).toBeTruthy();
    });
});

test('GET, expect data\'s body element to have front property', async () => {
  await request.get(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .then((data) => {
      expect(data.body[0].front).toBeTruthy();
    });
});

test('GET, expect data\'s body element to have back property', async () => {
  await request.get(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .then((data) => {
      expect(data.body[0].back).toBeTruthy();
    });
});

test('GET, expect data\'s body element to have starred property', async () => {
  await request.get(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .then((data) => {
      expect(typeof(data.body[0].starred)).toBe(typeof(true));
    });
});

test('GET, expect data\'s body element to have key property', async () => {
  await request.get(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .then((data) => {
      expect(data.body[0].key).toBeTruthy();
    });
});


test('PUT new, expect 401, no body, no token', async () => {
  await request.put(path)
    .expect(401);
});

test('PUT new, expect 415, no body, random token', async () => {
  await request.put(path)
    .set('Authorization', `Bearer random`)
    .expect(415);
});

test('PUT new, expect 415, invalid body, random token', async () => {
  await request.put(path)
    .set('Authorization', `Bearer random`)
    .send('wrong')
    .expect(415);
});

test('PUT new, expect 415, invalid body, set', async () => {
  await request.put(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .send('wrong')
    .expect(415);
});

test('PUT new, expect 400, invalid body object', async () => {
  await request.put(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({random: 0})
    .expect(400);
});

test('PUT new, expect 404, valid body object, unknown key', async () => {
  db.getSet_id = () => null;
  await request.put('/v0/card/random')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({front: 'front description',
      back: 'back description',
      starred: false})
    .expect(404);
});

let key = 0;

test('PUT new, expect 201, valid request', async () => {
  db.getSet_id = () => ({owner: 1234});
  db.getCard_front = () => false;
  db.addCard = () => {};
  await request.put(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({front: 'test card', back: 'back description', starred: false})
    .expect(201)
    .then((data) => {
      key = data.body;
    });
});

test('PUT new, returns string key', async () => {
  expect(typeof(key)).toBe(typeof('test'));
});

test('PUT new, expect 409, card with duplicate front', async () => {
  db.getCard_front = () => ({key: 'random'});
  await sleep(100).then(async () => {
    await request.put(path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({back: 'this should not work', front: 'test card', starred: false})
      .expect(409);
  });
});

test('POST update, random set_id, expect 404', async () => {
  db.getSet_id = () => false;
  await request.post('/v0/card/random?cardId=random')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({back: 'this should update', front: 'test card 1', starred: false})
    .expect(404);
});

test('POST update, random card_id, expect 404', async () => {
  db.getCard_id = () => false;
  await request.post(`${path}?cardId=random`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({back: 'this should update', front: 'test card 1', starred: false})
    .expect(404);
});

test('POST update, expect 409, duplicate front', async () => {
  db.getSet_id = () => ({owner: 1234});
  db.getCard_id = () => ({
    'front': 'string',
    'back': 'string',
    'starred': true,
    'key': 'string',
  });
  db.getCard_front = () => ({key: '9876'});
  await request.post(`${path}?cardId=${key}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({back: 'this should update', front: 'do not delete', starred: false})
    .expect(409);
});

test('POST update, expect 403, valid body, valid token, not owned set',
  async () => {
    db.getSet_id = () => ({owner: 5678});
    await request.post(
      `/v0/card/${otherSetKey}?cardId=2f0a1e5b-0583-448e-b819-5b71c5fc676e`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({front: 'front description',
        back: 'back description',
        starred: false})
      .expect(403);
  });

test('POST update, expect 201, body, known set', async () => {
  db.getSet_id = () => ({owner: 1234});
  db.getCard_front = () => ({key: 'string'});
  db.updateCard = () => {};
  await request.post(`${path}?cardId=string`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({back: 'this should update', front: 'test card 1', starred: false})
    .expect(201);
});

test('Delete, expect 404, unknown set', async () => {
  db.getSet_id = () => null;
  await request.delete(`/v0/card/random?cardId=${key}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(404);
});

test('Delete, expect 404, unknown card', async () => {
  db.getSet_id = () => ({owner: 1234});
  db.getCard_id = () => false;
  await request.delete(`${path}?cardId=random`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(404);
});

test('Delete, expect 403, random id, invalid token', async () => {
  await request.delete(`${path}?cardId=random`)
    .set('Authorization', `Bearer random`)
    .expect(403);
});

test('Delete, expect 403, not owned set, valid token', async () => {
  db.getSet_id = () => ({owner: 5678});
  await request.delete(`/v0/card/${otherSetKey}?cardId=${key}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(403);
});

test('Delete, expect 200, valid request', async () => {
  db.getSet_id = () => ({owner: 1234});
  db.getCard_id = () => true;
  db.deleteCard = () => {};
  await request.delete(`${path}?cardId=${key}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200);
});

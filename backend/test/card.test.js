const supertest = require('supertest');
const http = require('http');
require('dotenv').config();
const app = require('../src/app');

let server;

// https://www.sitepoint.com/delay-sleep-pause-wait/
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

beforeAll(() => {
  server = http.createServer(app);
  server.listen();
  request = supertest(server);
});

afterAll((done) => {
  server.close(done);
});

set_key = 'bd24a693-5256-4414-9321-c4a3480ad96g';

test('PUT new, expect 415, no body, no set', async () => {
    await request.put('/v0/card/' + set_key)
        .expect(415)
  });

test('PUT new, expect 415, invalid body, set', async () => {
await request.put('/v0/card/' + set_key)
    .send('wrong')
    .expect(415)
});

test('PUT new, expect 400, invalid body object', async () => {
    await request.put('/v0/card/' + set_key)
        .send({random: 0})
        .expect(400)
});

test('PUT new, expect 404, valid body object, unknown key', async () => {
    await request.put('/v0/card/random')
        .send({front: 'front description', back: 'back description', starred: false})
        .expect(404)
});

let key = 0
test('PUT new, expect 201, valid request', async () => {
    await request.put('/v0/card/' + set_key)
        .send({front: 'test card', back: 'back description', starred: false})
        .expect(201)
        .then((data) => {
            key = data.body;
        })
});

test('PUT new, returns string key', async () => {
    expect(typeof(key)).toBe(typeof('test'));
});

test('PUT new, expect 409, card with duplicate front', async () => {
    await sleep(100).then(async () => {
      await request.put('/v0/card/' + set_key)
      .send({back: 'this should not work', front: 'test card', starred: false})
      .expect(409)
    })
  });

// GET Operation does not exist, so add when it does
/*
test('PUT new, after valid request, GET contains set', async () => {
  await sleep(100).then(async () => {
    await request.get('/v0/card/' + set_key)
    .then((data) => {
      flag = false;
      for (const obj of data.body) {
        if (obj.name == 'test_card') {
          flag = true;  
        }
      }
      expect(flag).toBeTruthy();
    });
  })
});
*/
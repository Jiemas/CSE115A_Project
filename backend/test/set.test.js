const supertest = require('supertest');
const http = require('http');
require('dotenv').config();
const app = require('../src/app');

let server;

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
});

setKey = 'bd24a693-5256-4414-9321-c4a3480ad96g';
path = '/v0/set';

/*
test('GET, expect 401, no token provided', async () => {
  await request.get(path)
    .expect(401);
});

test('GET, expect 403, invalid token provided', async () => {
  await request.get(path)
    .set('Authorization', 'Bearer asiopgho')
    .expect(403);
});

*/
let accessToken;

test('GET, expect 200', async () => {
  await request.post('/v0/login')
    .send({password: 'bacon', email: 'mail@email.com'})
    .then(async (data) => {
      accessToken = data.body.accessToken;
      await request.get(path)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
});

/*
test('GET, expect data\'s body is an array', async () => {
  await request.get(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .then((data) => {
      expect(Array.isArray(data.body)).toBeTruthy();
    });
});

test('GET, expect data\'s body element to have card_num property', async () => {
  await request.get(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .then((data) => {
      expect(typeof(data.body[0].card_num)).toBe(typeof(1));
    });
});

test('GET, expect data\'s body element to have description property',
  async () => {
    await request.get(path)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        expect(data.body[0].description).toBeTruthy();
      });
  });

test('GET, expect data\'s body element to have name property', async () => {
  await request.get(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .then((data) => {
      expect(data.body[0].name).toBeTruthy();
    });
});

test('GET, expect data\'s body element to have owner property', async () => {
  await request.get(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .then((data) => {
      expect(data.body[0].owner).toBeTruthy();
    });
});

test('GET, expect data\'s body element to have key property', async () => {
  await request.get(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .then((data) => {
      expect(data.body[0].key).toBeTruthy();
    });
});
*/


test('PUT new, expect 401, no body, no token', async () => {
  await request.put(path)
    .expect(401);
});

test('PUT new, expect 401, no body, token', async () => {
  await request.put(path)
    .set('Authorization', `Bearer random`)
    .expect(415);
});

test('PUT new, expect 415, invalid body, token', async () => {
  await request.put(path)
    .set('Authorization', `Bearer random`)
    .send('wrong')
    .expect(415);
});

test('PUT new, expect 400, invalid body object', async () => {
  await request.put(path)
    .set('Authorization', `Bearer random`)
    .send({random: 0})
    .expect(400);
});

test('PUT new, expect 401, valid body, no token', async () => {
  await request.put(path)
    .send({description: 'this is a test', name: 'third_test'})
    .expect(401)
});

test('PUT new, expect 401, valid body, invalid token', async () => {
  await request.put(path)
    .set('Authorization', `Bearer random`)
    .send({description: 'this is a test', name: 'third_test'})
    .expect(403)
});

let key = 0;
// TODO When adding login, 'global' needs to be variable
test('PUT new, expect 201, valid request', async () => {
  await request.put(path)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({description: 'this is a test', name: 'third_test'})
    .expect(201)
    .then((data) => {
      key = data.body;
    });
});

test('PUT new, returns string key', async () => {
  expect(typeof(key)).toBe(typeof('test'));
});

test('PUT new, after valid request, GET contains set', async () => {
  await sleep(400).then(async () => {
    await request.get(path)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        flag = false;
        for (const obj of data.body) {
          if (obj.name == 'third_test') {
            flag = true;
          }
        }
        expect(flag).toBeTruthy();
      });
  });
});

// TODO When adding login, 'global' needs to be variable
test('PUT new, expect 409, set with duplicate name', async () => {
  await sleep(100).then(async () => {
    await request.put(path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({description: 'this should not work', name: 'third_test'})
      .expect(409);
  });
});

test('PUT new, there should be set entry in cards table', async () => {
  await request.get(`/v0/card/${key}`)
    .expect(200);
});

/*
test('PUT update, expect 415, no body, unknown set', async () => {
  await request.put(`${path}/random`)
    .expect(415);
});

test('PUT update, expect 404, body, unknown set', async () => {
  await request.put(`${path}/random`)
    .send({card_num: 1, description: 'this should not work',
      name: 'third_test', owner: 'global'})
    .expect(404);
});

test('PUT update, expect 201, body, known set', async () => {
  await request.put(`${path}/${setKey}`)
    .send({card_num: 1, description: 'description of the test set',
      name: 'fourth_set', owner: 'global'})
    .expect(201);
});

test('PUT update, after valid request, GET contains updated set', async () => {
  await sleep(500).then(async () => {
    await request.get(path)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        flag = false;
        for (const obj of data.body) {
          if (obj.name == 'fourth_set') {
            flag = true;
          }
        }
        expect(flag).toBeTruthy();
      });
  });
});

test('PUT update, cleaning up from last test', async () => {
  await request.put(`${path}/${setKey}`)
    .send({card_num: 0, description: 'do not delete, part of tests',
      name: 'test_set', owner: 'global'})
    .expect(201);
});

test('Delete, expect 405, no name', async () => {
  await request.delete(path)
    .expect(405);
});

test('Delete, expect 404, random name', async () => {
  await request.delete(`${path}/random`)
    .expect(404);
});

test('Delete, expect 200, valid request', async () => {
  await request.delete(`${path}/${key}`)
    .expect(200);
});

test('Delete, after valid request, GET does not contain set', async () => {
  await sleep(500).then(async () => {
    await request.get(path)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        flag = false;
        for (const obj of data.body) {
          if (obj.name == 'third_test') {
            flag = true;
          }
        }
        expect(flag).toBeFalsy();
      });
  });
});

test('Delete, there should be no set entry in cards table', async () => {
  await request.get(`/v0/card/${key}`)
    .expect(404);
});
*/
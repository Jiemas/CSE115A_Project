const supertest = require('supertest');
const http = require('http');
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

/*
test('GET, expect 200', async () => {
  await request.get('/v0/set')
    .expect(200);
});

test('GET, expect data\'s body is an array', async () => {
  await request.get('/v0/set')
    .then((data) => {
      expect(Array.isArray(data.body)).toBeTruthy();
    });
});

test('GET, expect data\'s body element to have card_num property', async () => {
  await request.get('/v0/set')
    .then((data) => {
      expect(typeof(data.body[0].card_num)).toBe(typeof(1));
    });
});

test('GET, expect data\'s body element to have description property', async () => {
  await request.get('/v0/set')
    .then((data) => {
      expect(data.body[0].description).toBeTruthy();
    });
});

test('GET, expect data\'s body element to have name property', async () => {
  await request.get('/v0/set')
    .then((data) => {
      expect(data.body[0].name).toBeTruthy();
    });
});

test('GET, expect data\'s body element to have owner property', async () => {
  await request.get('/v0/set')
    .then((data) => {
      expect(data.body[0].owner).toBeTruthy();
    });
});

test('PUT new, expect 415, no body', async () => {
  await request.put('/v0/set')
    .expect(415)
});

test('PUT new, expect 415, invalid body', async () => {
  await request.put('/v0/set')
    .send('wrong')
    .expect(415)
});

test('PUT new, expect 400, invalid body object', async () => {
  await request.put('/v0/set')
    .send({random: 0})
    .expect(400)
});

// TODO When adding login, 'global' needs to be variable
test('PUT new, expect 201, valid request', async () => {
  await request.put('/v0/set')
    .send({description: 'this is a test', name: 'third_test', owner: 'global'})
    .expect(201)
});

test('PUT new, after valid request, GET contains set', async () => {
  sleep(500).then(async () => {
    await request.get('/v0/set')
    .then((data) => {
      flag = false;
      for (const obj of data.body) {
        if (obj.name == 'third_test') {
          flag = true;  
        }
      }
      expect(flag).toBeTruthy();
    });
  })
});

// TODO When adding login, 'global' needs to be variable
test('PUT new, expect 409, set with duplicate name', async () => {
  sleep(500).then(async () => {
    await request.put('/v0/set')
    .send({description: 'this should not work', name: 'third_test', owner: 'global'})
    .expect(409)
  })
});

test('PUT update, expect 415, no body, unknown set', async () => {
  await request.put('/v0/set/random')
    .expect(415)
});

test('PUT update, expect 404, body, unknown set', async () => {
  await request.put('/v0/set/random')
    .send({card_num: 1, description: 'this should not work', name: 'third_test', owner: 'global'})
    .expect(404)
});

test('PUT update, expect 201, body, known set', async () => {
  await request.put('/v0/set/test_set')
    .send({card_num: 1, description: 'description of the test set', name: 'fourth_set', owner: 'global'})
    .expect(201);
});


test('PUT update, after valid request, GET contains updated set', async () => {
  sleep(500).then(async () => {
    await request.get('/v0/set')
      .then((data) => {
        flag = false;
        console.log(data.body)
        for (const obj of data.body) {
          if (obj.name == 'fourth_test') {
            flag = true;  
          }
        }
        expect(flag).toBeTruthy()
    });
  })
});

test('PUT update, cleaning up from last test', async () => {
  await request.put('/v0/set/fourth_set')
    .send({card_num: 0, description: 'description of the test set', name: 'test_set', owner: 'global'})
    .expect(201);
});
*/

test('PUT update, expect 400, no name', async () => {
  await request.delete('/v0/set')
    .expect(400)
});
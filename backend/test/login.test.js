const supertest = require('supertest');
const http = require('http');
require('dotenv').config();
const app = require('../src/app');
let server;

const path = '/v0/login';
const uEmail = 'mail@email.com';
const uObj = {password: 'bacon', email: uEmail};

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

test('login, expect 400 code, invalid body', async () => {
  await request.post(path)
    .send({content: 'this is it?'})
    .expect(400);
});


test('login, expect 400 code, body no password', async () => {
  await request.post(path)
    .send({email: 'email@email.com'})
    .expect(400);
});

test('login, expect 400 code, body no email', async () => {
  await request.post(path)
    .send({password: '8agh8249hrvsuiooh3'})
    .expect(400);
});

test('login, expect 400 code, right props, invalid email', async () => {
  await request.post(path)
    .send({password: '8agh8249hrvsuiooh3', email: 'not an email'})
    .expect(400);
});

test('login, expect 400 code, too many props', async () => {
  await request.post(path)
    .send({password: '8agh8249hrvsuiooh3', email: 'email@email.com', a: 'b'})
    .expect(400);
});

test('login, expect 401 code, unknown email', async () => {
  await request.post(path)
    .send({password: '8agh8249hrvsuiooh3', email: 'email@email.com'})
    .expect(401);
});

test('login, expect 401 code, wrong password', async () => {
  await request.post(path).send({password: 'random', email: uEmail})
    .expect(401);
});

test('login, expect 401 code, password uses encryption', async () => {
  await request.post(path).send({
    password: '$2b$10$fR4PocRC94CeJy.yELEbWu8T3cK/ku6jt1b3/BBo.RONffFqCSkUi',
    email: uEmail,
  })
    .expect(401);
});

test('login, expect 200 code', async () => {
  await request.post(path).send(uObj).expect(200);
});

test('login, data body is an object', async () => {
  await request.post(path).send(uObj)
    .then((data) => {
      expect(typeof(data.body)).toBe(typeof({test: 0}));
    });
});

test('login, body has accessToken', async () => {
  await request.post(path).send(uObj)
    .then((data) => {
      expect(typeof(data.body.accessToken)).toBeDefined();
    });
});

test('create account, expect 415, no body', async () => {
  await request.put(path)
    .expect(415);
});

test('create account, expect 415, invalid body', async () => {
  await request.put(path)
    .send('wrong')
    .expect(415);
});

test('create account, expect 400, invalid body object', async () => {
  await request.put(path)
    .send({random: 0})
    .expect(400);
});

test('create account, expect 401, duplicate email', async () => {
  await request.put(path)
    .send({email: 'mail@email.com', password: 'not bacon'})
    .expect(401);
});

let accountKey;
test('create account, expect 201', async () => {
  await request.put(path)
    .send({email: 'jsrubio@email.com', password: 'not bacon'})
    .expect(201)
    .then((data) => {
      accountKey = data.body;
    });
});

test('after create account, login, expect 200 code', async () => {
  await sleep(500).then(async () => {
    await request.post(path)
      .send({email: 'jsrubio@email.com', password: 'not bacon'})
      .expect(200);
  });
});

test('account database cleanup', async () => {
  await request.delete(`${path}/${accountKey}`)
    .expect(200);
});

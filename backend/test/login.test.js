const supertest = require('supertest');
const http = require('http');
require('dotenv').config();
const app = require('../src/app');

let server;

const path = '/v0/login';
const uEmail = 'mail@email.com';
const uObj = {password: 'bacon', email: uEmail};

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

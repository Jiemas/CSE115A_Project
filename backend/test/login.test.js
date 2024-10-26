const supertest = require('supertest');
const http = require('http');
require('dotenv').config();
const app = require('../src/app');

let server;

const path = '/v0/login'

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
  await request.post('/v0/login')
    .send({email: 'email@email.com'})
    .expect(400);
});

test('login, expect 400 code, body no email', async () => {
  await request.post('/v0/login')
    .send({password: '8agh8249hrvsuiooh3'})
    .expect(400);
});

test('login, expect 400 code, right props, invalid email', async () => {
  await request.post('/v0/login')
    .send({password: '8agh8249hrvsuiooh3', email: 'not an email'})
    .expect(400);
});

test('login, expect 400 code, too many props', async () => {
  await request.post('/v0/login')
    .send({password: '8agh8249hrvsuiooh3', email: 'email@email.com', a: 'b'})
    .expect(400);
});

test('login, expect 401 code, unknown email', async () => {
  await request.post('/v0/login')
    .send({password: '8agh8249hrvsuiooh3', email: 'email@email.com'})
    .expect(401);
});
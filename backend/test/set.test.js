const supertest = require('supertest');
const http = require('http');
const app = require('../src/app');

let server;

beforeAll(() => {
  server = http.createServer(app);
  server.listen();
  request = supertest(server);
});

afterAll((done) => {
  server.close(done);
});

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

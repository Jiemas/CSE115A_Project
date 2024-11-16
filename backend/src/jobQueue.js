const Queue = require('bull');

const myQueue = new Queue('myQueueName', {
  redis: {
    port: 6379,
    host: process.env.HOST_NAME,
  },
  limiter: {
    max: 1,
    duration: 5000,
  },
});

module.exports = myQueue;

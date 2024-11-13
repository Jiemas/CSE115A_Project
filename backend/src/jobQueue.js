const Queue = require('bull');

const myQueue = new Queue('myQueueName', {
  limiter: {
    max: 1,
    duration: 1000,
  },
});

module.exports = myQueue;

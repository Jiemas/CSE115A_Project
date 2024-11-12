const myQueue = require('./jobQueue');

myQueue.process(async (job) => {
  console.log(job.data);
});

console.log('Worker started');

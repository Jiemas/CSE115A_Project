require('dotenv').config();
const app = require('./app.js');

const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server Running on port ${port}`);
});


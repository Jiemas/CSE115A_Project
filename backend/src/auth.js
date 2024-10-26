const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const crypto = require('crypto');

const db = require('./db');

/*
const saltRounds = 10;
const myPlaintextPassword = 'bacon';
const someOtherPlaintextPassword = 'not_bacon';
bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
  console.log(hash);
  bcrypt.compare(myPlaintextPassword, hash, function(err, result) {
    console.log(result)
});
});
*/

exports.login = async (req, res) => {
  // Check the given email corresponds to existing member
  // If not, return 401
  const out = await db.getUser(req.body.email);
  if (!out) {
    res.status(401).send();
    return;
  }

  // Checks that provided password matches the encryped one in db
  const {password, key, email} = out;
  if (!bcrypt.compareSync(req.body.password, password)) {
    res.status(401).send();
    return;
  }

  // Generates temporary access token and returns it in res
  const dbAccessTok = process.env.SECRET;
  const uAccessToken = jwt.sign(
    {email: req.body.email, key: key},
    dbAccessTok, {
      expiresIn: '30m',
      algorithm: 'HS256'});
  res.status(200).json({accessToken: uAccessToken});
};
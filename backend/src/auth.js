const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db');

exports.createAccount = async (req, res) => {
  // Check the given email corresponds to existing member
  // If it does, return 401
  const out = await db.getUser(req.body.email);
  if (out) {
    res.status(401).send();
    return;
  }
  const newObj = {};
  req.body.key = crypto.randomUUID();

  bcrypt.hash(req.body.password, 10, function(err, hash) {
    req.body.password = hash;
    newObj[req.body.key] = req.body;
    db.addUser(newObj);
  });

  res.status(201).json(req.body.key);
};

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
    {email: email, key: key},
    dbAccessTok, {
      expiresIn: '30m',
      algorithm: 'HS256'});
  res.status(200).json({accessToken: uAccessToken});
};

exports.delete = async (req, res) => {
  db.deleteUser(req.params.id);
  res.status(200).send();
};

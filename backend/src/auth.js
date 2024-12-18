const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db').dbFunctions;

const getExistingUser = async (email, bool, res) => {
  const user = await db.getUser(email);
  if (Boolean(user) == bool) {
    res.status(401).send();
    return false;
  }
  return bool ? true : user;
};

exports.createAccount = async (req, res) => {
  // Check the given email corresponds to existing member
  // If it does, return 401
  if (!(await getExistingUser(req.body.email, true, res))) return;
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
  const user = await getExistingUser(req.body.email, false, res);
  if (!user) return;

  // Checks that provided password matches the encryped one in db
  const {password, key, email} = user;
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

exports.check = async (req, res, next) => {
  // Set up variables
  const authHeader = req.headers.authorization;
  const dbAccessTok = process.env.SECRET;
  const token = authHeader.split(' ')[1];

  // Checks that the provided token is valid
  jwt.verify(token, dbAccessTok, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

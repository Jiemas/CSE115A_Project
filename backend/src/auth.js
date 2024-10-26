const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const db = require('./db');

exports.login = async (req, res) => {
  // Check the given email corresponds to existing member
  // If not, return 401
  const out = await db.getUser(req.body.email);
  if (!out) {
    res.status(401).send();
    return;
  }

  res.status(200).send();
};
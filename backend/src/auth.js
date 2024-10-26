const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const crypto = require('crypto');

const db = require('./db');

exports.login = async (req, res) => {
  // Check the given email corresponds to existing member
  // If not, return 401
  console.log(crypto.randomUUID());
  const out = await db.getUser(req.body.email);
  console.log(out);
  if (!out) {
    res.status(401).send();
    return;
  }

  res.status(200).send();
};
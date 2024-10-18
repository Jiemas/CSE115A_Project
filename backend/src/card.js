const db = require('./db');
const crypto = require('crypto');

exports.add = async (req, res) => {
  setId = req.params.setId;

  // Check provided set id exists
  set = await db.getSet_id(setId);
  if (set == null) {
    res.status(404).send();
    return;
  }

  // Check duplicate front, duplicate backs shouldn't matter
  duplicate = await db.getCard_front(req.body.front, setId);
  if (duplicate) {
    res.status(409).send();
    return;
  }

  req.body.key = crypto.randomUUID();
  newObj = {};
  newObj[req.body.key] = req.body;
  db.addCard(newObj, setId);
  res.status(201).json(req.body.key);
};

exports.getAll = async (req, res) => {
  setId = req.params.setId;

  // Check provided set id exists
  set = await db.getSet_id(setId);
  if (set == null) {
    res.status(404).send();
    return;
  }
  cards = await db.getAllCards(setId);
  res.status(200).json(cards);
};

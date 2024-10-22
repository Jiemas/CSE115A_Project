const db = require('./db');
const crypto = require('crypto');

exports.getAll = async (req, res) => {
  // When login is implemented, 'global' will have to become variable
  // Will then have to add cases where fetch returns nothing
  sets = await db.getAllSets();
  res.status(200).json(sets);
};

exports.add = async (req, res) => {
  setName = req.body.name;
  duplicate = await db.getSet_name(setName);
  if (duplicate.length) {
    res.status(409).send();
    return;
  }

  req.body.card_num = 1;
  req.body.key = crypto.randomUUID();
  newObj = {};
  newObj[req.body.key] = req.body;
  db.addSet(newObj, req.body.key);
  res.status(201).json(req.body.key);
};

exports.update = async (req, res) => {
  id = req.params.id;
  duplicate = await db.getSet_id(id);
  if (duplicate == null) {
    res.status(404).send();
    return;
  }
  newObj = {};
  newObj[id] = req.body;
  req.body.key = id;
  db.addSet(newObj, null);
  res.status(201).send();
};

exports.delete = async (req, res) => {
  id = req.params.id;
  duplicate = await db.getSet_id(id);
  if (duplicate == null) {
    res.status(404).send();
    return;
  }
  db.deleteSet(id);
  res.status(200).send();
};

exports.import = async (req, res) => {
  const set_id = req.params.setId;
  const cards = req.body;

  const newCards = {};
  for (const card of cards) {
    card.key = crypto.randomUUID();
    card.set_id = set_id;
    card.starred = card.starred || false;
    newCards[card.key] = card;
  }

  console.log('New Cards:', newCards); // Debugging log

  // Add new cards to the set
  await db.addCard(newCards, set_id);

  //Update the set card count do later

};

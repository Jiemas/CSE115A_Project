const db = require('./db');
const crypto = require('crypto');

// Called by PUT '/v0/set' (Create Set)
exports.add = async (req, res) => {
  // Gets set name from request parameter
  const setName = req.body.name;

  // Checks if a set is already using the name
  const duplicate = await db.getSet_name(setName);
  if (duplicate.length) {
    res.status(409).send();
    return;
  }

  // Sets up data for new set and adds it to db
  req.body.card_num = 1;
  req.body.owner = req.user.key;
  req.body.key = crypto.randomUUID();
  const newObj = {};
  newObj[req.body.key] = req.body;
  db.addSet(newObj, req.body.key);

  // Returns key of new set for frontend use
  res.status(201).json(req.body.key);
};

// Called by GET '/v0/set' (Read Sets)
exports.getAll = async (req, res) => {
  // When login is implemented, 'global' will have to become variable
  // Will then have to add cases where fetch returns nothing
  const sets = await db.getAllSets(req.user.key);
  res.status(200).json(sets);
};

// Called by PUT '/v0/set/:id' (Update Set)
exports.update = async (req, res) => {
  // Gets set id from request parameter
  const id = req.params.id;

  // Checks that set id is valid
  const exists = await db.getSet_id(id);
  if (exists == null) {
    res.status(404).send();
    return;
  }

  // If user does not own the requested set, return 403
  if (exists.owner !== req.user.key) {
    res.status(403).send();
    return;
  }

  // Updates specified set with new data
  const newObj = {};
  newObj[id] = req.body;
  req.body.key = id;
  req.body.owner = exists.owner;
  db.addSet(newObj, null);
  res.status(201).send();
};

// Called by DELETE '/v0/set/:id' (Delete Set)
exports.delete = async (req, res) => {
  // Gets set id from request parameter
  const id = req.params.id;

  // Checks that set id is valid
  const exists = await db.getSet_id(id);
  if (exists == null) {
    res.status(404).send();
    return;
  }

  // Deletes set
  db.deleteSet(id);
  res.status(200).send();
};

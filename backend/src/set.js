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
  const sets = await db.getAllSets();
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

  // Updates specified set with new data
  const newObj = {};
  newObj[id] = req.body;
  req.body.key = id;
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

exports.import = async (req, res) => {
  try {
    const set_id = req.params.setId;
    const cards = req.body;

    const setExists = await db.getSet_id(set_id);
    if (!setExists) {
      return res.status(400).json({ message: 'Invalid set_id', status: 400 });
    }

    const lines = cards.split('\n');
    const newCards = {};

    for (const line of lines) {
      const [term, definition] = line.split('\t');
      if (term && definition) {
        const card = {
          key: crypto.randomUUID(),
          term: term.trim(),
          definition: definition.trim(),
          starred: false
        };
        newCards[card.key] = card;
      }
    }

    await db.addCard(newCards, set_id);
    res.status(200).json({ message: 'Cards imported successfully', count: Object.keys(newCards).length });
  } catch (error) {
    console.error('Error importing cards:', error);
    res.status(500).json({ message: 'Failed to import cards', error: error.message });
  }
};

const db = require('./db');
const crypto = require('crypto');

const isSetIdValidAndAllowed = async (setId, userKey, res) => {
  const set = await db.getSet_id(setId);
  if (!set) {
    res.status(404).send();
    return false;
  }
  if (set.owner !== userKey) {
    res.status(403).send();
    return false;
  }
  return set;
};

// Called by PUT '/v0/set' (Create Set)
exports.add = async (req, res) => {
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
  const sets = await db.getAllSets(req.user.key);
  if (!sets) {
    res.status(404).send();
    return;
  }
  res.status(200).json(sets);
};

// Called by PUT '/v0/set/:id' (Update Set)
exports.update = async (req, res) => {
  const id = req.params.id;
  const set = await isSetIdValidAndAllowed(id, req.user.key, res);
  if (!set) return;

  // Updates specified set with new data
  const newObj = {};
  newObj[id] = req.body;
  req.body.key = id;
  req.body.owner = set.owner;
  db.addSet(newObj, null);
  res.status(201).send();
};

// Called by DELETE '/v0/set/:id' (Delete Set)
exports.delete = async (req, res) => {
  const id = req.params.id;
  if (!(await isSetIdValidAndAllowed(id, req.user.key, res))) return;
  db.deleteSet(id);
  res.status(200).send();
};

exports.import = async (req, res) => {
  try {
    const setId = req.params.setId;
    const cards = req.body;

    if (!(await isSetIdValidAndAllowed(setId, req.user.key, res))) return;

    const lines = cards.split('\n');
    const newCards = {};

    // Create a card for each line
    for (const line of lines) {
      const [term, definition] = line.split('\t');
      if (term && definition) {
        const card = {
          key: crypto.randomUUID(),
          front: term.trim(),
          back: definition.trim(),
          starred: false,
        };
        newCards[card.key] = card;
      }
    }
    await db.addCard(newCards, setId);

    res.status(200).json(
      {message: 'Cards imported successfully',
        count: newCards});
  } catch (error) {
    console.error('Error importing cards:', error);
    res.status(500).send();
  }
};

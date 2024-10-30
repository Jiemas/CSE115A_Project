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
  const set_id = req.params.setId;
  const cards = req.body;

  // Split the input into lines hardcode for now
  const lines = cards.split('\n');

  const newCards = {};
  for (const line of lines) {
    // Split the line into term and definition
    const [term, definition] = line.split('\t');

    // Check if term and definition are not empty
    if (term && definition) {
      //Create Card objects and add them to the newCards object
      const card = {
        key: crypto.randomUUID(),
        set_id: set_id,
        term: term.trim(),
        definition: definition.trim(),
        starred: false
      };
      newCards[card.key] = card;
    }
  }

  console.log('New Cards:', newCards); // Debugging log

  // Add new cards to the set
  await db.addCard(newCards, set_id);

  

};

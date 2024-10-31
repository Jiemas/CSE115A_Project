const db = require('./db');
const crypto = require('crypto');

// Called by PUT '/v0/card/:setId' (Create Card)
exports.add = async (req, res) => {
  // Gets set id from request parameter
  const setId = req.params.setId;

  // Check provided set id exists
  const set = await db.getSet_id(setId);
  if (set == null) {
    res.status(404).send('add card, set 404');
    return;
  }

  // Check duplicate front, duplicate backs shouldn't matter
  const duplicate = await db.getCard_front(req.body.front, setId);
  if (duplicate) {
    res.status(409).send();
    return;
  }

  // Sets up data for new card and adds it to db
  req.body.key = crypto.randomUUID();
  const newObj = {};
  newObj[req.body.key] = req.body;
  db.addCard(newObj, setId);

  // Returns key of new card for frontend use
  res.status(201).json(req.body.key);
};

// Called by GET '/v0/card/:setId' (Read Cards)
exports.getAll = async (req, res) => {
  // Gets set id from request parameter
  const setId = req.params.setId;

  // Check that the set exists
  const exists = await db.getSet_id(setId);
  if (exists == null) {
    res.status(404).send();
    return;
  }

  // Check that the user owns the requested set
  // to get all cards specific to the user

  if (exists.owner != req.user.key) {
    res.status(403).send();
    return;
  }
  // console.log('after check if exists.owner = req.user.key');


  // Gets cards using setId
  // to grab from specific set not user.key, already know user owns it
  const cards = await db.getAllCards(setId);

  // If setId invalid, cards is null
  if (cards == null) {
    res.status(404).send();
    return;
  }

  res.status(200).json(cards);
};

// Called by POST '/v0/card/:setId' (Update Card)
exports.update = async (req, res) => {
  // Gets data from request parameters
  const setId = req.params.setId;
  const cardId = req.query.cardId;

  // Checks validity of setId
  const exists = await db.getSet_id(setId);
  if (exists == null) {
    res.status(404).send();
    return;
  }

  // If the user doesn't own the requested card
  if (exists.owner != req.user.key) {
    res.status(403).send();
    return;
  }

  // Check duplicate front, duplicate backs shouldn't matter
  const duplicate = await db.getCard_front(req.body.front, setId);
  if (duplicate && duplicate.key !== cardId) {
    res.status(409).send();
    return;
  }

  // Checks validity of cardId
  // was supposed to be above checking duplicate
  const card = await db.getCard_id(setId, cardId);
  if (card == null) {
    res.status(404).send();
    return;
  }

  // Updates data of specified card
  req.body.key = cardId;
  db.updateCard(req.body, setId, cardId);
  res.status(201).send(req.body);
};

// Called by DELETE '/v0/card/:setId' (Delete Card)
exports.delete = async (req, res) => {
  // Gets data from request parameters
  const setId = req.params.setId;
  const cardId = req.query.cardId;

  // Checks validity of setId
  const exists = await db.getSet_id(setId);
  if (exists == null) {
    res.status(404).send();
    return;
  }


  // If the user doesn't own the requested card
  if (exists.owner != req.user.key) {
    res.status(403).send('delete: exists owner != req key, 403');
    return;
  }

  // Checks validity of cardId
  const card = await db.getCard_id(setId, cardId);
  if (card == null) {
    res.status(404).send();
    return;
  }

  db.deleteCard(setId, cardId);
  res.status(200).send();
};

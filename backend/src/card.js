const db = require('./db');
const crypto = require('crypto');

// Called by PUT '/v0/card/:setId' (Create Card)
exports.add = async (req, res) => {
  // Gets set id from request parameter
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

  // Sets up data for new card and adds it to db
  req.body.key = crypto.randomUUID();
  newObj = {};
  newObj[req.body.key] = req.body;
  db.addCard(newObj, setId);

  // Returns key of new card for frontend use
  res.status(201).json(req.body.key);
};

// Called by GET '/v0/card/:setId' (Read Cards)
exports.getAll = async (req, res) => {
  // Gets set id from request parameter
  setId = req.params.setId;

  // Gets cards using setId
  cards = await db.getAllCards(setId);

  // If setId invalid, cards is null
  if (!cards) {
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

  // Simultaneously checks validity of setId and cardId
  card = await db.getCard_id(setId, cardId);
  if (card == null) {
    res.status(404).send();
    return;
  }

  // Check duplicate front, duplicate backs shouldn't matter
  duplicate = await db.getCard_front(req.body.front, setId);
  if (duplicate && duplicate.key !== cardId) {
    res.status(409).send();
    return;
  }

  // Updates data of card
  req.body.key = cardId;
  db.updateCard(req.body, setId, cardId);
  res.status(201).send();
};

// Called by DELETE '/v0/card/:setId' (Delete Card)
exports.delete = async (req, res) => {
  // Gets data from request parameters
  const setId = req.params.setId;
  const cardId = req.query.cardId;

  // Simultaneously checks validity of setId and cardId
  card = await db.getCard_id(setId, cardId);
  if (card == null) {
    res.status(404).send();
    return;
  }

  db.deleteCard(setId, cardId);
  res.status(200).send();
};

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
  if (!cards) {
    res.status(500);
  }
  res.status(200).json(cards);
};

exports.update = async (req, res) => {
  const setId = req.params.setId;
  const cardId = req.query.cardId;

  // check if the set id is valid
  set = await db.getSet_id(setId);
  if (set == null) {
      // not a valid set id
      res.status(404).send(); 
      return;
  }

  // how to check if the card id is valid in the set?
  card = await db.getCard_id(setId, cardId);
  if (card == null) {
      // card id not valid in set
      res.status(404).send(); 
      return;
  }

  // Check duplicate front, duplicate backs shouldn't matter
  duplicate = await db.getCard_front(req.body.front, setId);
  if (duplicate) {
    res.status(409).send();
    return;
  }

  req.body.key = cardId;
 
  db.updateCard(req.body, setId, cardId); // don't think we need a new_obj for this
  res.status(201).send();
}

exports.delete = async (req, res) => {
  const setId = req.params.setId;
  const cardId = req.query.cardId;

  /* Not required because of the OpenAPI File
  if (cardId == null) {
      return res.status(400).json({error: 'cardId query parameter is required'});
  }
  */

  // Check that the set is valid
  const set = await db.getSet_id(setId);
  if (set == null) {
      res.status(404).send({error: 'Set not found'});
      return;
  }

  // Check that the card is valid
  card = await db.getCard_id(setId, cardId);
  if (card == null) {
      res.status(404).send({error: 'Card not found'});
      return;
  }

  db.deleteCard(setId, cardId);
  // Delete Successful
  res.status(200).send(); 
}
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

const isDuplicateCard = async (front, setId, cardId, res) => {
  const card = await db.getCard_front(front, setId, res);
  if (card && card.key !== cardId) {
    res.status(409).send();
    return true;
  }
  return false;
};

// Helper function to grab the last card's order in the array
const mostRecentOrder = async (setId, res) => {
  const cards = await db.getAllCards(setId);
  let order = 0;
  // if cards array is empty, set order to 0
  if (cards) {
    const lastCard = cards[cards.length - 1];
    // console.log('last card.order: ' + lastCard.order);
    order = lastCard.order;
  }
  return order;
};

// --- HELPER FUNCTION FOR SH1 TASK 4 ---
// --- Called by card.update() function ---
const canChangeOrder = async (newOrder, res) => {
  // Grab the array of cards
  if (newOrder > 0) return true;
  res.status(409).send('Order not in range, or array length is <= 1');
  return false;
};

// Called by PUT '/v0/card/:setId' (Create Card)
exports.add = async (req, res) => {
  // Gets set id from request parameter
  const setId = req.params.setId;

  if (! (await isSetIdValidAndAllowed(setId, req.user.key, res))) return;
  if (await isDuplicateCard(req.body.front, setId, null, res)) return;

  // Grab the last card's order
  const prevOrder = await mostRecentOrder(setId, res);
  const newOrder = prevOrder + 1;

  // Assigning order to new card
  req.body.order = newOrder;
  // req.body.direction = '';

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
  const setId = req.params.setId;

  if (! (await isSetIdValidAndAllowed(setId, req.user.key, res))) return;

  const cards = await db.getAllCards(setId);
  // Just in case of asychronous issues with firebase
  if (!cards) {
    res.status(404).send();
    return;
  }

  res.status(200).json(cards);
};

const isCardIdValid = async (setId, cardId, res) => {
  const card = await db.getCard_id(setId, cardId);
  if (!card) {
    res.status(404).send();
    return false;
  }
  return true;
};

// Called by POST '/v0/card/:setId' (Update Card)
exports.update = async (req, res) => {
  // Gets data from request parameters
  const setId = req.params.setId;
  const cardId = req.query.cardId;

  const currCard = await isCardIdValid(setId, cardId, res);
  if (!currCard) return;
  if (! (await isSetIdValidAndAllowed(setId, req.user.key, res))) return;
  if (await isDuplicateCard(req.body.front, setId, cardId, res)) return;

  // Updates data of specified card
  req.body.key = cardId;

  // Get the new order to update card with
  const newOrder = req.body.order;

  // Update card order if user made changes to order
  if (newOrder && newOrder != currCard.order) {
    if (! (await canChangeOrder(newOrder, res))) return;
  } else if (!newOrder && currCard.order) {
    req.body.order = currCard.order;
  }
  // Update the card body
  db.updateCard(req.body, setId, cardId);
  res.status(201).send(req.body);
};

// Called by DELETE '/v0/card/:setId' (Delete Card)
exports.delete = async (req, res) => {
  const setId = req.params.setId;
  const cardId = req.query.cardId;

  if (! (await isSetIdValidAndAllowed(setId, req.user.key, res))) return;
  if (!(await isCardIdValid(setId, cardId, res))) return;

  db.deleteCard(setId, cardId);
  res.status(200).send();
};

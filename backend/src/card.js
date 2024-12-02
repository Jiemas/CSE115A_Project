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

const isDuplicateCard = async (front, setId, res) => {
  const card = await db.getCard_front(front, setId, res);
  if (card) {
    res.status(409).send();
    return true;
  }
  return false;
};

// Function to grab the last card in array's order
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
const updateOrder = async (setId, cardId, direction, res) => {
  // Grab the array of cards
  const cards = await db.getAllCards(setId);
  if (!cards) {
    res.status(404).send();
    return;
  }
  // console.log('cards: ' + cards);

  // Grab current card's info
  // console.log('updateOrder cardId: ' + cardId);
  const currCard = await db.getCard_id(setId, cardId);
  // console.log('currCard: ' + currCard);
  const currOrder = currCard.order;
  // console.log('currOrder: ' + currOrder);
  // Grab the index of the current card in card array
  const currIndex = cards.findIndex((card) => card.order === currOrder);

  // Find the target card's info
  let targetCard;
  if (direction === 'up') {
    // console.log('direction was set to up, finding target card');
    if (currIndex > 0) {
      targetCard = cards[currIndex - 1];
    }
  } else if (direction === 'down') {
    // console.log('direction was set to down, finding target card');
    if (currIndex < (cards.length - 1)) {
      targetCard = cards[currIndex + 1];
    }
  }

  // Set target card's order
  const targetOrder = targetCard.order;
  // console.log('targetOrder: ' + targetOrder);
  // console.log('targetCard: ' + targetCard);

  // Swap the order of each card
  currCard.order = targetOrder;
  targetCard.order = currOrder;

  // Reset direction to empty string
  currCard.direction = '';

  // Update the order for both cards
  db.updateCard(currCard, setId, cardId);
  db.updateCard(targetCard, setId, targetCard.key);

  res.status(201).send(currCard);
  // res.status(201).send(targetCard);
};

// Called by PUT '/v0/card/:setId' (Create Card)
exports.add = async (req, res) => {
  // Gets set id from request parameter
  const setId = req.params.setId;

  if (! (await isSetIdValidAndAllowed(setId, req.user.key, res))) return;
  if (await isDuplicateCard(req.body.front, setId, res)) return;

  // Grab the last card's order
  const prevOrder = await mostRecentOrder(setId, res);
  const newOrder = prevOrder + 1;

  // Assigning order to new card
  req.body.order = newOrder;
  req.body.direction = '';
  // console.log('req.body.order: ' + req.body.order);

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

  if (! (await isSetIdValidAndAllowed(setId, req.user.key, res))) return;
  if (await isDuplicateCard(req.body.front, setId, res)) return;

  // Checks validity of cardId
  // was supposed to be above checking duplicate
  if (!(await isCardIdValid(setId, cardId, res))) return;

  // Updates data of specified card
  req.body.key = cardId;

  // Grab values for if a card order is changed
  const direction = req.body.direction;

  // only change order if direction is specifically up or down
  let orderChanged = false;
  if (direction == 'up' | direction == 'down') {
    orderChanged = true;
  }

  // IF TRUE: CHANGE THE ORDER OF CURRCARD AND TARGETCARD
  // ELSE: NO CHANGE TO CARD'S ORDER, JUST UPDATE CARD INFO

  // Regardless which condition, first update card w/ new front/back/starred
  db.updateCard(req.body, setId, cardId);

  if (orderChanged == true) {
    // res status will be called in updateOrder
    updateOrder(setId, cardId, direction, res);
  } else {
    res.status(201).send(req.body);
  }
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

// exports.updateOrder = async (req, res) => {
//   const setId = req.params.setId;

//   // From the frontend, grab the current cardId and direction (e.g. up/down)
//   const {cardId, direction} = req.body;

//   // Check if set and card are valid
//   if (!(await isSetIdValidAndAllowed(setId, req.user.key, res))) return;
//   if (!(await isCardIdValid(setId, cardId, res))) return;

//   // Grab the array of cards
//   const cards = await db.getAllCards(setId);
//   if (!cards) {
//     res.status(404).send();
//     return;
//   }

//   // Grab current card's info
//   const currCard = await db.getCard_id(cardId); // cards[cardId];
//   const currOrder = currCard.order;

//   // Find the target card's info
//   let targetCard;
//   if (direction == 'up') {
//     // find the card with order of currOrder - 1
//     targetCard = Object.values(cards).find((card) =>
//       card.order === currOrder - 1);
//   } else if (direction == 'down') {
//     // find the card with order of currOrder + 1
//     targetCard = Object.values(cards).find((card) =>
//       card.order === currOrder + 1);
//   }

//   // Set target card's order
//   const targetOrder = targetCard.order;
//   console.log(targetOrder);

//   // Update the order for both cards
//   await db.updateCard(currCard, setId, cardId);
//   await db.updateCard(targetCard, setId, targetCard.key);

//   res.status(200).send();
// };


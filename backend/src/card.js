const db = require('./db');
const crypto = require('crypto')

exports.add = async (req, res) => {
    set_id = req.params.set_id;

    // Check provided set id exists
    set = await db.getSet_id(set_id)
    if (set == null) {
        res.status(404).send();
        return;
    }
    
    // Check duplicate front, duplicate backs shouldn't matter
    duplicate = await db.getCard_front(req.body.front, set_id)
    if (duplicate) {
        res.status(409).send();
        return;
    }

    req.body.key = crypto.randomUUID()
    new_obj = {};
    new_obj[req.body.key] = req.body;
    db.addCard(new_obj, set_id);
    res.status(201).json(req.body.key);
}

exports.getAll = async (req, res) => {
    set_id = req.params.set_id;

    // Check provided set id exists
    set = await db.getSet_id(set_id);
    if (set == null) {
        res.status(404).send();
        return;
    }
    cards = await db.getAllCards(set_id);
    res.status(200).json(cards);
};

exports.delete = async (req, res) => {
    const set_id = req.params.set_id;
    const card_id = req.query.card_id;

    if (card_id == null) {
        return res.status(400).json({error: 'card_id query parameter is required'});
    }

    // Check that the set is valid
    const set = await db.getSet_id(set_id);
    if (set == null) {
        res.status(404).send({error: 'Set not found'});
        return;
    }

    // Check that the card is valid
    card = await db.getCard_id(set_id, card_id);
    if (card == null) {
        res.status(404).send({error: 'Card not found'});
        return;
    }

    db.deleteCard(set_id, card_id);
    // Delete Successful
    res.status(200).send(); 
}
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

//Import new set of flashcards
exports.import = async (req, res) => {
    set_id = req.params.set_id;

    // Check provided set id exists
    set = await db.getSet_id(set_id)
    if (set == null) {
        
        res.status(404).send();
        return;
    }

    // Check duplicate front, duplicate backs shouldn't matter
    for (let card of req.body) {
        duplicate = await db.getCard_front(card.front, set_id)
        if (duplicate) {
            res.status(409).send();
            return;
        }
    }

    new_obj = {};
    // Go through each card and add a key to it 
    for (let card of req.body) {
        card.key = crypto.randomUUID();
        new_obj[card.key] = card;
    }
    // 
    db.addCard(new_obj, set_id);
    res.status(201).send();
}
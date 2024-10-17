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

// --- my edits: update/delete card ---
// req = request, res = response

//exports.update = async (req, res) => {

//}

exports.delete = async (req, res) => {
    set_id = req.params.set_id;
    card_id = req.params.card_id;

    // check if set id is valid
    duplicate = await getSet_id(set_id);
    if (duplicate == null) {
        res.status(404).send(); // not a valid set id
        return;
    }

    // how to check if the card id is valid in the set?
    dupe = await getCard_id(card_id);
    if (dupe == null) {
        res.status(404).send(); // card id not valid in set
        return;
    }
    db.deleteCard(set_id, card_id);

    res.status(200).send(); // delete successful

}

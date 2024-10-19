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

exports.update = async (req, res) => {
    const set_id = req.params.set_id;
    const card_id = req.query.card_id;

    // check if the set id is valid
    set = await db.getSet_id(set_id);
    if (set == null) {
        // not a valid set id
        res.status(404).send(); 
        return;
    }

    // how to check if the card id is valid in the set?
    card = await db.getCard_id(set_id, card_id);
    if (card == null) {
        // card id not valid in set
        res.status(404).send(); 
        return;
    }

    // card_obj = {};
    // card_obj[card_id] = req.body;
    // console.log("req.body: ", req.body);

    // req.body.key = card_id;
    // console.log("req.body.key: ", req.body.key);
    // console.log("card_obj: ", card_obj);

    // don't need those^^^ not supposed to create a new obj for the card,
    // just grabbing the body from the request line 
    // (which should be the data to be updated on the card, see PUT curl command example)

    db.updateCard(req.body, set_id, card_id); // don't think we need a new_obj for this
    res.status(201).send();
}

exports.delete = async (req, res) => {
    const set_id = req.params.set_id;
    const card_id = req.query.card_id;

    // check if set id is valid
    set = await db.getSet_id(set_id);
    if (set == null) {
        // not a valid set id
        res.status(404).send(); 
        return;
    }

    // how to check if the card id is valid in the set?
    card = await db.getCard_id(set_id, card_id);
    if (card == null) {
        // card id not valid in set
        res.status(404).send(); 
        return;
    }

    //console.log("before calling db.deleteCard");
    db.deleteCard(set_id, card_id);
    //console.log("after calling db.deleteCard");

    res.status(200).send();

}

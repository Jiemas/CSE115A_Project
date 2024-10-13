const db = require('./db');
const crypto = require('crypto')

// curl -X PUT -d '{"alanisawesome":{"name": "Alan Turing","birthday": "June 23, 1912"}}' 
// 'https://rapid-review-4255a-default-rtdb.firebaseio.com/users.json'

exports.getAll = async (req, res) => {
    // When login is implemented, 'global' will have to become variable
    // Will then have to add cases where fetch returns nothing
    sets = await db.getAllSets()
    res.status(200).json(sets);
};

exports.add = async (req, res) => {
    set_name = req.body.name;
    duplicate = await db.getSet_name(set_name)
    if (duplicate.length) {
        res.status(409).send();
        return;
    }

    req.body.card_num = 0;
    req.body.key = crypto.randomUUID()
    new_obj = {};
    new_obj[req.body.key] = req.body;
    db.addSet(new_obj);
    res.status(201).json(req.body.key);
}

exports.update = async (req, res) => {
    id = req.params.id;
    duplicate = await db.getSet_id(id)
    if (duplicate == null) {
        res.status(404).send();
        return;
    }
    new_obj = {};
    new_obj[id] = req.body;
    req.body.key = id;
    db.addSet(new_obj);
    res.status(201).send();
}

exports.delete = async (req, res) => {
    id = req.params.id;
    duplicate = await db.getSet_id(id);
    if (duplicate == null) {
        res.status(404).send();
        return;
    }
    db.deleteSet(id);
    res.status(200).send();
}
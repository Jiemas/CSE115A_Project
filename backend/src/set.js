const db = require('./db');

// curl -X PUT -d '{"alanisawesome":{"name": "Alan Turing","birthday": "June 23, 1912"}}' 
// 'https://rapid-review-4255a-default-rtdb.firebaseio.com/users.json'

exports.getAll = async (req, res) => {
    // When login is implemented, 'global' will have to become variable
    // Will then have to add cases where fetch returns nothing
    res.status(200).json(await db.getAllSets());
};

exports.add = async (req, res) => {
    set_name = req.body.name;
    duplicate = await db.getSet(set_name)
    if (duplicate.length) {
        res.status(409).send();
        return;
    }

    req.body.card_num = 0;
    new_obj = {};
    new_obj[set_name] = req.body;
    db.addSet(new_obj);
    res.status(201).send();
}

exports.update = async (req, res) => {
    set_name = req.params.name;
    duplicate = await db.getSet(set_name)
    if (!duplicate.length) {
        res.status(404).send();
        return;
    }
    new_obj = {};
    new_obj[set_name] = req.body;
    db.addSet(new_obj);
    res.status(201).send()
}
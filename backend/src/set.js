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

    req.body.card_num = 1;
    req.body.key = crypto.randomUUID()
    new_obj = {};
    new_obj[req.body.key] = req.body;
    db.addSet(new_obj, req.body.key);
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
    db.addSet(new_obj, null);
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

exports.import = async (req, res) => {
    //console.log('Received import request:', req.body);
    const cards = req.body;
    if (!Array.isArray(cards) || cards.length === 0) {
      //console.log('Invalid input received');
      return res.status(400).json({ code: 400, message: 'Invalid input. Non-empty array of cards required.' });
    }
  
    try {
      const set_id = crypto.randomUUID();
      //console.log('Generated set_id:', set_id);
      const new_set = {};
  
      for (let card of cards) {
        card.key = crypto.randomUUID();
        card.set_id = set_id;
        new_set[card.key] = card;
        //console.log('Creating card:', card);
        await db.addCard(card);
      }
  
      //console.log('Adding new set:', new_set);
      await db.addSet(new_set, set_id);
      res.status(201).json({ code: 201, message: 'Cards imported successfully', data: new_set });
    } catch (error) {
      //console.error('Error importing set:', error);
      res.status(500).json({ code: 500, message: 'Internal Server Error' });
    }
  };
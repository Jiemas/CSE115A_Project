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
// exports.import = async (req, res) => {
//     const set_id = req.params.set_id;

//     // Check provided set id exists
//     let set = await db.getSet_id(set_id)
//     if (set != null) {
        
//         res.status(404).send({ error: 'Set already exists' });
//         return;
//     }

//     // Check duplicate front, duplicate backs shouldn't matter
//     for (let card of req.body) {
//         duplicate = await db.getCard_front(card.front, set_id)
//         if (duplicate) {
//             res.status(409).send({ error: 'Duplicate card found' });
//             return;
//         }
//     }

//     // Create new set
//     set = {
//         id: set_id,
//         // Add other set properties if needed
//     };
//     await db.createSet(set);

//     // Insert cards into the new set
//     let new_obj = {};
//     for (let card of req.body) {
//         card.key = crypto.randomUUID();
//         card.set_id = set_id; // Associate card with the set
//         new_obj[card.key] = card;
//         await db.createCard(card); // Insert card into the database
//     }

//     res.status(201).send(new_obj);
// }

exports.import = async (req, res) => {
    const cards = req.body;

    if (!Array.isArray(cards) || cards.length === 0) {
        return res.status(400).json({ code: 400, message: 'Invalid input. Non-empty array of cards required.' });
    }

    try {
        const set_id = crypto.randomUUID(); // Generate a unique set ID
        const new_obj = {}; // Initialize the new set object

        // Insert cards into the new set
        for (let card of cards) {
            if (!card.front || !card.back || typeof card.starred !== 'boolean' || !card.key) {
                return res.status(400).json({ code: 400, message: 'Missing required fields' });
            }
            card.key = crypto.randomUUID();
            card.set_id = set_id; // Associate card with the set
            new_obj[card.key] = card;
            await db.createCard(card); // Insert card into the database
        }

        // Add the new set to the database
        await db.addSet(new_obj, set_id);

        res.status(201).json({ code: 201, message: 'Cards imported successfully', data: new_obj });
    } catch (error) {
        console.error('Error importing set:', error);
        res.status(500).json({ code: 500, message: 'Internal Server Error' });
    }
};
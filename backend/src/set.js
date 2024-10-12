console.log('hello world');

// curl -X PUT -d '{"alanisawesome":{"name": "Alan Turing","birthday": "June 23, 1912"}}' 
// 'https://rapid-review-4255a-default-rtdb.firebaseio.com/users.json'

exports.getAll = async (req, res) => {
    fetch('https://rapid-review-4255a-default-rtdb.firebaseio.com/set.json', {method: 'GET'})
        .then((data_res) => {
            data_res.json()
                .then((json_res) => {
                    res.status(200).json(Object.keys(json_res));
                })
        })
};
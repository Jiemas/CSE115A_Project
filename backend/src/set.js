console.log('hello world');

// curl -X PUT -d '{"alanisawesome":{"name": "Alan Turing","birthday": "June 23, 1912"}}' 
// 'https://rapid-review-4255a-default-rtdb.firebaseio.com/users.json'

fetch('https://rapid-review-4255a-default-rtdb.firebaseio.com/set/test_two.json', {method: 'PUT',
    body: JSON.stringify({name: 'test_2', description: 'desc of second set'}), headers: {'Content-Type': 'application/json'}})
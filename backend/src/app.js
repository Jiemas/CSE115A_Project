const express = require('express');
const cors = require('cors');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const OpenApiValidator = require('express-openapi-validator');

const set = require('./set');
const card = require('./card');
const auth = require('./auth');

// Testing
// const llm = require('./llm');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const apiSpec = path.join(__dirname, '../api/openapi.yaml');
const apidoc = yaml.load(fs.readFileSync(apiSpec, 'utf8'));

app.use(
  '/v0/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(apidoc),
);

app.use(
  OpenApiValidator.middleware({
    apiSpec: apiSpec,
    validateRequests: true,
    validateResponses: true,
  }),
);

// CRUD Operations on Sets
app.put('/v0/set', auth.check, set.add); // Create
app.get('/v0/set', auth.check, set.getAll); // Read
app.put('/v0/set/:id', auth.check, set.update); // Update
app.delete('/v0/set/:id', auth.check, set.delete); // Delete

// CRUD Operations on Cards
app.put('/v0/card/:setId', auth.check, card.add); // Create
app.get('/v0/card/:setId', auth.check, card.getAll); // Read
app.post('/v0/card/:setId', auth.check, card.update); // Update
app.delete('/v0/card/:setId', auth.check, card.delete); // Delete

// Login
app.post('/v0/login', auth.login);
app.put('/v0/login', auth.createAccount);

// Solely for test cleanup, currently no plans to have a delete user endpoint
app.delete('/v0/login/:id', auth.delete);

// Testing
// app.get('/v0/llm', llm.llm_test);

app.use((err, req, res, next) => {
  res.status(err.status).json({
    message: err.message,
    errors: err.errors,
    status: err.status,
  });
});

module.exports = app;

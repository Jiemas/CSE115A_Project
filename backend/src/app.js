const express = require('express');
const cors = require('cors');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const OpenApiValidator = require('express-openapi-validator');

const set = require('./set');
const card = require('./card');

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

// Your Express routes go here
// CRUD Operations on Sets
app.put('/v0/set', set.add); // Create
app.get('/v0/set', set.getAll); // Read
app.put('/v0/set/:id', set.update); // Update
app.delete('/v0/set/:id', set.delete); // Delete

// CRUD Operations on Cards
app.put('/v0/card/:setId', card.add); // Create
app.get('/v0/card/:setId', card.getAll); // Read
// Update WIP
app.delete('/v0/card/:setId', card.delete) // Delete

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

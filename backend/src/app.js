const express = require('express');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const OpenApiValidator = require('express-openapi-validator');

const set = require('./set');
const llm = require('./llm');

const app = express();
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
app.get('/v0/set', set.getAll);
app.put('/v0/set', set.add);
app.put('/v0/set/:id', set.update);
app.delete('/v0/set/:id', set.delete);
app.get('/v0/llm', llm.llm_test);

app.use((err, req, res, next) => {
  res.status(err.status).json({
    message: err.message,
    errors: err.errors,
    status: err.status,
  });
});

module.exports = app;
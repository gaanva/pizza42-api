// importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
//required for token and key set.
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
// defining the Express app
const app = express();

// List of available Pizza (brief solution)
const pizzas = [
    {pizza: 'Pizza Marinara', description: 'Features tomatoes, sliced mozzarella, basil, and extra virgin olive oil.', price:'10'},
    {pizza: 'Sicilian Pizza', description: 'Features tomatoes, sliced mozzarella, basil, and extra virgin olive oil.', price:'12'},
    {pizza: 'Greek Pizza', description: 'Features tomatoes, sliced mozzarella, basil, and extra virgin olive oil.', price:'15'}
  ];
//List of pizza orders.
const orders = new Array();

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));


// return all available pizzas
  app.get('/', (req, res) => {
    res.send(pizzas);
  });

/** rest api protected calls. **/
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://gaanva.auth0.com/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    audience: 'https://gaanva.auth0.com/api/v2/',
    issuer: `https://gaanva.auth0.com/`,
    algorithms: ['RS256']
  });
  //securing the next REST API endpoint calls...
  app.use(checkJwt);

//customer request for a pizza order
app.post('/order', (req, res) => {
    const order = req.body;
    orders.push(order);
    res.send({message:'Pizza order successfully!'});
});

//consulting all orders.
app.get('/orders', (req, res) => {
    res.send(orders);
});
//TODO: deleting pizza order...
//TODO: updating pizza order...  


// starting the server
app.listen(3001, () => {
  console.log('listening on port 3001');
});
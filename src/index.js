// importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
//required for token and key set.
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

//adding authorization
const jwtAuthz = require('express-jwt-authz');

// defining the Express app
const app = express();

// List of available Pizza (By default)
//TODO: could be a MongoDB...

const pizzas = [
    {pizza: 'Pizza Marinara', description: 'Sliced mozzarella, basil, and extra virgin olive oil.', price:'10'},
    {pizza: 'Sicilian Pizza', description: 'Features tomatoes, basil, and extra virgin olive oil.', price:'12'},
    {pizza: 'Greek Pizza', description: 'Features tomatoes, sliced mozzarella, and extra virgin olive oil.', price:'15'}
  ];
//List of pizza orders.
const orders = new Array();

require('dotenv').config();
if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
  throw 'Make sure you have AUTH0_DOMAIN, and AUTH0_AUDIENCE in your .env file'
}

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));


const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: 'https://gaanva.auth0.com/.well-known/jwks.json'
    }),
  
    // Validate the audience and the issuer.
    audience: process.env.AUTH0_AUDIENCE,
    issuer: 'https://gaanva.auth0.com/',
    algorithms: ['RS256']
  });
//setting authorization levels
const checkScopes = jwtAuthz([ 'read:pizza' ]);
const checkScopesAdmin = jwtAuthz([ 'create:pizza' ]);

//customer request for a pizza order
app.post('/order', (req, res) => {
    const order = req.body;
    orders.push(order);
    res.send({message:'Pizza order successfully!'});
});

// My public request... return all available pizzas
app.get('/', (req, res) => {
  res.send(pizzas);
});
//consulting orders made. TODO: We could receive user to extract only user orders...
//read:message scope needed. 
app.get('/orders', checkJwt, checkScopes, (req, res) => {
    res.send(orders);
});
//write:message scope needed...
app.post('/pizza', checkJwt, checkScopesAdmin, (req, res)=>{
  //Creo una pizza nueva
  pizzas.push({pizza:req.body.pizza['pizza'], description:req.body.pizza['description'], price:req.body.pizza['price']});
  
  return res.status(201).json('Pizza ' + req.body.pizza['pizza'] + ' successfully created!');
});
//TODO: deleting pizza order...
//TODO: updating pizza order...  



// starting the server
app.listen(3001, () => {
  console.log('listening on port 3001');
});
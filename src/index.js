// importing the dependencies
const express = require('express');
// defining the Express app
const app = express();
//required for token and key set.
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
//adding authorization
const jwtAuthz = require('express-jwt-authz');

const cors = require('cors');
require('dotenv').config();

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
  throw 'Make sure you have AUTH0_DOMAIN, and AUTH0_AUDIENCE in your .env file'
}

const corsOptions =  {
  origin: 'http://localhost:3000'
};
// enabling CORS for all requests
app.use(cors(corsOptions));

const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
// adding Helmet to enhance your API's security
app.use(helmet());
// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());
// adding morgan to log HTTP requests
app.use(morgan('combined'));



const pizzas = [
  {pizza: 'Pizza Marinara', description: 'Sliced mozzarella, basil, and extra virgin olive oil.', price:'10'},
  {pizza: 'Sicilian Pizza', description: 'Features tomatoes, basil, and extra virgin olive oil.', price:'12'},
  {pizza: 'Greek Pizza', description: 'Features tomatoes, sliced mozzarella, and extra virgin olive oil.', price:'15'}
];
//List of pizza orders.
const orders = [];

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
const checkScopesUser = jwtAuthz(['read:pizza','read:myOrders'],{checkAllScopes: true});
const checkScopesAdmin = jwtAuthz(['read:pizza','create:pizza', 'read:orders', 'read:users'], {checkAllScopes: true});

// My public request... return all available pizzas
app.get('/', (req, res) => {
  res.send(pizzas);
});
//consulting orders made.
app.get('/orders', checkJwt, checkScopesAdmin, (req, res) => {
  console.log(orders);  
  return res.status(200).json(orders);
});

app.get('/myOrders', checkJwt, checkScopesUser, (req, res) => {
  console.log('parameter received: ' + req.query.user_email);
  var email = req.query.user_email
  var userOrders = [];
  //search for user orders
  console.log(orders);
  var i=0;
  for(i=0; i<orders.length; i++){
    if(orders[i].user_mail===email){
      console.log('order user email match!');
      userOrders.push(orders[i]);
    }
  }
  return res.status(200).json(userOrders);
});

app.post('/pizza', checkJwt, checkScopesAdmin, (req, res)=>{
  //Creo una pizza nueva
  pizzas.push({pizza:req.body.pizza['pizza'], description:req.body.pizza['description'], price:req.body.pizza['price']});
  return res.status(201).json('Pizza ' + req.body.pizza['pizza'] + ' successfully created!');
});

//customer request for a pizza order
app.post('/order', checkJwt, checkScopesUser, (req, res) => {
  console.log('oder recieved: ');
  console.log(req.body.order);
  orders.push(req.body.order);
  return res.status(201).json('Order successfully created!');
});

//TODO: deleting pizza order...
//TODO: updating pizza order...  

// starting the server
app.listen(3001, () => {
  console.log('listening on port 3001');
});
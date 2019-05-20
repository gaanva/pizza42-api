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


var AuthenticationClient = require('auth0').AuthenticationClient;

var auth0 = new AuthenticationClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_MNG_API_CLIENT_ID,
  clientSecret: process.env.AUTH0_MNG_API_CLIENT_SECRET
});
var access_token;
auth0.clientCredentialsGrant(
  {
    audience: process.env.AUTH0_MNG_API_AUDIENCE,
    scope: 'read:users'
  },
  function(err, response) {
    if (err) {
      // Handle error.
    }
    access_token = response.access_token;
  }
);

var request = require("request");





const pizzas = [
  {id:1, pizza: 'Pizza Marinara', description: 'Sliced mozzarella, basil, and extra virgin olive oil.', price:'10'},
  {id:2, pizza: 'Sicilian Pizza', description: 'Features tomatoes, basil, and extra virgin olive oil.', price:'12'},
  {id:3, pizza: 'Greek Pizza', description: 'Features tomatoes, sliced mozzarella, and extra virgin olive oil.', price:'15'}
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

//>>>>>>>>>>>>>>>>>+Pizza Services+>>>>>>>>>>>>>>>>>
// My public request... return all available pizzas
app.get('/', (req, res) => {
  res.send(pizzas);
});
//Create a new Pizza
app.post('/pizza', checkJwt, checkScopesAdmin, (req, res)=>{
  let pizza = req.body.pizza;
  console.log('pizza received to be create: ');
  console.log(pizza);
  //set the id
  pizza.id = (Math.max(...pizzas.map(pizzaStored => pizzaStored.id))+1);
  //pizzas.push({pizza:pizza['pizza'], description:req.body.pizza['description'], price:req.body.pizza['price']});
  pizzas.push(pizza);
  return res.status(201).json(pizza);
});

//Update a Pizza
app.put('/pizza', checkJwt, checkScopesAdmin, (req, res)=>{
  let pizzaUpdated = req.body.pizza;
  pizzas.forEach(function(pizza, i){ if (pizza.id === pizzaUpdated.id) pizzas[i] = pizzaUpdated; });
  return res.status(200).json('Pizza ' + pizzaUpdated + ' successfully updated!');
});
  
//Delete a Pizza
app.delete('/pizza', checkJwt, checkScopesAdmin, (req, res)=>{
  let pizzaId = req.body.id;
  pizzas.forEach(function(pizza, i){ 
    if (pizza.id === pizzaId){ 
      pizzas.splice(i,1); 
    }
  });
  return res.status(200).json('Pizza ' + pizzaId + ' successfully deleted!');
});
//<<<<<<<<<<<<<<<<<<+Pizza Services+<<<<<<<<<<<<<<<<

//>>>>>>>>>>>>>>>>>+Order Services+>>>>>>>>>>>>>>>>>
//customer request for a pizza order
app.post('/order', checkJwt, checkScopesUser, (req, res) => {
  console.log('oder recieved: ');
  orders.push(req.body.order);
  return res.status(201).json('Order successfully created!');
});

//<<<<<<<<<<<<<<<<<<+Order Services+<<<<<<<<<<<<<<<<

//>>>>>>>>>>>>>>>>>+Users profile list+>>>>>>>>>>>>>>>>>
app.get('/usersListInformation', checkJwt, checkScopesAdmin, (req, res) => {
  var options = { method: 'GET',
                  url: process.env.AUTH0_MNG_API_AUDIENCE+'users',
                  headers: 
                        { authorization: 'Bearer '+access_token,
                          'content-type': 'application/json' } 
                  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    return res.status(200).json(body);
  });
  
});
//<<<<<<<<<<<<<<<<<<+Users profile list+<<<<<<<<<<<<<<<<v

// starting the server
app.listen(3001, () => {
  console.log('listening on port 3001');
});
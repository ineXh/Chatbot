'use strict';

const 
  bodyParser = require('body-parser'),      
  express = require('express'),
  https = require('https');  
  
var app = express();

app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(express.static('public'));

var Database = require('./app/database.js');
var Messenger = require('./app/messenger.js');//, APP_SECRET, VALIDATION_TOKEN, PAGE_ACCESS_TOKEN, SERVER_URL);
var database = new Database();
var messenger = new Messenger(app, database);
app.use(bodyParser.json({ verify: messenger.verifyRequestSignature }));

// routes ==================================================
require('./app/routes')(app, messenger); // pass our application into our routes

database.connect();

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

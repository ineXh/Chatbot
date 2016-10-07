'use strict';

const 
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),  
  request = require('request');
  
var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
//app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));
/*
var express = require('express');
var app = express();

var port =  process.env.PORT || 443;*/

// ////////////
// Environments
// ////////////

// ///////////////////
// Serve Request Files
// ///////////////////
//app.use(express.static('source'));
//app.use(express.static('public'));

app.get('/', function (req, res) {
  //res.send('Hello World!');
  res.sendFile(__dirname + '/public/index.html')
});

app.post('/', function (req, res) {
  //res.send('Hello World!');
  res.sendFile(__dirname + '/public/index.html')
});


// routes ==================================================

//var server = app.listen(port, function(){
 //   console.log('listening on *:' + port);
//})

// start app
//exports = module.exports = app;

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

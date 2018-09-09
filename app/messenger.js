module.exports = exports = Messenger;
const 	config = require('config'),
		crypto = require('crypto'),
		enums = require("./enums.js"),
		request = require('request'),
		urls = require("./urls.js"),
		UserView = require('./DatabaseSchema/userviews.js');

var APP_SECRET, VALIDATION_TOKEN, PAGE_ACCESS_TOKEN, SERVER_URL;
var database;
var gAgeTime = 2; // global age Counter
var VERBOSE = false;

function Messenger(app, Database){//, app_secret, validation_token, page_access_token, server_url){
	database = Database;
	/*
	 * Be sure to setup your config values before running this code. You can 
	 * set them using environment variables or modifying the config file in /config.
	 *
	 */
	// App Secret can be retrieved from the App Dashboard
	
	APP_SECRET = config.get('appSecret');
	this.APP_SECRET = APP_SECRET;
	

	// Arbitrary value used to validate a webhook
	
	  
	 VALIDATION_TOKEN = config.get('validationToken');
	this.VALIDATION_TOKEN = VALIDATION_TOKEN;
	

	// Generate a page access token for your page from the App Dashboard
	PAGE_ACCESS_TOKEN = config.get('pageAccessToken');
	this.PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN;
	

	// URL where the app is running (include protocol). Used to point to scripts and 
	// assets located at this address. 
	SERVER_URL = config.get('serverURL');
	this.SERVER_URL = SERVER_URL;

	if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
	  console.error("Missing config values");
	  //process.exit(1);
	}
	
	this.create();
	return this;
} // end Messenger
Messenger.prototype = {
	create: function(){
	},
	/*
	* Verify that the callback came from Facebook. Using the App Secret from 
	* the App Dashboard, we can verify the signature that is sent with each 
	* callback in the x-hub-signature field, located in the header.
	*
	* https://developers.facebook.com/docs/graph-api/webhooks#setup
	*
	*/
	verifyRequestSignature: function(req, res, buf) {
		var signature = req.headers["x-hub-signature"];
		
		if (!signature) {
		// For testing, let's log an error. In production, you should throw an 
		// error.
		console.error("Couldn't validate the signature.");
		} else {
		var elements = signature.split('=');
		var method = elements[0];
		var signatureHash = elements[1];

		var expectedHash = crypto.createHmac('sha1', APP_SECRET)
		                    .update(buf)
		                    .digest('hex');

		if (signatureHash != expectedHash) {
		  throw new Error("Couldn't validate the request signature.");
		}
		}
	}, // end verifyRequestSignature
	/*
	* Authorization Event
	*
	* The value for 'optin.ref' is defined in the entry point. For the "Send to 
	* Messenger" plugin, it is the 'data-ref' field. Read more at 
	* https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
	*
	*/
	receivedAuthentication: function(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;
		var timeOfAuth = event.timestamp;

		var userview = new UserView();
		userview.userID = senderID;
		userview.timeOfAuth = timeOfAuth;
		database.insert(userview);

		// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
		// The developer can set this to an arbitrary value to associate the 
		// authentication callback with the 'Send to Messenger' click event. This is
		// a way to do account linking when the user clicks the 'Send to Messenger' 
		// plugin.
		var passThroughParam = event.optin.ref;

		console.log("Received authentication for user %d and page %d with pass " +
		"through param '%s' at %d", senderID, recipientID, passThroughParam, 
		timeOfAuth);

		// When an authentication is received, we'll send a message back to the sender
		// to let them know it was successful.
		sendTextMessage(senderID, "Authentication successful");
	}, // end recceivedAuthentication
	/*
	* Message Event
	*
	* This event is called when a message is sent to your page. The 'message' 
	* object format can vary depending on the kind of message that was received.
	* Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
	*
	* For this example, we're going to echo any text that we get. If we get some 
	* special keywords ('button', 'generic', 'receipt'), then we'll send back
	* examples of those bubbles to illustrate the special message bubbles we've 
	* created. If we receive a message with an attachment (image, video, audio), 
	* then we'll simply confirm that we've received the attachment.
	* 
	*/
	receivedMessage: function(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;
		var timeOfMessage = event.timestamp;
		var message = event.message;

		database.update({userID: senderID}, {$set: {timeOfLast: timeOfMessage, subscribed: true}});

		if(VERBOSE) console.log("Received message for user %d and page %d at %d with message:", 
		senderID, recipientID, timeOfMessage);
		console.log(JSON.stringify(message));

		var isEcho = message.is_echo;
		var messageId = message.mid;
		var appId = message.app_id;
		var metadata = message.metadata;

		// You may get a text or attachment but not both
		var messageText = message.text;
		var messageAttachments = message.attachments;
		var quickReply = message.quick_reply;

		if (isEcho) {
		// Just logging message echoes to console
		console.log("Received echo for message %s and app %d with metadata %s", 
		  messageId, appId, metadata);
		return;
		} else if (quickReply) {
		var quickReplyPayload = quickReply.payload;
		if(VERBOSE) console.log("Quick reply for message %s with payload %s",
		  messageId, quickReplyPayload);

		switch(quickReplyPayload) {
			case enums.actionFood:
				this.feed(senderID);				
				break;
			case enums.actionPlay:
				this.play(senderID);
				break;
			case enums.actionSleep:
				this.sleep(senderID);
				break;
			case enums.actionStartYes:
				sendStartEggs(senderID);
				break;
			case enums.actionStartNo:
				break;
			default:
				console.log("Action Default " + quickReplyPayload);
				break;
		}

		//sendTextMessage(senderID, "Quick reply tapped " + quickReplyPayload);
		return;
		}

		if (messageText) {

		// If we receive a text message, check to see if it matches any special
		// keywords and send back the corresponding example. Otherwise, just echo
		// the text we received.
		var tempText = messageText.toUpperCase();
		//console.log('tempText')
		//console.log(tempText)
		switch (tempText) {
		  case enums.cmdHelp:
		  	sendHelpMessage(senderID);
		  	break;
		  case enums.cmdStats:
		  	sendStatsMessage(senderID);
		  	break;
		  case enums.cmdStart:
		  	sendStartMessage(senderID);
		    break;
		  case enums.cmd:
		  	sendCmdReply(senderID);
		  	break;
		  case enums.cmdFeed:
		  case enums.cmdFood:
		  case enums.cmdEat:
		  case enums.emojiBurger:
		  	this.feed(senderID);
		  	break;
		  case enums.cmdPlay:
		  	this.play(senderID);
		  	break;
		  case enums.cmdSleep:
		  	this.sleep(senderID);
		  	break;
		  default:
		    sendTextMessage(senderID, messageText);
		}
		} else if (messageAttachments) {
		sendTextMessage(senderID, "Message with attachment received");
		}
	}, // end receivedMessage
	/*
	* Delivery Confirmation Event
	*
	* This event is sent to confirm the delivery of a message. Read more about 
	* these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
	*
	*/
	receivedDeliveryConfirmation: function(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;
		var delivery = event.delivery;
		var messageIDs = delivery.mids;
		var watermark = delivery.watermark;
		var sequenceNumber = delivery.seq;

		if (messageIDs) {
		messageIDs.forEach(function(messageID) {
		  if(VERBOSE) console.log("Received delivery confirmation for message ID: %s", 
		    messageID);
		});
		}

		if(VERBOSE) console.log("All message before %d were delivered.", watermark);
	}, // end receivedDeliveryConfirmation
	/*
	* Postback Event
	*
	* This event is called when a postback is tapped on a Structured Message. 
	* https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
	* 
	*/
	receivedPostback: function(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;
		var timeOfPostback = event.timestamp;

		// The 'payload' param is a developer-defined field which is set in a postback 
		// button for Structured Messages. 
		var payload = event.postback.payload;

		if(VERBOSE) console.log("Received postback for user %d and page %d with payload '%s' " + 
		"at %d", senderID, recipientID, payload, timeOfPostback);

		// When a postback is called, we'll send a message back to the sender to 
		// let them know it was successful
		//sendTextMessage(senderID, "Postback called " + payload);

		switch(payload){
			case enums.postEgg0:
			database.update({userID: senderID}, 
					{$set: {age: 0, ageLevel: 0, ageTime: gAgeTime, inPlay: true, 
						hunger: 10, happiness: 10, energy: 10}});				
				sendTextMessage(senderID, "Let's Cow! Here's an Egg. Take Good Care of it!");
				sendGifMessage(senderID, urls.egg0);
			break;
			case enums.postEgg1:
				database.update({userID: senderID}, 
					{$set: {age: 0, ageLevel: 0, ageTime: gAgeTime, inPlay: true, 
						hunger: 10, happiness: 10, energy: 10}});
				database.update({userID: senderID}, {$set: {ageTime: gAgeTime}});
				sendTextMessage(senderID, "Let's Cow! Here's an Egg. Take Good Care of it!");
				sendGifMessage(senderID, urls.egg1);
			break;
		}
	}, // end receivedPostback
	/*
	* Message Read Event
	*
	* This event is called when a previously-sent message has been read.
	* https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
	* 
	*/
	receivedMessageRead: function(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;

		// All messages before watermark (a timestamp) or sequence have been seen.
		var watermark = event.read.watermark;
		var sequenceNumber = event.read.seq;

		if(VERBOSE) console.log("Received message read event for watermark %d and sequence " +
		"number %d", watermark, sequenceNumber);
	}, // end receivedMessageRead
	/*
	* Account Link Event
	*
	* This event is called when the Link Account or UnLink Account action has been
	* tapped.
	* https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
	* 
	*/
	receivedAccountLink: function(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;

		var status = event.account_linking.status;
		var authCode = event.account_linking.authorization_code;

		console.log("Received account link event with for user %d with status %s " +
		"and auth code %s ", senderID, status, authCode);
	}, // end receivedAccountLink
	sendTextMessage: function(recipientId, messageText){
		sendTextMessage(recipientId, messageText);	
	},
	gameUpdate: function(){
		//console.log('gameUpdate')		
		var age = this.age.bind(this);
		var hatch = this.hatch.bind(this);
		var evolve = this.evolve.bind(this);
		database.getAllUsers({}).then(function(res){
			//console.log('get All Users blank');
			for(var i = 0; i < res.length; i++){
				//console.log('res[%d] ' + res[i], i);
				//console.log(res[i].ageTime);
				if(res[i].ageTime <= 0){
					if(res[i].age == 0){
						hatch(res[i]);
					}
					evolve(res[i]);
					age(res[i]);
				}
			}
		}); // end getAllUsers	
	}, // end gameUpdate
	age: function(user){
		//console.log('AGE')
		database.update({userID: user.userID}, {$inc: {age: 1}, $set: {ageTime: gAgeTime}}); // age		
	},
	evolve: function(user){		
		var ageLevel;
		switch(user.age){
			case 0: ageLevel = 1; 
				database.update({userID: user.userID}, {$set: {ageLevel: ageLevel}}); // ageLevel
				return;
			case 1: ageLevel = 2; break;
			case 2: ageLevel = 3; break;
			default: return;
		}
		console.log('evolve');		
		user.ageLevel = ageLevel;
		database.update({userID: user.userID}, {$set: {ageLevel: ageLevel}}); // ageLevel
		sendTextMessage(user.userID, "Your Pet has evolved.");
		this.idle(user);
	},
	feed: function(senderID){
		sendTextMessage(senderID, "You feed your pet.");
		database.update({userID: senderID}, {$set: {hunger: 10}});
		console.log("Action Food");
		database.getUser(senderID).then(function(res){			
			switch(res.ageLevel){
				case 0: break;
				case 1: sendGifMessage(senderID, urls.eat1); break;
				case 2: sendGifMessage(senderID, urls.eat2); break;
				case 3: sendGifMessage(senderID, urls.eat3); break;
			}			
		});
	}, // end feed
	play: function(senderID){
		sendTextMessage(senderID, "You play with your pet.");			
		database.update({userID: senderID}, {$set: {happiness: 10}});
		console.log("Action Play");
		database.getUser(senderID).then(function(res){			
			switch(res.ageLevel){
				case 0: break;
				case 1: sendGifMessage(senderID, urls.idle1); break;
				case 2: sendGifMessage(senderID, urls.idle2); break;
				case 3: sendGifMessage(senderID, urls.idle3); break;
			}			
		});
	}, // end play
	sleep: function(senderID){
		sendTextMessage(senderID, "Your pet goes to sleep.");
		database.update({userID: senderID}, {$set: {energy: 10}});	
		console.log("Action Sleep");
		database.getUser(senderID).then(function(res){			
			switch(res.ageLevel){
				case 0: break;
				case 1: sendGifMessage(senderID, urls.sleep1); break;
				case 2: sendGifMessage(senderID, urls.sleep2); break;
				case 3: sendGifMessage(senderID, urls.sleep3); break;
			}			
		});
	}, // end sleep
	idle: function(user){
		setTimeout(function(){
			switch(user.ageLevel){
				case 0: break;
				case 1: sendGifMessage(user.userID, urls.idle1); break;
				case 2: sendGifMessage(user.userID, urls.idle2); break;
				case 3: sendGifMessage(user.userID, urls.idle3); break;
			}
		}, 1000);
	},
	hatch: function(user){
		sendGifMessage(user.userID, urls.hatch);
		sendTextMessage(user.userID, "Your pet has hatched.");
		user.ageLevel = 1;
		this.idle(user);
	}, // end hatch
} // end Messenger

function sendHelpMessage(recipientId){
	sendTextMessage(recipientId, "Mooo. Type: 'stats' to check your pet's status, Type 'cmd' to see the list of available commands for your pet.");
}// end sendHelpMessage

function sendStatsMessage(recipientId) {
	var promise = database.getUser(recipientId).then(function(res){
		console.log(res);
		
		if(res.age == undefined){
			sendTextMessage(recipientId, "You don't have a pet. Begin by typing 'start'.");
			return;
		}
		var messageData = {
		    recipient: {
		      id: recipientId
		    },
		    message: {
		      text: "Pet stats. " +
		      "\nAge: " + res.age +
		      "\nHunger: " + res.hunger +
		      "\nEnergy:  " + res.energy +
		      "\nHappiness:  " + res.happiness
		      ,
		      metadata: "DEVELOPER_DEFINED_METADATA"
		    }
		};

		callSendAPI(messageData);
	});
}



/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

function sendStartMessage(recipientId) {
	database.getUser(recipientId).then(function(res){
		if(res.inPlay){
			var messageData = {
		    recipient: {
		      id: recipientId
		    },
		    message: {
		      text: "You already have a Pet. Do you want to start again?",
		      metadata: "DEVELOPER_DEFINED_METADATA",
		      quick_replies: [
		        {
		          "content_type":"text",
		          "title":"Yes",
		          "payload": enums.actionStartYes
		        },
		        {
		          "content_type":"text",
		          "title":"No",
		          "payload": enums.actionStartNo
		        }
		      ]
		    }
		  };
		  callSendAPI(messageData);
		}else{
			sendStartEggs(recipientId);
		}		
	}); // end getUser  	  
} // end sendStartMessage

function sendStartEggs(recipientId){	
	if(VERBOSE) console.log("setting stats of user %d", recipientId);

	var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Egg 0",              
            image_url: SERVER_URL + urls.egg0,
            buttons: [{
              type: "postback",
              title: "Pick Egg 0",
              payload: enums.postEgg0,
            }],
          }, {
            title: "Egg 1",
            image_url: SERVER_URL + urls.egg1,
            buttons: [ {
              type: "postback",
              title: "Pick Egg 1",
              payload: enums.postEgg1,
            }]
          }] // end elements
        } // end payload
      } // end attachment
    } // end message
  };
  callSendAPI(messageData);
} // end sendStartEggs

function sendCmdReply(recipientId){
	var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What would you like to do?",
      metadata: "DEVELOPER_DEFINED_METADATA",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Food",
          "payload": enums.actionFood
        },
        {
          "content_type":"text",
          "title":"Play",
          "payload": enums.actionPlay
        },
        {
          "content_type":"text",
          "title":"Sleep",
          "payload": enums.actionSleep
        }
      ]
    }
  };

  callSendAPI(messageData);
} // end sendCmdReply


/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        //console.log("Successfully sent message with id %s to recipient %s", 
          //messageId, recipientId);
      } else {
      	//console.log("Successfully called Send API for recipient %s", 
		// recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });  
} // end callSendAPI

function sendGifMessage(recipientId, url) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + url
        }
      }
    }
  };
  callSendAPI(messageData);
} // end sendGifMessage

const mongodb = require('mongodb');
const config = require('config');

module.exports = exports = Database;

var uri;
var db;

const databaseName = 'users';
function Database(){
	uri = config.get('dbURI');
	this.db = null;
	this.collection = null;
} // end Database
Database.prototype = {
	connect: function(){
		var database = this;
		mongodb.MongoClient.connect(uri, function(err, db) {
  			if(err) throw err;
  			console.log('database connect');
  			database.db = db;
  			database.collection = db.collection(databaseName);
  		});// end mongodb.MongoClient.connect
	}, // end connect
	disconnect: function(){
		var database = this;
		// Only close the connection when your app is terminating.
        this.db.close(function (err) {
          if(err) throw err;
          console.log('database disconnect');
          database.db = null;
          database.collection = null;
        });
	}, // end disconnect
	insert: function(data){
		if(this.db == null) return;
		if(this.collection == null) return;
		this.collection.insert(data, function(err, result){
			if(err) throw err;
		}); // end collection.insert
	}, // end insert
} // end Database

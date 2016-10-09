//https://www.npmjs.com/package/mongodb
const config = require('config');

module.exports = exports = Database;

var MongoClient = require('mongodb').MongoClient,
  test = require('assert');
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
		MongoClient.connect(uri, function(err, db) {
  			if(err) throw err;
  			console.log('database connect');
  			database.db = db;
  			database.collection = db.collection(databaseName);
  		});// end MongoClient.connect
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
			console.log('collection insert')
			console.log(result);
		}); // end collection.insert
	}, // end insert
	update: function(key, obj){
		// a simple document update using upsert (the document will be inserted if it does not exist)
		// key: { song: 'One Sweet Day' }
		// obj: { artist: 'Mariah Carey ft. Boyz II Men' }
		/*this.collection.update(
      		key, 
      		{ $set: obj },
      		function (err, result) {        
        		if(err) throw err;
        		console.log('database update')
        		console.log(key)
        		console.log(obj)
        		console.log(result);
    	});*/
		var collection = this.collection;
		collection.updateOne(key, obj, {upsert:true, w: 1}, function(err, result) {
		    test.equal(null, err);
		    test.equal(1, result.result.n);

		    /*// Fetch the document that we modified and check if it got inserted correctly
		    collection.findOne(key, function(err, item) {
		      test.equal(null, err);		      
		    });*/
		  });
	}, // end update
	getAllUsers: function(msg){
		var collection = this.collection;
		var users = [];
		// Peform a simple find and return all the documents
	    collection.find().toArray(function(err, docs) {
			test.equal(null, err);
			for(var i = 0; i < docs.length; i++){
				users.push(docs[i].userID);
			}
	     	console.log('getAllUsers Done')	      
	    	console.log(users)  
	    });
	    console.log('getAllUsers not done');
	    console.log(users)
	    return users;
	},
} // end Database

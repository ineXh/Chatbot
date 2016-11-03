//https://www.npmjs.com/package/mongodb
const config = require('config');
var Promise = require('promise');

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
	getUser: function(id) {
		var collection = this.collection;
		return new Promise(function(resolve, reject) {
			collection.findOne({userID:id}, function(err, user){
				if(err) {
					reject(1);
					throw err;
				}
				//console.log('getUser done');
				//console.log(user);
				resolve(user);
			}); // end collection findOne
		}); // end promise
	}, // end getUser
	getAllUsers: function(key){
		var collection = this.collection;
		var users = [];

		return new Promise(function(resolve, reject){
			// Peform a simple find and return all the documents
		    collection.find(key).toArray(function(err, docs) {
		    	if(err){
		    		reject(1);
		    		throw err;	
		    	} 
				test.equal(null, err);
				for(var i = 0; i < docs.length; i++){
					users.push(docs[i]);
				}				
		     	//console.log('getAllUsers Done')	      
		    	//console.log(users)
		    	resolve(users);
		    }); // end collection find
		}); // end Promise		
	    //console.log('getAllUsers not done');
	    //console.log(users)
	    //return users;
	}, // end getAllUsers		
	decrementStats: function() {
		var collection = this.collection;

		collection.bulkWrite([
				{	
					updateMany:
					{
						"filter": {"hunger": { $gt: 0 }, "age": { $gt: 0 }},
						"update": {$inc : {"hunger": -1}},
						"upsert": false
					}
				},
				{	
					updateMany:
					{
						"filter": {"happiness": { $gt: 0 }, "age": { $gt: 0 }},
						"update": {$inc : {"happiness": -1}},
						"upsert": false
					}
				},
				{	updateMany:
					{
						"filter": {"energy": { $gt: 0 }, "age": { $gt: 0 }},
						"update": {$inc : {"energy": -1}},
						"upsert": false
					}
				},
				{	updateMany:
					{
						"filter": {"ageTime": { $gt: 0 }},
						"update": {$inc : {"ageTime": -1}},
						"upsert": false
					}
				}
		]);

	}
} // end Database

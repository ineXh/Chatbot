module.exports = exports = userSchema;

function userSchema(){
	var schema = {
		'userID': 0, // facebook userID
		'timeOfAuth': 0,
		'timeOfLast': 0, // time of last message
		'subscribed': false,
	}
	return schema;
} // end userSchema
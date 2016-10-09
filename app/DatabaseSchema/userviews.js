module.exports = exports = userSchema;

function userSchema(){
	var schema = {
		'userID': 0, // facebook userID
		'timeOfAuth': 0,
		'timeOfLast': 0, // time of last message
		'subscribed': false,

		'type': 0,
		'age': 0,
		'hunger': 10,
		'happiness':10,
		'energy': 10,

	}
	return schema;
} // end userSchema
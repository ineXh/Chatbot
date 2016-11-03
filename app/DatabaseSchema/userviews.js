module.exports = exports = userSchema;

function userSchema(){
	var schema = {
		'userID': 0, // facebook userID
		'timeOfAuth': 0,
		'timeOfLast': 0, // time of last message
		'subscribed': false,

		'type': 0,
		'age': 0,	// increase by aging
		'ageLevel': 0, // increase by evolving

		'hunger': 10,
		'happiness':10,
		'energy': 10,

		'ageTime': 3, // count down to 0 to age
		'inPlay': false,

	}
	return schema;
} // end userSchema
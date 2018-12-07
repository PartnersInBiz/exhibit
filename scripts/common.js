// Code taken from a previous project of mine
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// Remove spaces from a string
String.prototype.removeSpaces = function() {
	var target = this;
	return target.replaceAll(" ", "");
};

// Validate email
String.prototype.validateEmail = function() {
	var target = this;

	// Regex from https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;	
    return re.test(String(target).toLowerCase());
};

// Return true if uppercase
String.prototype.isUpper = function() {
	var target = this;

	if (target[0] >= 'A' && target[0] <= 'Z')
		return true;
	else
		return false;
};

// Return true if lowercase
String.prototype.isLower = function() {
	var target = this;

	if (target[0] >= 'a' && target[0] <= 'z')
		return true;
	else
		return false;
};

// Return true if number
String.prototype.isNumber = function() {
	var target = this;

	if (target[0] >= '0' && target[0] <= '9')
		return true;
	else
		return false;
};

// Return breakdown of a string's contents
String.prototype.breakdown = function() {
	var target = this;

	// We're literally iterating characters and counting types
	let breakdown = {upper: 0, lower: 0, number: 0, symbol: 0};
	for (character of target)
	{
		if (character.isUpper())
			breakdown.upper++;
		else if (character.isLower())
			breakdown.lower++;
		else if (character.isNumber())
			breakdown.number++;
		else
			breakdown.symbol++;
	}
	return breakdown;
};

// Validate password with our security standards
String.prototype.validatePassword = function() {
	var target = this;

	// Must be 6 characters or longer
	if (target.length < 6)
		return false;
	else
	{
		let breakdown = target.breakdown();
		
		// Require one of each character type
		if (breakdown.upper < 1 || breakdown.lower < 1 || breakdown.number < 1 || breakdown.symbol < 1)
			return false;
	}

	return true;
};

// Validates forms given inputs and required fields
let validateForm = function(body, required) {
	for (require of required)
	{
		if (body.hasOwnProperty(require))
		{
			// We assume '' is not an answer, nor is '   '
			if (body[require].removeSpaces() == '')
				return false;
			// Check an email regex
			else if (require == "email" && !body[require].validateEmail())
				return false;
			// Check the password requirements
			else if (require == "password" && !body[require].validatePassword())
				return false;
		}
		else
			return false;
	}
	
	return true;
};

// Code from https://stackoverflow.com/questions/13644303/how-to-check-if-js-code-is-running-on-node-server-or-on-the-client
function is_server() {
	return ! (typeof window != 'undefined' && window.document);
}

(() => {
	if (is_server())
	{
		// This is just a Node.js thing
		module.exports = {
			validateForm: validateForm
		}
	}
})();
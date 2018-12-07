// For browserify, so we can generate random IDs on the client side
const shortid = require("shortid");

window.generate_shortid = function(){
	return shortid.generate();
}
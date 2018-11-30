// For browserify
const shortid = require("shortid");

window.generate_shortid = function(){
	return shortid.generate();
}
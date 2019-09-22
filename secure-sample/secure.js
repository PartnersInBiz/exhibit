module.exports = {
	// Settings for the session
	session_settings: {
		secret: "", // This is not for real; it's generated every time the server restarts
		resave: false,
		saveUninitialized: false,
		cookie: {
			expires: 600000,
			secure: false // Left this way for any experimentation on your own, but in production, it should be true
		}
	},
	// Get magic secret stuff for security
	secret: function(callback){
		let bcrypt = require("bcryptjs");
		callback(bcrypt.genSaltSync());
	},
	// Database connection settings
	db_settings: {
		host: "",
		user: "",
		password: "",
		database: ""
	},
	public_demo_users: []
}

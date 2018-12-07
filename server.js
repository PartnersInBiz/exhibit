module.exports = {
	// All the possible errors
	errors: {
		"LOGIN_REQUIRED": "Must be logged in to complete this action.",
		"LOGIN_FAILED": "Could not login using the credentials provided.",
		"EMAIL_TAKEN": "This email is already in use for another account.",
		"REGISTRATION_FAILED": "Failed to register with the information provided.",
		"FORM_INVALID": "The input provided was invalid. Make sure you have followed the instructions for each field.",
		"NO_SEND_SCRIPT": "Couldn't send script.",
		"NO_SEND_FILE": "Couldn't send file.",
		"FILE_UPLOAD_FAILED": "Failed to upload file.",
		"NO_ACCESS": "Couldn't access exhibit.",
		"SAVE_FAILED": "Couldn't save exhibit.",
		"JS_REQUIRED": "This web app requires JavaScript to work properly."
	},
	// Handle error by either sending a 400 message or redirecting to the error page
	handleError: function(req, res, error){
		// If we're not in an AJAX request, then we just redirect
		if (typeof req.body.ajax == "undefined" && typeof req.params.ajax == "undefined" && typeof req.query.ajax == "undefined")
		{
			res.redirect("/error/" + error);
		}
		// Otherwise send an error message
		else
		{
			res.status(400).send(this.errors[error]);
		}
	},
	// Handle success and associated redirect
	handleSuccess: function(req, res, path){
		if (typeof req.body.ajax == "undefined" && typeof req.params.ajax == "undefined" && typeof req.query.ajax == "undefined")
		{
			res.redirect(path);
		}
		else
		{
			res.status(301).send(path);
		}
	},
	// Get all of a user's owned exhibits
	getUserExhibits: function(con, mysql, user_id, callback){
		// SQL query
		let sql = "SELECT * FROM exhibits WHERE owner_id=? AND deleted=0 ORDER BY id DESC";
		let inserts = [user_id];
		sql = mysql.format(sql, inserts);

		con.query(sql, function (error, result) {
			if (error)
				throw error;
			
			callback(result);
		});
	},
	// Get a single user exhibit
	getUserExhibit: function(con, mysql, gen_id, owner_id, callback){
		let sql, inserts;

		// If this is for editing, check ownership
		if (owner_id > 0)
		{
			sql = "SELECT * FROM exhibits WHERE gen_id=? AND owner_id=? AND deleted=0";
			inserts = [gen_id, owner_id];
		}
		// Otherwise it's public for viewing
		else
		{
			sql = "SELECT * FROM exhibits WHERE gen_id=? AND deleted=0";
			inserts = [gen_id];
		}

		// SQL query
		sql = mysql.format(sql, inserts);
		con.query(sql, function (error, result) {
			if (error)
				throw error;
			
			callback(result);
		});
	},
	// Get all the media files a user owns and hasn't deleted
	getUserMedia: function(con, mysql, user_id, callback){
		// SQL query
		let sql = "SELECT gen_id, type, name, description FROM files WHERE owner_id=? AND deleted=0 ORDER BY id DESC";
		let inserts = [user_id];
		sql = mysql.format(sql, inserts);

		con.query(sql, function (error, result) {
			if (error)
				throw error;
			
			callback(result);
		});
	}
};
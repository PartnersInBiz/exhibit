module.exports = {
	errors: {
		"LOGIN_REQUIRED": "Must be logged in to complete this action.",
		"LOGIN_FAILED": "Could not login using the credentials provided.",
		"EMAIL_TAKEN": "This email is already in use for another account.",
		"REGISTRATION_FAILED": "Failed to register with the information provided.",
		"FORM_INVALID": "The input provided was invalid. Make sure you have followed the instructions for each field.",
		"NO_SEND_SCRIPT": "Couldn't send script."
	},
	handleError: function(req, res, error){
		if (typeof req.body.ajax == "undefined")
		{
			res.redirect("/error/" + error);
		}
		else
		{
			res.status(400).send(this.errors[error]);
		}
	},
	handleSuccess: function(req, res, path){
		if (typeof req.body.ajax == "undefined")
		{
			res.redirect(path);
		}
		else
		{
			res.status(301).send(path);
		}
	},
	getUserExhibits: function(con, mysql, user_id, callback){
		let sql = "SELECT * FROM exhibits WHERE owner_id=?";
		let inserts = [user_id];
		sql = mysql.format(sql, inserts);

		con.query(sql, function (error, result) {
			if (error)
				throw error;
			
			callback(result);
		});
	},
	getUserMedia: function(con, mysql, user_id, callback){
		let sql = "SELECT gen_id, type, name, description FROM files WHERE owner_id=?";
		let inserts = [user_id];
		sql = mysql.format(sql, inserts);

		con.query(sql, function (error, result) {
			if (error)
				throw error;
			
			callback(result);
		});
	}
};
module.exports = {
	errors: {
		"LOGIN_FAILED": "Could not login using the credentials provided.",
		"EMAIL_TAKEN": "This email is already in use for another account.",
		"FORM_INVALID": "The input provided was invalid. Make sure you have followed the instructions for each field."
	},
	handleError: function(req, res, error){
		if (typeof req.body.ajax == "undefined")
		{
			res.redirect("/error/" + error);
		}
		else
		{
			res.status(400).send(error);
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
	}
};
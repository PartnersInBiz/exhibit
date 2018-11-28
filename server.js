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
	}
};
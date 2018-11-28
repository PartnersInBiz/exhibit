const express = require("express");
const session = require("express-session");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const common = require("./common");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const secure = require("./secure/secure");
const server = require("./server");

const SALT = 10;

let app = express();

// Configure sessions
app.use(session(secure.session_settings));

// Configure Nunjucks templating engine
const TEMPLATE_PATH = 'templates';
nunjucks.configure(TEMPLATE_PATH, {
	autoescape: true,
	express: app
});

// Configure body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Configure database connection
let con = mysql.createConnection(secure.db_settings);

con.connect(function(error){
	if (error)
		throw error;
	
	console.log("Connected to database.");
});

// Check user authentication
let login_required = function(req, res, next) {
	// If the user is not logged in, make them login
	if (typeof req.session.user == "undefined")
		res.redirect("/login");
	else
		return next();
}

// Render error page
app.get("/error/:error", function(req, res){
	return res.render("error.html", {session: req.session, error: server.errors[req.params.error]});
});

// Render the splash homepage, should always be GET
app.get("/", function(req, res){
	return res.render("index.html", {session: req.session});
});

// GET to /login
app.get("/login", function(req, res){
	return res.render("login.html");
});

// POST to /login
let login = function(req, res){
	// Validate input
	const required = ["email", "password"];
	if (common.validateForm(req.body, required))
	{
	let sql = "SELECT * FROM users WHERE email=?";
	let inserts = [req.body.email];
	sql = mysql.format(sql, inserts);

	con.query(sql, function (error, result, fields) {
		if (error)
			throw error;

		// Row exists, now check password
		if (result.length > 0)
		{
			bcrypt.compare(req.body.password, result[0]['password'], function(err, resolved){
				if (resolved)
				{
					req.session.user = {
						id: result[0]['id'],
						first_name: result[0]['first_name'],
						last_name: result[0]['last_name'],
						display_name: result[0]['display_name'],
						status: result[0]['status']
					};
					res.redirect("/");
				}
				else
					server.handleError(req, res, "LOGIN_FAILED");
			});
		}
		else
		{
			server.handleError(req, res, "LOGIN_FAILED");
		}
	});
}
else
	server.handleError(req, res, "LOGIN_FAILED");
};
app.post("/login", login);

// Handle logout
let logout = function(req, res){
	req.session.destroy();
	res.redirect("/");
};
app.get("/logout", logout);

// GET to /register
app.get("/register", function(req, res){
	return res.render("register.html");
});

// POST to /register
let register = function(req, res){
	const required = ["first_name", "last_name", "email", "password"];
	
	// Validate input
	if (common.validateForm(req.body, required))
	{
		// Check if the email is already taken
		let sql = "SELECT id FROM users WHERE email=?";
		let inserts = [req.body.email];
		sql = mysql.format(sql, inserts);
		
		con.query(sql, function (error, result, fields) {
			if (error)
				throw error;

			// Alert user if email taken
			if (result.length > 0)
			{
				server.handleError(req, res, "EMAIL_TAKEN");
			}
			else
			{
				// Hash password
				bcrypt.hash(req.body.password, SALT, function(error, hash){
					let display_name = req.body.display_name;
					if (display_name.removeSpaces() == '')
						display_name = req.body.first_name + " " + req.body.last_name;

					// Insert into database
					let sql = "INSERT INTO users (first_name, last_name, display_name, email, password) VALUES (?, ?, ?, ?, ?)";
					let inserts = [req.body.first_name, req.body.last_name, display_name, req.body.email, hash];
	
					sql = mysql.format(sql, inserts);

					con.query(sql, function (error, result) {
						if (error)
							throw error;
	
						login(req, res);
					});
				});
			}
		});
	}
	else
	{
		server.handleError(req, res, "FORM_INVALID");
	}
}
app.post("/register", register);


// Listen on port 3000
app.listen(3000);
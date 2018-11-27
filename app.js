const express = require("express");
const session = require("express-session");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const common = require("./common");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const secure = require("./secure/secure");

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
					console.log("not match")
			});
		}
		else
		{
			console.log("User doesn't exist.");
		}
		
	});
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
				console.log("Email taken.")
				return false;
			}
			else
			{
				console.log("Creating user.");

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
		res.render("index.html");
	}
}
app.post("/register", register);


// Listen on port 3000
app.listen(3000);
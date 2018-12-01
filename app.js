const express = require("express");
const session = require("express-session");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
const common = require("./scripts/common");
const secure = require("./secure/secure");
const server = require("./server");

const SALT = 10;
const TEMPLATE_PATH = 'templates';
const PORT = 3000;

let app = express();

// Configure sessions
secure.secret(function(buffer){
	secure.session_settings.secret = buffer;
	app.use(session(secure.session_settings));
});

// Configure Nunjucks templating engine
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
	{
		if (typeof req.body.ajax != "undefined" || typeof req.params.ajax != "undefined" || typeof req.query.ajax != "undefined")
			res.status(403).send("/login");
		else
			res.redirect("/login");
	}
	else
		return next();
}

// Get a list of all the images the user owns
app.get("/media/list", function(req, res){
	server.getUserMedia(con, mysql, 6, function(mediax){
		let media = [
			{
				name: "hi"
			},
			{
				name: "hi2"
			},
			{
				name: "hi3"
			},
			{
				name: "hi4"
			},
			{
				name: "hi5"
			},
			{
				name: "hi6"
			},
			{
				name: "hi7"
			},
			{
				name: "hi8"
			},
			{
				name: "hi9"
			},
			{
				name: "hi10"
			},
			{
				name: "hi11"
			},
			{
				name: "hi12"
			},
			{
				name: "hi13"
			},
			{
				name: "hi14"
			},
			{
				name: "hi15"
			},
			{
				name: "hi16"
			},
			{
				name: "hi17"
			}
		]
		res.send(media);
	});
});

// Render client-side scripts
app.get("/client/:script", function(req, res){
	let options = {
		root: __dirname + "/scripts/",
		dotfiles: "deny",
		headers: {
			"x-timestamp": Date.now(),
			"x-sent": true
		}
	};

	res.sendFile(req.params.script, options, function(error){
		if (error)
			server.handleError(req, res, "NO_SEND_SCRIPT");
	});
});

app.get("/client/graphics/:script", function(req, res){
	let options = {
		root: __dirname + "/scripts/graphics/",
		dotfiles: "deny",
		headers: {
			"x-timestamp": Date.now(),
			"x-sent": true
		}
	};

	res.sendFile(req.params.script, options, function(error){
		if (error)
			server.handleError(req, res, "NO_SEND_SCRIPT");
	});
});

app.get("/client/textures/:texture", function(req, res){
	let options = {
		root: __dirname + "/default/images/",
		dotfiles: "deny",
		headers: {
			"x-timestamp": Date.now(),
			"x-sent": true
		}
	};

	res.sendFile(req.params.texture, options, function(error){
		if (error)
			server.handleError(req, res, "NO_SEND_SCRIPT");
	});
});

app.get("/client/css/:css", function(req, res){
	let options = {
		root: __dirname + "/default/css/",
		dotfiles: "deny",
		headers: {
			"x-timestamp": Date.now(),
			"x-sent": true
		}
	};

	res.sendFile(req.params.css, options, function(error){
		if (error)
			server.handleError(req, res, "NO_SEND_SCRIPT");
	});
});

// Render error page
app.get("/error/:error", function(req, res){
	return res.render("error.html", {session: req.session, error: server.errors[req.params.error]});
});

// Render the splash homepage, should always be GET
app.get("/", function(req, res){
	if (typeof req.session.user == "undefined")
		return res.render("index.html", {session: req.session});
	else
	{
		server.getUserExhibits(con, mysql, req.session.user.id, function(exhibits){
			return res.render("dashboard.html", {session: req.session, exhibits: exhibits});
		});
	}
});

// GET to /login
app.get("/login", function(req, res){
	if (typeof req.session.user == "undefined")
		return res.render("login.html");
	else
		return res.redirect("/");
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
			{
				throw error;
				server.handleError(req, res, "LOGIN_FAILED");
			}
			else if (result.length > 0)
			{
				// Row exists, now check password
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
						server.handleSuccess(req, res, "/");
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
			{
				server.handleError(req, res, "REGISTRATION_FAILED");
				throw error;
			}
			// Alert user if email taken
			else if (result.length > 0)
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
						{
							server.handleError(req, res, "REGISTRATION_FAILED");
							throw error;
						}
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

let new_exhibit = function(req, res){
	let sql = "INSERT INTO exhibits (gen_id, owner_id) VALUES (?, ?)";
	let inserts = [shortid.generate(), req.session.user.id];
	sql = mysql.format(sql, inserts);

	con.query(sql, function (error, result) {
		if (error)
			throw error;

		res.redirect("/edit/" + inserts[0]);
	});
};
app.get("/new", new_exhibit);

let edit = function(req, res){
	return res.render("edit.html");
}
app.get("/edit", edit);


// Listen on port 3000
app.listen(PORT);
console.log("Now listening on port", PORT + ".");
console.log("Hit CTRL-C to exit server application.");
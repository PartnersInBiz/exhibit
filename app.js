const express = require("express");
const session = require("express-session");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
const fs = require("fs");
const mime = require("mime-types");
const sharp = require("sharp");
const ffmpeg = require("ffmpeg");
const multer  = require("multer");
const upload = multer({
	dest: "uploads/",
	limits: {fieldSize: 100000000},
	fileFilter: function(req, file, callback){
		const types_allowed = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm", "video/ogg", "video/x-ms-wmv", "video/avi"];

		if (types_allowed.indexOf(file.mimetype) > -1)
			callback(null, true);
		else
			callback(null, false);
	}
});

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
app.get("/media/list", login_required, function(req, res){
	server.getUserMedia(con, mysql, req.session.user.id, function(media){
		res.send(media);
	});
});

// Crop thumbnail
let crop_thumbnail = function(req, res, path, cb=function(){}){
	fs.readFile(path, function(error, data){
		if (error)
		{
			server.handleError(req, res, "FILE_UPLOAD_FAILED");
			throw error;
		}
		sharp(data).jpeg().resize({ width: 150, height: 100 }).toBuffer().then(output => {
			fs.writeFile("uploads/thumbnails/" + req.file.filename, output, function (err) {
				if (err)
				{
					server.handleError(req, res, "FILE_UPLOAD_FAILED");
					throw err;
				}
				if (path.indexOf("temp") > - 1)
				{
					fs.unlink(path, (err) => {
						if (err)
						{
							server.handleError(req, res, "FILE_UPLOAD_FAILED");
							throw err;
						}
					});
				}
			}); 
		});
	});
};

// Upload file
let upload_file = function(req, res){
	if (typeof req.file != "undefined")
	{
		// Thumbnail generator -- first for images
		if (req.file.mimetype.indexOf("jpeg") > -1 || req.file.mimetype.indexOf("png") > -1)
		{
			crop_thumbnail(req, res, req.file.path);
		}
		// Thumbnail generator -- for videos
		else if (req.file.mimetype.indexOf("video") > -1)
		{
			try
			{
				let process = new ffmpeg("uploads/" + req.file.filename);
				process.then(function (video) {
					// Callback mode
					video.fnExtractFrameToJPG('uploads/temp', {
						frame_rate: 1,
						number: 1
					}, function (error, files) {
						if (error)
						{
							server.handleError("FILE_UPLOAD_FAILED");
							throw error;
						}
						else
						{
							crop_thumbnail(req, res, files[0]);
						}
					});
				}, function (err) {
					server.handleError("FILE_UPLOAD_FAILED");
					throw err;
				});
			}
			catch (e) {
				console.log(e.code);
				console.log(e.msg);

				server.handleError("FILE_UPLOAD_FAILED");
			}
		}

		// Name and description
		if (typeof req.body.file_name == "undefined" || req.body.file_name.removeSpaces() == "")
			req.body.file_name = req.file.originalname;
		
		if (typeof req.body.file_description == "undefined" || req.body.file_description.removeSpaces() == "")
			req.body.file_description = req.file.originalname;

		// Insert into database
		let sql = "INSERT INTO files (gen_id, path, type, name, description, owner_id) VALUES (?, ?, ?, ?, ?, ?)";
		let inserts = [req.file.filename, req.file.path, req.file.mimetype, req.body.file_name, req.body.file_description, req.session.user.id];

		sql = mysql.format(sql, inserts);

		con.query(sql, function (error, result) {
			if (error)
			{
				server.handleError(req, res, "FILE_UPLOAD_FAILED");
				throw error;
			}
			res.send("success");
		});
	}
	else
		server.handleError("FORM_INVALID");
};
app.post("/upload", login_required, upload.single("media_upload_file"), upload_file);

// Serve files
app.get("/file/:thumb?/:file", function(req, res){
	let options = {
		root: __dirname,
		dotfiles: "deny",
		headers: {
			"x-timestamp": Date.now(),
			"x-sent": true
		}
	};

	let cb = () => {
		res.sendFile(req.params.file, options, function(error){
			if (error)
				server.handleError(req, res, "NO_SEND_FILE");
		});
	};

	if (!req.params.thumb)
	{
		options.root += "/uploads/";

		let sql = "SELECT type FROM files WHERE gen_id=?";
		let inserts = [req.params.file];
		sql = mysql.format(sql, inserts);

		con.query(sql, function (error, result, fields) {
			if (error)
			{
				server.handleError(req, res, "NO_SEND_FILE");
				throw error;
			}
			else if (result.length > 0)
			{
				options.headers["Content-Type"] = result[0].type;
				cb(options);
			}
			else
			{
				server.handleError(req, res, "NO_SEND_FILE");
			}
		});
	}
	else
	{
		options.root += "/uploads/thumbnails/";
		options.headers["Content-Type"] = "image/jpeg";
		cb();
	}

	
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
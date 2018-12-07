// Load libraries
const express = require("express");
const session = require("express-session");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
const fs = require("fs");
const sharp = require("sharp");
const ffmpeg = require("ffmpeg");
const multer  = require("multer");
const upload = multer({
	dest: "uploads/",
	limits: {fieldSize: 100000000},
	fileFilter: function(req, file, callback){
		const types_allowed = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm", "video/ogg", "video/x-ms-wmv", "video/x-msvideo", "video/quicktime"];

		if (types_allowed.indexOf(file.mimetype) > -1)
			callback(null, true);
		else
			callback(null, false);
	}
});

// Load custom helper libraries
const common = require("./scripts/common");
const secure = require("./secure/secure");
const server = require("./server");

// Set constants
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

// Convert videos to MP4
let convert_video = function(req, res, path){
	let process = new ffmpeg("uploads/" + req.file.filename);
	
	process.then(function (video) {
		// Settings
		video
		.setVideoFormat("mp4")
		.setVideoCodec("h264")
		.save("uploads/" + req.file.filename, function(error){
			if (error)
			{
				server.handleError(req, res, "FILE_UPLOAD_FAILED");
				throw error;
			}
			else
			{
				console.log("Converted video", req.file.filename);
			}
		});
	});
};

// Crop thumbnail
let crop_thumbnail = function(req, res, path, cb=function(){}){
	fs.readFile(path, function(error, data){
		if (error)
		{
			server.handleError(req, res, "FILE_UPLOAD_FAILED");
			throw error;
		}

		// Create a jpeg, resize to 150x100, then write to thumbnail file
		sharp(data).jpeg().resize({ width: 150, height: 100 }).toBuffer().then(output => {
			fs.writeFile("uploads/thumbnails/" + req.file.filename, output, function (err) {
				if (err)
				{
					server.handleError(req, res, "FILE_UPLOAD_FAILED");
					throw err;
				}

				// Delete any temporary files, as in case of extracted frame from video
				if (path.indexOf("temp") > - 1)
				{
					fs.unlink(path, (err) => {
						if (err)
						{
							server.handleError(req, res, "FILE_UPLOAD_FAILED");
							throw err;
						}
						cb(req, res, path);
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
					// Extract a frame for the thumbnail
					video.fnExtractFrameToJPG('uploads/temp', {
						frame_rate: 1,
						number: 1
					}, function (error, files) {
						if (error)
						{
							server.handleError(req, res, "FILE_UPLOAD_FAILED");
							throw error;
						}
						else
						{
							// Crop the thumbnail image
							crop_thumbnail(req, res, files[0], convert_video);
						}
					});
				}, function (err) {
					server.handleError(req, res, "FILE_UPLOAD_FAILED");
					throw err;
				});
			}
			catch (e) {
				server.handleError(req, res, "FILE_UPLOAD_FAILED");
			}
		}

		// Name and description
		if (typeof req.body.file_name == "undefined" || req.body.file_name.removeSpaces() == "")
			req.body.file_name = req.file.originalname;

		if (typeof req.body.file_description == "undefined" || req.body.file_description.removeSpaces() == "")
			req.body.file_description = req.file.originalname;

		// Video mimetype should always become mp4 because of conversion, otherwise (as with images) may vary so record it
		let mimetype;
		if (req.file.mimetype.indexOf("video") > -1)
			mimetype = "video/mp4";
		else
			mimetype = req.file.mimetype;

		// Insert into database
		let sql = "INSERT INTO files (gen_id, path, type, name, description, owner_id) VALUES (?, ?, ?, ?, ?, ?)";
		let inserts = [req.file.filename, req.file.path, mimetype, req.body.file_name, req.body.file_description, req.session.user.id];

		// Escape query, execute it
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
		server.handleError(req, res, "FORM_INVALID");
};
app.post("/upload", login_required, upload.single("media_upload_file"), upload_file);

// Update file meta
let update_file = function(req, res){
	// Validate the form
	let required = ["gen_id", "name", "description"];
	if (common.validateForm(req.body, required))
	{
		// SQL query
		let sql = "UPDATE files SET name=?, description=? WHERE gen_id=?";
		let inserts = [req.body.name, req.body.description, req.body.gen_id];
		sql = mysql.format(sql, inserts);

		con.query(sql, function (error, result) {
			if (error)
				throw error;
				
			if (typeof req.query.ajax != "undefined")
				res.send("success");
			else
				res.redirect("/");
		});
	}
	else
		server.handleError(req, res, "FORM_INVALID");
};
app.post("/file/update", login_required, update_file);

// Delete file
let delete_file = function(req, res){
	// Validate form
	let required = ["gen_id"];
	if (common.validateForm(req.body, required))
	{
		// SQL query
		let sql = "UPDATE files SET deleted=1 WHERE gen_id=? AND owner_id=?";
		let inserts = [req.body.gen_id, req.session.user.id];
		sql = mysql.format(sql, inserts);

		con.query(sql, function (error, result) {
			if (error)
				throw error;
				
			if (typeof req.query.ajax != "undefined")
				res.send("success");
			else
				res.redirect("/");
		});
	}
	else
		server.handleError(req, res, "FORM_INVALID");
};
app.post("/file/delete", login_required, delete_file);

// Serve files
app.get("/file/:thumb?/:file", function(req, res){
	// These are header options so that we send the images in an appropriate manner to the file type
	let options = {
		root: __dirname,
		dotfiles: "deny",
		headers: {
			"x-timestamp": Date.now(),
			"x-sent": true
		}
	};

	// A callback function to send the file once we've gotten some information from the database
	let cb = () => {
		res.sendFile(req.params.file, options, function(error){
			if (error && error.code != "ECONNABORTED")
				server.handleError(req, res, "NO_SEND_FILE");
		});
	};

	// This is a regular file, not a thumbnail
	if (!req.params.thumb)
	{
		options.root += "/uploads/";

		// Get the file type from the database
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
				// Change the headers, call the callback
				options.headers["Content-Type"] = result[0].type;
				cb();				
			}
			else
			{
				server.handleError(req, res, "NO_SEND_FILE");
			}
		});
	}
	// If a thumbnail
	else
	{
		// No database query because all thumbnails are generated the same way
		options.root += "/uploads/thumbnails/";
		options.headers["Content-Type"] = "image/jpeg";
		cb();
	}
});

// Serve client-side scripts
app.get("/client/:script", function(req, res){
	// Header options
	let options = {
		root: __dirname + "/scripts/",
		dotfiles: "deny",
		headers: {
			"x-timestamp": Date.now(),
			"x-sent": true
		}
	};

	// Send the file
	res.sendFile(req.params.script, options, function(error){
		if (error)
			server.handleError(req, res, "NO_SEND_SCRIPT");
	});
});

// Serve client-side graphics scripts
app.get("/client/graphics/:script", function(req, res){
	// Header information
	let options = {
		root: __dirname + "/scripts/graphics/",
		dotfiles: "deny",
		headers: {
			"x-timestamp": Date.now(),
			"x-sent": true
		}
	};

	// Send the file
	res.sendFile(req.params.script, options, function(error){
		if (error)
			server.handleError(req, res, "NO_SEND_SCRIPT");
	});
});

// Serve default images and textures
app.get("/client/textures/:texture", function(req, res){
	// Header options
	let options = {
		root: __dirname + "/default/images/",
		dotfiles: "deny",
		headers: {
			"x-timestamp": Date.now(),
			"x-sent": true
		}
	};

	// Send the file
	res.sendFile(req.params.texture, options, function(error){
		if (error)
			server.handleError(req, res, "NO_SEND_SCRIPT");
	});
});

// Serve default CSS
app.get("/client/css/:css", function(req, res){
	// Header
	let options = {
		root: __dirname + "/default/css/",
		dotfiles: "deny",
		headers: {
			"x-timestamp": Date.now(),
			"x-sent": true
		}
	};

	// Send
	res.sendFile(req.params.css, options, function(error){
		if (error)
			server.handleError(req, res, "NO_SEND_SCRIPT");
	});
});

// Render error page
app.get("/error/:error", function(req, res){
	res.render("error.html", {session: req.session, error: server.errors[req.params.error]});
});

// Render the splash homepage, should always be GET
app.get("/", function(req, res){
	// Not logged in, so render login page (time constraints => no time for a real splash homepage)
	if (typeof req.session.user == "undefined")
		res.render("login.html", {session: req.session});
	// Logged in
	else
	{
		server.getUserExhibits(con, mysql, req.session.user.id, function(exhibits){
			res.render("dashboard.html", {session: req.session, exhibits: exhibits});
		});
	}
});

// GET to /login
app.get("/login", function(req, res){
	// Only show login if not already logged in
	if (typeof req.session.user == "undefined")
		res.render("login.html");
	else
		res.redirect("/");
});

// POST to /login
let login = function(req, res){
	// Validate input
	const required = ["email", "password"];
	if (common.validateForm(req.body, required))
	{
		// SQL query
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
						// Set the session, congratulate user
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
				server.handleError(req, res, "LOGIN_FAILED");
		});
	}
	else
		server.handleError(req, res, "LOGIN_FAILED");
};
app.post("/login", login);

// Handle logout
let logout = function(req, res){
	// Destroy session, redirect
	req.session.destroy();
	res.redirect("/");
};
app.get("/logout", logout);

// GET to /register
app.get("/register", function(req, res){
	res.render("register.html");
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

// Create a new exhibit
let new_exhibit = function(req, res){
	// Database entry
	let sql = "INSERT INTO exhibits (gen_id, owner_id) VALUES (?, ?)";
	let inserts = [shortid.generate(), req.session.user.id];
	sql = mysql.format(sql, inserts);

	con.query(sql, function (error, result) {
		if (error)
			throw error;

		// Copy the predefined structure of these files to a new one named after the random ID
		fs.copyFile("exhibits/_struct.html", "exhibits/" + inserts[0], (err) => {
			if (err)
				throw err;
			res.redirect("/edit/" + inserts[0]);
		});
	});
};
app.get("/new", login_required, new_exhibit);

// Display the editor
let edit = function(req, res){
	let serve_editor = (result) => {
		if (result.length > 0)
		{
			// The exhibit exists, so we can get it ready
			let exhibit = {
				title: result[0].title,
				description: result[0].description,
				gen_id: result[0].gen_id,
				data: ""
			};
			
			// Read the file
			fs.readFile(result[0].file_path + result[0].gen_id, "utf8", function(error, data) {
				if (error)
					throw error;

				// Render database meta info + file data
				exhibit.data = {
					assets: data.split("<!--ASSETS-->")[1],
					content: data.split("<!--ASSETS-->")[0]
				};
				res.render("edit.html", {exhibit: exhibit, session: req.session});
			});
		}
	};
	server.getUserExhibit(con, mysql, req.params.id, req.session.user.id, serve_editor);
}
app.get("/edit/:id", login_required, edit);

// No such thing as /edit, must have an exhibit ID
app.get("/edit", function(req, res){
	res.redirect("/");
});

// Render view page
let view = function(req, res){
	let serve_viewer = (result) => {
		if (result.length > 0)
		{
			// Yay the exhibit exists
			let exhibit = {
				title: result[0].title,
				description: result[0].description,
				gen_id: result[0].gen_id,
				data: ""
			};

			// Read the file, serve the page
			fs.readFile(result[0].file_path + result[0].gen_id, "utf8", function(error, data) {
				if (error)
					throw error;

				// Divide content and assets
				let split_1 = data.split("<!--ASSETS-->");

				// Divide spawn info from rest of content
				let split_2 = split_1[0].split('id="spawn"');
				exhibit.data = {
					assets: split_1[1],
					content: split_2[0].substring(0, split_2[0].length - 10) + '</a-entity>',
					spawn_point: split_2[1].split('<a-box')[1].split('position="')[1].split('"')[0]
				};
				res.render("view.html", {exhibit: exhibit, session: req.session});
			});
		}
	};
	server.getUserExhibit(con, mysql, req.params.id, 0, serve_viewer);
}
app.get("/view/:id", view);

// No such thing as /view, must have an exhibit ID
app.get("/view", function(req, res){
	res.redirect("/");
});

// Deleting an exhibit
let delete_exhibit = function(req, res){
	// Database stuff!
	let sql = "UPDATE exhibits SET deleted=1 WHERE gen_id=? AND owner_id=?";
	let inserts = [req.params.id, req.session.user.id];
	sql = mysql.format(sql, inserts);

	con.query(sql, function (error, result) {
		if (error)
			throw error;
			
		res.redirect("/");
	});
};
app.get("/delete/:id", login_required, delete_exhibit);

// No such thing as /delete, must have an exhibit ID
app.get("/delete", function(req, res){
	res.redirect("/");
});

// Update the database or file for the exhibit
let update = function(req, res){
	// Only updating meta info, like the name and description
	if (typeof req.body.type != "undefined" && req.body.type == "meta")
	{
		// Validate inputs
		const required = ["title", "description"];
		if (common.validateForm(req.body, required))
		{
			// SQL query
			let sql = "UPDATE exhibits SET title=?, description=? WHERE gen_id=? AND owner_id=?";
			let inserts = [req.body.title, req.body.description, req.params.id, req.session.user.id];
			sql = mysql.format(sql, inserts);

			con.query(sql, function (error) {
				if (error)
				{
					server.handleError(req, res, "SAVE_FAILED");
					throw error;
				}
				res.send("success");
			});
		}
		else
			server.handleError(req, res, "SAVE_FAILED");
	}
	// Modifying the actual exhibit contents
	else if (typeof req.body.type != "undefined" && req.body.type == "content")
	{
		// Validate inputs
		const required = ["content"];
		if (common.validateForm(req.body, required))
		{
			// Write the new contents to the file
			fs.writeFile("exhibits/" + req.params.id, req.body.content, function(err) {
				if(err) {
					server.handleError(req, res, "SAVE_FAILED");
					throw err;
				}

				res.send("success");
			}); 
		}
		else
			server.handleError(req, res, "SAVE_FAILED");
	}
	else
		server.handleError(req, res, "FORM_INVALID");
};
app.post("/update/:id", login_required, update);

// Listen on port 3000
app.listen(PORT);
console.log("Now listening on port", PORT + ".");
console.log("Hit CTRL-C to exit server application.");
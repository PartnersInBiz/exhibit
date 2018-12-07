# Exhibitor: Design Document

## First, a note

Many of the functions in my code are explained in greater detail in comments. What follows is a non-exhaustive list of some basic design considerations and the files used to make the user experience in Exhibitor possible.

## Choice of Backend

I chose Node.js as the backend because I wanted to be able to easily add collaborative editing capabilities in the future; Node.js has an asynchronous design that allows data to be easily received and transmitted in real-time.

I chose Express.js as the framework because it is similar to Flask and is popular among Node.js developers.

I chose the Nunjucks templating language because it is similar to Jinja.

I chose MySQL because I have experience with that database system and because it has significant performance advantages over SQLite for production applications. I found that a relational database system was sufficient for my purposes, and that a NoSQL database would have presented relatively few benefits.

## Choice of Frontend

HTML, CSS, and JavaScript are the languages of the frontend as a general rule. Bootstrap is simple and eliminates much styling work. I'm familiar with jQuery, and in the case of AJAX it saves a lot of time forming requests.

A-Frame is based on Three.js, which is a much lower-level 3D modeling system, and offers the benefit of a WebVR-compliant framework that does much of the low-level graphics grunt work for me. A-Frame also has, in my opinion, a more suitable data structure than React 360 -- HTML versus a list of JavaScript commands. The HTML is certainly easier for creating an edit mode for end users.

## app.js

This is the main server code. It uses the Express.js framework and Nunjucks templating engine to handle routes and render pages to users. There is also some logic, though some is outsourced to separate library files.

### Callback functions

One important design element to note is the fact that much of the code relies on callback functions. This is due to the asynchronous nature of JavaScript; to execute a function only after another one has finished, a callback function is necessary.

### `login_required`

This function checks whether a user is logged in. If so, it calls `next()`, which is the next function in the router's definition. If the user isn't logged in, they'll be redirected to `/login`.

## scripts/authentication.js

This file contains functions for client-side `registration` and `login` form validation.

Essentially, when either the `registration` or `login` form is submitted, the event is cancelled, each field is checked (using the same functions as will be used on the server-side), and either the user is warned to fix their input or the form is submitted via AJAX.

## scripts/common.js

This file contains functions that can be used on either the server- or client-side.

### `String.prototype.*`

I changed the String prototype to include functions for replacing all instances of a string (`replaceAll`), removing all spaces in a string (`removeSpaces`), validating an email using a simple RegEx (`validateEmail`), detecting if a character is uppercase or lowercase or a digit (`isUpper`, `isLower`, `isNumber`), getting an object of the character-type breakdown of a string (`breakdown`), and validating a password using editable security standards (`validatePassword`).

Modifying the String prototype allowed these functions to be called easily on any string, regardless of whether they were called on the client or server.

### `validateForm`

This function checks a form, given the input data and required fields. It treats a string of all spaces as equivalent to an empty string (largely because a first name `  `, while valid if just checking for a value at all, is not ultimately a name, for example).

The function detects if a field is `email` or `password` and calls the `validateEmail` or `validatePassword` functions on each as needed.

### `is_server`

This function determines if the code is being run on the server or client.

This is used on the script's first run to determine if `module.exports` is necessary (it's needed only on the server-side, and indeed breaks browser JS).

## scripts/scene-height.js

This file adjusts the scene to the appropriate height given the navbars present on the front-end.

## scripts/shortid.js

This is not my code, but a browserified version of the shortid library. This allows me to generate short random IDs for objects on the client-side.

## scripts/toolbar.js

The code herein handles anything to do with the editing experience, particularly the context toolbar, the media modal, and the main toolbar at the bottom of the editing screen.

## scripts/graphics/ceiling.js

In view mode, this script clones the floor tiles to create a ceiling.

## scripts/graphics/globals.js

These are some useful global constants and variables used throughout the code of both editor and viewer.

## scripts/graphics/grid-interactive.js

This is a series of functions associated with making the third-person edit mode function properly on the client-side.

## scripts/graphics/grid.js

This is a script used in the edit mode to generate the grid that is so crucial to the editor's functioning.

## scripts/graphics/navigation.js

This is a series of classes and functions dedicated to making third-person navigation in the scene possible.

## secure/secure.js

Sensitive information, like database authorization, is stored in `secure/secure.js`. This was for security in development; my repository is configured to ignore anything in the `secure` directory. So, the authorization info for my database is not available in a Git repository online.

This abstraction also makes configuration a little easier, since the relevant settings are stored in one separate file. In some sense, `secure.js` is just a standard config file.

## server.js

This file includes functions for server-exclusive functions.

### `errors`

This object has an error code as a key for each human-readable description as a value.

### `handleError`

This function determines how to deal with an error given the error code. If it detects from the request that this was sent as an AJAX form (as I specify in the client-side JS), then it'll just send error code `400` with a description. Otherwise, it'll redirect the user to `/error/[ERROR_CODE]`.]

### `handleSuccess`

Much the same purpose as `handleError`, but with success. If it detects an AJAX form, it'll send code `301` with a redirect URL. Otherwise, it'll redirect directly to `path`, the redirect URL specified on calling the function.

### `getUserExhibits`

This function retrieves every exhibit in the database with `owner_id` matching `session.user.id`.
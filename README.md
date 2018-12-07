# Exhibitor: User Documentation

A web app to aid in the creation of interactive online three-dimensional museum exhibits.

## Browser support

This project uses A-Frame, which uses WebGL. It has been tested and confirmed to work in the latest versions of Firefox, Chrome, and Safari.

## Using the production version online

To avoid the hassle of installation, just visit https://exhibit.josharchibald.com. If you must install it yourself, follow the Installation instructions below.

## Interface

### Registration

On the homepage at https://exhibit.josharchibald.com there is a link to the Registration page on the top right of the navbar. Click that button and register for an account. Passwords must be at least 6 characters long and include an uppercase letter, a lowercase letter, a number, and a symbol.

### Login

If you're not logged in, there's a link to the Login page at the top right of the navbar. Fill out the form to log in using your credentials, if they exist already.

For CS50 testing purposes, you may find it helpful to login to a project with a pre-existing sample exhibit. Use the email `jharvard@josharchibald.com` and password `Crimson1636!` to use a sample exhibit.

### Dashboard

When you first log in, you'll be presented with a list of any exhibits you've already created. Click **View** in one of your exhibits' card to view the project (as with VR controls), or click **Edit** to edit the exhibit in a user-friendly editor.

If you don't have any exhibits, you can create one by clicking the link in the card on your dashboard or by clicking **New Exhibit** in the navbar.

### Viewer

The viewer interface allows you to look at exhibits that have been created. If you're on a laptop or desktop, you can use either WASD or arrow controls for translation, and drag your mouse for rotation.

If you're using a VR headset, see the instructions on the [A-Frame website](https://aframe.io/docs/0.8.0/introduction/vr-headsets-and-webvr-browsers.html) for both headset support and setup. Note that figuring out how VR headsets work was beyond the scope of this project; all testing was done in a regular web browser, so your mileage may vary.

### Editor

#### Metadata

To edit the title and description of the exhibit, use the input boxes in the toolbar at the bottom of the editor page.

#### Navigation

The editor navigation is, necessarily, different than that of the viewer, in that it is third-person instead of first-person.

To translate, use the arrow keys.

To zoom, scroll using your mouse wheel (or your touchpad).

To rotate on the vertical axis, use the `,` and `.` keys.

All of these navigational functions are available in the module on the bottom left of the editor screen.

#### Useful viewing tools

When editing an exhibit, the walls may obstruct your view. Click the button to the left of the `forward` button in the navigation module, and the walls will become shorter.

When left-clicking items within the exhibit, as to delete them, you may find it difficult to select a specific item. To solve this issue, click the button to the right of the `forward` button in the navigation module, and the grid will disappear. This allows you to have more control over your input (sometimes the program will think you're clicking the grid instead of an item, so nothing will happen).

#### Creating rooms

To add walls, click the wall button in the toolbar at the bottom of the editor. Hovering over the grid will show where the wall will go if you click; left-click to add the wall.

To add floors, click the floor button in the toolbar at the bottom of the editor. Hovering over the grid will show where the floor will go if you click; left-click to add the floor.

By default, a ceiling will be added at the top of the wall wherever a floor tile is located.

#### Adding images and videos

To place an image or video (2D media) in your exhibit, click the Media button in the toolbar at the bottom of the editor. Either select 2D media you've already uploaded, or upload new 2D media. Hovering over the walls will show where you are placing the 2D media; by default, this location will snap to the wall nearest to your mouse. Left-click to finalize the 2D media's location. If you wish to change which side of the wall the 2D media will appear on, tap the `\|` key on your keyboard.

#### Deleting anything

When the wall and floor tools are selected, you can right-click any wall or floor to delete it.

To delete anything in the exhibit (including floors and walls), make sure you're not in any other tools (the buttons on the bottom toolbar are toggle buttons, so just click any blue buttons) and then left-click on any item within your exhibit. A menu will appear on the left. Click delete.

To make the menu disappear (in case you accidentally click an object), just left-click anywhere in the grid that isn't covered with a floor.

#### Creating a spawn point

This is very important! To specify users' starting position when they load the exhibit, click the red box (by default, it's at the corner of the grid when you create a new exhibit) and move your mouse. Left-click to place the spawn point. Users will start at that position when they load the exhibit.

#### Saving the exhibit

Your work is automatically saved whenever you make a change.

## Installation (for nerds)

For Exhibitor to work on your server, you will need a MySQL database and a user with full permissions on that database.

1. Open the command-line interface of your computer (or server).
2. Create a directory in which your copy of exhibitor will reside. For example, `mkdir exhibitor`.
3. Change directory to the project directory you just created, as with `cd exhibitor`.
4. Download the project code into this directory.
5. In the project directory, run the command `npm install --production`.
6. Edit the file `secure/secure.js`, editing the object `db_settings` within `module.exports`. Edit the object to include the information required to authenticate into your MySQL database -- `host`, `user`, `password`, and `database` should each have a value.
7. To setup the database, run the command `mysql -u [username] -p [database_name] < setup.sql`, filling in your username and database name and typing your password when prompted. This SQL script will configure the necessary tables.
8. One more dependency: FFmpeg. Installation info is on [their website](https://www.ffmpeg.org/).
9. To run the server, run the command `node app.js`. If all went well, you'll see three lines of feedback:
```
Now listening on port 3000.
Hit CTRL-C to exit server application.
Connected to database.
```

### Examining data

If you want to see the database structure, I recommend [MySQL Workbench](https://www.mysql.com/products/workbench/). Connect to your database with that, if you've set up your own database.

If you want to examine the contents of my own server, log on via SSH using the following credentials:
- Host: `josharchibald.com:7822`
- Username: `cs50`
- Password: `Harvard1636!`

If you want to examine the contents of my database, log on using software like MySQL Workbench and the following credentials:
- Host: `josharchibald.com`
- Username: `cs50`
- Password: `Harvard1636!`
- Database: `exhibitor`

In both cases, the CS50 user has complete viewing privileges.

Alternatively, just go to https://exhibit.josharchibald.com and use the software in its production version online!
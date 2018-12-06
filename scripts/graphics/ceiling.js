(() => {
	// Essentially, cloning the floor and putting it at the top of the walls to create a ceiling
	let clone = document.getElementById("floors").cloneNode(true);
	clone.setAttribute("position", "0 " + WALL_HEIGHT + " 0");
	document.getElementById("building").appendChild(clone);
})();
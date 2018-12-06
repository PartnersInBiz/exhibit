(() => {
	// Dynamically create the scene height
	let scene_height = window.innerHeight;
	for (navbar of document.getElementsByTagName("nav"))
		scene_height -= navbar.offsetHeight;
	document.getElementById("scene").style.height = scene_height + "px";
})();
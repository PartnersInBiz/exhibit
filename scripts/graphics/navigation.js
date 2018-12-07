class MovementDelta {
	// Constants for PI fractions
	constructor() {
		this.RADIANS = {
			_90: Math.PI / 2,
			_180: Math.PI,
			_270: Math.PI * 3 / 2,
			_360: Math.PI * 2
		};
	}

	// How do we move if we want to go left?
	left(rotation, scale = 1) {
		let direction;

		// Math that I won't bother to explain, but it works!
		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: -scale, z: 0};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: 0, z: scale};
		else
			direction = {x: -scale, z: scale};

		// How much we change in either direction
		let delta = {
			x: direction.x * Math.cos(rotation),
			z: direction.z * Math.sin(rotation),
		};

		return delta;
	}

	// How to move right?
	right(rotation, scale = 1) {
		let direction;

		// Math, again!
		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: scale, z: 0};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: 0, z: -scale};
		else
			direction = {x: scale, z: -scale};

		// Final structure
		let delta = {
			x: direction.x * Math.cos(rotation),
			z: direction.z * Math.sin(rotation),
		};

		return delta;
	}

	// Moving forward?
	forward(rotation, scale = 1) {
		let direction;
		
		// Math strikes once more
		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: 0, z: -scale};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: -scale, z: 0};
		else
			direction = {x: -scale, z: -scale};

		// Final structure
		let delta = {
			x: direction.x * Math.sin(rotation),
			z: direction.z * Math.cos(rotation),
		};

		return delta;
	}

	// Moving backward?
	backward(rotation, scale = 1) {
		let direction;

		// Math
		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: 0, z: scale};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: scale, z: 0};
		else
			direction = {x: scale, z: scale};

		// Structure
		let delta = {
			x: direction.x * Math.sin(rotation),
			z: direction.z * Math.cos(rotation),
		};

		return delta;
	}

	// Zooming in? A mix of moving forward and down
	zoomIn(position, rotation, scale = 1) {
		let delta = this.forward(rotation);
		delta.y = -scale;

		return delta;
	}

	// Zooming out? A mix of moving backward and up
	zoomOut(position, rotation, scale = 1) {
		let delta = this.backward(rotation);
		delta.y = scale;

		return delta;
	}
}

// The Navigation class allows us to move using the deltas above
class Navigation {
	constructor() {
		this.deltas = new MovementDelta();
	}

	// We're moving in one direction
	translate(direction, el) {
		// Where we are now
		let currentPos = el.object3D.position;
		let currentRot = el.object3D.rotation;
		let delta;

		// Get the delta depending on direction
		if (direction == "left")
			delta = this.deltas.left(currentRot.y);
		else if (direction == "right")
			delta = this.deltas.right(currentRot.y);
		else if (direction == "forward")
			delta = this.deltas.forward(currentRot.y);
		else
			delta = this.deltas.backward(currentRot.y);

		// Change the object (the camera) to the new positions
		el.object3D.position.set(currentPos.x + delta.x, currentPos.y, currentPos.z + delta.z);
	}

	// Rotating
	rotate(direction, el) {
		let currentRot = el.object3D.rotation;

		// Depending on direction, set the rotation in one direction or the other
		if (direction == "counterclockwise")
			el.object3D.rotation.set(currentRot.x, currentRot.y + Math.PI / 24, currentRot.z);
		else
			el.object3D.rotation.set(currentRot.x, currentRot.y - Math.PI / 24, currentRot.z);
	}

	// Zooming
	zoom(direction, el) {
		// Where we are now
		let currentPos = el.object3D.position;
		let currentRot = el.object3D.rotation;
		let delta;

		// Get delta based on direction
		if (direction == "out")
			delta = this.deltas.zoomOut(currentPos, currentRot.y);
		else
			delta = this.deltas.zoomIn(currentPos, currentRot.y);

		// Use delta
		el.object3D.position.set(currentPos.x + delta.x, currentPos.y + delta.y, currentPos.z + delta.z);
	}
}

// The main code for the page
(() => {
	// A component for third-person navigation through the A-Frame scene
	AFRAME.registerComponent('navigation', {
		init: function() {
			let data = this.data;
			let el = this.el;
			let navigation = new Navigation();
	
			// Keyboard controls
			document.addEventListener("keydown", function(event) {
				if (ENABLE_NAVIGATE)
				{
					// Translation
					if (event.keyCode == 37)
						navigation.translate("left", el);
					else if (event.keyCode == 39)
						navigation.translate("right", el);
					else if (event.keyCode == 38)
						navigation.translate("forward", el);
					else if (event.keyCode == 40)
						navigation.translate("backward", el);
					// Rotation
					else if (event.keyCode == 188)
						navigation.rotate("counterclockwise", el);
					else if (event.keyCode == 190)
						navigation.rotate("clockwise", el);
					// Zoom
					else if (event.keyCode == 173)
						navigation.zoom("out", el);
					else if (event.keyCode == 61)
						navigation.zoom("in", el);
					// For 2D media creation, flipping sides of the wall
					else if (event.keyCode == 220)
						SIDE_MULTIPLIER = -SIDE_MULTIPLIER;
				}
			});

			// Zoom mouse controls
			document.getElementById("scene").addEventListener("wheel", function(event) {
				if (event.deltaY > 0)
					navigation.zoom("out", el);
				else
					navigation.zoom("in", el);
			});

			// All controls - navigation tools in toolbar
			for (control of document.getElementsByClassName("navigation-control"))
			{
				control.addEventListener("mousedown", function(e){
					// Translate
					let direction = this.dataset.action.split("-")[1];
					if (this.dataset.action.indexOf("translate") > -1)
						navigation.translate(direction, el);
					else if (this.dataset.action.indexOf("rotate") > -1)
						navigation.rotate(direction, el);
					else if (this.dataset.action.indexOf("zoom") > -1)
						navigation.zoom(direction, el);
				});
			}

			// For when we right-click, say no to the context menu (within the scene)!
			document.getElementById("scene").addEventListener("contextmenu", e => e.preventDefault());
		}
	});
})();
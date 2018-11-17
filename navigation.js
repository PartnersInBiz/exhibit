class MovementDelta {
	constructor() {
		this.RADIANS = {
			_90: Math.PI / 2,
			_180: Math.PI,
			_270: Math.PI * 3 / 2,
			_360: Math.PI * 2
		};
	}

	left(rotation) {
		let direction;

		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: -1, z: 0};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: 0, z: 1};
		else
			direction = {x: -1, z: 1};

		let delta = {
			x: direction.x * Math.cos(rotation),
			z: direction.z * Math.sin(rotation),
		};

		return delta;
	}

	right(rotation) {
		let direction;

		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: 1, z: 0};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: 0, z: -1};
		else
			direction = {x: 1, z: -1};

		let delta = {
			x: direction.x * Math.cos(rotation),
			z: direction.z * Math.sin(rotation),
		};

		return delta;
	}

	forward(rotation) {
		let direction;
		
		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: 0, z: -1};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: -1, z: 0};
		else
			direction = {x: -1, z: -1};

		let delta = {
			x: direction.x * Math.sin(rotation),
			z: direction.z * Math.cos(rotation),
		};

		return delta;
	}

	backward(rotation) {
		let direction;

		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: 0, z: 1};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: 1, z: 0};
		else
			direction = {x: 1, z: 1};

		let delta = {
			x: direction.x * Math.sin(rotation),
			z: direction.z * Math.cos(rotation),
		};

		return delta;
	}

	zoomIn(position, rotation) {
		let delta = this.forward(rotation);
		delta.y = -1;

		return delta;
	}

	zoomOut(position, rotation) {
		let delta = this.backward(rotation);
		delta.y = 1;

		return delta;
	}
}

(() => {
	AFRAME.registerComponent('navigation', {
		init: function() {
			let data = this.data;
			let el = this.el;
			let deltas = new MovementDelta();
	
			document.addEventListener('keydown', function(event) {
				let currentPos = el.object3D.position;
				let currentRot = el.object3D.rotation;
				if (event.keyCode == 37)
				{
					let delta = deltas.left(currentRot.y);
					el.object3D.position.set(currentPos.x + delta.x, currentPos.y, currentPos.z + delta.z);
				}
				else if (event.keyCode == 39)
				{
					let delta = deltas.right(currentRot.y);
					el.object3D.position.set(currentPos.x + delta.x, currentPos.y, currentPos.z + delta.z);
				}
				else if (event.keyCode == 38)
				{
					let delta = deltas.forward(currentRot.y);
					el.object3D.position.set(currentPos.x + delta.x, currentPos.y, currentPos.z + delta.z);
				}
				else if (event.keyCode == 40)
				{
					let delta = deltas.backward(currentRot.y);
					el.object3D.position.set(currentPos.x + delta.x, currentPos.y, currentPos.z + delta.z);
				}
				else if (event.keyCode == 188)
				{
					el.object3D.rotation.set(currentRot.x, currentRot.y + Math.PI / 24, currentRot.z);
				}
				else if (event.keyCode = 190)
				{
					el.object3D.rotation.set(currentRot.x, currentRot.y - Math.PI / 24, currentRot.z);
				}
			});
			document.addEventListener("wheel", function(event) {
				let currentPos = el.object3D.position;
				let currentRot = el.object3D.rotation;
				if (event.deltaY > 0)
				{
					let delta = deltas.zoomOut(currentPos, currentRot.y);
					el.object3D.position.set(currentPos.x + delta.x, currentPos.y + delta.y, currentPos.z + delta.z);
				}
				else
				{
					let delta = deltas.zoomIn(currentPos, currentRot.y);
					el.object3D.position.set(currentPos.x + delta.x, currentPos.y + delta.y, currentPos.z + delta.z);
				}
			});
		}
	  });
})();
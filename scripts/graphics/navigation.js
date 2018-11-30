class MovementDelta {
	constructor() {
		this.RADIANS = {
			_90: Math.PI / 2,
			_180: Math.PI,
			_270: Math.PI * 3 / 2,
			_360: Math.PI * 2
		};
	}

	left(rotation, scale = 1) {
		let direction;

		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: -scale, z: 0};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: 0, z: scale};
		else
			direction = {x: -scale, z: scale};

		let delta = {
			x: direction.x * Math.cos(rotation),
			z: direction.z * Math.sin(rotation),
		};

		return delta;
	}

	right(rotation, scale = 1) {
		let direction;

		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: scale, z: 0};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: 0, z: -scale};
		else
			direction = {x: scale, z: -scale};

		let delta = {
			x: direction.x * Math.cos(rotation),
			z: direction.z * Math.sin(rotation),
		};

		return delta;
	}

	forward(rotation, scale = 1) {
		let direction;
		
		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: 0, z: -scale};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: -scale, z: 0};
		else
			direction = {x: -scale, z: -scale};

		let delta = {
			x: direction.x * Math.sin(rotation),
			z: direction.z * Math.cos(rotation),
		};

		return delta;
	}

	backward(rotation, scale = 1) {
		let direction;

		if (rotation == 0 || rotation == this.RADIANS._180)
			direction = {x: 0, z: scale};
		else if (rotation == this.RADIANS._90 || rotation == this.RADIANS._270)
			direction = {x: scale, z: 0};
		else
			direction = {x: scale, z: scale};

		let delta = {
			x: direction.x * Math.sin(rotation),
			z: direction.z * Math.cos(rotation),
		};

		return delta;
	}

	zoomIn(position, rotation, scale = 1) {
		let delta = this.forward(rotation);
		delta.y = -scale;

		return delta;
	}

	zoomOut(position, rotation, scale = 1) {
		let delta = this.backward(rotation);
		delta.y = scale;

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
				else if (event.keyCode == 190)
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

			document.addEventListener("mousedown", function(event){
				let currentPos = el.object3D.position;
				let currentRot = el.object3D.rotation;

				// if middle button
				if (event.button == 1)
				{
					let mouseRotation =  function(e){
						let percentageX, percentageY;

						// rotation on Y axis
						if (e.pageX < HALFWIDTH)
							percentageX = Math.round(-100 * (HALFWIDTH - e.pageX) / HALFWIDTH) / 100;
						else
							percentageX = Math.round(100 * (e.pageX - HALFWIDTH) / HALFWIDTH) / 100;

						// *****
						// rotation on X/Z axes -- MATH PROBLEM
						if (e.pageY < HALFHEIGHT)
							percentageY = Math.round(-100 * (HALFHEIGHT - e.pageY) / HALFHEIGHT) / 100;
						else
							percentageY = Math.round(-100 * (HALFHEIGHT - e.pageY) / HALFHEIGHT) / 100;

						let delta;
						if (percentageX < 0)
							el.object3D.rotation.set(currentRot.x, currentRot.y - Math.PI / 24, currentRot.z);
						else
							el.object3D.rotation.set(currentRot.x, currentRot.y + Math.PI / 24, currentRot.z);

						// *****

						document.getElementById("scene").style.cursor = 'all-scroll';
					};
					document.addEventListener("mousemove", mouseRotation);
					document.addEventListener("mouseup", function(e){
						e.preventDefault();
						document.removeEventListener("mousemove", mouseRotation);
						document.getElementById("scene").style.cursor = 'default';
					}, true);
				}
				// if a right-click/drag
				else if (event.button == 2)
				{
					let rightDragMovement =  function(e){
						let percentageX, percentageY;

						// determine if cursor moving left else right
						if (e.pageX < HALFWIDTH)
							percentageX = Math.round(-100 * (HALFWIDTH - e.pageX) / HALFWIDTH) / 100;
						else
							percentageX = Math.round(100 * (e.pageX - HALFWIDTH) / HALFWIDTH) / 100;

						// determine if cursor moving up else down
//						if (e.pageY < HALFHEIGHT)
							percentageY = Math.round(-100 * (HALFHEIGHT - e.pageY) / HALFHEIGHT) / 100;
//						else
//							percentageY = Math.round(-100 * (HALFHEIGHT - e.pageY) / HALFHEIGHT) / 100;
						
						//console.log(percentageX, " ", percentageY)

						let delta;

						// determine delta left/right
						if (Math.abs(percentageX) > Math.abs(percentageY))
						{
							if (percentageX < 0)
								delta = deltas.left(currentRot.y, Math.abs(percentageX), DRAGSCALE);
							else
								delta = deltas.right(currentRot.y, Math.abs(percentageX), DRAGSCALE);
						}
						// determine delta forward/backward
						else
						{
							if (percentageY < 0)
								delta = deltas.forward(currentRot.y, Math.abs(percentageY), DRAGSCALE)
							else
								delta = deltas.backward(currentRot.y, Math.abs(percentageY), DRAGSCALE)
						}
						
						el.object3D.position.set(currentPos.x + delta.x, currentPos.y, currentPos.z + delta.z);
						document.getElementById("scene").style.cursor = 'all-scroll';
					};
					document.addEventListener("mousemove", rightDragMovement);
					document.addEventListener("mouseup", function(e){
						e.preventDefault();
						document.removeEventListener("mousemove", rightDragMovement);
						document.getElementById("scene").style.cursor = 'default';
					}, true);
				}
			});

			/*document.addEventListener("mousemove", function(e){
				let currentPos = el.object3D.position;
				let currentRot = el.object3D.rotation;

				if (e.pageY < PAN_SENSITIVITY)
				{
					let delta = deltas.forward(currentRot.y, DRAGSCALE);
					el.object3D.position.set(currentPos.x + delta.x, currentPos.y, currentPos.z + delta.z);
				}
				else if (e.pageY > window.innerHeight - PAN_SENSITIVITY)
				{
					let delta = deltas.backward(currentRot.y, DRAGSCALE);
					el.object3D.position.set(currentPos.x + delta.x, currentPos.y, currentPos.z + delta.z);
				}
				else if (e.pageX < PAN_SENSITIVITY)
				{
					let delta = deltas.left(currentRot.y, DRAGSCALE);
					el.object3D.position.set(currentPos.x + delta.x, currentPos.y, currentPos.z + delta.z);
				}
				else if (e.pageX > screen.width - PAN_SENSITIVITY)
				{
					let delta = deltas.right(currentRot.y, DRAGSCALE);
					el.object3D.position.set(currentPos.x + delta.x, currentPos.y, currentPos.z + delta.z);
				}
			});*/

			document.addEventListener("contextmenu", e => e.preventDefault());
		}
	  });
})();
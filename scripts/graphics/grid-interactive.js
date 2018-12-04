class GridSnap {
	wall(intersection, height=WALL_HEIGHT, media=false) {
		let x = intersection.point.x;
		let z = intersection.point.z;

		// Determine which side x and z are each closer to
		let xFloor = (x >= 0) ? Math.floor(x) : Math.ceil(x);
		let zFloor = (z >= 0) ? Math.floor(z) : Math.ceil(z);

		let xRound, zRound;
		if (xFloor != 0)
			xRound = Math.abs((Math.round(x)) % xFloor);
		else
			xRound = 0;

		if (zFloor != 0)
			zRound = Math.abs((Math.round(z)) % zFloor);
		else
			zRound = 0;

		// compare thing
		let differenceX = Math.abs(x - xFloor - xRound);
		let differenceZ = Math.abs(z - zFloor - zRound);

		let add = 0;
		if (media)
			add = SIDE_MULTIPLIER * (WALL_WIDTH / 2 + .01);

		if (differenceX < differenceZ)
		{
			// Make life easier
			let rot = {
				x: (media) ? 0 : 90,
				y: (SIDE_MULTIPLIER == 1) ? 90 : 270,
				z: 0
			};

			// Align to X axis
			let meta = {
				position: {
					x: xFloor + add,
					y: height / 2,
					z: zFloor - .5,
					string: (xFloor + add) + " " + (height / 2) + " "  + (zFloor - .5)
				},
				rotation: {
					x: rot.x,
					y: rot.y,
					z: rot.z,
					string: rot.x + " " + rot.y + " " + rot.z
				}
			}
			return meta;
		}
		else if (differenceX > differenceZ)
		{
			// Use these multiple times
			let rot = {
				x: (media) ? 0 : 90,
				y: (SIDE_MULTIPLIER == 1) ? 0 : 180,
				z: 0
			};
			
			// Align to Z axis
			let meta = {
				position: {
					x: xFloor + .5,
					y: height / 2,
					z: zFloor + add,
					string: (xFloor + .5) + " " + (height / 2) + " " + (zFloor + add)
				},
				rotation: {
					x: rot.x,
					y: rot.y,
					z: rot.z,
					string: rot.x + " " + rot.y + " " + rot.z
				}
			}
			return meta;
		}
	}

	space(intersection, height=1) {
		let stringForm = intersection.object.el.attributes.position.value;
		let parts = stringForm.split(" ");
		let meta = {
			position: {
				x: parseInt(parts[0]),
				y: parseInt(parts[1]) + (height / 2),
				z: parseInt(parts[2]) - .5,
				string: parts[0] + " " + (parseInt(parts[2]) + height / 2) + " " + (-parseInt(parts[1]) - .5)
			},
			ceiling: {
				x: parseInt(parts[0]),
				y: parseInt(parts[1]) + (height / 2) + WALL.tall,
				z: parseInt(parts[2]) - .5,
				string: parts[0] + " " + (parseInt(parts[2]) + height / 2 + WALL.tall) + " " + (-parseInt(parts[1]) - .5)
			}
		}
		return meta;
	}
}

(() => {
	AFRAME.registerComponent('grid-interactive', {
		schema: {
			color: {default: '#00FF08'}
		},
	
		init: function() {
			let data = this.data;
			let el = this.el;
			let defaultColor = el.getAttribute('material').color;
			const SNAP = new GridSnap();
			let unique_id;
			let object_placement = {type: '', media_id: '', width: -1, height: -1};

			el.addEventListener('mouseenter', function() {
				// Grid hover color
				if (el.classList.contains("floor"))
					el.setAttribute("src", "#floor-space-green");
				else
					el.setAttribute('src', "#grid-space-green");
			});
	
			el.addEventListener('mouseleave', function (e) {
				el.setAttribute('color', defaultColor);

				if (el.classList.contains("floor"))
					el.setAttribute("src", "#floor-space");
				else
					el.setAttribute("src", "#grid-space");

				$(".temp").remove();
			});

			let addWall = function(event){
				if (typeof event.button != "undefined")
				{
					if (event.button == 0)
					{
						if (document.getElementById(unique_id) != null)
							document.getElementById(unique_id).classList.remove("temp");
					}
					document.removeEventListener("mousedown", addWall);
				}
			};

			let wallSnap = function(e){
				// Grid wall snap
				let placement = SNAP.wall(e.detail.intersection);
				if (!$(".temp[position='" + placement.position.string + "'").length)
				{
					unique_id = "wall_" + generate_shortid();
					
					$("#building").append('<a-box color="#d8d8d8" position="' + placement.position.string + '" scale="1.1 .1 ' + WALL_HEIGHT + '" rotation="' + placement.rotation.string + '" class="temp wall" id="' + unique_id + '"></a-box>');
					
					// When user clicks, we finalize the wall segment by removing the temp class
					document.addEventListener("mousedown", addWall);
				}
			};

			// Remove wall function
			let removeWall = function(event){
				// If this event has the button identification information
				if (typeof event.button != "undefined")
				{
					// If the button is a right click
					if (event.button == 2)
					{
						// Get the element, remove from DOM if it's still there (mousedown often calls multiple times, so only want to do it once)
						let item = document.getElementById(unique_id);
						if (item != null && unique_id.indexOf("wall_") > -1)
							item.parentNode.removeChild(item);
					}
				}
				// If no button identification info, then it's an A-Frame event and has the relevant element -- we need that
				else
				{
					// If the ID is indeed present, we store it in the unique_id variable for use in the previous condition later
					if (typeof event.srcElement.id != "undefined")
					{
						if (event.srcElement.id.indexOf("wall_") > -1)
							unique_id = event.srcElement.id;
					}
				}
			};

			document.addEventListener("wall_tool_on", function(){
				$("#wall-toggle").data("toggle", "on").removeClass("btn-secondary").addClass("btn-info");

				el.addEventListener("mouseenter", wallSnap);
				document.addEventListener("mousedown", removeWall);
				document.dispatchEvent(EVENTS.floor_tool_off);
			});
			document.addEventListener("wall_tool_off", function(){
				$("#wall-toggle").data("toggle", "off").removeClass("btn-info").addClass("btn-secondary");

				el.removeEventListener("mouseenter", wallSnap);
				document.removeEventListener("mousedown", removeWall);
			});

			// Finalize adding floor
			let addFloor = function(event){
				if (typeof event.button != "undefined")
				{
					if (event.button == 0)
					{
						// need something separate for ceiling finalization
						if (document.getElementById(unique_id) != null)
							document.getElementById(unique_id).classList.remove("temp");
					}
					document.removeEventListener("mousedown", addFloor);
				}
			};

			// Remove floor function
			let removeFloor = function(event){
				// If this event has the button identification information
				if (typeof event.button != "undefined")
				{
					// If the button is a right click
					if (event.button == 2)
					{
						// Get the element, remove from DOM if it's still there (mousedown often calls multiple times, so only want to do it once)
						let item = document.getElementById(unique_id);
						if (item != null)
							item.parentNode.removeChild(item);
					}
				}
				// If no button identification info, then it's an A-Frame event and has the relevant element -- we need that
				else
				{
					// If the ID is indeed present, we store it in the unique_id variable for use in the previous condition later
					if (typeof event.srcElement.id != "undefined")
					{
						if (event.srcElement.id.indexOf("floor_") > -1)
							unique_id = event.srcElement.id;
					}
				}
			};

			// Grid space floor snap
			let floorSnap = function(e){
				let placement = SNAP.space(e.detail.intersection, FLOOR_HEIGHT);
				if (!$(".temp[position='" + placement.position.string + "'").length)
				{
					unique_id = "floor_" + generate_shortid();
					
					$("#building").append('<a-box src="#floor-space" position="' + placement.position.string + '" scale="1 ' + FLOOR_HEIGHT + ' 1" rotation="0 0 0" class="temp floor" id="' + unique_id + '" grid-interactive></a-box>');
					
					// When user clicks, we finalize the floor segment by removing the temp class
					document.addEventListener("mousedown", addFloor);
				}
			};

			document.addEventListener("floor_tool_on", function(){
				$("#floor-toggle").data("toggle", "on").removeClass("btn-secondary").addClass("btn-info");

				el.addEventListener("mouseenter", floorSnap);
				document.addEventListener("mousedown", removeFloor);
				document.dispatchEvent(EVENTS.wall_tool_off);
			});
			document.addEventListener("floor_tool_off", function(){
				$("#floor-toggle").data("toggle", "off").removeClass("btn-info").addClass("btn-secondary");

				el.removeEventListener("mouseenter", floorSnap);
				document.removeEventListener("mousedown", removeFloor);
			});

			/* Here we handle 2D object placement */
			// Finalize object location
			let add2D = function(event){
				if (typeof event.button != "undefined")
				{
					if (event.button == 0)
					{
						if (document.getElementById(unique_id) != null)
							document.getElementById(unique_id).classList.remove("temp");
					}
					document.removeEventListener("mousedown", add2D);
					document.dispatchEvent(EVENTS._2d_tool_off);
				}
			};

			let snap2D = function(e){
				// Grid wall snap
				let placement = SNAP.wall(e.detail.intersection, WALL_HEIGHT, true);

				if (!$(".temp[position='" + placement.position.string + "'").length)
				{
					unique_id = "object_" + generate_shortid();

					if (object_placement.type.indexOf("video") > -1)
					{
						$("#objects").append('<a-video position="' + placement.position.string + '" width="' + object_placement.width + '" height="' + object_placement.height + '" rotation="' + placement.rotation.string + '" id="' + unique_id + '" src="#' + object_placement.media_id + '" class="temp"></a-video>');
					}
					else if (object_placement.type.indexOf("image") > -1)
					{
						$("#objects").append('<a-image position="' + placement.position.string + '" width="' + object_placement.width + '" height="' + object_placement.height + '" rotation="' + placement.rotation.string + '" id="' + unique_id + '" src="#' + object_placement.media_id + '" class="temp"></a-image>');
					}
					
					// When user clicks, we finalize the wall segment by removing the temp class
					document.addEventListener("mousedown", add2D);
				}
			};

			// Remove wall function
			let remove2D = function(event){
				// If this event has the button identification information
				if (typeof event.button != "undefined")
				{
					// If the button is a right click
					if (event.button == 2)
					{
						// Get the element, remove from DOM if it's still there (mousedown often calls multiple times, so only want to do it once)
						let item = document.getElementById(unique_id);
						if (item != null && unique_id.indexOf("media") > -1)
							item.parentNode.removeChild(item);
					}
				}
				// If no button identification info, then it's an A-Frame event and has the relevant element -- we need that
				else
				{
					// If the ID is indeed present, we store it in the unique_id variable for use in the previous condition later
					if (typeof event.srcElement.id != "undefined")
					{
						if (event.srcElement.id.indexOf("media_") > -1)
							unique_id = event.srcElement.id;
					}
				}
			};

			document.addEventListener("2d_tool_on", function(evt){
				$("#media-toggle").data("toggle", "on").removeClass("btn-secondary").addClass("btn-info");

				object_placement.type = evt.detail.type;
				object_placement.media_id = evt.detail.media_id;
				object_placement.width = $("#plane_width").val();
				object_placement.height = $("#plane_height").val();

				el.addEventListener("mouseenter", snap2D);
				document.addEventListener("mousedown", remove2D);

				document.dispatchEvent(EVENTS.wall_tool_off);
				document.dispatchEvent(EVENTS.floor_tool_off);
			});
			document.addEventListener("2d_tool_off", function(){
				$("#media-toggle").data("toggle", "off").removeClass("btn-info").addClass("btn-secondary");

				el.removeEventListener("mouseenter", snap2D);
				document.removeEventListener("mousedown", remove2D);
			});
		}
	});
})();
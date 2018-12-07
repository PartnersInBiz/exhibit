// This class allows grip snapping to happen!
class GridSnap {
	// For wall snapping
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

		// Comparison
		let differenceX = Math.abs(x - xFloor - xRound);
		let differenceZ = Math.abs(z - zFloor - zRound);

		let add = 0;

		// We add a little if it's media so it doesn't go right in the middle of a wall
		if (media)
			add = SIDE_MULTIPLIER * (WALL_WIDTH / 2 + .01);

		// Align to X axis
		if (differenceX < differenceZ)
		{
			// Make life easier for generating meta
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
		// Align to Z axis
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

	// Grid-space snapping
	space(intersection, height=1) {
		// Get the intersection point
		let stringForm = intersection.object.el.attributes.position.value;
		let parts = stringForm.split(" ");

		// Figure out where we're going to put the object based on that
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

// The main code
(() => {
	// Initialize SNAP, we use it a lot
	const SNAP = new GridSnap();
	let unique_id;

	// The grid-interactive component makes the grid, interactive. Mind-blowing.
	AFRAME.registerComponent('grid-interactive', {
		schema: {
			color: {default: '#00FF08'}
		},
	
		init: function() {
			// Some variables
			let data = this.data;
			let el = this.el;
			let defaultColor = el.getAttribute("material").color;
			let object_placement = {type: '', media_id: '', width: -1, height: -1};

			// Grid hover texture
			el.addEventListener('mouseenter', function() {
				if (el.classList.contains("floor"))
					el.setAttribute("src", "#floor-space-green");
				else
					el.setAttribute('src', "#grid-space-green");
			});
	
			// When we leave the grid space, no more hover texture :(
			el.addEventListener('mouseleave', function (e) {
				if (typeof el.getAttribute("data-selected") == "undefined")
					el.setAttribute('color', defaultColor);

				if (el.classList.contains("floor"))
					el.setAttribute("src", "#floor-space");
				else
					el.setAttribute("src", "#grid-space");

				// ALSO, IMPORTANT, we remove all temporary elements, as the previews for when we're placing new walls
				$(".temp").remove();
			});

			/* Here we handle 2D media placement */
			// Finalize object location
			let add2D = function(event){
				if (typeof event.button != "undefined")
				{
					// Left click
					if (event.button == 0)
					{
						if (document.getElementById(unique_id) != null)
						{
							// Permanent, no longer .temp
							document.getElementById(unique_id).classList.remove("temp");
							document.getElementById(unique_id).setAttribute("click-menu", "");

							// We sound the alarm to save
							document.dispatchEvent(EVENTS.exhibit_updated);
						}
					}

					// Cleanup
					document.removeEventListener("mousedown", add2D);
					document.dispatchEvent(EVENTS._2d_tool_off);
				}
			};

			// Grid wall snap for 2D media
			let snap2D = function(e){
				// Get the suggested location
				let placement = SNAP.wall(e.detail.intersection, WALL.tall, true);

				// If the temp isn't already there, add it
				if (!$(".temp[position='" + placement.position.string + "'").length)
				{
					unique_id = "object_" + generate_shortid();

					if (object_placement.type.indexOf("video") > -1)
					{
						$("#2d_media").append('<a-video position="' + placement.position.string + '" width="' + object_placement.width + '" height="' + object_placement.height + '" rotation="' + placement.rotation.string + '" id="' + unique_id + '" src="#' + object_placement.media_id + '" class="temp"></a-video>');
					}
					else if (object_placement.type.indexOf("image") > -1)
					{
						$("#2d_media").append('<a-image position="' + placement.position.string + '" width="' + object_placement.width + '" height="' + object_placement.height + '" rotation="' + placement.rotation.string + '" id="' + unique_id + '" src="#' + object_placement.media_id + '" class="temp"></a-image>');
					}
					
					// We sound the alarm to save
					document.dispatchEvent(EVENTS.exhibit_updated);

					// When user clicks, we finalize the wall segment by removing the temp class
					document.addEventListener("mousedown", add2D);
				}
			};

			// We first learn that we're place 2D media in the scene
			document.addEventListener("2d_tool_on", function(evt){
				$("#media-toggle").data("toggle", "on").removeClass("btn-secondary").addClass("btn-info");

				// Figure out stuff about the object
				object_placement.type = evt.detail.type;
				object_placement.media_id = evt.detail.media_id;
				object_placement.width = $("#plane_width").val();
				object_placement.height = $("#plane_height").val();

				// Grid snap
				el.addEventListener("mouseenter", snap2D);

				// Turn off the other stuff so it doesn't get confusing
				document.dispatchEvent(EVENTS.wall_tool_off);
				document.dispatchEvent(EVENTS.floor_tool_off);
			});

			// We're done with the 2D media, so we cleanup
			document.addEventListener("2d_tool_off", function(){
				$("#media-toggle").data("toggle", "off").removeClass("btn-info").addClass("btn-secondary");
				el.removeEventListener("mouseenter", snap2D);
			});
		}
	});

	// For deletion and minor edits
	AFRAME.registerComponent("click-menu", {
		init: function() {
			let el = this.el;
			let defaultColor = el.getAttribute("material").color;
			let defaultSource = el.getAttribute("src");

			// A function to set the selected object back in its natural state once user clicks elsewhere
			let clear_selection = function(e){
				if (el.tagName == "A-IMAGE" || el.tagName == "A-VIDEO")
					el.setAttribute("src", defaultSource);

				el.setAttribute("color", defaultColor);
				el.removeAttribute("data-original_color");

				if (e.detail != "stay_open")
					document.getElementById("item_tools").classList.add("invisible");
				document.removeEventListener("item_click", clear_selection);
			};

			// Highlight the selected item
			el.addEventListener("mousedown", function(e){
				// We can indeed add the context toolbar; we're not adding a wall or something
				if (CONTEXT_ENABLED)
				{
					// Not a grid space, so we can highlight it
					if (!el.classList.contains("grid-space") && el.tagName != "A-SKY")
					{
						// Change color and store original
						el.setAttribute("color", "#A10000");
						el.setAttribute("data-original_color", defaultColor);

						// Show the toolkit!
						let tools = document.getElementById("item_tools")
						tools.classList.remove("invisible");
						tools.setAttribute("data-item_id", el.id)
						
						document.dispatchEvent(EVENTS.item_click_stay);
					}
					else
						document.dispatchEvent(EVENTS.item_click);
					document.addEventListener("item_click", clear_selection);
				}
			});
		}
	});

	// For moving the spawn point, primarily
	AFRAME.registerComponent("spawn-point", {
		init: function() {
			let el = this.el;

			// Finalize spawn placement
			let addSpawn = function(e){
				if (typeof e.button != "undefined")
				{
					// Left click
					if (e.button == 0)
					{
						if (document.getElementById("spawn_point") != null)
						{
							document.getElementById("spawn_point").classList.remove("temp");
							document.getElementById("spawn_point").setAttribute("spawn-point", "");

							// Cancel the mouseover event
							document.getElementById("grid").removeEventListener("mouseenter", spawnSnap);
							document.getElementById("floors").removeEventListener("mouseenter", spawnSnap);

							CONTEXT_ENABLED = true;

							// We sound the alarm to save
							document.dispatchEvent(EVENTS.exhibit_updated);
						}
					}
					document.removeEventListener("mousedown", addSpawn);
				}
			};

			// Grid space snap
			let spawnSnap = function(e){
				CONTEXT_ENABLED = false;
				let placement = SNAP.space(e.detail.intersection, HUMAN_HEIGHT * 2);

				// If on a floor, need to correct for a bug that would place spawn point below the floor
				if (e.detail.intersection.object.el.id.indexOf("floor_") > -1)
				{
					position = [placement.position.x + .5, HUMAN_HEIGHT, placement.position.z];
					placement.position.string = position.join(" ");
				}
				
				// Don't create duplicates!
				if (!$(".temp[position='" + placement.position.string + "'").length)
				{
					$("#spawn").append('<a-box position="' + placement.position.string + '" scale=".3 .3 .3" color="#8A2000" id="spawn_point" class="temp" spawn-point></a-box>');
						
					// When user clicks, we finalize the floor segment by removing the temp class
					document.addEventListener("mousedown", addSpawn);
				}
			};

			// Select this item and allow movement
			el.addEventListener("mousedown", function(){
				document.getElementById("spawn").removeChild(document.getElementById("spawn_point"));
				document.getElementById("grid").addEventListener("mouseenter", spawnSnap);
				document.getElementById("floors").addEventListener("mouseenter", spawnSnap);
			});
		}
	});

	/* The following functions, while initially included in the grid-interactive component,
	   are now included separately because having 500+ event listeners was,
	   unsurprisingly, quite inefficient. */

	// Finalizes wall within the grid
	let addWall = function(event){
		if (typeof event.button != "undefined")
		{
			// Left click
			if (event.button == 0)
			{
				if (document.getElementById(unique_id) != null)
				{
					document.getElementById(unique_id).classList.remove("temp");
					document.getElementById(unique_id).setAttribute("click-menu", "");

					// We sound the alarm to save
					document.dispatchEvent(EVENTS.exhibit_updated);
				}
			}
			document.removeEventListener("mousedown", addWall);
		}
	};

	// Snaps walls to grid when adding
	let wallSnap = function(e){
		// Get suggested location
		let placement = SNAP.wall(e.detail.intersection);

		// No duplicates!
		if (!$(".temp[position='" + placement.position.string + "'").length)
		{
			unique_id = "wall_" + generate_shortid();
			
			$("#walls").append('<a-box color="#d8d8d8" position="' + placement.position.string + '" scale="1.1 .1 ' + WALL_HEIGHT + '" rotation="' + placement.rotation.string + '" class="temp wall" id="' + unique_id + '"></a-box>');
			
			// When user clicks, we finalize the wall segment by removing the temp class
			document.addEventListener("mousedown", addWall);
			CONTEXT_ENABLED = false;
		}
	};

	// Remove wall, as by a right-click
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
				{
					item.parentNode.removeChild(item);
					
					// We sound the alarm to save
					document.dispatchEvent(EVENTS.exhibit_updated);
				}
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

	// When the wall tool is turned on
	document.addEventListener("wall_tool_on", function(){
		$("#wall-toggle").data("toggle", "on").removeClass("btn-secondary").addClass("btn-info");

		// This is the source of the freeze - 572 different event listeners are being added
		document.getElementById("grid").addEventListener("mouseenter", wallSnap);
		document.getElementById("floors").addEventListener("mouseenter", wallSnap);
		document.addEventListener("mousedown", removeWall);
		document.dispatchEvent(EVENTS.floor_tool_off);

		// Disable toolbar context menus when clicking on objects
		CONTEXT_ENABLED = false;
	});

	// When the wall tool is turned off, we clean up
	document.addEventListener("wall_tool_off", function(){
		$("#wall-toggle").data("toggle", "off").removeClass("btn-info").addClass("btn-secondary");

		document.getElementById("grid").removeEventListener("mouseenter", wallSnap);
		document.getElementById("floors").removeEventListener("mouseenter", wallSnap);
		document.removeEventListener("mousedown", removeWall);

		CONTEXT_ENABLED = true;
	});

	// Finalize adding floor
	let addFloor = function(event){
		if (typeof event.button != "undefined")
		{
			// Left click
			if (event.button == 0)
			{
				if (document.getElementById(unique_id) != null)
				{
					document.getElementById(unique_id).classList.remove("temp");
					document.getElementById(unique_id).setAttribute("click-menu", "");

					// We sound the alarm to save
					document.dispatchEvent(EVENTS.exhibit_updated);
				}
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
				{
					item.parentNode.removeChild(item);
					
					// We sound the alarm to save
					document.dispatchEvent(EVENTS.exhibit_updated);
				}
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
		// Get suggested position
		let placement = SNAP.space(e.detail.intersection, FLOOR_HEIGHT);

		// No duplicates!
		if (!$(".temp[position='" + placement.position.string + "'").length)
		{
			unique_id = "floor_" + generate_shortid();
			
			$("#floors").append('<a-box src="#floor-space" position="' + placement.position.string + '" scale="1 ' + FLOOR_HEIGHT + ' 1" rotation="0 0 0" class="temp floor" id="' + unique_id + '" grid-interactive></a-box>');
			
			// When user clicks, we finalize the floor segment by removing the temp class
			document.addEventListener("mousedown", addFloor);
		}
	};

	// When the floor tool is turned on
	document.addEventListener("floor_tool_on", function(){
		$("#floor-toggle").data("toggle", "on").removeClass("btn-secondary").addClass("btn-info");

		document.getElementById("grid").addEventListener("mouseenter", floorSnap);
		document.addEventListener("mousedown", removeFloor);
		document.dispatchEvent(EVENTS.wall_tool_off);

		// Disable toolbar context menus when clicking on objects
		CONTEXT_ENABLED = false;
	});
	
	// When the floor tool is turned off, we clean up
	document.addEventListener("floor_tool_off", function(){
		$("#floor-toggle").data("toggle", "off").removeClass("btn-info").addClass("btn-secondary");

		document.getElementById("grid").removeEventListener("mouseenter", floorSnap);
		document.removeEventListener("mousedown", removeFloor);

		CONTEXT_ENABLED = true;
	});
})();
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
	const SNAP = new GridSnap();
	let unique_id;

	AFRAME.registerComponent('grid-interactive', {
		schema: {
			color: {default: '#00FF08'}
		},
	
		init: function() {
			let data = this.data;
			let el = this.el;
			let defaultColor = el.getAttribute("material").color;
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

			
			

			

			/* Here we handle 2D object placement */
			// Finalize object location
			let add2D = function(event){
				if (typeof event.button != "undefined")
				{
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

			document.addEventListener("2d_tool_on", function(evt){
				$("#media-toggle").data("toggle", "on").removeClass("btn-secondary").addClass("btn-info");

				object_placement.type = evt.detail.type;
				object_placement.media_id = evt.detail.media_id;
				object_placement.width = $("#plane_width").val();
				object_placement.height = $("#plane_height").val();

				el.addEventListener("mouseenter", snap2D);

				document.dispatchEvent(EVENTS.wall_tool_off);
				document.dispatchEvent(EVENTS.floor_tool_off);
			});
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

				if (e.detail != "stay_open")
					document.getElementById("item_tools").classList.add("invisible")
				document.removeEventListener("item_click", clear_selection);
			};

			// Highlight the selected item
			el.addEventListener("mousedown", function(e){
				if (CONTEXT_ENABLED)
				{
					if (el.tagName == "A-IMAGE" || el.tagName == "A-VIDEO")
					{
						el.setAttribute("src", "#floor-space");
						$("._2d_only").show();
						document.getElementById("_2d_wall_height_input").value = el.object3D.position.y;
					}
					else
					{
						$("._2d_only").hide();
					}
					el.setAttribute("color", "#D4F4FF");

					if (!el.classList.contains("grid-space"))
					{
						let tools = document.getElementById("item_tools")
						tools.classList.remove("invisible");
						tools.setAttribute("data-item-id", el.id)
						
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
			let defaultColor = el.getAttribute("material").color;

			// Finalize spawn placement
			let addSpawn = function(e){
				if (typeof e.button != "undefined")
				{
					if (e.button == 0)
					{
						if (document.getElementById("spawn_point") != null)
						{
							document.getElementById("spawn_point").classList.remove("temp");
							document.getElementById("spawn_point").setAttribute("spawn-point", "");

							// Cancel the mouseover event
							document.getElementById("grid").removeEventListener("mouseenter", spawnSnap);

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

				let placement = SNAP.space(e.detail.intersection, HUMAN_HEIGHT);
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
			});
		}
	});


	/* The following functions, while initially included in the component,
	   are now included separately because having 500+ event listeners was,
	   unsurprisingly, quite inefficient. */

	// Finalizes wall within the grid
	let addWall = function(event){
		if (typeof event.button != "undefined")
		{
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
		let placement = SNAP.wall(e.detail.intersection);
		if (!$(".temp[position='" + placement.position.string + "'").length)
		{
			unique_id = "wall_" + generate_shortid();
			
			$("#walls").append('<a-box color="#d8d8d8" position="' + placement.position.string + '" scale="1.1 .1 ' + WALL_HEIGHT + '" rotation="' + placement.rotation.string + '" class="temp wall" id="' + unique_id + '"></a-box>');
			
			// When user clicks, we finalize the wall segment by removing the temp class
			document.addEventListener("mousedown", addWall);
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
		document.addEventListener("mousedown", removeWall);
		document.dispatchEvent(EVENTS.floor_tool_off);

		// Disable toolbar context menus when clicking on objects
		CONTEXT_ENABLED = false;
	});

	// When the wall tool is turned off
	document.addEventListener("wall_tool_off", function(){
		$("#wall-toggle").data("toggle", "off").removeClass("btn-info").addClass("btn-secondary");

		document.getElementById("grid").removeEventListener("mouseenter", wallSnap);
		document.removeEventListener("mousedown", removeWall);

		CONTEXT_ENABLED = true;
	});


	// Finalize adding floor
	let addFloor = function(event){
		if (typeof event.button != "undefined")
		{
			if (event.button == 0)
			{
				// need something separate for ceiling finalization
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
		let placement = SNAP.space(e.detail.intersection, FLOOR_HEIGHT);
		if (!$(".temp[position='" + placement.position.string + "'").length)
		{
			unique_id = "floor_" + generate_shortid();
			
			$("#floors").append('<a-box src="#floor-space" position="' + placement.position.string + '" scale="1 ' + FLOOR_HEIGHT + ' 1" rotation="0 0 0" class="temp floor" id="' + unique_id + '" grid-interactive></a-box>');
			
			// When user clicks, we finalize the floor segment by removing the temp class
			document.addEventListener("mousedown", addFloor);
		}
	};

	document.addEventListener("floor_tool_on", function(){
		$("#floor-toggle").data("toggle", "on").removeClass("btn-secondary").addClass("btn-info");

		document.getElementById("grid").addEventListener("mouseenter", floorSnap);
		document.addEventListener("mousedown", removeFloor);
		document.dispatchEvent(EVENTS.wall_tool_off);

		// Disable toolbar context menus when clicking on objects
		CONTEXT_ENABLED = false;
	});
	document.addEventListener("floor_tool_off", function(){
		$("#floor-toggle").data("toggle", "off").removeClass("btn-info").addClass("btn-secondary");

		document.getElementById("grid").removeEventListener("mouseenter", floorSnap);
		document.removeEventListener("mousedown", removeFloor);

		CONTEXT_ENABLED = true;
	});
})();
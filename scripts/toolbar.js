(() => {
	$("#wall-toggle").click(function(){
		if ($(this).data("toggle") == "off")
			document.dispatchEvent(EVENTS.wall_tool_on);
		else
			document.dispatchEvent(EVENTS.wall_tool_off);
	});

	$("#floor-toggle").click(function(){
		if ($(this).data("toggle") == "off")
			document.dispatchEvent(EVENTS.floor_tool_on);
		else
			document.dispatchEvent(EVENTS.floor_tool_off);
	});

	$("#short-walls-toggle").click(function(){
		if ($(this).data("toggle") == "off")
		{
			$(this).data("toggle", "on").children(":first").removeClass("fas").addClass("far");
			for (segment of document.getElementsByClassName("wall"))
			{
				let currentPos = segment.object3D.position;
				let currentScale = segment.object3D.scale;

				segment.object3D.position.set(currentPos.x, WALL.short / 2, currentPos.z);
				segment.object3D.scale.set(currentScale.x, currentScale.y, WALL.short);
			}
			WALL_HEIGHT = WALL.short;
		}
		else
		{
			$(this).data("toggle", "off").children(":first").removeClass("far").addClass("fas");
			for (segment of document.getElementsByClassName("wall"))
			{
				let currentPos = segment.object3D.position;
				let currentScale = segment.object3D.scale;

				segment.object3D.position.set(currentPos.x, WALL.tall / 2, currentPos.z);
				segment.object3D.scale.set(currentScale.x, currentScale.y, WALL.tall);
			}
			WALL_HEIGHT = WALL.tall;
		}
	});

	$("#grid-toggle").click(function(){
		if ($(this).data("toggle") == "off")
		{
			$(this).data("toggle", "on").children(":first").removeClass("far").addClass("fas");
			document.getElementById("grid").object3D.position.set(0, 0, 0);
		}
		else
		{
			$(this).data("toggle", "off").children(":first").removeClass("fas").addClass("far");
			document.getElementById("grid").object3D.position.set(10000, 0, 0);
		}
	});

	let media_modal = new Vue({
		el: '#media-modal',
		delimiters: ["<%", "%>"],
		data: {
			media: [],
			show: [],
			pages: 0,
			page: 0,
			rows: 0,
			mode: "list",
			selected: 0,
			selected_file: {name: "", description: ""},
			alert: ""
		},
		methods: {
			previous_page: function(page){
				if (this.page > 0)
				{
					this.page -= 1;
					show_page();
				}
			},
			next_page: function(){
				if (this.page < this.pages - 1)
				{
					this.page += 1;
					show_page();
				}
			},
			select: function(id){
				this.mode = 'place';
				this.selected = id;
			},
			place_media: function(e){
				e.preventDefault();
				
				// We add the media as an asset only if it hasn't already been added
				let item = this.media.find(obj => obj.gen_id == this.selected);
				if (item.type.indexOf("video") > -1 && !document.getElementById("media_" + this.selected))
				{
					$("a-assets").append('<video src="/file/' + this.selected + '" id="media_' + this.selected + '" autoplay loop muted class="user_asset"></video>');
				}
				else if (item.type.indexOf("image") > -1 && !document.getElementById("media_" + this.selected))
				{
					$("a-assets").append('<img src="/file/' + this.selected + '" id="media_' + this.selected + '" class="user_asset">');
				}

				let _2d_tool_on = new CustomEvent("2d_tool_on", {
					detail: {
						type: item.type,
						media_id: "media_" + this.selected
					}
				});
				document.dispatchEvent(_2d_tool_on);

				$("#media-modal").modal("hide");
			},
			upload_file: function(e){
				e.preventDefault();
				let vuer = this;
		
				if ($("#media_upload_file").val() != "")
				{
					let form_data = new FormData(document.getElementById("media_upload"));
		
					$.ajax({
						url : "/upload?ajax=true",
						type: "POST",
						data : form_data,
						processData: false,
						contentType: false,
						success: function(){
							setTimeout(list_media, 500);
						},
						error: function(jqXHR, textStatus, errorThrown){
							if (jqXHR.status == 403)
								window.location = jqXHR.responseText;
							else if (jqXHR.status == 400)
								vuer.alert = jqXHR.responseText;
						}
					});
				}
				else
					vuer.alert = "The input provided was invalid. Make sure you have followed the instructions for each field.";
			},
			edit: function(id, name, description){
				this.selected = id;
				this.mode = "edit";
				this.selected_file.name = name;
				this.selected_file.description = description;
			},
			update_file: function(e){
				e.preventDefault();

				let vuer = this;
				let data = {
					"gen_id": this.selected,
					"name": document.getElementById("file_name").value,
					"description": document.getElementById("file_description").value
				};
				let required = ["gen_id", "name", "description"];

				if (validateForm(data, required))
				{
					// If update works
					let success = function(){
						vuer.alert = "Updated media meta.";
					};

					// If update doesn't work
					let error = function(jqXHR){
						vuer.alert = jqXHR.responseText;
					};

					$.post("/file/update?ajax=true", data, success).fail(error);
				}
			},
			delete_file: function(id){
				let vuer = this;
				let data = {
					"gen_id": id
				};
				let required = ["gen_id"];

				if (validateForm(data, required))
				{
					// If delete works
					let success = function(){
						vuer.alert = "Deleted media file.";
						list_media();
					};

					// If delete doesn't work
					let error = function(jqXHR){
						vuer.alert = jqXHR.responseText;
					};

					$.post("/file/delete?ajax=true", data, success).fail(error);
				}
			}
		}
	});

	let show_page = function(){
		let list = media_modal.media;
		let page = media_modal.page;
		media_modal.mode = "list";

		media_modal.show = new Array(list.slice(page * 16, page * 16 + 4), list.slice(page * 16 + 4, page * 16 + 8), list.slice(page * 16 + 8, page * 16 + 12), list.slice(page * 16 + 12, page * 16 + 16));
		media_modal.rows = Math.ceil(list.slice(page * 16, page * 16 + 16).length / 4);
	};

	let list_media = function(){
		let data = {
			ajax: true
		};

		let fail = (xhr) => {
			if (xhr.status == 403)
				window.location = xhr.responseText;
		};

		let success = (list) => {
			media_modal.media = list;
			media_modal.pages = Math.ceil(list.length / 16);
			media_modal.page = 0;
			media_modal.mode = 'list';
			
			show_page();
		};

		$.getJSON("/media/list", data, success).fail(fail);
	};

	$("#media-modal").on("show.bs.modal", list_media);

	// Handle popup toolbar for individual items
	document.getElementById("delete-item").addEventListener("click", function(){
		let id = document.getElementById("item_tools").getAttribute("data-item-id");
		$("#" + id).remove();
		
		document.getElementById("item_tools").classList.add("invisible");
		
		// We sound the alarm to save
		document.dispatchEvent(EVENTS.exhibit_updated);
	});

	// Add event listeners for the exhibit meta inputs
	document.getElementById("exhibit_title").addEventListener("change", function(){
		document.dispatchEvent(EVENTS.exhibit_updated_meta);
	});

	document.getElementById("exhibit_description").addEventListener("change", function(){
		document.dispatchEvent(EVENTS.exhibit_updated_meta);
	});

	// Handle saving the data to the server
	document.addEventListener("exhibit_updated", function(e){
		// Tell the user we're saving
		$("#save_status").text("Saving...");

		// Cleanup the workspace
		for (asset of document.getElementsByClassName("user_asset"))
		{
			if (document.querySelector("[src='#" + asset.id + "']") == null)
				document.getElementsByTagName("a-assets")[0].removeChild(document.getElementById(asset.id));
		}

		// Setup AJAX
		let gen_id = document.getElementById("gen_id").value;
		let data;
		if (e.detail == "meta")
		{
			// Prep for AJAX
			data = {
				type: "meta",
				title: document.getElementById("exhibit_title").value,
				description: document.getElementById("exhibit_description").value
			};
		}
		else
		{
			// Get only the user assets
			$("#asset_manager").html($("a-assets").html());
			$("#asset_manager").find(".default_asset").remove();

			// All that follows is a way to make sure that even if the user is in short-wall view mode, the walls are saved at full height
			let content = document.getElementById("user_content").innerHTML;
			
			// We start by changing the scale
			let filtered = content.replaceAll('scale="1.1 .1 ' + WALL.short + '"', 'scale="1.1 .1 ' + WALL.tall + '"');

			// Now we loop through all the elements to change the positioning, since A-Frame is center-positioned
			let html = '';
			for (ele of filtered.split(">"))
			{
				if (ele.indexOf('wall"') > -1)
				{
					// Regex from here: https://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli
					let attributes = ele.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g);
					for (const [i, attribute] of attributes.entries())
					{
						// If there's a position attribute for this wall, change it so that the Y position is suitable for a tall wall
						if (attribute.indexOf("position=") > -1)
						{
							let pos = attribute.split('"')[1];
							pos = pos.split(" ");
							pos[1] = WALL.tall / 2;

							attributes[i] = 'position="' + pos.join(" ") + '"';
						}
						
					}
					html += attributes.join(" ") + ">";
				}
				else if (ele.indexOf("<") > -1)
					html += ele + ">";
			}

			// Prep for AJAX
			data = {
				type: "content",
				content: '<a-entity id="user_content">' + html + "</a-entity>\n<!--ASSETS-->\n" + document.getElementById("asset_manager").innerHTML
			};
		}

		// If save works
		let success = function(){
			$("#save_status").text("Saved.");
		};

		// If save doesn't work
		let error = function(jqXHR){
			if (jqXHR.status == 403)
				window.location = jqXHR.responseText;
			else
				$("#save_status").text("Not saved.");
		};

		// AJAX request
		$.post("/update/" + gen_id + "?ajax=true", data, success).fail(error);
	});
})();
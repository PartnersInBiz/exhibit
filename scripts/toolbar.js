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

	let media_modal = new Vue({
		el: '#media-modal',
		delimiters: ["<%", "%>"],
		data: {
			media: [],
			show: [],
			pages: 0,
			page: 0,
			rows: 0
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
			}
		}
	});

	let show_page = function(){
		let list = media_modal.media;
		let page = media_modal.page;

		media_modal.show = new Array(list.slice(page * 16, page * 16 + 4), list.slice(page * 16 + 4, page * 16 + 8), list.slice(page * 16 + 8, page * 16 + 12), list.slice(page * 16 + 12, page * 16 + 16));
		media_modal.rows = Math.ceil(list.slice(page * 16, page * 16 + 16).length / 4);
	};

	$("#media-modal").on("show.bs.modal", function(){
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
			
			show_page();
		};

		$.getJSON("/media/list", data, success).fail(fail);
	});
})();
(() => {
	let wall_tool_on = new CustomEvent("wall_tool_on");
	let wall_tool_off = new CustomEvent("wall_tool_off");

	$("#wall-toggle").click(function(){
		if ($(this).data("toggle") == "off")
		{
			$(this).data("toggle", "on").removeClass("btn-secondary").addClass("btn-info");
			document.dispatchEvent(wall_tool_on);
		}
		else
		{
			$(this).data("toggle", "off").removeClass("btn-info").addClass("btn-secondary");
			document.dispatchEvent(wall_tool_off);
		}
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
			WALL_HEIGHT = .5;
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
			WALL_HEIGHT = 2;
		}
	});
})();
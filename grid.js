(() => {
	const GRID = $("#grid");
	const CAMERA = $("#camera");
	
	for (let x = 0; x < SIZE; x++)
	{
		for (let y = 0; y < SIZE; y++)
		{
			let position = (x + .5) + " " + (y + 1.5) + " " + "0";
			GRID.append('<a-plane src="#grid-space" position="' + position + '" class="grid-space" data-id="' + x + "," + y + '" grid-hover=""></a-plane>');
		}
	}
	//CAMERA.attr("position", SIZE / 2 + " 5 -" + SIZE / 2);
})();
(() => {
	const GRID = $("#grid");
	const CAMERA = $("#camera");
	
	for (let x = 0; x < SIZE; x++)
	{
		for (let y = 0; y < SIZE; y++)
		{
			let position = (x + .5) + " " + (y + .5) + " " + "0";
			GRID.append('<a-plane src="#grid-space" position="' + position + '" class="grid-space" data-id="' + x + "," + y + '" grid-interactive click-menu></a-plane>');
		}
	}
})();
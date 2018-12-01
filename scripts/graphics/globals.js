const SIZE = 16;
const HALFWIDTH = screen.width / 2;
const HALFHEIGHT = window.innerHeight / 2;
const DRAGSCALE = 1.2;
const PAN_SENSITIVITY = 75;
const WALL = {
	short: .5,
	tall: 2.5
};
let WALL_HEIGHT = WALL.tall;
let FLOOR_HEIGHT = .01;

const EVENTS = {
	wall_tool_on: new CustomEvent("wall_tool_on"),
	wall_tool_off: new CustomEvent("wall_tool_off"),
	floor_tool_on: new CustomEvent("floor_tool_on"),
	floor_tool_off: new CustomEvent("floor_tool_off")
};

function parametize(assoc)
{
	let string = '';
	for (key in assoc)
	{
		if (assoc.hasOwnProperty(key))
			string += assoc[key] + ' ';
	}
	return string.slice(0, -1);
}
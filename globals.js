const SIZE = 64;
const HALFWIDTH = screen.width / 2;
const HALFHEIGHT = window.innerHeight / 2;
const DRAGSCALE = 1.2;

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
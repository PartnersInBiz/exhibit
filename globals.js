const SIZE = 64;

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
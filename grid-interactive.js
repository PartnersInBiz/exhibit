(() => {
	AFRAME.registerComponent('grid-hover', {
		schema: {
			color: {default: '#00FF08'}
		},
	
		init: function() {
			let data = this.data;
			let el = this.el;
			let defaultColor = el.getAttribute('material').color;
	
			el.addEventListener('mouseenter', function () {
				el.setAttribute('color', data.color);
			});
	
			el.addEventListener('mouseleave', function () {
				el.setAttribute('color', defaultColor);
			});

			el.addEventListener("mouseenter", function(e){
				// abs(intersection.point.z) corresponds roughly to this.position.y
				// x corresponds to x
				//console.log(e.detail.intersection)
				let intersection = e.detail.intersection;
				//let options = {x: Math.round(intersection.point.x), z: Math.abs(Math.round(intersection.point.z))};
				console.log("intersection: ", intersection)
				let x = intersection.point.x//Math.round(intersection.point.x * 2) / 2
				let z = intersection.point.z//Math.round(intersection.point.z * 2) / 2
				console.log("x,z: ",x,",",z)
				let xp = Math.round(intersection.point.x * 2) / 2 + .5;
				let zp = Math.round(z * 2) / 2 + .5;
				console.log("x',z': ",xp,",",zp)
				let xpp = Math.round(xp)
				let zpp = Math.round(zp)

				if (Math.abs(Math.abs(x) - Math.abs(xp)) > Math.abs(Math.abs(z) - Math.abs(zp)))
				{
					$("a-scene").append('<a-box color="blue" position="' + xpp + ' 0 ' + (zpp - .5) + '" scale="1 .1 1" rotation="90 90 0"></a-box>')
				}
				else
				{
					$("a-scene").append('<a-box color="green" position="' + (xpp - .5) + ' 0 ' + zpp + '" scale="1 .1 1" rotation="90 0 0"></a-box>')
				}



				//console.log("options:",options)
				// If closer to x than y
				//console.log("x - pointX: ",Math.abs(options.x - intersection.point.x))
				//console.log("y - pointY: ", Math.abs(options.z - Math.abs(intersection.point.z)))
				/*if (Math.abs(options.x - intersection.point.x) < Math.abs(options.z - Math.abs(intersection.point.z)))
				{
					alert("X")
					$("a-scene").append('<a-box color="blue" position="' + (options.x + .5) + ' 0 ' + Math.round(intersection.point.z) + '" scale="1 .1 1" rotation="90 90 0"></a-box>')
				}
				else
				{
					alert("Y");
				}*/

				//console.log(this.getAttribute("position"))
			});
		}
	  });
})();
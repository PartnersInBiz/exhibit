class GridSnap {
	wall(intersection, height=1) {
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

		if (differenceX < differenceZ)
		{
			let meta = {
				position: {
					x: xFloor,
					y: height / 2,
					z: zFloor - .5,
					string: xFloor + " " + (height / 2) + " "  + (zFloor - .5)
				},
				rotation: {
					x: 90,
					y: 90,
					z: 0,
					string: "90 90 0"
				}
			}
			return meta;
		}
		else if (differenceX > differenceZ)
		{
			let meta = {
				position: {
					x: xFloor + .5,
					y: height / 2,
					z: zFloor,
					string: (xFloor + .5) + " " + (height / 2) + " " + zFloor
				},
				rotation: {
					x: 90,
					y: 0,
					z: 0,
					string: "90 0 0"
				}
			}
			return meta;
		}
	}
}

(() => {
	AFRAME.registerComponent('grid-hover', {
		schema: {
			color: {default: '#00FF08'}
		},
	
		init: function() {
			let data = this.data;
			let el = this.el;
			let defaultColor = el.getAttribute('material').color;
			const SNAP = new GridSnap();
			let move = true;
	
			el.addEventListener('mouseenter', function () {
				// Grid hover color
				el.setAttribute('color', data.color);
			});

			$(".temp").on("mouseenter", function(e){
				move = false;
			})
	
			el.addEventListener('mouseleave', function (e) {
				el.setAttribute('color', defaultColor);
				//console.log(e.relatedTarget)
				//console.log(e)
				//if (e.target.className != "grid-space")
				//if (move)
					$("a-box.temp").remove();
			});

			/*let checkChange = function(e, position){
				if (e.detail.intersection.point.x != position.x || v.detail.intersection.point.z != position.z)
					{
						$("a-box.temp").remove();
						el.removeEventListener("mouseenter", checkChange);
						el.addEventListener("mouseenter", wallSnap)
					}
			}*/
			let position;
			let check = function(ev){
				if (ev.detail.intersection.point.x != position.x || ev.detail.intersection.point.z != position.z)
				{
					$("a-box.temp").remove();
					el.removeEventListener("mouseenter", check)
					el.addEventListener("mouseenter", wallSnap)
				}
			}

			let wallSnap = function(e){
				// Grid wall snap
				//console.log(e)
				let placement = SNAP.wall(e.detail.intersection);
				//console.log(placement)
				if (!$(".temp[position='" + placement.position.string + "'").length)
				{
					$("a-scene").append('<a-box color="blue" position="' + placement.position.string + '" scale="1 .1 1" rotation="' + placement.rotation.string + '" class="temp"></a-box>');
				}

				position = e.detail.intersection.point;
				//$(el).addClass("noevent")

				//el.removeEventListener("mouseenter", wallSnap);
				//document.addEventListener("mousemove", check);
			};

			el.addEventListener("mouseenter", wallSnap);
		}
	  });
})();
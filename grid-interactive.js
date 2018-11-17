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
		}
	  });
})();
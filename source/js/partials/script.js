function ledPanel() {
	var params = {
		bgColor: "#000",
		rainbow: true,				// rainbow mode
		activeColor: "#15b515",
		inactiveColor: "#325032",
		depth: 60,					// % of area to show dot
		margin: 0.5,				// space between dots
		font: "200px Arial Black",
		paddingLeft: 10,			// space between left border and text
		paddingBottom: 180,			// space between bottom border and text
		default: {
			text: "Hello world",
			radius: 3
		},
		log: false					// enable loging
	}

	var canvas,
		ctx,
		dotRadius,
		startOffset,
		dotMargin,
		dots = [], // array of all tots
		canvasDots = [], // array of dots on canvas
		fps,
		stopHeight,
		stopWidth,
		frame = 0,
		built = false;

	this.build = function(id, text = params.default.text, radius = params.default.radius) {
		canvas = document.getElementById(id);
		ctx = canvas.getContext("2d");
		ctx.font = params.font;

		dotRadius = radius;
		startOffset = 1.5*dotRadius;
		dotMargin = (2+params.margin)*dotRadius;

		stopHeight	= Math.floor(canvas.height/(dotMargin));
		stopWidth	= Math.floor(canvas.width/(dotMargin))+1;

		var textWidth = ctx.measureText(text).width;

		var areaInfo,
			sumColor,
			k,
			delta = 0; // distance to move text left

		// Run timer
		if (params.log)
			var time = performance.now();

		// Put text on canvas and build dots array
		// then move it left on canvas.width length
		// and build next part of dots array
		// repeat untill all text transformed into dots
		do {
			var x = startOffset;
			var y = startOffset;
			var start,
				stop;

			// fill background with black
			ctx.fillStyle = "#000";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// put white text
			ctx.fillStyle = "#fff";
			ctx.fillText(text, params.paddingLeft-delta, params.paddingBottom);

			// move along Y axis
			for (var i=0;i<stopHeight;i++) {
				// initialize row array
				if (typeof(dots[i]) == "undefined") {
					dots[i] = [];
					start = dots[i].length+1;	// first element reserved for active line marker
					stop = dots[i].length+stopWidth;
				} else {
					start = dots[i].length;		// on 2nd and next steps do not miss forst element of array
					stop = dots[i].length+stopWidth-1;
				}

				if ( typeof(dots[i][0]) == "undefined" ) {	// if not currently filled
					dots[i][0] = false;						// marker if row has active dots
				}

				// move along X axis
				for (var j=start;j<stop;j++) {
					k = 0;
					sumColor = 0;

					// get square area with a = 2*r
					areaInfo = ctx.getImageData(x-dotRadius, y-dotRadius, 2*dotRadius, 2*dotRadius);

					// move through all dots in area
					for (var l=0;l<areaInfo.data.length;l+=4) {
						// get sum of Red, Green and Blue components
						sumColor +=	areaInfo.data[l] +		// Red
								 	areaInfo.data[l+1] +	// Green
								 	areaInfo.data[l+2];		// Blue
						k++;
					}

					// if average sum > depth - mark dot as active
					if ( sumColor / k / 3 > 255 * params.depth / 100 ) {
						dots[i][j] = 1;
						dots[i][0] = true;	// mark line as those that have active dots
					} else {
						dots[i][j] = 0;
					}

					x += dotMargin; // Next x
				}

				y += dotMargin;		// Next Y
				x = startOffset;	// Null x at begin of next row
			}
			delta += canvas.width;	// Move text left
		} while( textWidth-delta > 0 );

		// Log build time
		if (params.log) {
			time = performance.now() - time;
			console.log('Build: ', time);
		}

		// Put dots on canvas
		fillDots(dots);
	}

	function fillDots(arr) {
		var x = startOffset;
		var y = startOffset;
		var tmpArr = [];
		var color;
		var z = 0;

		// Log time
		if (params.log)
			var time = performance.now();

		// first build
		if (!built ) {
			ctx.fillStyle = params.bgColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		// Move along Y axis
		arr.forEach(function(dotY) {
			// get Row array
			tmpArr = dotY.slice(0, stopWidth);

			// if first build or row has active dots
			if ( !built || tmpArr[0] === true ) {
				// Move along X axis
				for (var k=1;k<tmpArr.length;k++) {
					// if rainbow mode
					if ( params.rainbow ) {
						params.activeColor = "hsl("+Math.round(k/tmpArr.length*360)+", 100%, 50%)";
					}
					color = ( tmpArr[k] == 1 ) ? params.activeColor : params.inactiveColor;

					// repaint only if line has active dots
					// check if current dot differs from previous
					if (built && canvasDots[z][k] !== tmpArr[k]) {
						// clear dot area
						ctx.fillStyle = params.bgColor;
						ctx.fillRect(x - dotRadius*(1+params.margin), y - dotRadius*(1+params.margin), 2 * dotRadius*(1+params.margin), 2 * dotRadius*(1+params.margin));
						
						// put dot
						fill(x, y, color);
					} else if ( !built ) {
						// first build
						fill(x, y, color);
					}

					x += dotMargin;
				}
			}

			y += dotMargin;		// Next Y
			x = startOffset;	// Null X on begin of next row

			// remember current state of dots
			canvasDots[z] = tmpArr;
			z++;
		});
		
		// Log time
		if (params.log) {
			time = performance.now() - time;
			console.log('fillDots: '+Math.round(time)+'; fps: '+ Math.round(1000/time));
		}

		// Mark as build
		built = true;
	}

	// fill dot
	function fill(x, y, color) {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x, y, dotRadius, 0, Math.PI*2);
		ctx.closePath();
		ctx.fill();
	}

	function anim() {
		var y,
			arr = [];

	    setTimeout(function() {
	        requestAnimationFrame(anim);
			y = 0;
			dots.forEach(function(dotY) {
				if (frame+stopWidth>=dotY.length) {
					arr[y] = dotY.slice(0,1).concat(dotY.slice(frame+1,frame+stopWidth+1).concat(dotY.slice(1,frame+stopWidth-dotY.length+1)));
				} else {
					arr[y] = dotY.slice(0,1).concat(dotY.slice(frame+1,frame+stopWidth+1));
				}
				y++;
			});

			fillDots(arr);
			if (frame == dots[0].length) {
				frame = 0;
			}
			frame++;
	    }, fps);
	}

	this.animate = function(dotsPerSecond = 10) {
		fps = 1000 / dotsPerSecond;
		anim();
	}
}


document.addEventListener('DOMContentLoaded', function() {
	var led = new ledPanel();
	led.build("ledpanel", "     Running LED Lights", 3);
	led.animate(30);
});
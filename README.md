# led-screen
Emulate LED screen using HTML5 Canvas

# Demo
https://vibos.github.io/led-screen/

# Getting Started
```sh
led.build(id, Text, DotRadius)
```

```js
document.addEventListener('DOMContentLoaded', function() {
	var led = new ledPanel();
	led.build("ledpanel", "Running LED Lights", 3);
	led.animate(30);	// dots per second
});
```

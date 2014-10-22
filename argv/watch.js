var hxjs = require('../src/hx');
var hx = new hxjs('test/debug/', {
	output: "../build",
	template: "./template/",
	data: "./data/",
	src: "./src/"
});
hx.init();
hx.watch();
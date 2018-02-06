var Benchtest;
if(typeof(Benchtest)==="undefined") {
	Benchtest = require("../src/benchtest.js");
}

const test = new Benchtest({
		log: console,
		start: () => console.log("start"),
		before: () => console.log("before test"),
		between: () => console.log("between tests"),
		after: () => console.log("after test"),
		end: () => console.log("end"),
		suites: {
			suiteone: {
				tests: {
					main: {
						f: () => true
					}
				}
			},
			suitetwo: {
				tests: {
					main: {
						f: () => true
					}
				}
			}
		}
	});
test.run();


const Benchtest = require("../src/benchtest.js"),
	test = new Benchtest({
		suites: {
			main: {
				tests: {
					main: {
						f: () => console.log("ok")
					}
				}
			}
		}
	});
test.run();
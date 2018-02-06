var Benchtest;
if(typeof(Benchtest)==="undefined") {
	Benchtest = require("../src/benchtest.js");
}

const test = new Benchtest({
		log: console,
		context: {
			value: "context value"
		},
		start: () => console.log("start"),
		before: (name) => console.log(`Running ${name} ...`),
		between: () => console.log("between suites"),
		after: () => (name) => console.log(`Completed ${name} ...`),
		end: () => console.log("end"),
		suites: {
			suiteone: {
				expect: "context value",
				tests: {
					test1: {
						f: function() { return this.value; }
					}
				}
			},
			suitetwo: {
				// will fail due to override below
				expect: function(value) { return value==="context value"; },
				context: {
					value: "context override value"
				},
				tests: {
					test1: {
						f: function() { return this.value; }
					},
					test2: {
						f: function() { return "context value"; }
					}
				}
			}
		}
	});
test.run();
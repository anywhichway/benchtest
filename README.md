# benchtest: Opinionated, serializable, integrated benchmarking and unit testing

Benchtest is wrapper around the superb [benchmark.js](https://github.com/bestiejs/benchmark.js) library. We needed a uniform way of representing benchmarks so that:

1) They could be easily serialized

2) There is less boilerplate code

3) There is some unit test like validation to ensure benchmarks are producing correct results

4) Multiple suites could be clustered and run at the same time

# Installation

npm install benchtest

# API

When using benchtest, all tests are represented in the context of a JavaScript object. The shape of the object is:

```javascript
{
	name: string, // optional name
	log: outputStream, // optional, if provided results are logged to the stream
	context: { // optional, provides functions or data for suites
		// keys with data or functions as values, "this" inside of cycle and test functions
	},
	start: function, // optional, runs when benchmarking starts
	before: function(suiteName), // optional, runs when each suite starts
	between: function, // optional, runs between each suite
	after: function(suiteName), // optional, runs when each suite ends
	end: function,  //optional, runs when benchmarkin is complete
	suites: {
		<suiteName>: {
			context: { // optional, provides functions or data for suiteName
				// extends/overrides parent context in before, after, and test functions
			},
			expect: boolean|number|string|function, // optional, used to verify tests return correct value
			tests: {
				<testName>: {
					expect: value|function, // optional, overrides suite expect
					f: function // the actual function to test and benchmark
				}[, // optional additional tests
				...]
			}
		}[, // optional additional suites
		...]
	},
	results: { // generated dynamically during testing
		<suiteName>: {
			statistics: [
				[<testName>,<ops/sec>,<margin of error>,<sample size>]
				[,...]
			],
			errors: /[
				[<testName>,<expected>,<received>]
				[,...]
			],
		}[, // additional suite results
		...]
	}
}
```

To create and run a Benchtest just pass an appropriately shaped object to the Benchtest constructor and call run:

```javascript
const benchtest = new Benchtest(<spec>).run(); // run and return the benchtest
```

To create a serializable Benchtest just call `serialize`:

```javascript
const json = new Benchtest(<spec>).serialize();
```

The Benchtest constructor will automatically deserialize:

```
const json = new Benchtest(<spec>).serialize(),
	benchtest = new Benchtest(json).run(); // // run and return the benchtest 
```

## Example

```javascript
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
```

will produce

```
start
Running suiteone ...
between suites
Statistics: suiteone
| Name  | Ops/Sec    | Margin of Error | Sample Size |
| ----- | ---------- | --------------- | ----------- |
| test1 | 65,031,779 | +/- 1.34%       | 89          |
Running suitetwo ...
between suites
Statistics: suitetwo
| Name  | Ops/Sec    | Margin of Error | Sample Size |
| ----- | ---------- | --------------- | ----------- |
| test2 | 65,119,160 | +/- 3.83%       | 79          |
| test1 | 0          | 0               | 0           |
Errors: suitetwo
| Name  | Expected                      | Received               |
| ----- | ----------------------------- | ---------------------- |
| test1 | function () { [native code] } | context override value |
end
```


# Release History (reverse chronological order)

2018-02-06 v0.0.6b BETA Improved test case and example.

2018-02-06 v0.0.5b BETA Modified cycle behavior and functions. Finalized API.

2018-02-05 v0.0.4a ALPHA Removed context on tests. Can't support with Benchmark.js.

2018-02-04 v0.0.3a ALPHA Fixed Node table rendering for results

2018-02-04 v0.0.2a ALPHA Update results spec. Address some context scope issues.

2018-02-04 v0.0.1a ALPHA Initial public release


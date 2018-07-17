# benchtest v1.0.0

Integrated performance testing for Mocha based unit testing.

Benchtest provides performance testing wrapper around the [Mocha](https://mochajs.org/) unit test runner. It can be used as a light weight, but not as powerful, alternative to the stellar [benchmark.js](https://github.com/bestiejs/benchmark.js) library.

Benchtest set-up can be done in as little as three lines of code for [Node](https://nodejs.org/en/) projects.

```
const benchtest = require("benchtest");
afterEach(function () { benchtest.test(this.currentTest); });
after(() => benchtest.run({log:"md"}));

```

Afterwards a Markdown compatible table containing performance results for all successful tests similar to the one below will be printed to the console:


| Name                                     | Ops/Sec  | +/- Msec | Sample Size |
| ---------------------------------------- | -------- | -------- | ----------- |
| overhead (time for () => true to run) ## | 20000000 | 0.048    | 100         |
| random sleep done #                      | 19969098 | 1.7      | 31          |
| random sleep Promise #                   | 19970873 | 0.77     | 29          |
| no-op (should be at or close to zero) #  | 0        | 0.021    | 100         |


In the browser `benchtest` requires just one line of code after loading the library! This `onload` call adds performance testing to all Mocha unit tests.

```
<body onload="benchtest(mocha.run(),{all:true})">
```

The browser results will be augmented like below:

&check; overhead (time for function that does nothing to execute) ## 20000000 sec +/- 0.10 msec 100 samples

&check; random sleep done # 19900000 sec +/- 2.2 msec 100 samples

&check; random sleep Promise # 19857143 sec +/- 2.2 msec 100 samples

&check; no-op (should be at or close to zero based on overhead) # 0 sec +/- 0.10 msec 100 samples


# Installation

npm install benchtest --save-dev

# Usage

## Node

Just add two global Mocha event hooks to include tests to be benchmarked and then run the benchmarks after Mocha has completed unit testing. Benchtest will automatically exclude tests that have failed.

```
const benchtest = require("benchtest");
afterEach(function () { benchtest.test(this.currentTest); });
after(() => benchtest.run());

```

Add a `#` to the end of each unit test name you wish to benchmark, or just pass `all:true` in the options to run.

If there is a point at which you wish to skip all tests except benchmark tests, add this line:

```
beforeEach(function() { if(!benchtest.testable(this.currentTest)) this.currentTest.skip(); })
```

See the API section for options that can be passed to `benchtest.run()`.

## Browser

Load the benchtest code, `benchtest.js` located in the module `browser` subdirectory using a `script` tag. Assuming your testing is occuring from subdirectory of your project root it should look something like this:

```
<script src="../node_modules/browser/benchtest.js" type="text/javascript"></script>
```

Add this to your `onload` function or where you normally start Mocha.

```
benchtest(mocha.run());
```

Add a `#` to the end of each unit test name you wish to benchmark, or just pass `all:true` in an options object as the second argument to `benchtest`. See the API section for details.


# API

`Runner benchtest(mochaRunner,options={})` - Used for browser initialization of `benchtest`. The value of `mochaRunner` is the return value of `mocha.run()`. Returns `mochaRunner`. The `options` has this shape with the provided defaults:

```
{minCycles=10,maxCycles=100,sensitivity=.01,log="json",logStream=console,all=false,off=false}`
```

<ul>
	<li>`minCycles` - The minimum number of times to run a test to assess its performance.</li>
	<li>`maxCycles` - The maximum number of times to run a test to assess its performance.</li>
	<li>`sensisitivity` - The value of the percentage difference (expressed as a float, i.e. .01 = 1%) between individual cycle tests at which point the test loop should exit.</li>
	<li>`log` - The format in which to output results to the `logStream`. Valid values are `md` for Markdown and `json`.</li>
	<li>`logStream` - The stream to which results should be sent. The stream must support the method `log`, e.g. `console.log(...)`, `logstream.log(...)`.</li>
	<li>`all` - Whether or not to benchtest all unit tests. When all is false, those tests with names ending in `#` will be performance tested.</li>
	<li>`only` - Tells Mocha to skip all tests except those marked for benchmarking. Supercedes `all`. </li>
	<li>`off` - Setting to `true` will turn off benchtesting.
</ul>

`benchtest.run(options={})` - Used for Node. The options are the same as for the browser (see above), except `only` is not supported. See the use of `beforeEach` in the Node usage section in place of `only`. Returns `undefined`.

`Test benchtest.test(unitTest)` - Used to add the `unitTest` to those to be benchmarked after Mocha has run all tests, automatically excludes failed tests. Returns the `unitTest`.

`boolean benchtest.testable(unitTest)` - Checks for `#` as last character in test name.

# Known Issues

All tests across all test suites are included in one table and test name collisions will overwrite results.

Unit tests that result in rejected Promises abort the `benchtest` processing. Use `done(Error)` for all your test failures.

# Release History (reverse chronological order)

2018-07-17 v1.0.0 Switched from `benchmark.js` to `mocha`. Mocha is in wider use. Removed serialization. Dramatically simplified. Margin of Error now in milliseconds. Test suite divisions not currently supported, they should be run from separate files.

2018-02-07 v0.0.7b BETA Adjusted results to conform better to spec.

2018-02-06 v0.0.6b BETA Improved test case and example.

2018-02-06 v0.0.5b BETA Modified cycle behavior and functions. Finalized API.

2018-02-05 v0.0.4a ALPHA Removed context on tests. Can't support with Benchmark.js.

2018-02-04 v0.0.3a ALPHA Fixed Node table rendering for results

2018-02-04 v0.0.2a ALPHA Update results spec. Address some context scope issues.

2018-02-04 v0.0.1a ALPHA Initial public release


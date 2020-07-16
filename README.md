# benchtest v2.0.2

Integrated performance testing for Mocha based unit testing. No special tests are needed. Re-uses existing [Mocha](https://mochajs.org/) unit tests.

It can be used as a light weight, but not as quite as powerful, alternative to the stellar [benchmark.js](https://github.com/bestiejs/benchmark.js) library.

Benchtest set-up can be done in as little as three lines of code for [Node](https://nodejs.org/en/) projects.

```javascript
const benchtest = require("benchtest");
afterEach(function () { benchtest.test(this.currentTest); });
after(() => benchtest.run({log:"md"}));

```

Afterwards a Markdown compatible table containing performance results for all successful tests similar to the one below will be printed to the console:


| Test Suite 1          |  Ops/Sec |      +/- |   Min |      Max | Sample | Errors |
| --------------------- | --------:| --------:| -----:| --------:| ------:| ------ | 
| no-op #               | Infinity | Infinity | 20000 | Infinity |    100 |      0 |
| sleep 100ms #         |       10 |        1 |    10 |       12 |    100 |      0 |
| sleep 100ms Promise # |       10 |        1 |     8 |       11 |    100 |      0 |
| sleep random ms #     |       21 |        2 |    10 | Infinity |    100 |      0 |
| loop 100 #            | Infinity | Infinity | 10526 | Infinity |    100 |      0 |
| use heap #            | Infinity | Infinity | 10526 | Infinity |    100 |      0 |
| throw error #         |    43290 |     4329 |     0 |        0 |    100 |     99 |


Note, the `Ops/Sec` will be `Infinity` for functions where the time to execute `maxCycles` (a start-up option defaulting to 100) on average takes less time than can me measured by `window.perf()` or `performance-now` for Node.js.

In the browser `benchtest` requires just one line of code after loading the library! This `onload` call adds performance testing to all Mocha unit tests in a browser. See  `Usage` below for how to use wuth Node.js.

```
<body onload="benchtest(mocha.run(),{all:true})">
```

The browser results will be augmented like below:

&check; no-op # Infinity sec +/- Infinity min: 909 max: Infinity 100 samples

&check; sleep 100ms # 10 sec +/- 1 min: 10 max: 10 12 samples100ms

&check; sleep 100ms Promise # 10 sec +/- 1 min: 10 max: 10 10 samples100ms

&check; sleep random ms # 19 sec +/- 2 min: 10 max: Infinity 100 samples81ms

&check; loop 100 # Infinity sec +/- Infinity min: 10000 max: Infinity 100 samples

&check; use heap # Infinity sec +/- Infinity min: 10000 max: Infinity 100 samples

&check; no-benchtest

Note, Benchtest should only be one part of your performance testing, you should also use simulators that emulate real world conditions and test your code at the application level to assess
network impacts, module interactions, etc. 

# Installation

npm install benchtest --save-dev

# Usage

Whenever you do performance tests, if the code will ever be used in a browser, we recommend you test across ALL browsers and not use Node.js results as a proxy for the browser. 
Node.js performance results are rarely the same as browsers results. For browsers, we generally find Chrome fastest and Firefox next and older versions of Edge a distant third
despite Microsoft's claims that Edge is the fastest. Newer versions of Edge use the v8 engine and are likely to be close to Chrome for non-DOM operations. Node.js frequently 
lags behind the browsers in the V8 engine it uses and can vary dramatically from version to version. This being said, browser vendors also reduce the precision of 
the timers used to help reduce their cyber attack surface, so you should also not use browsers as a proxy for you server environment.

See the test in the `test` directory for an example of how to use.

## Node

Just add two global Mocha event hooks. Benchtest will automatically exclude tests that fail.

```javascript
const benchtest = require("benchtest");
beforeEach(benchtest.test);
after(benchtest.report);
```

Add a `#` to the end of each unit test name you wish to benchmark or use the opiton `all:true`. See the API section for details on cofiguration options for `benchtest`.

## Browser

Load the benchtest code, `benchtest.js` located in the module `browser` subdirectory using a `script` tag. Assuming your testing is occuring from subdirectory of your project root it should look something like this:

```html
<script src="../node_modules/benchtest/browser/benchtest.js" type="text/javascript"></script>
```

Add this to your `onload` function or where you normally start Mocha.

```javascript
benchtest(mocha.run());
```

Add a `#` to the end of each unit test name you wish to benchmark or use the opiton `all:true`. See the API section for details on cofiguration options for `benchtest`.

If there is a div in the HTML with the id "messages", benchtest will report the test it is running so that it does not appear things are "dead".

## Unit Testing Performance Expectations

With v2.0.0 of `benchtest` it is now possible to set expectations about performance in your unit tests. The `this` context of each unit test will be the test itself. On each test is a `performance` property having the surface `{duration:number,min:number,max:number,cycles:number}`. You can test these values like any other value inside of a test, e.g. the test below ensurses the average duration is between 99 and 101 milliseconds.

```javascript
	expect(this.performance.duration).to.be.above(99);
	expect(this.performance.duration).to.be.below(101);
```

# API

`Runner benchtest(mochaRunner,options={})` - Used for browser initialization of `benchtest`. The value of `mochaRunner` is the return value of `mocha.run()`. Returns `mochaRunner`.

For the default Mocha command line test runner, the first argument will be `null`. If you build a custom runner, pass in your runner instance after call `runner.run()`:

```
const benchtest = require("benchtest");
benchtest(null,{log:"json"}); // with the default Node.js Mocha tools, the first arg will always be null
beforeEach(benchtest.test);
after(benchtest.report);
```

The `options` has this shape with the provided defaults:

```javascript
{minCycles=10,maxCycles=100,sensitivity=.01,log="md",logStream=console,all=false,off=false,only=false}`
```

<ul>
	<li>`minCycles` - The minimum number of times to run a test to assess its performance.</li>
	<li>`maxCycles` - The maximum number of times to run a test to assess its performance.</li>
	<li>`sensisitivity` - The value of the percentage difference (expressed as a float, i.e. .01 = 1%) between individual cycle tests at which point the test loop should exit.</li>
	<li>`log` - The format in which to output results to the `logStream`. Valid values are `md` for Markdown and `json`.</li>
	<li>`logStream` - The stream to which results should be sent. The stream must support the method `log`, e.g. `console.log(...)`, `logstream.log(...)`.</li>
	<li>`all` - Whether or not to benchtest all unit tests. When `all` is false, only tests with names ending in `#` will be performance tested.</li>
	<li>`only` - Tells Mocha to skip all tests except those marked for benchmarking. Supercedes `all`. </li>
	<li>`off` - Setting to `true` will turn off benchtesting.
</ul>

`Suite benchtest.report(suite)` - Writes the performance report for the `suite` to the log specified in the `benchtest` options using the format also specified in the options. If `suite` is not a `Suite`, uses its own tracking mechanism to get it (Mocha has no API to provide it).

`Test async benchtest.test(unitTest)` - Runs performance assessment on `unitTest`, automatically excludes failed tests. If `unitTest` is not a `Test`, gets the `cuurentTest` from Mocha, if any. Returns the test.

`boolean benchtest.testable(unitTest)` - Checks for `#` as last character in test name.

# Internals

Before running each test with regular expectations, `benchtest` runs each test `minCycles` to `maxCycles` and exits its test loop when the variance percentage is than or equal `sensitivity`. The average execution time is then computed from the time at the very start of a test loop up to the point it exits divided by the number of cycles actually run. This avoids situations where a single function call may always or almost always take less than a millisecond. It also addresses the fact that garbage collection in JavaScript is unmanaged and your functions may be subject to it at some point. If more than 80% of test calls in a benchtest cycle take less that 1ms, then the speed will be reported as `Infinity` because garbage collection
will most likely overshadow any micro-optimizations.

If `global.gc` is defined as a result of starting Chrome or Node.js with `--expose-gc` flag, it will be called betwen each test-lopp to minimize garbage collection impact on actual tests.

# Known Issues

Unit tests that result in rejected Promises abort the `benchtest` processing. Use `done(Error)` for all your test failures.

# Release History (reverse chronological order)

2020-07-17 v2.0.6 Added error counts.

2020-07-16 v2.0.5 Test cycles not just aborat when a test throws an error rather than throw an error themselves and prevent further testing.

2020-06-28 v2.0.4 Enhanced documentation.

2020-06-27 v2.0.3 Added cycle reporting while benchtests are running.

2018-11-23 v2.0.2 Added min and max to reporting.

2018-11-22 v2.0.1 Fixed edge case reporting error where bechtest is used but no tests are benchmarked.

2018-11-21 v2.0.0 Complete re-write of internals to simplify and better use built-in Mocha capability. Performance expectations can now be checked inside of unit tests.

2018-11-18 v1.1.1 Revised performance calculation so that it returns `Infinity` less often. Implemented forced garbage collection where v8 supports it.

2018-11-17 v1.1.0 Test suite divisions now supported. Optimized for more precision and reduced variance across test cycles.

2018-07-17 v1.0.0 Switched from `benchmark.js` to `mocha`. Mocha is in wider use. Removed serialization. Dramatically simplified. Margin of Error now in milliseconds. Test suite divisions not currently supported, they should be run from separate files.

2018-02-07 v0.0.7b BETA Adjusted results to conform better to spec.

2018-02-06 v0.0.6b BETA Improved test case and example.

2018-02-06 v0.0.5b BETA Modified cycle behavior and functions. Finalized API.

2018-02-05 v0.0.4a ALPHA Removed context on tests. Can't support with Benchmark.js.

2018-02-04 v0.0.3a ALPHA Fixed Node table rendering for results

2018-02-04 v0.0.2a ALPHA Update results spec. Address some context scope issues.

2018-02-04 v0.0.1a ALPHA Initial public release

# License

MIT License

Copyright (c) 2018 Simon Y. Blackwell, AnyWhichWay, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

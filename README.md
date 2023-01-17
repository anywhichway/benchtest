# benchtest v3.0.0a

Integrated performance testing and resource tracking (memory, cpu, Promise, socket, etc) for unit testing. No special tests are needed. Re-uses existing unit tests.

## Installation

```
npm install benchtest --save-dev
```

Note: This is an ALPHA release. For a stable release install 2.0.7 and use the documentation from the install.

```
npm install benchtest@2.0.7 --save-dev
```

# Usage

*Note*: During ALPHA, the instructions apply to Jasmine. It is assumed you have installed and have working (https://jasmine.github.io/)[Jasmine] and Jasmine test specs. Support for other test harness will be added in BETA.

*Note*: Benchtest should only be one part of your performance testing, you should also use simulators that emulate real world conditions and test your code at the application level to assess network impacts, module interactions, etc.

## Node

Benchtest set-up can be done in as little two lines of code for [Node](https://nodejs.org/en/) projects at the head of your test spec file.

```javascript
import {benchtest} from "../index.js";
it = benchtest(it);
```

### Default Behavior

By default all unit tests will now run and collect data regarding performance and Promise, async, memory, and cpu usage by running each test for 100 cycles.

You can add an `afterAll` function to display the results:

```javascript
const metrics = benchtest.metrics(),
    summary = benchtest.summarize(metrics),
    issues = benchtest.issues(summary);
//console.log("Metrics:",JSON.stringify(metrics,null,2));
//console.log("Summary:",JSON.stringify(summary,null,2));
console.log("Issues:",JSON.stringify(issues,null,2));
```

### Configuring Tests

In place of the `timeout` value normally passed as the optional third argument to a test specification, you can pass a configuration object. All properties are optional.

Providing `true` as a value simply turns on tracking. Providing a number ensures the runtime value is either `<=`, `=` depending on item tracked. The `memory`, `performance` and `cpu` metrics require sampling after the initial test is run and if a sample `size` is not provided, it defaults to 1. The other metrics are currently collected before sampling during normal test execution. Memory is sampled before the first and after the last sample cycle. If sampling is not requested for `performance` or `cpu`, a single cycle will be run to collect `memory` metrics.

```javascript
{
  metrics: {
      unresolvedPromises: boolean | number, // ===
      unresolvedAsyncs: boolean | number, // ===
      activeResources: boolean | {
          CloseReq: boolean | number, // ===
          ConnectWrap: boolean | number, // ===
          Timeout: boolean | number, // ===
          TCPSocketWrap: boolean | number, // ===
          TTYWrap: boolean | number // ===
      },
      sample: {
          size: number,
          memory: boolean | {
              rss: boolean | number, // <=  bytes
              heapTotal: boolean | number, // <=  bytes
              heapUsed: boolean | number, // <=  bytes
              external: boolean | number, // <=  bytes
              arrayBuffers: boolean | number// <=  bytes
          },
          performance: boolean | number, // <= float milliseconds to execute
          cpu: boolean | {
              user: boolean | number, // <= microseconds cpu time
              system: boolean | number, // <= microseconds cpu time
              }   
      }
  },
  timeout: number | undefined // milliseconds to wait for test completion
}
```

`unresolvePromises` is the number of Promises that have been created but not resolved. The `unresolvedAsyncs` is the number of async function calls that have not resolved. The `unresolvedPromises` value may be larger than `unresolvedAsyncs`. These are tracked separately because async function calls can't be monkey patched like Promise. Although they return Promises, depending on the underlying engine, they may not use the global Promise class to create their Promises.

If your code uses third party libraries, you may find Promises, asyncs, and other resources being utilized that you did not expect. You can evaluate this by building unit test that only leverage the third party library and not any code that you have written to wrap the library.

*Note*: If you run your test suite from anything but the command line, the tool you use, e.g. WebStorm, VisualStudio, may allocate external memory and you will get false errors when testing with a `memory.external` configuration.

Here are a few examples. See `./sepc/inex.spec.js` for

```javascript
    const garbage = [];
    it("Promise test 1",() => {
        const promise = new Promise(() => {});
        expect(promise).toBeInstanceOf(Promise)
    },{metrics:{unresolvedPromises: 1,unresolvedAsyncs:1}})
    
    it("Promise test 1 - fail",() => {
        const promise = new Promise(() => {});
        expect(promise).toBeInstanceOf(Promise)
    },{metrics:{unresolvedPromises: 0,unresolvedAsyncs:0}})
    
    it("memtest1",() => {
        const text = "".padStart(1024,"a");
    }, {metrics:{memory: {heapUsed:0}}, sample:{performance:true,cpu:true}})
    
    it("memtest2",() => {
        garbage.push("".padStart(1024,"a"));
    },{metrics:{memory: {heapUsed:0}}, sample:{performance:true,cpu:true}})
```

## Browser

Not supported in ALPHA release

## API


## How Benchtest Works

Benchtest redefines the test specification function, monkey patches `Promise`, and uses `async_hooks`, performance.now()`, `process.getActiveResourcesInfo()`, `process.cpuUsage()`, and `process.memoryUsage()` to track absolute and delta values for resources. It also manually manages the garbage collection process. Careful attention has been paid to reporting performance in a manner that is not impacted by the `gc()` calls, although the actual runtime of tests will obviously be impacted by garbage collection.

The redefined test specification runs the original test once to track use of Promises, asyncs, and system resources other than memory. Then a sampling cycle is used for `memory`, `performance` and `cpu` utilization.

## Release History (reverse chronological order)

2023-01-17 v3.0.0a Alpha of complete re-write that supports memory, Promise, timeout, socket and other resource traceability as well as performance testing. Use v2.0.7 for a stable release that only supports performance testing.

2020-09-23 v2.0.7 Codacy driven quality improvements.

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

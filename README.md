# benchtest

Integrated performance testing and resource tracking (memory, cpu, Promise, socket, etc) for unit testing. No special tests are needed. Re-uses existing unit tests for [Mocha](https://mochajs.org/), [Jest](https://jestjs.io/), and [Jasmine](https://jasmine.github.io/).

*Note*: Benchtest should only be one part of your performance testing, you should also use simulators that emulate real world conditions and test your code at the application level to assess network impacts, module interactions, etc.

## Installation

```
npm install benchtest --save-dev
```

Note: This is an BETA release. For a stable release install 2.0.7 and use the documentation from the install.

```
npm install benchtest@2.0.7 --save-dev
```

## Usage

*Note*: It is assumed you have installed and have working test suites and specs for your chosen test harness.

## Node

Benchtest set-up can be done in as little three lines of code for [Node](https://nodejs.org/en/) projects at the head of your test spec file.

```javascript
import {benchtest} from "benchtest";
it = benchtest.it(it);
describe = benchtest.describe(describe);
```

## Browser

Not supported in BETA release.

## Default Behavior

By default, all unit tests with an object as a third argument will run and collect data regarding performance and Promise, async, memory, and cpu usage by running each test for 100 cycles. Unit tests with a number (timeout) or no third argument will run normally.

See [Configuring Tests](#configuring-tests) below for how to use the third argument.

You can add an and `after` function for Mocha or `afterAll` function for `Jest` or `Jasmine` to display the results:

```javascript
const metrics = benchtest.metrics(),
    summary = benchtest.summarize(metrics),
    issues = benchtest.issues(summary);
//console.log("Metrics:",JSON.stringify(metrics,null,2));
//console.log("Summary:",JSON.stringify(summary,null,2));
console.log("Issues:",JSON.stringify(issues,null,2));
```

### Configuring Tests

In place of the `timeout` value normally passed as the optional third argument to a test specification, you can pass a configuration object. All properties are optional. If you do not provide a `metrics` property, then all metrics are collected with a default sample size of 100.

Providing `true` as a value simply turns on tracking so that you can use `metrics()` and `summary(metrics)` to support analysis of you code. Providing a number ensures the runtime value is  `<=` the value provided and will cause unit tests to fail if they do not satisfy the constraint. 

The `memory`, `performance` and `cpu` metrics require sampling after the initial test is run and if a sample `size` is not provided, it defaults to 1. The other metrics are collected before sampling during normal test execution. Memory is sampled before the first and after the last sample cycle. If sampling is not requested for `performance` or `cpu`, a single cycle will be run to collect `memory` metrics.

```javascript
{
    timeout: number | undefined, // milliseconds to wait for test completion
    metrics: {
      unresolvedPromises: boolean | number, // <=
      activeResources: boolean | {
          CloseReq: boolean | number, // <=
          ConnectWrap: boolean | number, // <=
          Timeout: boolean | number, // <=
          TCPSocketWrap: boolean | number, // <=
          TTYWrap: boolean | number // <=
      },
      sample: {
          size: number, // number of sample cycles to run, 100 is usually a good number, < 10 often sqews results
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
    }
}
```

`unresolvePromises` is the number of Promises that have been created but not resolved including async calls.

If your code uses third party libraries, you may find Promises, asyncs, and other resources being utilized that you did not expect. You can evaluate this by building unit test that only leverage the third party library and not any code that you have written to wrap the library.

*Note*: Async calls that return values that do not look like Promises automatically resolve during the Node evaluation cycle even if they are not awaited. Async calls that return Promises in any state or objects with a then property that is a function do not resolve until awaited.

*Note*: If you run your test suite from anything but the command line, the tool you use, e.g. WebStorm, VisualStudio, may allocate memory and you may get false errors when testing with a `memory` configuration.

Here are a few examples. See `./sepc/inex.spec.js` for more examples

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

## API

### function benchtest.describe(function)

`benchtest` takes the test harness suite specification function and returns a redefined function capable of instrumenting tests.

### function benchtest.it(function)

`benchtest` takes the test harness test specification function and returns a redefined function capable of instrumenting tests.

### object metrics()

`metrics` returns an object containing all metrics for tests up to the point at which it is called. For Example:

```json
{
  "main tests ": {
    "async returning primitive": {
      "pendingPromises": 0,
      "expected": {
        "pendingPromises": 0
      }
    },
    "memtest1": {
      "memory": {
        "start": {
          "heapUsed": 20090656
        },
        "finish": {
          "heapUsed": 20090656
        },
        "delta": {
          "heapUsed": 0
        },
        "deltaPct": {
          "heapUsed": "0%"
        }
      },
      "pendingPromises": 0,
      "samples": [
        {
          "cycle": 1
        }
      ],
      "expected": {
        "pendingPromises": false,
        "activeResources": false,
        "memory": {
          "rss": false,
          "heapTotal": false,
          "heapUsed": 0,
          "external": false,
          "arrayBuffers": false
        }
      }
    },
    "memtest2": {
      "memory": {
        "start": {
          "heapUsed": 20124816
        },
        "finish": {
          "heapUsed": 20126040
        },
        "delta": {
          "heapUsed": 1224
        },
        "deltaPct": {
          "heapUsed": "0.00006082043184885144%"
        }
      },
      "pendingPromises": 0,
      "samples": [
        {
          "cycle": 1
        }
      ],
      "expected": {
        "pendingPromises": false,
        "activeResources": false,
        "memory": {
          "rss": false,
          "heapTotal": false,
          "heapUsed": 0,
          "external": false,
          "arrayBuffers": false
        }
      }
    },
    "performance": {
      "samples": [
        {
          "cycle": 1,
          "cpu": {
            "user": 0,
            "system": 0
          },
          "performance": 0.010699987411499023
        },
        {
          "cycle": 2,
          "cpu": {
            "user": 0,
            "system": 0
          },
          "performance": 0.009199976921081543
        },
        {
          "cycle": 3,
          "cpu": {
            "user": 0,
            "system": 0
          },
          "performance": 0.010300040245056152
        },
        {
          "cycle": 4,
          "cpu": {
            "user": 0,
            "system": 0
          },
          "performance": 0.010200023651123047
        },
        {
          "cycle": 5,
          "cpu": {
            "user": 0,
            "system": 0
          },
          "performance": 0.02890002727508545
        }
      ],
      "expected": {
        "sample": {
          "size": 5,
          "cpu": {
            "user": true,
            "system": true
          },
          "performance": true
        }
      }
    }
  }
}
```

### object summarize(object metrics)

`summarize` takes a `metrics` object and returns summarized data. For example:

```json
 {
  "main tests ": {
    "async returning primitive": {
      "cycles": 0,
      "pendingPromises": 0,
      "expected": {
        "pendingPromises": 0
      }
    },
    "memtest1": {
      "cycles": 1,
      "memory": {
        "start": {
          "heapUsed": 20086976
        },
        "finish": {
          "heapUsed": 20086960
        },
        "delta": {
          "heapUsed": -16
        },
        "deltaPct": {
          "heapUsed": "-7.96536024139094e-7%"
        }
      },
      "expected": {
        "memory": {
          "heapUsed": 0
        }
      }
    },
    "memtest2": {
      "cycles": 1,
      "memory": {
        "start": {
          "heapUsed": 20093176
        },
        "finish": {
          "heapUsed": 20094400
        },
        "delta": {
          "heapUsed": 1224
        },
        "deltaPct": {
          "heapUsed": "0.00006091620359072181%"
        }
      },
      "expected": {
        "memory": {
          "heapUsed": 0
        }
      }
    },
    "performance": {
      "cycles": 100,
      "expected": {
        "sample": {
          "size": 100,
          "cpu": {}
        }
      },
      "performance": {
        "count": 100,
        "sum": 0.5365004539489746,
        "max": 0.03100001811981201,
        "avg": 0.005365004539489746,
        "min": 0.003000020980834961,
        "var": 0.00001665002049436464,
        "stdev": 0.004080443663912619
      },
      "opsSec": {
        "count": 100,
        "max": 333331.0021457522,
        "avg": 227690.45705979408,
        "min": 32258.04566097667,
        "var": 4533245263.869028,
        "stdev": 67329.37890600973
      }
    }
  }
}
```

### object issues(object summary)

`isseus` takes a summary data object and returns an object containing test names and metrics that to not satisfy the constraints provide in the configuration object passed as the third argument to a test. For example:

```json
{
  "main tests ": {
    "memtest2": {
      "heapUsed": 1224,
      "expected": {
        "memory": {
          "heapUsed": 0
        }
      }
    }
  }
}
```

## How Benchtest Works

Benchtest redefines the test sutie and test specification functions, monkey patches `Promise`, and uses `async_hooks`, `performance.now()`, `process.getActiveResourcesInfo()`, `process.cpuUsage()`, and `process.memoryUsage()` to track absolute and delta values for resources. It also manually manages the garbage collection process. Careful attention has been paid to reporting performance in a manner that is not impacted by the `gc()` calls, although the actual runtime of tests will obviously be impacted by garbage collection.

The redefined test specification runs the original test once to track use of Promises, asyncs, and system resources other than memory. Then sampling cycles are used for `memory`, `performance` and `cpu` utilization. The memory is tracked by calling `gc()` and getting `memoryUsage()` before any cycles are run and then again after all cycles are run. The `performance` and `cpu` metrics are tracked by calling `performance.now()` and `process.cpuUsage()` before and after each cycle. A `gc()` is called at the end of each cycle outside of the peformance tracking scope.

## Release History (reverse chronological order)

2023-02-10 v3.2.0 Dropped dist directory in favor of index.js at root.

2023-02-06 v3.1.5b Slight adjustments to build configuration.

2023-01-30 v3.0.4b Fixed CJS bundling issue. Optimized, short-circuits when timeout is a number or there is no timeout.

2023-01-30 v3.0.3b Added parcel as build engine.

2023-01-26 v3.0.2b Fixed bug related to collecting `activeResources` issues when reporting. Enhanced documentation.

2023-01-26 v3.0.1b Added `'mocha` and `jest` support. Modified all test boundarys to use `<=`.

2023-01-21 v3.0.5a Improved reporting, enhanced documentation.

2023-01-20 v3.0.4a Improved summary reporting.

2023-01-20 v3.0.3a Corrected how some default metric specs are created. Eliminated remainder of async tracking. Fixed documentation version numbering in history.

2023-01-20 v3.0.2a Adjusted and clarified use of third argument to test spec.

2023-01-20 v3.0.1a Consolidated async and Promise tracking

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

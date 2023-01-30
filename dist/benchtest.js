var $gXNCa$nodeperf_hooks = require("node:perf_hooks");
var $gXNCa$nodeasync_hooks = require("node:async_hooks");
var $gXNCa$nodeprocess = require("node:process");
var $gXNCa$nodevm = require("node:vm");
var $gXNCa$v8 = require("v8");
var $gXNCa$chai = require("chai");
var $gXNCa$mathjsnumber = require("mathjs/number");

var $parcel$global =
typeof globalThis !== 'undefined'
  ? globalThis
  : typeof self !== 'undefined'
  ? self
  : typeof window !== 'undefined'
  ? window
  : typeof global !== 'undefined'
  ? global
  : {};
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "benchtest", () => $4fa36e821943b400$export$195db9932151140f);
$parcel$export(module.exports, "default", () => $4fa36e821943b400$export$195db9932151140f);
/*
MIT License

Copyright (c) 2023 Simon Y. Blackwell, AnyWhichWay, LLC

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
*/ 






(0, ($parcel$interopDefault($gXNCa$v8))).setFlagsFromString("--expose_gc");
const $4fa36e821943b400$var$gc = (0, ($parcel$interopDefault($gXNCa$nodevm))).runInNewContext("gc");
const $4fa36e821943b400$var$asyncTracker = {
    created: new Map(),
    resolved: new Set(),
    rejected: new Set()
}, $4fa36e821943b400$var$asyncHookOptions = {
    init (asyncId, type, triggerAsyncId, resource) {
        if (!$4fa36e821943b400$var$asyncHook.tracking) {
            $4fa36e821943b400$var$asyncHook.tracking = true;
            if (!($4fa36e821943b400$var$asyncTracker.created.has(asyncId) || $4fa36e821943b400$var$asyncTracker.created.has(triggerAsyncId))) $4fa36e821943b400$var$asyncTracker.created.set(asyncId, resource);
            $4fa36e821943b400$var$asyncHook.tracking = false;
        }
    },
    promiseResolve (asyncId) {
        const promise = $4fa36e821943b400$var$asyncTracker.created.get(asyncId);
        if (promise) $4fa36e821943b400$var$asyncTracker.resolved.add(promise);
    }
}, $4fa36e821943b400$var$OldPromise = $parcel$global.Promise, $4fa36e821943b400$var$MonkeyPromise = class Promise1 extends $4fa36e821943b400$var$OldPromise {
    constructor(executor){
        super(executor); // call native Promise constructor
        if (!$4fa36e821943b400$var$MonkeyPromise.tracking) {
            $4fa36e821943b400$var$MonkeyPromise.tracking = true;
            const [asyncId, triggerAsyncId] = Object.getOwnPropertySymbols(this).map((key)=>this[key]);
            if (!($4fa36e821943b400$var$asyncTracker.created.has(asyncId) || $4fa36e821943b400$var$asyncTracker.created.has(triggerAsyncId))) {
                $4fa36e821943b400$var$asyncTracker.created.set(asyncId, this);
                this.then(()=>{
                    $4fa36e821943b400$var$asyncTracker.resolved.add(this);
                });
                this.catch(()=>{
                    $4fa36e821943b400$var$asyncTracker.rejected.add(this);
                });
            // todo rewrite catch to watch fro unhandled rejecttions by counting for calls
            }
            $4fa36e821943b400$var$MonkeyPromise.tracking = false;
        }
    }
}, $4fa36e821943b400$var$asyncHook = (0, ($parcel$interopDefault($gXNCa$nodeasync_hooks))).createHook($4fa36e821943b400$var$asyncHookOptions), $4fa36e821943b400$var$trackAsync = (on)=>{
    if (on) {
        if (!$4fa36e821943b400$var$trackAsync.enabled) {
            $4fa36e821943b400$var$trackAsync.enabled = true;
            Object.values($4fa36e821943b400$var$asyncTracker).forEach((map)=>{
                map.clear();
            });
            $4fa36e821943b400$var$asyncHook.enable();
            $parcel$global.Promise = $4fa36e821943b400$var$MonkeyPromise;
        }
    } else if (!on && $4fa36e821943b400$var$trackAsync.enabled) {
        $4fa36e821943b400$var$trackAsync.enabled = false;
        $4fa36e821943b400$var$asyncHook.disable();
        $parcel$global.Promise = Promise;
    }
};
const $4fa36e821943b400$var$objectDelta = (start, finish)=>{
    return Object.entries(start).reduce((delta, [key, value])=>{
        if (typeof value === "number" && typeof finish[key] === "number") delta[key] = finish[key] - value;
        return delta;
    }, {});
};
const $4fa36e821943b400$var$objectDeltaPercent = (start, finish)=>{
    return Object.entries(start).reduce((delta, [key, value])=>{
        if (typeof value === "number" && typeof finish[key] === "number") delta[key] = finish[key] / value - 1 + "%";
        return delta;
    }, {});
};
const $4fa36e821943b400$var$copyExpected = (expected)=>{
    if (typeof expected !== "object" || expected == null) return expected;
    return Object.entries(expected).reduce((expected, [key, value])=>{
        if (value !== false && value !== true) expected[key] = $4fa36e821943b400$var$copyExpected(value);
        return expected;
    }, {});
};
const $4fa36e821943b400$var$issues = (summary)=>{
    const issues = {};
    Object.entries(summary).forEach(([suiteName, summary])=>{
        issues[suiteName] = {};
        Object.entries(summary).forEach(([testName, testSummary])=>{
            const expected = summary[testName].expected;
            Object.entries(testSummary.memory?.delta || {}).forEach(([memoryType, value])=>{
                if (expected.memory === true && value > 0 || value > expected.memory[memoryType] || expected.memory[memoryType] === undefined && value > 0) {
                    issues[suiteName][testName] ||= {};
                    issues[suiteName][testName][memoryType] = value;
                }
            });
            if (testSummary.pendingPromises > 0 && (expected.pendingPromises === true || testSummary.pendingPromises > expected.pendingPromises)) {
                issues[suiteName][testName] ||= {};
                issues[suiteName][testName].pendingPromises = testSummary.pendingPromises;
            }
            if (testSummary.unresolvedAsyncs > 0 && (expected.unresolvedAsyncs === true || testSummary.unresolvedAsyncs > expected.unresolvedAsyncs)) {
                issues[suiteName][testName] ||= {};
                issues[suiteName][testName].unresolvedAsyncs = testSummary.unresolvedAsyncs;
            }
            Object.entries(testSummary.activeResources || {}).forEach(([resourceType, count])=>{
                if (expected.activeResources == null || expected.activeResources == false) return;
                else if (expected.activeResources !== true && count > 0) expected.activeResources = {};
                if (count > 0 && expected.activeResources === true || expected.activeResources[resourceType] > count || expected.activeResources[resourceType] === undefined) {
                    issues[suiteName][testName] ||= {};
                    issues[suiteName][testName][resourceType] = count;
                }
            });
            if (issues[suiteName][testName]) {
                issues[suiteName][testName].expected = $4fa36e821943b400$var$copyExpected(expected);
                summary[testName].issues = issues[testName];
            }
        });
    });
    return issues;
};
const $4fa36e821943b400$var$summarize = (metrics)=>{
    const summary = {};
    Object.entries(metrics).forEach(([suiteName, metrics])=>{
        summary[suiteName] = {};
        Object.entries(metrics).filter(([key])=>![
                "sample",
                "pendingPromises",
                "activeResources"
            ].includes(key)).forEach(([testName, { memory: memory , pendingPromises: pendingPromises , activeResources: activeResources , samples: samples , expected: expected  }])=>{
            const testSummary = {
                cycles: samples?.length || 0,
                memory: memory,
                pendingPromises: pendingPromises,
                activeResources: activeResources,
                expected: $4fa36e821943b400$var$copyExpected(expected)
            }, durations = [], cputime = {};
            let cpuSampled;
            (samples || []).forEach((sample)=>{
                if (sample.performance != null) durations.push(sample.performance);
                if (sample.cpu != null) Object.entries(sample.cpu).forEach(([cpuType, value])=>{
                    if (expected.sample.cpu[cpuType] !== false) {
                        cpuSampled = true;
                        if (cpuType === "delta") return;
                        cputime[cpuType] ||= [];
                        cputime[cpuType].push(value);
                    }
                });
            });
            if (durations.length > 0) {
                for(let i = 0; i <= 2 && durations.length > 10; i--){
                    const maxi = durations.indexOf((0, $gXNCa$mathjsnumber.max)(durations));
                    durations.splice(maxi, 1);
                    const mini = durations.indexOf((0, $gXNCa$mathjsnumber.min)(durations));
                    durations.splice(mini, 1);
                }
                const performance = testSummary.performance = {};
                Object.defineProperty(performance, "sum", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.sum)(durations);
                    }
                });
                Object.defineProperty(performance, "max", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.max)(durations);
                    }
                });
                Object.defineProperty(performance, "avg", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.mean)(durations);
                    }
                });
                Object.defineProperty(performance, "min", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.min)(durations);
                    }
                });
                Object.defineProperty(performance, "var", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.variance)(durations);
                    }
                });
                Object.defineProperty(performance, "stdev", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.std)(durations);
                    }
                });
                const opsSec = testSummary.opsSec = {}, ops = durations.map((duration)=>1000 / duration);
                Object.defineProperty(opsSec, "max", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.max)(ops);
                    }
                });
                Object.defineProperty(opsSec, "avg", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.mean)(ops);
                    }
                });
                Object.defineProperty(opsSec, "min", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.min)(ops);
                    }
                });
                Object.defineProperty(opsSec, "var", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.variance)(ops);
                    }
                });
                Object.defineProperty(opsSec, "stdev", {
                    enumerable: true,
                    get () {
                        return (0, $gXNCa$mathjsnumber.std)(ops);
                    }
                });
                Object.defineProperty(opsSec, "+/-", {
                    enumerable: true,
                    get () {
                        const diff1 = this.max - this.avg, diff2 = this.avg - this.min;
                        return (Math.max(diff1 / this.avg, diff2 / this.avg) * 100).toFixed(2) + "%";
                    }
                });
            }
            if (cpuSampled) {
                const cpu = testSummary.cpu = {};
                Object.entries(cputime).forEach(([cpuType, values])=>{
                    for(let i = 0; i <= 2 && values.length > 10; i--){
                        const maxi = values.indexOf((0, $gXNCa$mathjsnumber.max)(values));
                        values.splice(maxi, 1);
                        const mini = values.indexOf((0, $gXNCa$mathjsnumber.min)(values));
                        values.splice(mini, 1);
                    }
                    const o = cpu[cpuType] = {};
                    Object.defineProperty(o, "sum", {
                        enumerable: true,
                        get () {
                            return (0, $gXNCa$mathjsnumber.sum)(values);
                        }
                    });
                    Object.defineProperty(o, "max", {
                        enumerable: true,
                        get () {
                            return values.length > 0 ? (0, $gXNCa$mathjsnumber.max)(values) : undefined;
                        }
                    });
                    Object.defineProperty(o, "avg", {
                        enumerable: true,
                        get () {
                            return values.length > 0 ? (0, $gXNCa$mathjsnumber.mean)(values) : undefined;
                        }
                    });
                    Object.defineProperty(o, "min", {
                        enumerable: true,
                        get () {
                            return values.length > 0 ? (0, $gXNCa$mathjsnumber.min)(values) : undefined;
                        }
                    });
                    Object.defineProperty(o, "var", {
                        enumerable: true,
                        get () {
                            return values.length > 0 ? (0, $gXNCa$mathjsnumber.variance)(values) : undefined;
                        }
                    });
                    Object.defineProperty(o, "stdev", {
                        enumerable: true,
                        get () {
                            return values.length > 0 ? (0, $gXNCa$mathjsnumber.std)(values) : undefined;
                        }
                    });
                    Object.defineProperty(o, "+/-", {
                        enumerable: true,
                        get () {
                            if (this.avg === 0) return "0%";
                            const diff1 = this.max - this.avg, diff2 = this.avg - this.min;
                            return (Math.max(diff1 / this.avg, diff2 / this.avg) * 100).toFixed(2) + "%";
                        }
                    });
                });
                delete testSummary.expected.sample.size;
            }
            Object.entries(testSummary).forEach(([key, value])=>{
                if (key === "performance" || key === "cpu" || key === "opsSec") {
                    if (!expected.sample) delete testSummary[key];
                    return;
                }
                if (key !== "expected" && key !== "cycles" && (value === undefined || expected[key] === false || expected[key] == null)) delete testSummary[key];
            });
            summary[suiteName][testName] = testSummary;
        });
    });
    return summary;
};
const $4fa36e821943b400$var$_metrics = {}, $4fa36e821943b400$var$metrics = ()=>{
    return $4fa36e821943b400$var$_metrics;
};
const $4fa36e821943b400$export$195db9932151140f = {};
$4fa36e821943b400$export$195db9932151140f.describe = (describeSpecification)=>(name, fn)=>{
        $4fa36e821943b400$export$195db9932151140f.suiteName = name;
        return describeSpecification(name, fn);
    };
$4fa36e821943b400$export$195db9932151140f.it = $4fa36e821943b400$export$195db9932151140f.test = (testSpecFunction)=>{
    const _testSpecFunction = testSpecFunction;
    return function(name, f, options) {
        let timeout, cycles = 0, metrics;
        if (typeof options === "number" || !options) return _testSpecFunction(name, f, options);
        timeout = options.timeout;
        metrics = options.metrics || {
            memory: true,
            pendingPromises: true,
            activeResources: true,
            sample: {
                size: 100
            }
        };
        cycles = typeof metrics.sample?.size === "number" ? metrics.sample?.size : metrics.sample ? 100 : 0;
        if (typeof metrics.sample === "object" && metrics.sample.cpu == null && metrics.sample.performance == null || metrics.sample) metrics.sample = {
            size: cycles,
            cpu: true,
            performance: true
        };
        if (metrics.sample?.opsSec === true && !metrics.sample.performance) metrics.sample.performance = true;
        else if (typeof metrics.sample?.opsSec === "number" && !metrics.sample.performance) metrics.sample.performance = metrics.sample.opsSec / 1000;
        if (metrics.memory && !cycles) cycles = 1;
        if (typeof metrics.memory === "object") metrics.memory = {
            rss: false,
            heapTotal: false,
            heapUsed: false,
            external: false,
            arrayBuffers: false,
            ...metrics.memory
        };
        if (metrics.sample?.cpu === true) metrics.sample.cpu = {
            user: true,
            system: true
        };
        const expected = {
            ...metrics
        }, _f = f, memory = metrics?.memory ? {} : undefined, AsyncFunction = (async ()=>{}).constructor;
        let sampleMetrics, pendingPromises, active, activeResources;
        if (f.constructor === AsyncFunction) f = async function() {
            //trackAsync(false);
            let error;
            active = (0, ($parcel$interopDefault($gXNCa$nodeprocess))).getActiveResourcesInfo().reduce((resources, item)=>{
                resources[item] ||= 0;
                resources[item]++;
                return resources;
            }, {});
            $4fa36e821943b400$var$trackAsync(true);
            await _f();
            $4fa36e821943b400$var$trackAsync(false);
            if (metrics?.pendingPromises) {
                pendingPromises = $4fa36e821943b400$var$asyncTracker.created.size - ($4fa36e821943b400$var$asyncTracker.resolved.size - $4fa36e821943b400$var$asyncTracker.rejected.size);
                if (typeof metrics.pendingPromises === "number") try {
                    (0, $gXNCa$chai.expect)(pendingPromises).to.be.lessThanOrEqual(metrics.pendingPromises);
                } catch (e) {
                    e.message += " when checking pendingPromises";
                    error = e;
                }
            }
            if (metrics?.activeResources) {
                activeResources = (0, ($parcel$interopDefault($gXNCa$nodeprocess))).getActiveResourcesInfo().reduce((resources, item)=>{
                    resources[item] ||= 0;
                    resources[item]++;
                    return resources;
                }, {});
                Object.entries(activeResources).forEach(([key, value])=>{
                    if (value <= active[key]) delete activeResources[key];
                    else activeResources[key] = activeResources[key] - (active[key] || 0);
                });
                if (typeof metrics.activeResources === "object") for (const [type, value] of Object.entries(metrics.activeResources)){
                    if (typeof value === "number") try {
                        (0, $gXNCa$chai.expect)(activeResources[type]).to.be.lessThanOrEqual(value);
                    } catch (e) {
                        e.message += ` when checking activeResources[${type}]`;
                        error ||= e;
                        break;
                    }
                }
            }
            if (metrics) {
                $4fa36e821943b400$var$gc();
                if (memory) memory.start = (0, ($parcel$interopDefault($gXNCa$nodeprocess))).memoryUsage();
                $4fa36e821943b400$var$gc();
                let cycle = 1;
                while(cycle <= cycles && !error){
                    sampleMetrics ||= [];
                    const sample = {
                        cycle: cycle,
                        cpu: metrics.sample?.cpu ? (0, ($parcel$interopDefault($gXNCa$nodeprocess))).cpuUsage() : undefined,
                        performance: metrics.sample?.performance ? (0, $gXNCa$nodeperf_hooks.performance).now() : undefined
                    };
                    try {
                        await _f();
                    } catch (e) {
                        error = e;
                    } finally{
                        if (sample.performance) {
                            sample.performance = (0, $gXNCa$nodeperf_hooks.performance).now() - sample.performance;
                            if (typeof metrics.sample.performance === "number") try {
                                (0, $gXNCa$chai.expect)(sample.performance).to.be.lessThanOrEqual(metrics.sample.performance);
                            } catch (e) {
                                e.message += ` when checking performance`;
                                error ||= e;
                            }
                        }
                        if (sample.cpu) {
                            sample.cpu = (0, ($parcel$interopDefault($gXNCa$nodeprocess))).cpuUsage(sample.cpu);
                            if (typeof metrics.sample.cpu === "object") for (const [type, max] of Object.entries(metrics.sample.cpu)){
                                if (typeof max === "number") try {
                                    (0, $gXNCa$chai.expect)(sample.cpu[type]).to.be.lessThanOrEqual(max);
                                } catch (e) {
                                    e.message += ` when checking cpu[${type}]`;
                                    error ||= e;
                                    break;
                                }
                                else if (!max) delete sample.cpu[type];
                            }
                        }
                        sampleMetrics.push(sample);
                        $4fa36e821943b400$var$gc();
                        cycle++;
                    }
                }
                if (memory) {
                    $4fa36e821943b400$var$gc();
                    memory.finish = (0, ($parcel$interopDefault($gXNCa$nodeprocess))).memoryUsage();
                    memory.delta = $4fa36e821943b400$var$objectDelta(memory.start, memory.finish);
                    memory.deltaPct = $4fa36e821943b400$var$objectDeltaPercent(memory.start, memory.finish);
                    if (typeof metrics.memory === "object") for (const [type, max] of Object.entries(metrics.memory)){
                        if (typeof max === "number") try {
                            (0, $gXNCa$chai.expect)(memory.delta[type]).to.be.lessThanOrEqual(max);
                        } catch (e) {
                            e.message += ` when checking memory[${type}]`;
                            error ||= e;
                            break;
                        }
                        else if (!max) {
                            delete memory.start[type];
                            delete memory.finish[type];
                            delete memory.delta[type];
                            delete memory.deltaPct[type];
                        }
                    }
                }
                metrics[name] = {
                    memory: memory,
                    pendingPromises: pendingPromises,
                    activeResources: activeResources,
                    samples: sampleMetrics,
                    expected: expected
                };
                Object.entries(metrics[name]).forEach(([key, value])=>{
                    if (value === undefined) delete metrics[name][key];
                });
                $4fa36e821943b400$var$_metrics[suiteName][name] = metrics[name];
                if (error) throw error;
            }
        };
        else f = function() {
            // trackAsync(false);
            let error;
            if (metrics?.pendingPromises != null) pendingPromises = Promise.instances?.size || 0;
            active = (0, ($parcel$interopDefault($gXNCa$nodeprocess))).getActiveResourcesInfo().reduce((resources, item)=>{
                resources[item] ||= 0;
                resources[item]++;
                return resources;
            }, {});
            $4fa36e821943b400$var$trackAsync(true);
            _f();
            $4fa36e821943b400$var$trackAsync(false);
            if (metrics?.pendingPromises != null) {
                pendingPromises = $4fa36e821943b400$var$asyncTracker.created.size - ($4fa36e821943b400$var$asyncTracker.resolved.size - $4fa36e821943b400$var$asyncTracker.rejected.size);
                if (typeof metrics.pendingPromises === "number") try {
                    (0, $gXNCa$chai.expect)(pendingPromises).to.be.lessThanOrEqual(metrics.pendingPromises);
                } catch (e) {
                    e.message += ` when checking pendingPromises`;
                    error = e;
                }
            }
            if (metrics?.activeResources) {
                activeResources = (0, ($parcel$interopDefault($gXNCa$nodeprocess))).getActiveResourcesInfo().reduce((resources, item)=>{
                    resources[item] ||= 0;
                    resources[item]++;
                    return resources;
                }, {});
                Object.entries(activeResources).forEach(([key, value])=>{
                    if (value <= active[key]) delete activeResources[key];
                    else activeResources[key] = activeResources[key] - (active[key] || 0);
                });
                if (typeof metrics.activeResources === "object") for (const [type, value] of Object.entries(metrics.activeResources)){
                    if (typeof value === "number") try {
                        (0, $gXNCa$chai.expect)(activeResources[type]).to.be.lessThanOrEqual(value);
                    } catch (e) {
                        e.message += " when checking activeResources";
                        error ||= e;
                        break;
                    }
                }
            }
            if (metrics) {
                $4fa36e821943b400$var$gc();
                if (memory) {
                    $4fa36e821943b400$var$gc();
                    memory.start = (0, ($parcel$interopDefault($gXNCa$nodeprocess))).memoryUsage();
                    $4fa36e821943b400$var$gc();
                }
                let cycle = 1;
                while(cycle <= cycles && !error){
                    sampleMetrics ||= [];
                    const sample = {
                        cycle: cycle,
                        cpu: metrics.sample?.cpu ? (0, ($parcel$interopDefault($gXNCa$nodeprocess))).cpuUsage() : undefined,
                        performance: metrics.sample?.performance ? (0, $gXNCa$nodeperf_hooks.performance).now() : undefined
                    };
                    try {
                        _f();
                    } catch (e) {
                        error = e;
                    } finally{
                        if (sample.performance) {
                            sample.performance = (0, $gXNCa$nodeperf_hooks.performance).now() - sample.performance;
                            if (typeof metrics.sample.performance === "number") try {
                                (0, $gXNCa$chai.expect)(sample.performance).to.be.lessThanOrEqual(metrics.sample.performance);
                            } catch (e) {
                                e.message += " when checking performance";
                                error ||= e;
                            }
                        }
                        if (sample.cpu) {
                            sample.cpu = (0, ($parcel$interopDefault($gXNCa$nodeprocess))).cpuUsage(sample.cpu);
                            if (typeof metrics.sample.cpu === "object") for (let [type, max] of Object.entries(metrics.sample.cpu)){
                                if (typeof max === "number") try {
                                    (0, $gXNCa$chai.expect)(sample.cpu[type]).to.be.lessThanOrEqual(max);
                                } catch (e) {
                                    e.message += ` when checking cpu[${type}]`;
                                    error ||= e;
                                    break;
                                }
                                else if (!max) delete sample.cpu[type];
                            }
                        }
                        sampleMetrics.push(sample);
                        $4fa36e821943b400$var$gc();
                        cycle++;
                    }
                }
                if (memory) {
                    $4fa36e821943b400$var$gc();
                    memory.finish = (0, ($parcel$interopDefault($gXNCa$nodeprocess))).memoryUsage();
                    memory.delta = $4fa36e821943b400$var$objectDelta(memory.start, memory.finish);
                    memory.deltaPct = $4fa36e821943b400$var$objectDeltaPercent(memory.start, memory.finish);
                    if (typeof metrics.memory === "object") for (let [type, max] of Object.entries(metrics.memory)){
                        if (max === true) max = 0;
                        if (typeof max === "number") try {
                            (0, $gXNCa$chai.expect)(memory.delta[type]).to.be.lessThanOrEqual(max);
                        } catch (e) {
                            e.message += ` when checking memory[${type}]`;
                            error ||= e;
                            break;
                        }
                        else if (!max) {
                            delete memory.start[type];
                            delete memory.finish[type];
                            delete memory.delta[type];
                            delete memory.deltaPct[type];
                        }
                    }
                }
                metrics[name] = {
                    memory: memory,
                    pendingPromises: pendingPromises,
                    activeResources: activeResources,
                    samples: sampleMetrics,
                    expected: expected
                };
                Object.entries(metrics[name]).forEach(([key, value])=>{
                    if (value === undefined) delete metrics[name][key];
                });
                $4fa36e821943b400$var$_metrics[suiteName][name] = metrics[name];
                if (error) throw error;
            }
        };
        const spec = _testSpecFunction(name, f, timeout), suiteName = $4fa36e821943b400$export$195db9932151140f.suiteName;
        $4fa36e821943b400$var$_metrics[suiteName] ||= {};
        return spec;
    };
};
$4fa36e821943b400$export$195db9932151140f.summarize = $4fa36e821943b400$var$summarize;
$4fa36e821943b400$export$195db9932151140f.issues = $4fa36e821943b400$var$issues;
$4fa36e821943b400$export$195db9932151140f.metrics = $4fa36e821943b400$var$metrics;


//# sourceMappingURL=benchtest.js.map

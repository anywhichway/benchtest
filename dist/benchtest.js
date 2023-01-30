import {performance as $5OpyM$performance} from "node:perf_hooks";
import $5OpyM$nodeasync_hooks from "node:async_hooks";
import $5OpyM$nodeprocess from "node:process";
import $5OpyM$nodevm from "node:vm";
import $5OpyM$v8 from "v8";
import {expect as $5OpyM$expect} from "chai";
import {max as $5OpyM$max, min as $5OpyM$min, sum as $5OpyM$sum, mean as $5OpyM$mean, variance as $5OpyM$variance, std as $5OpyM$std} from "mathjs/number";

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






(0, $5OpyM$v8).setFlagsFromString("--expose_gc");
const $cf838c15c8b009ba$var$gc = (0, $5OpyM$nodevm).runInNewContext("gc");
const $cf838c15c8b009ba$var$asyncTracker = {
    created: new Map(),
    resolved: new Set(),
    rejected: new Set()
}, $cf838c15c8b009ba$var$asyncHookOptions = {
    init (asyncId, type, triggerAsyncId, resource) {
        if (!$cf838c15c8b009ba$var$asyncHook.tracking) {
            $cf838c15c8b009ba$var$asyncHook.tracking = true;
            if (!($cf838c15c8b009ba$var$asyncTracker.created.has(asyncId) || $cf838c15c8b009ba$var$asyncTracker.created.has(triggerAsyncId))) $cf838c15c8b009ba$var$asyncTracker.created.set(asyncId, resource);
            $cf838c15c8b009ba$var$asyncHook.tracking = false;
        }
    },
    promiseResolve (asyncId) {
        const promise = $cf838c15c8b009ba$var$asyncTracker.created.get(asyncId);
        if (promise) $cf838c15c8b009ba$var$asyncTracker.resolved.add(promise);
    }
}, $cf838c15c8b009ba$var$OldPromise = $parcel$global.Promise, $cf838c15c8b009ba$var$MonkeyPromise = class Promise1 extends $cf838c15c8b009ba$var$OldPromise {
    constructor(executor){
        super(executor); // call native Promise constructor
        if (!$cf838c15c8b009ba$var$MonkeyPromise.tracking) {
            $cf838c15c8b009ba$var$MonkeyPromise.tracking = true;
            const [asyncId, triggerAsyncId] = Object.getOwnPropertySymbols(this).map((key)=>this[key]);
            if (!($cf838c15c8b009ba$var$asyncTracker.created.has(asyncId) || $cf838c15c8b009ba$var$asyncTracker.created.has(triggerAsyncId))) {
                $cf838c15c8b009ba$var$asyncTracker.created.set(asyncId, this);
                this.then(()=>{
                    $cf838c15c8b009ba$var$asyncTracker.resolved.add(this);
                });
                this.catch(()=>{
                    $cf838c15c8b009ba$var$asyncTracker.rejected.add(this);
                });
            // todo rewrite catch to watch fro unhandled rejecttions by counting for calls
            }
            $cf838c15c8b009ba$var$MonkeyPromise.tracking = false;
        }
    }
}, $cf838c15c8b009ba$var$asyncHook = (0, $5OpyM$nodeasync_hooks).createHook($cf838c15c8b009ba$var$asyncHookOptions), $cf838c15c8b009ba$var$trackAsync = (on)=>{
    if (on) {
        if (!$cf838c15c8b009ba$var$trackAsync.enabled) {
            $cf838c15c8b009ba$var$trackAsync.enabled = true;
            Object.values($cf838c15c8b009ba$var$asyncTracker).forEach((map)=>{
                map.clear();
            });
            $cf838c15c8b009ba$var$asyncHook.enable();
            $parcel$global.Promise = $cf838c15c8b009ba$var$MonkeyPromise;
        }
    } else if (!on && $cf838c15c8b009ba$var$trackAsync.enabled) {
        $cf838c15c8b009ba$var$trackAsync.enabled = false;
        $cf838c15c8b009ba$var$asyncHook.disable();
        $parcel$global.Promise = Promise;
    }
};
const $cf838c15c8b009ba$var$objectDelta = (start, finish)=>{
    return Object.entries(start).reduce((delta, [key, value])=>{
        if (typeof value === "number" && typeof finish[key] === "number") delta[key] = finish[key] - value;
        return delta;
    }, {});
};
const $cf838c15c8b009ba$var$objectDeltaPercent = (start, finish)=>{
    return Object.entries(start).reduce((delta, [key, value])=>{
        if (typeof value === "number" && typeof finish[key] === "number") delta[key] = finish[key] / value - 1 + "%";
        return delta;
    }, {});
};
const $cf838c15c8b009ba$var$copyExpected = (expected)=>{
    if (typeof expected !== "object" || expected == null) return expected;
    return Object.entries(expected).reduce((expected, [key, value])=>{
        if (value !== false && value !== true) expected[key] = $cf838c15c8b009ba$var$copyExpected(value);
        return expected;
    }, {});
};
const $cf838c15c8b009ba$var$issues = (summary)=>{
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
                issues[suiteName][testName].expected = $cf838c15c8b009ba$var$copyExpected(expected);
                summary[testName].issues = issues[testName];
            }
        });
    });
    return issues;
};
const $cf838c15c8b009ba$var$summarize = (metrics)=>{
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
                expected: $cf838c15c8b009ba$var$copyExpected(expected)
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
                    const maxi = durations.indexOf((0, $5OpyM$max)(durations));
                    durations.splice(maxi, 1);
                    const mini = durations.indexOf((0, $5OpyM$min)(durations));
                    durations.splice(mini, 1);
                }
                const performance = testSummary.performance = {};
                Object.defineProperty(performance, "sum", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$sum)(durations);
                    }
                });
                Object.defineProperty(performance, "max", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$max)(durations);
                    }
                });
                Object.defineProperty(performance, "avg", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$mean)(durations);
                    }
                });
                Object.defineProperty(performance, "min", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$min)(durations);
                    }
                });
                Object.defineProperty(performance, "var", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$variance)(durations);
                    }
                });
                Object.defineProperty(performance, "stdev", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$std)(durations);
                    }
                });
                const opsSec = testSummary.opsSec = {}, ops = durations.map((duration)=>1000 / duration);
                Object.defineProperty(opsSec, "max", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$max)(ops);
                    }
                });
                Object.defineProperty(opsSec, "avg", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$mean)(ops);
                    }
                });
                Object.defineProperty(opsSec, "min", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$min)(ops);
                    }
                });
                Object.defineProperty(opsSec, "var", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$variance)(ops);
                    }
                });
                Object.defineProperty(opsSec, "stdev", {
                    enumerable: true,
                    get () {
                        return (0, $5OpyM$std)(ops);
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
                        const maxi = values.indexOf((0, $5OpyM$max)(values));
                        values.splice(maxi, 1);
                        const mini = values.indexOf((0, $5OpyM$min)(values));
                        values.splice(mini, 1);
                    }
                    const o = cpu[cpuType] = {};
                    Object.defineProperty(o, "sum", {
                        enumerable: true,
                        get () {
                            return (0, $5OpyM$sum)(values);
                        }
                    });
                    Object.defineProperty(o, "max", {
                        enumerable: true,
                        get () {
                            return values.length > 0 ? (0, $5OpyM$max)(values) : undefined;
                        }
                    });
                    Object.defineProperty(o, "avg", {
                        enumerable: true,
                        get () {
                            return values.length > 0 ? (0, $5OpyM$mean)(values) : undefined;
                        }
                    });
                    Object.defineProperty(o, "min", {
                        enumerable: true,
                        get () {
                            return values.length > 0 ? (0, $5OpyM$min)(values) : undefined;
                        }
                    });
                    Object.defineProperty(o, "var", {
                        enumerable: true,
                        get () {
                            return values.length > 0 ? (0, $5OpyM$variance)(values) : undefined;
                        }
                    });
                    Object.defineProperty(o, "stdev", {
                        enumerable: true,
                        get () {
                            return values.length > 0 ? (0, $5OpyM$std)(values) : undefined;
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
const $cf838c15c8b009ba$var$_metrics = {}, $cf838c15c8b009ba$var$metrics = ()=>{
    return $cf838c15c8b009ba$var$_metrics;
};
const $cf838c15c8b009ba$export$195db9932151140f = {};
$cf838c15c8b009ba$export$195db9932151140f.describe = (describeSpecification)=>(name, fn)=>{
        $cf838c15c8b009ba$export$195db9932151140f.suiteName = name;
        return describeSpecification(name, fn);
    };
$cf838c15c8b009ba$export$195db9932151140f.it = $cf838c15c8b009ba$export$195db9932151140f.test = (testSpecFunction)=>{
    const _testSpecFunction = testSpecFunction;
    return function(name, f, options) {
        let timeout, cycles = 0, metrics;
        if (typeof options === "number" || !options) {
            metrics = {};
            timeout = options;
        } else {
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
        }
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
            active = (0, $5OpyM$nodeprocess).getActiveResourcesInfo().reduce((resources, item)=>{
                resources[item] ||= 0;
                resources[item]++;
                return resources;
            }, {});
            $cf838c15c8b009ba$var$trackAsync(true);
            await _f();
            $cf838c15c8b009ba$var$trackAsync(false);
            if (metrics?.pendingPromises) {
                pendingPromises = $cf838c15c8b009ba$var$asyncTracker.created.size - ($cf838c15c8b009ba$var$asyncTracker.resolved.size - $cf838c15c8b009ba$var$asyncTracker.rejected.size);
                if (typeof metrics.pendingPromises === "number") try {
                    (0, $5OpyM$expect)(pendingPromises).to.be.lessThanOrEqual(metrics.pendingPromises);
                } catch (e) {
                    e.message += " when checking pendingPromises";
                    error = e;
                }
            }
            if (metrics?.activeResources) {
                activeResources = (0, $5OpyM$nodeprocess).getActiveResourcesInfo().reduce((resources, item)=>{
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
                        (0, $5OpyM$expect)(activeResources[type]).to.be.lessThanOrEqual(value);
                    } catch (e) {
                        e.message += ` when checking activeResources[${type}]`;
                        error ||= e;
                        break;
                    }
                }
            }
            if (metrics) {
                $cf838c15c8b009ba$var$gc();
                if (memory) memory.start = (0, $5OpyM$nodeprocess).memoryUsage();
                $cf838c15c8b009ba$var$gc();
                let cycle = 1;
                while(cycle <= cycles && !error){
                    sampleMetrics ||= [];
                    const sample = {
                        cycle: cycle,
                        cpu: metrics.sample?.cpu ? (0, $5OpyM$nodeprocess).cpuUsage() : undefined,
                        performance: metrics.sample?.performance ? (0, $5OpyM$performance).now() : undefined
                    };
                    try {
                        await _f();
                    } catch (e) {
                        error = e;
                    } finally{
                        if (sample.performance) {
                            sample.performance = (0, $5OpyM$performance).now() - sample.performance;
                            if (typeof metrics.sample.performance === "number") try {
                                (0, $5OpyM$expect)(sample.performance).to.be.lessThanOrEqual(metrics.sample.performance);
                            } catch (e) {
                                e.message += ` when checking performance`;
                                error ||= e;
                            }
                        }
                        if (sample.cpu) {
                            sample.cpu = (0, $5OpyM$nodeprocess).cpuUsage(sample.cpu);
                            if (typeof metrics.sample.cpu === "object") for (const [type, max] of Object.entries(metrics.sample.cpu)){
                                if (typeof max === "number") try {
                                    (0, $5OpyM$expect)(sample.cpu[type]).to.be.lessThanOrEqual(max);
                                } catch (e) {
                                    e.message += ` when checking cpu[${type}]`;
                                    error ||= e;
                                    break;
                                }
                                else if (!max) delete sample.cpu[type];
                            }
                        }
                        sampleMetrics.push(sample);
                        $cf838c15c8b009ba$var$gc();
                        cycle++;
                    }
                }
                if (memory) {
                    $cf838c15c8b009ba$var$gc();
                    memory.finish = (0, $5OpyM$nodeprocess).memoryUsage();
                    memory.delta = $cf838c15c8b009ba$var$objectDelta(memory.start, memory.finish);
                    memory.deltaPct = $cf838c15c8b009ba$var$objectDeltaPercent(memory.start, memory.finish);
                    if (typeof metrics.memory === "object") for (const [type, max] of Object.entries(metrics.memory)){
                        if (typeof max === "number") try {
                            (0, $5OpyM$expect)(memory.delta[type]).to.be.lessThanOrEqual(max);
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
                $cf838c15c8b009ba$var$_metrics[suiteName][name] = metrics[name];
                if (error) throw error;
            }
        };
        else f = function() {
            // trackAsync(false);
            let error;
            if (metrics?.pendingPromises != null) pendingPromises = Promise.instances?.size || 0;
            active = (0, $5OpyM$nodeprocess).getActiveResourcesInfo().reduce((resources, item)=>{
                resources[item] ||= 0;
                resources[item]++;
                return resources;
            }, {});
            $cf838c15c8b009ba$var$trackAsync(true);
            _f();
            $cf838c15c8b009ba$var$trackAsync(false);
            if (metrics?.pendingPromises != null) {
                pendingPromises = $cf838c15c8b009ba$var$asyncTracker.created.size - ($cf838c15c8b009ba$var$asyncTracker.resolved.size - $cf838c15c8b009ba$var$asyncTracker.rejected.size);
                if (typeof metrics.pendingPromises === "number") try {
                    (0, $5OpyM$expect)(pendingPromises).to.be.lessThanOrEqual(metrics.pendingPromises);
                } catch (e) {
                    e.message += ` when checking pendingPromises`;
                    error = e;
                }
            }
            if (metrics?.activeResources) {
                activeResources = (0, $5OpyM$nodeprocess).getActiveResourcesInfo().reduce((resources, item)=>{
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
                        (0, $5OpyM$expect)(activeResources[type]).to.be.lessThanOrEqual(value);
                    } catch (e) {
                        e.message += " when checking activeResources";
                        error ||= e;
                        break;
                    }
                }
            }
            if (metrics) {
                $cf838c15c8b009ba$var$gc();
                if (memory) {
                    $cf838c15c8b009ba$var$gc();
                    memory.start = (0, $5OpyM$nodeprocess).memoryUsage();
                    $cf838c15c8b009ba$var$gc();
                }
                let cycle = 1;
                while(cycle <= cycles && !error){
                    sampleMetrics ||= [];
                    const sample = {
                        cycle: cycle,
                        cpu: metrics.sample?.cpu ? (0, $5OpyM$nodeprocess).cpuUsage() : undefined,
                        performance: metrics.sample?.performance ? (0, $5OpyM$performance).now() : undefined
                    };
                    try {
                        _f();
                    } catch (e) {
                        error = e;
                    } finally{
                        if (sample.performance) {
                            sample.performance = (0, $5OpyM$performance).now() - sample.performance;
                            if (typeof metrics.sample.performance === "number") try {
                                (0, $5OpyM$expect)(sample.performance).to.be.lessThanOrEqual(metrics.sample.performance);
                            } catch (e) {
                                e.message += " when checking performance";
                                error ||= e;
                            }
                        }
                        if (sample.cpu) {
                            sample.cpu = (0, $5OpyM$nodeprocess).cpuUsage(sample.cpu);
                            if (typeof metrics.sample.cpu === "object") for (let [type, max] of Object.entries(metrics.sample.cpu)){
                                if (typeof max === "number") try {
                                    (0, $5OpyM$expect)(sample.cpu[type]).to.be.lessThanOrEqual(max);
                                } catch (e) {
                                    e.message += ` when checking cpu[${type}]`;
                                    error ||= e;
                                    break;
                                }
                                else if (!max) delete sample.cpu[type];
                            }
                        }
                        sampleMetrics.push(sample);
                        $cf838c15c8b009ba$var$gc();
                        cycle++;
                    }
                }
                if (memory) {
                    $cf838c15c8b009ba$var$gc();
                    memory.finish = (0, $5OpyM$nodeprocess).memoryUsage();
                    memory.delta = $cf838c15c8b009ba$var$objectDelta(memory.start, memory.finish);
                    memory.deltaPct = $cf838c15c8b009ba$var$objectDeltaPercent(memory.start, memory.finish);
                    if (typeof metrics.memory === "object") for (let [type, max] of Object.entries(metrics.memory)){
                        if (max === true) max = 0;
                        if (typeof max === "number") try {
                            (0, $5OpyM$expect)(memory.delta[type]).to.be.lessThanOrEqual(max);
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
                $cf838c15c8b009ba$var$_metrics[suiteName][name] = metrics[name];
                if (error) throw error;
            }
        };
        const spec = _testSpecFunction(name, f, timeout), suiteName = $cf838c15c8b009ba$export$195db9932151140f.suiteName;
        $cf838c15c8b009ba$var$_metrics[suiteName] ||= {};
        return spec;
    };
};
$cf838c15c8b009ba$export$195db9932151140f.summarize = $cf838c15c8b009ba$var$summarize;
$cf838c15c8b009ba$export$195db9932151140f.issues = $cf838c15c8b009ba$var$issues;
$cf838c15c8b009ba$export$195db9932151140f.metrics = $cf838c15c8b009ba$var$metrics;


export {$cf838c15c8b009ba$export$195db9932151140f as benchtest, $cf838c15c8b009ba$export$195db9932151140f as default};
//# sourceMappingURL=benchtest.js.map

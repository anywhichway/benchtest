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
import { performance } from "node:perf_hooks";
import async_hooks from 'node:async_hooks';
import process from "node:process";
import vm from "node:vm"
import v8 from "v8";

v8.setFlagsFromString('--expose_gc');
const gc = vm.runInNewContext('gc');

import { max, min, mean, std, sum, variance } from 'mathjs/number';

const asyncTracker = {created:new Map(),resolved:new Set(),rejected:new Set()},
    asyncHookOptions = {
        init(asyncId, type, triggerAsyncId, resource){
            if(!asyncHook.tracking) {
                asyncHook.tracking = true;
                if(!(asyncTracker.created.has(asyncId) || asyncTracker.created.has(triggerAsyncId))) {
                    asyncTracker.created.set(asyncId,resource);
                }
                asyncHook.tracking = false;
            }
        },
        promiseResolve(asyncId) {
            const promise = asyncTracker.created.get(asyncId);
            if(promise) {
                asyncTracker.resolved.add(promise);
            }
        }
    },
    OldPromise = global.Promise,
    MonkeyPromise = class Promise extends OldPromise {
        constructor(executor) {
            super(executor); // call native Promise constructor
            if(!MonkeyPromise.tracking) {
                MonkeyPromise.tracking = true;
                const [asyncId,triggerAsyncId] = Object.getOwnPropertySymbols(this).map((key) => this[key]);
                if(!(asyncTracker.created.has(asyncId) || asyncTracker.created.has(triggerAsyncId))) {
                    asyncTracker.created.set(asyncId, this);
                    this.then(() => {
                        asyncTracker.resolved.add(this);
                    })
                    this.catch(() => {
                        asyncTracker.rejected.add(this);
                    })
                }
                MonkeyPromise.tracking = false;
            }
        }
    },
    asyncHook = async_hooks.createHook(asyncHookOptions),
    trackAsync = (on) => {
        if(on) {
            if(!trackAsync.enabled) {
                trackAsync.enabled = true;
                Object.values(asyncTracker).forEach((map) => {
                    map.clear();
                })
                asyncHook.enable();
                global.Promise = MonkeyPromise;
            }
        } else if(!on && trackAsync.enabled){
            trackAsync.enabled = false;
            asyncHook.disable();
            global.Promise = Promise;
        }
    };

const objectDelta = (start,finish) => {
    return Object.entries(start).reduce((delta,[key,value]) => {
        if(typeof(value)==="number" && typeof(finish[key])==="number") {
            delta[key] = finish[key] - value;
        }
        return delta;
    },{})
}

const objectDeltaPercent = (start,finish) => {
    return Object.entries(start).reduce((delta,[key,value]) => {
        if(typeof(value)==="number" && typeof(finish[key])==="number") {
            delta[key] = ((finish[key] / value) - 1) + "%";
        }
        return delta;
    },{})
}


const issues = (summary) => {
    const issues = {};
    Object.entries(summary).forEach(([suiteName,summary]) => {
        issues[suiteName] = {};
        Object.entries(summary).forEach(([testName,testSummary]) => {
            const expected = summary[testName].expected;
            Object.entries(testSummary.memory?.delta||{}).forEach(([memoryType,value]) => {
                if((expected.memory===true && value>0) || value > expected.memory[memoryType] || (expected.memory[memoryType]===undefined && value>0)) {
                    issues[suiteName][testName] ||= {};
                    issues[suiteName][testName][memoryType] = value;
                }
            })
            if(testSummary.pendingPromises>0 && (expected.pendingPromises===true || testSummary.pendingPromises>expected.pendingPromises)) {
                issues[suiteName][testName] ||= {};
                issues[suiteName][testName].pendingPromises = testSummary.pendingPromises;
            }
            if(testSummary.unresolvedAsyncs>0 && (expected.unresolvedAsyncs===true || testSummary.unresolvedAsyncs>expected.unresolvedAsyncs)) {
                issues[suiteName][testName] ||= {};
                issues[suiteName][testName].unresolvedAsyncs = testSummary.unresolvedAsyncs;
            }
            Object.entries(testSummary.activeResources||{}).forEach(([resourceType,count]) => {
                if((expected.activeResources===true && count>0) || expected.activeResources[resourceType]!==count || (expected.activeResources[resourceType]===undefined && count>0)) {
                    issues[suiteName][testName] ||= {};
                    issues[suiteName][testName][resourceType] = count;
                }
            });
            if(issues[suiteName][testName]) {
                issues[suiteName][testName].expected = expected;
                summary[testName].issues = issues[testName];
            }
        })
    })
    return issues;
}

const summarize = (metrics) => {
    const summary = {};
    Object.entries(metrics).forEach(([suiteName,metrics]) => {
        summary[suiteName] = {};
        Object.entries(metrics).filter(([key]) => !["performance","cpu","memory","pendingPromises","unresolvedAsyncs","activeResources"].includes(key)).forEach(([testName, {memory,pendingPromises,unresolvedAsyncs,activeResources,samples,expected}]) => {
            const testSummary = {cycles:samples?.length||0,memory,pendingPromises,unresolvedAsyncs,activeResources,expected},
                durations = [],
                cputime = {};
            (samples||[]).forEach((sample) => {
                if(metrics.performance) {
                    durations.push(sample.performance);
                }
                if(metrics.cpu) {
                    Object.entries(sample.cpu).forEach(([cpuType,value]) => {
                        if(cpuType==="delta") {
                            return;
                        }
                        cputime[cpuType] ||= [];
                        cputime[cpuType].push(value);
                    })
                }
            })

            if(metrics.performance) {
                const performance = testSummary.performance = {};
                Object.defineProperty(performance,"count",{enumerable:true,get() { return durations.length }});
                Object.defineProperty(performance,"sum",{enumerable:true,get() { return sum(durations)}});
                Object.defineProperty(performance,"max",{enumerable:true,get() { return durations.length>0 ? max(durations) : undefined }});
                Object.defineProperty(performance,"avg",{enumerable:true,get() { return durations.length>0 ? mean(durations) : undefined }});
                Object.defineProperty(performance,"min",{enumerable:true,get() { return durations.length>0 ? min(durations) : undefined }});
                Object.defineProperty(performance,"var",{enumerable:true,get() { return durations.length>0 ? variance(durations) : undefined }});
                Object.defineProperty(performance,"stdev",{enumerable:true,get() { return durations.length>0 ? std(durations) : undefined }});

                const opsSec = testSummary.opsSec = {},
                    ops = durations.map((duration) => 1000 / duration);
                Object.defineProperty(opsSec,"count",{enumerable:true,get() { return ops.length }});
                Object.defineProperty(opsSec,"max",{enumerable:true,get() { return ops.length>0 ? max(ops) : undefined }});
                Object.defineProperty(opsSec,"avg",{enumerable:true,get() { return ops.length>0 ? mean(ops) : undefined }});
                Object.defineProperty(opsSec,"min",{enumerable:true,get() { return ops.length>0 ? min(ops) : undefined }});
                Object.defineProperty(opsSec,"var",{enumerable:true,get() { return ops.length>0 ? variance(ops) : undefined }});
                Object.defineProperty(opsSec,"stdev",{enumerable:true,get() { return ops.length>0 ? std(ops) : undefined }});
            }

            if(metrics.cpu) {
                const cpu = testSummary.cpu = {};
                Object.entries(cputime).forEach(([cpuType,values]) => {
                    const o = cpu[cpuType] = {};
                    Object.defineProperty(o,"count",{enumerable:true,get() { return values.length }});
                    Object.defineProperty(o,"sum",{enumerable:true,get() { return sum(values)}});
                    Object.defineProperty(o,"max",{enumerable:true,get() { return values.length>0 ? max(values) : undefined }});
                    Object.defineProperty(o,"avg",{enumerable:true,get() { return values.length>0 ? mean(values) : undefined }});
                    Object.defineProperty(o,"min",{enumerable:true,get() { return values.length>0 ? min(values) : undefined }});
                    Object.defineProperty(o,"var",{enumerable:true,get() { return values.length>0 ? variance(values) : undefined }});
                    Object.defineProperty(o,"stdev",{enumerable:true,get() { return values.length>0 ? std(values) : undefined }});
                })
            }

            Object.entries(testSummary).forEach(([key,value]) => {
                if(value===undefined) {
                    delete testSummary[key];
                }
            })
            summary[suiteName][testName] = testSummary;
        })
    });
    return summary;
}


const _metrics = {},
    metrics = () => {
        return _metrics
    };

const benchtest = (testSpecFunction) => {
    const _testSpecFunction = testSpecFunction;
    return function(name,f,options) {
        let timeout, cycles = 0, metrics;
        if(typeof(options)==="number" || !options) {
            metrics = {};
            timeout = options;
        } else {
            timeout = options.timeout;
            cycles = typeof(options.sample?.size)==="number" ? options.sample?.size : 100;
            metrics = options.metrics || {memory:true, pendingPromises: true,unresolvedAsyncs:true,activeResources:true, sample:{size:100, cpu:true, performance:true}};
        }
        if(metrics.memory && !cycles) {
            cycles = 1;
        }
        if(typeof(metrics.memory)==="object") {
            metrics.memory = {rss:false,heapTotal:false,heapUsed:false,external:false,arrayBuffers:false,...metrics.memory}
        }
        if(typeof(metrics.sample?.cpu)==="object") {
            metrics.cpu = {user:0,system:0,...metrics.cpu}
        }
        const expected = {...metrics},
            _f = f,
            memory = metrics?.memory ? {} : undefined,
            AsyncFunction = (async ()=>{}).constructor;
        let sampleMetrics,
            pendingPromises,
            unresolvedAsyncs,
            active,
            activeResources;
        if(f.constructor===AsyncFunction) {
            f = async function()  {
                //trackAsync(false);
                let error;
                if(metrics?.pendingPromises) {
                    pendingPromises = Promise.instances?.size||0;
                }
                active = process.getActiveResourcesInfo().reduce((resources,item) => {
                    resources[item] ||= 0;
                    resources[item]++;
                    return resources;
                },{});
                trackAsync(true);
                await _f();
                trackAsync(false);
                if(metrics?.pendingPromises) {
                    pendingPromises = asyncTracker.created.size - (asyncTracker.resolved.size - asyncTracker.rejected.size);
                    if(typeof(metrics.pendingPromises)==="number") {
                        try {
                            expect(pendingPromises).withContext(`unrsolvedPromises`).toBe(metrics.pendingPromises);
                        } catch(e) {
                            error = e;
                        }
                    }
                }
                if(metrics?.activeResources) {
                    activeResources = process.getActiveResourcesInfo().reduce((resources,item) => {
                        resources[item] ||= 0;
                        resources[item]++;
                        return resources;
                    }, {});
                    Object.entries(activeResources).forEach(([key,value]) => {
                        if(value<=active[key]) {
                            delete activeResources[key];
                        } else {
                            activeResources[key] = activeResources[key] - (active[key] || 0)
                        }
                    })
                    if(typeof(metrics.activeResources)==="object") {
                        for(const [type,value] of Object.entries(metrics.activeResources)) {
                            if(typeof(value)==="number") {
                                try {
                                    expect(activeResources[type]).withContext(`activeResources[${type}]`).toBe(value);
                                } catch(e) {
                                    error ||= e;
                                    break;
                                }
                            }
                        }
                    }
                }
                if(metrics) {
                    gc();
                    if(memory) {
                        memory.start = process.memoryUsage();
                    }
                    gc();
                    let cycle = 1;
                    while(cycle<=cycles && !error) {
                        sampleMetrics ||= [];
                        const sample = {
                            cycle,
                            cpu: metrics.sample?.cpu ? process.cpuUsage() : undefined,
                            performance: metrics.sample?.performance ? performance.now() : undefined
                        }
                        try {
                            await _f();
                        } catch(e) {
                            error = e;
                        } finally {
                            if(sample.performance) {
                                sample.performance = performance.now() - sample.performance;
                                if(typeof(metrics.sample.performance)==="number") {
                                    try {
                                        expect(sample.performance).withContext(`performance`).toBeLessThanOrEqual(metrics.sample.performance)
                                    } catch(e) {
                                        error ||= e;
                                    }
                                }
                            }
                            if(sample.cpu) {
                                sample.cpu = process.cpuUsage(sample.cpu);
                                if(typeof(metrics.sample.cpu)==="object") {
                                    for(const [type,max] of Object.entries(metrics.sample.cpu)) {
                                        if(typeof(max)==="number") {
                                            try {
                                                expect(sample.cpu[type]).withContext(`cpu[${type}]`).toBeLessThanOrEqual(max);
                                            } catch(e) {
                                                error ||= e;
                                                break;
                                            }
                                        } else if(!max) {
                                            delete sample.cpu[type];
                                        }
                                    }
                                }
                            }
                            sampleMetrics.push(sample);
                            gc();
                            cycle++;
                        }
                    }
                    if(memory) {
                        gc();
                        memory.finish = process.memoryUsage();
                        memory.delta = objectDelta(memory.start,memory.finish);
                        memory.deltaPct = objectDeltaPercent(memory.start,memory.finish);
                        if(typeof(metrics.memory)==="object") {
                            for(const [type,max] of Object.entries(metrics.memory)) {
                                if(typeof(max)==="number") {
                                    try {
                                        expect(memory.delta[type]).withContext(`memory[${type}]`).toBeLessThanOrEqual(max);
                                    } catch(e) {
                                        error ||= e;
                                        break;
                                    }
                                } else if(!max) {
                                    delete memory.start[type];
                                    delete memory.finish[type];
                                    delete memory.delta[type];
                                    delete memory.deltaPct[type];
                                }
                            }
                        }
                    }
                    metrics[name] = {
                        memory,
                        pendingPromises,
                        unresolvedAsyncs,
                        activeResources,
                        samples: sampleMetrics,
                        expected
                    }
                    Object.entries(metrics[name]).forEach(([key,value]) => {
                        if(value===undefined) {
                            delete metrics[name][key]
                        }
                    })
                    _metrics[suiteName][name] = metrics[name];
                    if(error) {
                        throw error;
                    }
                }
            }
        } else {
            f = function() {
               // trackAsync(false);
                let error;
                if (metrics?.pendingPromises!=null) {
                    pendingPromises = Promise.instances?.size || 0;
                }
                if(metrics?.unresolvedAsyncs!=null) {
                    unresolvedAsyncs = asyncTracker.size;
                }
                active = process.getActiveResourcesInfo().reduce((resources, item) => {
                    resources[item] ||= 0;
                    resources[item]++;
                    return resources;
                }, {});
                trackAsync(true);
                _f();
                trackAsync(false);
                if(metrics?.pendingPromises!=null) {
                    pendingPromises = asyncTracker.created.size - (asyncTracker.resolved.size - asyncTracker.rejected.size);
                    if(typeof(metrics.pendingPromises)==="number") {
                        try {
                            expect(pendingPromises).withContext("pendingPromises").toBe(metrics.pendingPromises);
                        } catch(e) {
                            error = e;
                        }
                    }
                }
                if(metrics?.activeResources) {
                    activeResources = process.getActiveResourcesInfo().reduce((resources, item) => {
                        resources[item] ||= 0;
                        resources[item]++;
                        return resources;
                    }, {});
                    Object.entries(activeResources).forEach(([key, value]) => {
                        if (value <= active[key]) {
                            delete activeResources[key];
                        } else {
                            activeResources[key] = activeResources[key] - (active[key] || 0)
                        }
                    })
                    if(typeof(metrics.activeResources)==="object") {
                        for(const [type,value] of Object.entries(metrics.activeResources)) {
                            if(typeof(value)==="number") {
                                try {
                                    expect(activeResources[type]).withContext(`activeResources[${type}]`).toBe(value);
                                } catch(e) {
                                    error ||= e;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (metrics) {
                    gc();
                    if (memory) {
                        gc();
                        memory.start = process.memoryUsage();
                        gc();
                    }
                    let cycle = 1;
                    while (cycle <= cycles && !error) {
                        sampleMetrics ||= [];
                        const sample = {
                            cycle,
                            cpu: metrics.sample?.cpu ? process.cpuUsage() : undefined,
                            performance: metrics.sample?.performance ? performance.now() : undefined
                        }
                        try {
                            _f();
                        } catch (e) {
                            error = e;
                        } finally {
                            if(sample.performance) {
                                sample.performance = performance.now() - sample.performance;
                                if(typeof(metrics.sample.performance)==="number") {
                                    try {
                                        expect(sample.performance).withContext(`performance`).toBeLessThanOrEqual(metrics.sample.performance)
                                    } catch(e) {
                                        error ||= e;
                                    }
                                }
                            }
                            if (sample.cpu) {
                                sample.cpu = process.cpuUsage(sample.cpu);
                                if(typeof(metrics.cpu)==="object") {
                                    for(let [type,max] of Object.entries(metrics.sample.cpu)) {
                                        if(max===true) {
                                            max = 0;
                                        }
                                        if(typeof(max)==="number") {
                                            try {
                                                expect(sample.cpu[type]).withContext(`cpu[${type}]`).toBeLessThanOrEqual(max);
                                            } catch(e) {
                                                error ||= e;
                                                break;
                                            }
                                        }  else if(!max) {
                                            delete sample.cpu[type];
                                        }
                                    }
                                }
                            }
                            sampleMetrics.push(sample);
                            gc();
                            cycle++;
                        }
                    }
                    if (memory) {
                        gc();
                        memory.finish = process.memoryUsage();
                        memory.delta = objectDelta(memory.start, memory.finish);
                        memory.deltaPct = objectDeltaPercent(memory.start, memory.finish);
                        if(typeof(metrics.memory)==="object") {
                            for(let [type,max] of Object.entries(metrics.memory)) {
                                if(max===true) {
                                    max = 0;
                                }
                                if(typeof(max)==="number") {
                                    try {
                                        expect(memory.delta[type]).withContext(`memory[${type}]`).toBeLessThanOrEqual(max);
                                    } catch(e) {
                                        error ||= e;
                                        break;
                                    }
                                }  else if(!max) {
                                    delete memory.start[type];
                                    delete memory.finish[type];
                                    delete memory.delta[type];
                                    delete memory.deltaPct[type];
                                }
                            }
                        }
                    }
                   metrics[name] = {
                        memory,
                        pendingPromises,
                        unresolvedAsyncs,
                        activeResources,
                        samples: sampleMetrics,
                        expected
                    }
                    Object.entries(metrics[name]).forEach(([key,value]) => {
                        if(value===undefined) {
                            delete metrics[name][key]
                        }
                    })
                    _metrics[suiteName][name] = metrics[name];
                    if (error) {
                        throw error;
                    }
                }
            }
        }
        const spec = _testSpecFunction(name,f,timeout),
            fullName = spec.getFullName(),
            suiteName = fullName.substring(0,fullName.indexOf(name));
        _metrics[suiteName] ||= {};
        return spec;
    }
}

benchtest.summarize = summarize;
benchtest.issues = issues;
benchtest.metrics = metrics;

export {benchtest, benchtest as default}

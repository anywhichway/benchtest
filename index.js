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
import {expect} from "chai";

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
                    // todo rewrite catch to watch fro unhandled rejecttions by counting for calls
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

const copyExpected = (expected) => {
    if(typeof(expected)!=="object" || expected==null) {
        return expected;
    }
    return Object.entries(expected).reduce((expected,[key,value]) => {
        if(value!==false && value!==true) {
            expected[key] = copyExpected(value);
        }
        return expected;
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
                if(expected.activeResources==null ||  expected.activeResources==false) {
                    return;
                } else if(expected.activeResources !== true && count>0) {
                    expected.activeResources = {};
                }
                if(count>0 && (expected.activeResources===true) || expected.activeResources[resourceType]>count || (expected.activeResources[resourceType]===undefined)) {
                    issues[suiteName][testName] ||= {};
                    issues[suiteName][testName][resourceType] = count;
                }
            });
            if(issues[suiteName][testName]) {
                issues[suiteName][testName].expected = copyExpected(expected);
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
        Object.entries(metrics).filter(([key]) => !["sample","pendingPromises","activeResources"].includes(key)).forEach(([testName, {memory,pendingPromises,activeResources,samples,expected}]) => {
            const testSummary = {cycles:samples?.length||0,memory,pendingPromises,activeResources,expected:copyExpected(expected)},
                durations = [],
                cputime = {};
            let cpuSampled;
            (samples||[]).forEach((sample) => {
                if(sample.performance!=null) {
                    durations.push(sample.performance);
                }
                if(sample.cpu!=null) {
                    Object.entries(sample.cpu).forEach(([cpuType,value]) => {
                        if(expected.sample.cpu[cpuType]!==false) {
                            cpuSampled = true;
                            if(cpuType==="delta") {
                                return;
                            }
                            cputime[cpuType] ||= [];
                            cputime[cpuType].push(value);
                        }
                    })
                }
            })

            if(durations.length>0) {
                for(let i=0;i<=2 && durations.length>10;i--) {
                    const maxi = durations.indexOf(max(durations));
                    durations.splice(maxi, 1);
                    const mini = durations.indexOf(min(durations));
                    durations.splice(mini, 1);
                }
                const performance = testSummary.performance = {};
                Object.defineProperty(performance,"sum",{enumerable:true,get() { return sum(durations)}});
                Object.defineProperty(performance,"max",{enumerable:true,get() { return  max(durations)}});
                Object.defineProperty(performance,"avg",{enumerable:true,get() { return  mean(durations)  }});
                Object.defineProperty(performance,"min",{enumerable:true,get() { return min(durations)  }});
                Object.defineProperty(performance,"var",{enumerable:true,get() { return variance(durations) }});
                Object.defineProperty(performance,"stdev",{enumerable:true,get() { return std(durations) }});

                const opsSec = testSummary.opsSec = {},
                    ops = durations.map((duration) => 1000 / duration);
                    Object.defineProperty(opsSec,"max",{enumerable:true,get() { return max(ops)}});
                    Object.defineProperty(opsSec,"avg",{enumerable:true,get() { return mean(ops)}});
                    Object.defineProperty(opsSec,"min",{enumerable:true,get() { return min(ops)}});
                    Object.defineProperty(opsSec,"var",{enumerable:true,get() { return variance(ops)}});
                    Object.defineProperty(opsSec,"stdev",{enumerable:true,get() { return std(ops)}});
                    Object.defineProperty(opsSec,"+/-",{enumerable:true,get()  {
                            const diff1 = this.max - this.avg,
                                diff2 = this.avg - this.min;
                            return (Math.max(diff1/this.avg,diff2/this.avg)*100).toFixed(2) + "%";
                        }})
            }
            if(cpuSampled) {
                const cpu = testSummary.cpu = {};
                Object.entries(cputime).forEach(([cpuType,values]) => {
                    for(let i=0;i<=2 && values.length>10;i--) {
                        const maxi = values.indexOf(max(values));
                        values.splice(maxi, 1);
                        const mini = values.indexOf(min(values));
                        values.splice(mini, 1);
                    }
                    const o = cpu[cpuType] = {};
                    Object.defineProperty(o,"sum",{enumerable:true,get() { return sum(values)}});
                    Object.defineProperty(o,"max",{enumerable:true,get() { return values.length>0 ? max(values) : undefined }});
                    Object.defineProperty(o,"avg",{enumerable:true,get() { return values.length>0 ? mean(values) : undefined }});
                    Object.defineProperty(o,"min",{enumerable:true,get() { return values.length>0 ? min(values) : undefined }});
                    Object.defineProperty(o,"var",{enumerable:true,get() { return values.length>0 ? variance(values) : undefined }});
                    Object.defineProperty(o,"stdev",{enumerable:true,get() { return values.length>0 ? std(values) : undefined }});
                    Object.defineProperty(o,"+/-",{enumerable:true,get()  {
                            if(this.avg===0) {
                                return "0%"
                            }
                            const diff1 = this.max - this.avg,
                                diff2 = this.avg - this.min;
                            return (Math.max(diff1/this.avg,diff2/this.avg)*100).toFixed(2) + "%";
                        }})
                })

                delete testSummary.expected.sample.size;
            }
            Object.entries(testSummary).forEach(([key,value]) => {
                if(key==="performance" || key==="cpu" || key==="opsSec") {
                    if(!expected.sample) {
                        delete testSummary[key];
                    }
                    return;
                }
                if(key!=="expected" && key!=="cycles" &&  (value===undefined || expected[key]===false || expected[key]==null)) {
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

const benchtest = {};

benchtest.describe = (describeSpecification) => (name,fn) => {
    benchtest.suiteName = name;
    return describeSpecification(name,fn);
};

benchtest.it = benchtest.test = (testSpecFunction) => {
    const _testSpecFunction = testSpecFunction;
    return function(name,f,options) {
        let timeout, cycles = 0, metrics;
        if(typeof(options)==="number" || !options) {
            metrics = {};
            timeout = options;
        } else {
            timeout = options.timeout;
            metrics = options.metrics || {memory:true, pendingPromises: true,activeResources:true, sample:{size:100}};
            cycles = typeof(metrics.sample?.size)==="number" ? metrics.sample?.size : (metrics.sample ? 100 : 0);
            if((typeof(metrics.sample)==="object" && metrics.sample.cpu==null && metrics.sample.performance==null) || metrics.sample) {
                metrics.sample = {
                    size: cycles,
                    cpu: true,
                    performance: true
                }
            }
        }
        if(metrics.sample?.opsSec===true && !metrics.sample.performance) {
            metrics.sample.performance = true;
        } else if(typeof(metrics.sample?.opsSec)==="number" && !metrics.sample.performance) {
            metrics.sample.performance = metrics.sample.opsSec / 1000;
        }
        if(metrics.memory && !cycles) {
            cycles = 1;
        }
        if(typeof(metrics.memory)==="object") {
            metrics.memory = {rss:false,heapTotal:false,heapUsed:false,external:false,arrayBuffers:false,...metrics.memory}
        }
        if(metrics.sample?.cpu===true) {
            metrics.sample.cpu = {user:true,system:true}
        }
        const expected = {...metrics},
            _f = f,
            memory = metrics?.memory ? {} : undefined,
            AsyncFunction = (async ()=>{}).constructor;
        let sampleMetrics,
            pendingPromises,
            active,
            activeResources;
        if(f.constructor===AsyncFunction) {
            f = async function()  {
                //trackAsync(false);
                let error;
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
                            expect(pendingPromises).to.be.lessThanOrEqual(metrics.pendingPromises);
                        } catch(e) {
                            e.message += ' when checking pendingPromises';
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
                                    expect(activeResources[type]).to.be.lessThanOrEqual(value);
                                } catch(e) {
                                    e.message += ` when checking activeResources[${type}]`;
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
                                        expect(sample.performance).to.be.lessThanOrEqual(metrics.sample.performance)
                                    } catch(e) {
                                        e.message += ` when checking performance`;
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
                                                expect(sample.cpu[type]).to.be.lessThanOrEqual(max);
                                            } catch(e) {
                                                e.message += ` when checking cpu[${type}]`;
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
                                        expect(memory.delta[type]).to.be.lessThanOrEqual(max);
                                    } catch(e) {
                                        e.message += ` when checking memory[${type}]`;
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
                            expect(pendingPromises).to.be.lessThanOrEqual(metrics.pendingPromises);
                        } catch(e) {
                            e.message += ` when checking pendingPromises`;
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
                                    expect(activeResources[type]).to.be.lessThanOrEqual(value);
                                } catch(e) {
                                    e.message += ' when checking activeResources'
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
                                        expect(sample.performance).to.be.lessThanOrEqual(metrics.sample.performance)
                                    } catch(e) {
                                        e.message += ' when checking performance';
                                        error ||= e;
                                    }
                                }
                            }
                            if (sample.cpu) {
                                sample.cpu = process.cpuUsage(sample.cpu);
                                if(typeof(metrics.sample.cpu)==="object") {
                                    for(let [type,max] of Object.entries(metrics.sample.cpu)) {
                                        if(typeof(max)==="number") {
                                            try {
                                               expect(sample.cpu[type]).to.be.lessThanOrEqual(max);
                                            } catch(e) {
                                                e.message += ` when checking cpu[${type}]`;
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
                                        expect(memory.delta[type]).to.be.lessThanOrEqual(max);
                                    } catch(e) {
                                        e.message += ` when checking memory[${type}]`;
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
            suiteName = benchtest.suiteName;
        _metrics[suiteName] ||= {};
        return spec;
    }
}

benchtest.summarize = summarize;
benchtest.issues = issues;
benchtest.metrics = metrics;

export {benchtest, benchtest as default}

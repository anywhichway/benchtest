/*
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
*/
(function() {
	let perf = typeof(performance)!=="undefined" ? performance : null;
	if(typeof(module)!=="undefined" && typeof(window)==="undefined") {
		perf = {
				now: require("performance-now"),
				memory: {}
		}
		Object.defineProperty(perf.memory,"usedJSHeapSize",{enumerable:true,configurable:true,writable:true,value:0});
	}
	const ELEMENTS_SEEN = new Set(),
		PERFORMANCE_ACCESS_ERROR = new Error("performance access"),
		PERFORMANCE_PROXY = new Proxy({},{
			get(target,property) {
				throw PERFORMANCE_ACCESS_ERROR
			}
		});
	const benchtest = function(runner,{minCycles=10,maxCycles=100,sensitivity=.01,log="md",logStream=console,all,off,only}={}) {
		benchtest.options = {minCycles:Math.min(minCycles,maxCycles),maxCycles,sensitivity,log,logStream,all,off,only};
		if(runner) {
			runner.on("suite", suite => {
				beforeEach.call(suite,benchtest.test);
				after.call(suite,() => {
					benchtest.report(suite);
					const messages = document.getElementById("messages");
					if(messages) {
						messages.innerHTML = ``
					}
				});
			});
			if(typeof(window!=="undefined")) {
				runner.on("pass",function(test) {
					if(benchtest.testable(test)) {
						const elements = document.getElementsByTagName("H2");
						for(const element of [].slice.call(elements)) {
							if(element.innerText.indexOf(test.title)===0 && !ELEMENTS_SEEN.has(element)) {
								ELEMENTS_SEEN.add(element);
								const span = document.createElement("span"),
									duration = test.performance.duration,
									ops = Math.round(1000/duration),
									variability = Math.round(test.performance.sensitivity*10000/duration)+"",
									max = Math.round(1000/test.performance.min)+"",
									min = Math.round(1000/test.performance.max)+"";
								span.className = "speed";
								span.innerText = ` ${ops} sec +/- ${duration===0 && variability===Infinity ? 0 : variability} min: ${min} max: ${max} ${test.performance.cycles} samples`;
								element.insertBefore(span,element.firstElementChild);
								break;
							}
						}
					}
				});
			}
		}
		return runner;
	};
	benchtest.options = {minCycles:10,maxCycles:100,sensitivity:.01,log:"md",logStream:console};
	benchtest.report = function(doneOrSuite) {
		let widths = {
				title: 4,
				ops: 7,
				variability: 3,
				min: 3,
				max: 3,
				cycles: 6
		};
		const done = typeof(doneOrSuite)==="function" ? doneOrSuite : () => {},
				suite =  typeof(doneOrSuite)==="function" ? SUITE : doneOrSuite;
		if(!suite || !suite.tests) return;
		widths.title = Math.max(suite.title.length,4);
		const results = suite.tests.filter(test => test.performance!=null).map(test => {
			const duration = test.performance.duration,
				ops = Math.round(1000/duration)+"",
				variability = Math.round(test.performance.sensitivity*10000/duration)+"",
				max = Math.round(1000/test.performance.min)+"",
				min = Math.round(1000/test.performance.max)+"",
				cycles = test.performance.cycles+"",
				errors = test.performance.errors+"",
				result = {title:test.title,ops,variability,cycles,min,max,errors};
			widths.title = Math.max(result.title.length,widths.title);
			widths.ops = Math.max(ops.length,widths.ops);
			widths.variability = Math.max(variability.length,widths.variability);
			widths.min = Math.max(min.length,widths.min);
			widths.max = Math.max(max.length,widths.max);
			widths.cycles = Math.max(cycles.length,widths.cycles);
			widths.errors = Math.max(errors.length,widths.errors||"Errors ".length);
			return result;
		});
		if(results.length>0) {
			const {log,logStream} = benchtest.options;
			if(log==="md") {
				const	head = `| ${suite.title.padEnd(widths.title," ")} | ${"Ops/Sec".padStart(widths.ops," ")} | ${"+/-".padStart(widths.variability," ")} | ${"Min".padStart(widths.min," ")} | ${"Max".padStart(widths.max," ")} | ${"Sample".padStart(widths.cycles," ")} | ${"Errors".padStart(widths.errors," ")}|\n`,
					line = `| ${"-".padEnd(widths.title,"-")} | ${"-".padEnd(widths.ops,"-")}:| ${"-".padEnd(widths.variability,"-")}:| ${"-".padEnd(widths.min,"-")}:| ${"-".padEnd(widths.max,"-")}:| ${"-".padEnd(widths.cycles,"-")}:| ${"-".padEnd(widths.errors,"-")} | \n`,
					body = results.reduce((accum,result) => {
						accum += `| ${result.title.padEnd(widths.title," ")} | ${result.ops.padStart(widths.ops," ")} | ${result.variability.padStart(widths.variability," ")} | ${result.min.padStart(widths.min," ")} | ${result.max.padStart(widths.max," ")} | ${result.cycles.padStart(widths.cycles," ")} | ${result.errors.padStart(widths.errors," ")} |\n`;
						return accum;
					},"")
					logStream.log(head+line+body);
			} else if(log==="json") {
				logStream.log(results);
			}
		}
		done();
	};
	let SUITE;
	benchtest.test = async function() {
		const test = arguments[0] || this.currentTest; // don't move arguments[0] to an arg, it breaks Mocha
		if(benchtest.testable(test)) {
			const messages = document.getElementById("messages");
			// declare all variables outside test loop to reduce garbage collection impact
			if(test.parent!==SUITE) {
				SUITE = test.parent;
			}
			const {maxCycles,minCycles,sensitivity} = benchtest.options,
				fn = test.fn;
			let min = Infinity,
				max = -Infinity,
				mean,
				variance,
				resolved,
				begin,
				end = null,
				done = value => { end = perf.now(); resolved = value; return value; },
				duration,
				previous = 0,
				delta,
				start = perf.now(),
				cycles = 0,
				timeout = 0,
				perftime = Math.abs(perf.now()-perf.now());
				computetime = 0,
				durations = [];
			// make test object accessable inside of test
			test.fn = fn.bind(test);
			// use a special proxy so that performance checks are essentailly disabled during test loop
			test.performance = PERFORMANCE_PROXY;
			let errors = 0;
			while(++cycles<maxCycles) {
				if(messages) {
					messages.innerHTML = `Benchtesting ${test.title} cycle ${cycles} ...`
				}
				begin = perf.now();
				try {
					result = await test.fn.call(this,done);
				} catch(e) {
					if(e!==PERFORMANCE_ACCESS_ERROR) {
						errors++;
						continue;
					}
				}
				if(end===null) end = perf.now();
				duration = Math.max(0,(end - begin) - (perftime + computetime));
				begin = perf.now();
				if(timeout===0 && test._timeout>0) {
					this.timeout(test._timeout*(maxCycles+5))
				}
				durations.push(duration);
				delta = Math.abs(duration - previous) / duration;
				max = Math.max(duration,max);
				min = Math.min(duration,min);
				mean = durations.reduce((accum,duration) => accum += duration,0) / durations.length;
				variance = durations.map(duration => duration - mean).reduce((accum,duration) => accum += duration * duration,0)/durations.length;
				// exit if sensitivity criteria met and minCycles have been run
				if(variance / mean <= sensitivity && cycles >= minCycles) {
					computetime += (perf.now() - begin) + perftime;
					break;
				}
				if(variance / mean > 5 && cycles >= minCycles) {
					durations.pop(); // throw out probable GC
				} else {
					previous = duration;
				}
				end = null;
				computetime += (perf.now() - begin) + perftime;
			}
			duration = durations.filter(duration => duration<=0).length / durations.length >= 0.8 ? 0 : (perf.now() - (start + computetime + perftime)) / cycles;
			//duration = (perf.now() - start - computetime - perftime) / cycles;
			const revised = durations.filter(duration => duration!==min && duration!==max);
			const avg = revised.reduce((accum,duration) => accum += duration,0)/revised.length;
			test.performance = {cycles,duration,min,max,sensitivity,errors};
		}
	}
	benchtest.testable = function(test) {
		return test.title[test.title.length-1]==="#";
	}
	if(typeof(module)!=="undefined") module.exports = benchtest;
	if(typeof(window)!=="undefined") window.benchtest = benchtest;
	
}).call(this);
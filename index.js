(function() {
	var perf = typeof(performance)!=="undefined" ? performance : null;
	if(typeof(module)!=="undefined" && typeof(window)==="undefined") {
		perf = {
				now: require("performance-now"),
				memory: {}
		}
		Object.defineProperty(perf.memory,"usedJSHeapSize",{enumerable:true,configurable:true,writable:true,value:0});
	}
	const Table = require("markdown-table"),
		showResults = (logType,stream,results) => {
			if(typeof(window)!=="undefined") {
				const elementsSeen = new Set();
				results.forEach(([test,ops_sec,plus_minus,sample]) => {
					const elements = document.getElementsByTagName("H2");
					for(const element of [].slice.call(elements)) {
						if(element.innerText.indexOf(test.title)===0 && !elementsSeen.has(element)) {
							elementsSeen.add(element);
							const span = document.createElement("span");
							span.className = "speed";
							span.innerText = ` ${ops_sec} sec +/- ${plus_minus} ${sample} samples`;
							element.insertBefore(span,element.firstElementChild);
							break;
						}
					}
				});
			}
			if(logType) {
				results = results.map(item => { item[0] = item[0].title; return item;});
				// add table header
			  results.unshift(["Name","Ops/Sec","+/-","Sample Size"]); //"Memory Used",
			  if(logType==="md") {
			  	const statistics = Table(results);
			  	stream.log(statistics);
			  	return;
			  }
		  	stream.log(results);
			}
		},
		tests = [],
		registered = new Map();
		benchtest = (runner,options={}) => {
					runner.on("suite", suite => {
						if(options.only) {
							suite.tests = suite.tests.reduce((accum,test) => {
								benchtest.register(test);
								if(benchtest.testable(test)) {
									accum.push(test);
								}
								return accum;
							},[]);
						}
					});
				runner.on("pass", test => {
					benchtest.test(test);
				});
				runner.on("end",() => {
					benchtest.run(options);
				});
				return runner;
		};
	// Mocha disposes of functions after test, so we have to cache them
	benchtest.register = function(test) {
		registered.set(test,test.fn);
	}
	benchtest.run = async function run(runOptions) {
		let {minCycles,maxCycles,sensitivity,log,logStream,all,off} = runOptions;
		if(!minCycles) minCycles=10;
		if(!maxCycles) maxCycles=100;
		if(!sensitivity) sensitivity=.01;
		if(!logStream) logStream=console;
		if(minCycles>maxCycles) maxCycles = minCycles;
		if(off) {
			console.log("Performance testing off");
			return;
		}
		this.all = all;
		console.log("Performance testing ...");
		const results = [];
		let overhead = 0, //((start) => perf.now() - start)(perf.now()),
			parent;
		for(const test of tests) {
			if(all || this.testable(test)) {
				// declare variables outside test block to minimize chance of performance impact
				let f = registered.get(test),
					min = Infinity,
					max = -Infinity,
					prev = 0,
					i = maxCycles,
					sample = 0,
					heapsize = (perf && perf.memory ? perf.memory.usedJSHeapSize : 0),
					duration,
					delta,
					resolved,
					returned,
					start,
					end,
					done = value => { end = perf.now(); resolved = value; return value; };
				if(!f) f = new Function("return " + test.body)(test.ctx);
				const samples = [];
				try {
					while(i--) { // break after maxCycles
						end = 0;
						start = perf.now();
						returned = await f(done);
						if(!end) end = perf.now(); // unit test may have simply generated a resolved promise;
						if(resolved && typeof(resolved)==="object" && resolved instanceof Error) {
							throw resolved; // skip error producing functions
						}
						sample++;
						duration = (end - start) - overhead;
						delta = Math.abs(duration - prev)/duration;
						// break when things are not changing
						if(delta < sensitivity && sample > minCycles) break;
						samples.push(duration)
						prev = duration;
					}
					// if 80% of samples have a zero duration, assume any slower are due to garbage collection
					const zeros = samples.filter(duration => duration===0);
					if(zeros.length/samples.length>=.80) {
						duration = 0;
						max = 0;
						min = 0;
						sample = zeros.length;
					} else {
						duration = samples.reduce((accum,duration) => { min = Math.min(duration,min); max = Math.max(duration,max); return accum += duration},0) / samples.length;
					}
					const ops_sec = Math.round((1000/duration)),
						plus_minus = Math.round(max-min),
						heapused = (perf && perf.memory ? perf.memory.usedJSHeapSize : 0) - heapsize;
					if(test.parent && test.parent.title!==parent) {
						parent = test.parent.title;
						results.push([{title:"***"+parent}]);
					}
					results.push([test,ops_sec,plus_minus,sample]); //heapused/sample,
				} catch(e) {
					console.log(e)
				}
			}
		}
		showResults(log,logStream,results);
	}
	benchtest.test = test => {
		// only benchtest tests that pass
		if(test.state==="passed") tests.push(test); 
		return test;
	}
	benchtest.testable = function(test) {
		return test.title[test.title.length-1]==="#";
	}
	if(typeof(module)!=="undefined") module.exports = benchtest;
	if(typeof(window)!=="undefined") window.benchtest = benchtest;
	
}).call(this);
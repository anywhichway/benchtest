(function() {
	var perf = typeof(performance)!=="undefined" ? performance : null;
	if(typeof(module)!=="undefined" && typeof(window)==="undefined") {
		perf = {
				now: require("performance-now")
		}
	}
	const Table = require("markdown-table"),
		showResults = (logType,stream,results) => {
			// add table header
		  results.unshift(["Name","Ops/Sec","+/- Msec","Sample Size"]);
		  if(logType==="md") {
		  	const statistics = Table(results);
		  	stream.log(statistics);
		  	return;
		  }
	  	stream.log(results);
		},
		tests = [],
		benchtest = (runner,options={}) => {
				if(options.only) {
					runner.on("suite", suite => {
						suite.tests = suite.tests.reduce((accum,test) => {
							if(benchtest.testable(test)) {
								accum.push(test);
							}
							return accum;
						},[]);
					});
				}
				runner.on("pass", test => {
					benchtest.test(test);
				});
				runner.on("end",() => {
					benchtest.run(options);
				});
				return runner;
		};
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
		// move the overhead test to the front of the queue
		let i = tests.findIndex(test => test.title[test.title.length-2]==="#" && test.title[test.title.length-1]==="#"),
			test = i>=0 ? tests[i] : null,
			hasoverhead = i!==-1;
		if(test) {
			tests.splice(i,1);
			tests.unshift(test)
		}
		const results = [],
			elementsSeen = new Set(); // for browser unpdates
		let overhead;
		for(const test of tests) {
			if(all || this.testable(test)) {
				try {
					const f = new Function("return " + test.body)(test.ctx);
					let i = maxCycles,
						j = 0,
						duration = 0,
						avg = 0,
						prev = 0,
						min = Infinity,
						max = -Infinity;
					while(i--) { // break after maxCycles
						let resolved;
						const start = perf.now(),
								returned = f(value => resolved = value);
						if(resolved && typeof(resolved)==="object" && resolved instanceof Error) {
							continue; // skip error producing functions
						}
						j++;
						duration = perf.now() - start;
						min = Math.min(min,duration);
						max = Math.max(max,duration);
						// avoid Infinity from 0 duration
						const avg = (j/Math.max(duration,0.005)),
							delta = avg/prev;
						// break when things are not changing
						if(delta >= 1-sensitivity && delta <= 1+sensitivity && j>minCycles) break;
						prev = avg;
					}
					if(hasoverhead && !overhead) {
						test.speed = overhead = Math.round(prev*1000);
					} else {
						test.speed = Math.max(0,hasoverhead ? Math.round(overhead - (prev*1000)) : Math.round(prev*1000));
					}
					if(log) {
						results.push([test.title,test.speed,(max-min).toPrecision(2),j])
					}
					if(typeof(window)!=="undefined") {
						setTimeout(() => { // give browser time to re-draw so user can interact
							const elements = document.getElementsByTagName("H2");
							for(const element of elements) {
								if(element.innerText.indexOf(test.title)===0 && !elementsSeen.has(element)) {
									elementsSeen.add(element);
									const speed = document.createElement("span");
									speed.className = "speed";
									speed.innerText = ` ${Math.round(test.speed)} sec +/- ${(max-min).toPrecision(2)} msec ${j} samples`;
									element.insertBefore(speed,element.firstElementChild);
									break;
								}
							}
						});
					}
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
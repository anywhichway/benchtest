(function() {
	const Benchmark = require("benchmark"),
		Table = require("markdown-table");
	
	const showResults = (logType,stream,results) => { 
	  results.statistics.unshift(["Name","Ops/Sec","Margin of Error","Sample Size"]);
	  if(logType==="md") {
	  	const statistics = Table(results);
	  	stream.log(statistics);
	  	return;
	  }
  	stream.log(results);
	};

	function benchtest(mocha,options={}) {
		let {cycles,minCycles,maxCycles,sensitivity,log,logStream,off} = options;
		if(!cycles) cycles=500;
		if(!minCycles) minCycles=10;
		if(!maxCycles) maxCycles=100;
		if(!sensitivity) sensitivity=.01;
		if(!logStream) logStream=console;
		if(minCycles>maxCycles) maxCycles = minCycles;
		const tests = [],
			results = [];
		async function run() {
			if(off) {
				console.log("Performance testing off");
				return;
			}
			console.log("Performance testing ...");
			// move the overhead test to the front of the queue
			let i = tests.findIndex(test => test.title[test.title.length-2]==="#" && test.title[test.title.length-1]==="#"),
				test = i>=0 ? tests[i] : null;
			if(test) {
				tests.splice(i,1);
				tests.unshift(test)
			}
			let overhead;
			for(const test of tests) {
				await new Promise(async (resolve,reject) => {
					const f = new Function("return " + test.body)(test.ctx);
					start = performance.now();
					let i = maxCycles,
						j = 0,
						duration = 0,
						avg = 0,
						prev = 0,
						min = Infinity,
						max = -Infinity;
					while(i--) {
						await f(() => true);
						duration = performance.now() - start;
						j++;
						min = Math.min(min,duration);
						max = Math.max(max,duration);
						const avg = (j/duration),
							delta = avg/prev;
						if(delta >= 1-sensitivity && delta <= 1+sensitivity && j>minCycles) break;
						prev = avg;
					}
					if(!overhead) {
						test.speed = overhead = prev*1000
					} else {
						test.speed = overhead - (prev*1000);
					}
					
					if(log) {
						results.push([test.title,test.speed,max-min,j])
					}
					// give browser time to re-draw so user can interact
					setTimeout(() => {
						const elements = document.getElementsByTagName("H2");
						for(const element of elements) {
							if(element.innerText.indexOf(test.title)===0) {
								const speed = document.createElement("span");
								speed.className = "speed";
								speed.innerText = ` ${Math.round(test.speed)} sec +/- ${(max-min).toPrecision(2)} msec ${j} samples`;
								element.insertBefore(speed,element.firstElementChild);
								resolve();
								break;
							}
						}
					});
				});
			}
			return results;
		}
		return new Proxy(mocha,{
			get(target,property) {
				if(property==="run") {
					return (...args) => {
						const runner = target.run(...args);
						runner.on("pass", (test) => {
							if(test.title[test.title.length-1]==="#") {
								tests.push(test);
							}
						});
						runner.on("end",() => {
							run().then(results => {
								console.log(results);
								showResults(log,logStream,results);
							})
						});
						return runner;
					}
				}
				return target[property];
			}
		})
	}
	if(typeof(module)!=="undefined") module.exports = benchtest;
	if(typeof(window)!=="undefined") window.benchtest = benchtest;
	
}).call(this);
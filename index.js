(function() {
	const Benchmark = require("benchmark");
	
	const showResults = (benchmarks,suiteName,benchmarkResults) => {
		const suite = benchmarks.suites[suiteName];
	  let table = [],
	  	errors = [];
	  benchmarkResults.forEach(result => {
	    const name = result.target.name;
	    const opsPerSecond = result.target.hz.toLocaleString('en-US', {
	      maximumFractionDigits: 0
	    });
	    const relativeMarginOferror = `+/- ${result.target.stats.rme.toFixed(2)}%`;
	    const sampleSize = result.target.stats.sample.length;

	    table.push(typeof(Table)==="undefined" ? {"Name":name, "Ops/Sec":opsPerSecond, "Margin of Error":relativeMarginOferror, "Sample Size":sampleSize} : [name, opsPerSecond, relativeMarginOferror, sampleSize]);
	  });
	  let expect = suite.expect;
	  for(let name in suite.tests) {
	  	const test = suite.tests[name];
	  	if(!benchmarkResults.some(result => result.target.name===name)) {
	  		table.push(typeof(Table)==="undefined" ? {"Name":name, "Ops/Sec":"0", "Margin of Error":"0", "Sample Size":"0"} : [name, "0", "0", "0"]);
	  		if(typeof(test.expect)!=="undefined") expect = test.expect;
	  		let result;
	  		try {
	  			result = test.f();
	  		} catch(e) {
	  			result = e.message;
	  		}
	  		errors.push(typeof(Table)==="undefined" ? {"Name":name, "Expected":expect+"", "Received":result} : [name, expect+"", result]);
	  	}
	  }
	  suite.results = {statistics:table.errors};
	  
	  if(benchmarks.log) {
	    if(typeof(Table)!=="undefined") {
	    	table.unshift(["Name","Ops/Sec","Margin of Error","Sample Size"]);
	    	table = Table(table);
	    	benchmarks.log.log(`Statistics: ${suiteName}`);
	    	benchmarks.log.log(table);
	    	if(errors.length>0) {
	    		errors.unshift(["Name","Expected","Received"]);
	    		errors = Table(errors);
	    		benchmarks.log.log(`Errors: ${suiteName}`);
	    		benchmarks.log.log(errors);
	    	}
	    } else {
	    	benchmarks.log.log(`Statistics: ${suiteName}`);
	    	benchmarks.log.table(table); // eslint-disable-line no-console
	    	 if(errors.length>0) {
	    		 benchmarks.log.log(`Errors: ${suiteName}`);
	    		 benchmarks.log.table(errors);
	    	 }
	    }
	  }
	};

	const sortDescResults = (benchmarkResults) => {
	  return benchmarkResults.sort((a, b) => {
	    return a.target.hz < b.target.hz ? 1 : -1;
	  });
	};

	const onCycle = (event) => {
	  results.push(event);
	};

	const onComplete = (benchmarks,suiteName) => {
	  const orderedBenchmarkResults = sortDescResults(results);
	  showResults(benchmarks,suiteName,orderedBenchmarkResults);
	};


	//let result;

	const serialize = (data) => {
			const type = typeof(data);
			if(!data || ["number","string","boolean","underfined"].includes(type)) return data;
			if(type==="function") return data+"";
			let object = {};
			for(let key in data) {
				object[key] = serialize(data[key]);
			}
			return object;
		},
		deserialize = (data) => {
			const type = typeof(data);
			if(!data || ["number","function","boolean","underfined"].includes(type)) return data;
			if(type==="string") {
				let value = data;
				try {
					value = Function("return " + data)();
					if(typeof(value)==="function") return value;
				} catch(e) {
					return value;
				}
			}
			if(Array.isArray(data)) {
				let array = [];
				for(let item of data) {
					array.push(deserialize(item));
				}
				return array;
			}
			let object = {};
			for(let key in data) {
				object[key] = deserialize(data[key]);
			}
			return object;
		}
		
		let results,
		context;
	class Benchtest {
		constructor(spec) {
			this.benchmarks = deserialize(spec);
		}
		serialize() {
			return serialize(this);
		}
		run() {
			const benchmarks = this.benchmarks;
			if(benchmarks.before) {
				context = benchmarks.context;
				benchmarks.before();
			}
			for(let sname in benchmarks.suites) {
				const s = new Benchmark.Suite,
					suite = benchmarks.suites[sname],
					context = suite.context;
				suite.context = Object.assign({},benchmarks.context,suite.context);
				let expect = (typeof(suite.expect)==="function" ? suite.expect.bind(suite.context) : suite.expect);
				for(let tname in suite.tests) {
					const test = suite.tests[tname],
						context = Object.assign({},suite.context,test.context);
					const f = test.f = test.f.bind(context);
					if(typeof(test.expect)!=="undefined") expect = (typeof(test.expect)==="function" ? test.expect.bind(context) : test.expect);
					try {
						const result = f();
						if(typeof(expect)==="undefined" || (typeof(expect)==="function" ? expect(result) : result===expect)) {
							s.add(tname,f);
						} else {
							console.warn(`Ignoring ${sname}:${tname}. Expected:`,expect,"Received:",result);
						}
					} catch(e) {
						console.warn(`Ignoring ${sname}:${tname}. Expected:`,expect,`Received:${e.message}`);
					}
				}
				s.on('start', () => {
				  console.log("");
				  console.log(`Running ${sname} ...`);
				  results = [];
				})
				.on('cycle', onCycle)
				.on('complete', () => {
					suite.context = context;
				  onComplete(benchmarks,sname);
				})
				.run({
				  async: false
				});
			}
		}
	}
	if(typeof(module)!=="undefined") module.exports = Benchtest;
	if(typeof(window)!=="undefined") window.Benchtest = Benchtest;
	
}).call(this);
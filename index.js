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

	    table.push([name, opsPerSecond, relativeMarginOferror, sampleSize]);
	  });
	  let expect = suite.expect;
	  for(let name in suite.tests) {
	  	const test = suite.tests[name];
	  	if(!benchmarkResults.some(result => result.target.name===name)) {
	  		table.push([name, "0", "0", "0"]);
	  		if(typeof(test.expect)!=="undefined") expect = test.expect;
	  		let result;
	  		try {
	  			result = test.f();
	  		} catch(e) {
	  			result = e.message;
	  		}
	  		errors.push([name, expect+"", result]);
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
	    	table = table.map(row => { return {"Name":row[0], "Ops/Sec":row[1], "Margin of Error":row[2], "Sample Size":row[3]}; });
	    	benchmarks.log.table(table); // eslint-disable-line no-console
	    	 if(errors.length>0) {
	    		 benchmarks.log.log(`Errors: ${suiteName}`);
	    		 errors = errors.map(row => { return {"Name":row[0], "Expected":row[1]+"", "Received":row[2]}; });
	    		 benchmarks.log.table(errors);
	    	 }
	    }
	  }
	};

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
		
	class Benchtest {
		constructor(spec) {
			this.benchmarks = deserialize(spec);
			this.results = [];
		}
		serialize() {
			return serialize(this);
		}
		run() {
			const benchmarks = this.benchmarks;
			if(benchmarks.before) {
				benchmarks.before.call(Object.assign({},benchmarks.context));
			}
			for(let sname in benchmarks.suites) {
				const s = new Benchmark.Suite,
					suite = benchmarks.suites[sname],
					scontext = Object.assign({},benchmarks.context,suite.context);
				for(let key in scontext) {
					if(typeof(scontext[key])==="function") {
						scontext[key] = scontext[key].bind(scontext);
					}
				}
				let expect = (typeof(suite.expect)==="function" ? suite.expect.bind(scontext) : suite.expect);
				for(let tname in suite.tests) {
					const test = suite.tests[tname],
						tcontext = Object.assign({},scontext,test.context),
						f = test.f = test.f.bind(tcontext);
					for(let key in tcontext) {
						if(typeof(tcontext[key])==="function") {
							tcontext[key] = tcontext[key].bind(tcontext);
						}
					}
					if(typeof(test.expect)!=="undefined") expect = (typeof(test.expect)==="function" ? test.expect.bind(tcontext) : test.expect);
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
				  this.results = [];
				})
				.on('cycle', (event) =>  this.results.push(event))
				.on('complete', () => {
				   const orderedBenchmarkResults = this.results.sort((a, b) => {
				     return a.target.hz < b.target.hz ? 1 : -1;
				   });
				   showResults(benchmarks,sname,orderedBenchmarkResults);
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
(function() {
	const Benchmark = require("benchmark"),
		Table = require("markdown-table");
	
	const showResults = (benchmarks,suiteName,benchmarkResults) => {
		const suite = benchmarks.suites[suiteName],
			results = suite.results;
	  benchmarkResults.forEach(result => {
	    const name = result.target.name;
	    const opsPerSecond = result.target.hz.toLocaleString('en-US', {
	      maximumFractionDigits: 0
	    });
	    const relativeMarginOferror = `+/- ${result.target.stats.rme.toFixed(2)}%`;
	    const sampleSize = result.target.stats.sample.length;

	    results.statistics.push([name, opsPerSecond, relativeMarginOferror, sampleSize]);
	  });
	  let expect = suite.expect;
	  for(let name in suite.tests) {
	  	const test = suite.tests[name];
	  	if(!benchmarkResults.some(result => result.target.name===name)) {
	  		results.statistics.push([name, "0", "0", "0"]);
	  	}
	  }
	  
	  if(benchmarks.log) {
	  	 results.statistics.unshift(["Name","Ops/Sec","Margin of Error","Sample Size"]);
	    	const statistics = Table(results.statistics);
	    	benchmarks.log.log(`Statistics: ${suiteName}`);
	    	benchmarks.log.log(statistics);
	    	if(results.errors.length>0) {
	    		results.errors.unshift(["Name","Expected","Received"]);
	    		const errors = Table(results.errors);
	    		benchmarks.log.log(`Errors: ${suiteName}`);
	    		benchmarks.log.log(errors);
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
			const benchmarks = this.benchmarks,
				promises = [];
			if(benchmarks.start) {
				benchmarks.start.call(benchmarks.context);
			}
			const suitenames = Object.keys(benchmarks.suites);
			suitenames.forEach((sname,i) => {
				const s = new Benchmark.Suite,
					suite = benchmarks.suites[sname],
					context = Object.assign({},benchmarks.context,suite.context);
				suite.results = {statistics:[],errors:[]};
				let completed;
				promises.push(new Promise((resolve) => completed = resolve));
				for(let key in context) {
					const value = context[key];
					if(typeof(value)==="function" && !value.bound) {
						context[key] = value.bind(context);
						context[key].bound = true;
					}
				}
				for(let tname in suite.tests) {
					const test = suite.tests[tname],
						f = test.f.bind(context);
					let expect; 
					if(typeof(test.expect)==="undefined") {
						expect = (typeof(suite.expect)==="function" ? suite.expect.bind(context) : suite.expect);
					} else {
						expect = (typeof(test.expect)==="function" ? test.expect.bind(context) : test.expect);
					}
					try {
						const result = f();
						if(typeof(expect)==="undefined" || (typeof(expect)==="function" ? expect(result) : result===expect)) {
							s.add(tname,f);
						} else {
							suite.results.errors.push([tname, expect+"", result]);
						}
					} catch(e) {
							suite.results.errors.push([tname, expect+"", e.message]);
					}
				}
				s.on('start', () => {
				  if(benchmarks.before) benchmarks.before.call(context,sname);
				  this.results = [];
				})
				.on('cycle', (event) =>  {
					this.results.push(event);
					if(benchmarks.between) benchmarks.between.call(benchmarks);
				})
				.on('complete', () => {
					if(benchmarks.after) benchmarks.after.call(context,sname);
				   const orderedBenchmarkResults = this.results.sort((a, b) => {
				     return a.target.hz < b.target.hz ? 1 : -1;
				   });
				   showResults(benchmarks,sname,orderedBenchmarkResults);
				   completed();
				})
				.run({
				  async: false
				});
			});
			Promise.all(promises).then(() => {
				if(benchmarks.end) benchmarks.end.call(benchmarks.context);
			});
		}
	}
	if(typeof(module)!=="undefined") module.exports = Benchtest;
	if(typeof(window)!=="undefined") window.Benchtest = Benchtest;
	
}).call(this);
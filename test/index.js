var mocha,
	chai,
	expect;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	const benchtest = require("../index.js");
	beforeEach(benchtest.test);
	after(benchtest.report);
}

const heap = [];

let perf = typeof(performance)!=="undefined" ? performance : null;
if(typeof(module)!=="undefined" && typeof(window)==="undefined") {
	perf = {
			now: require("performance-now"),
			memory: {}
	}
	Object.defineProperty(perf.memory,"usedJSHeapSize",{enumerable:true,configurable:true,writable:true,value:0});
}
const ELEMENTS_SEEN = new Set();

[1].forEach(num => {
	describe("Test Suite " + num,function() {
		it("no-op #", function no_op(done) { done(); });
		it("sleep 100ms #", function sleep100(done) { 
			this.timeout(101);
			const startTime = Date.now();
			while (Date.now() < startTime + 100) { ; };
			expect(this.performance.duration).to.be.above(99);
			expect(this.performance.duration).to.be.below(101);
			done();
		});
		it("sleep 100ms Promise #", function sleep100Promise() { 
			this.timeout(101);
			return new Promise(resolve => {
				const startTime = Date.now();
				while (Date.now() < startTime + 100) { ; };
				expect(this.performance.duration).to.be.above(99);
				expect(this.performance.duration).to.be.below(101);
				resolve();
			});
		});
		it("sleep random ms #", function sleepRandom(done) { 
			const startTime = Date.now(),
				extra = (Math.random()*100);
			while (Date.now() < startTime + extra) { ; };
			done();
		});
		it("loop 100 #", function loop100(done) { let i=0; while(i++<100) i++; done(); });
		it("use heap #",function(done) {
			heap.push(new Array(1000).fill("        "));
			done();
		});
		it("throw error #", function() { throw(new Error("test error")); })
		it("no-benchtest", function(done) { done(); });
	});
});


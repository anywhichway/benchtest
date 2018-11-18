var mocha,
	chai,
	expect;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	const benchtest = require("../index.js");
	beforeEach(function() { 
		benchtest.register(this.currentTest); 
		if(!benchtest.testable(this.currentTest)) {
			this.currentTest.skip(); 
		}
	});
	afterEach(function () { benchtest.test(this.currentTest); });
	after(() => benchtest.run({log:"md"}));
}

const heap = [];

[1,2,3].forEach(num => {
	describe("Test Suite " + num,function() {
		it("no-op #", function no_op(done) { done(); });
		it("sleep 100ms #", function sleep100(done) { 
			const startTime = Date.now();
			while (Date.now() < startTime + 100) { ; };
			done();
		});
		it("sleep 100ms Promise #", function sleep100Promise() { 
			return new Promise(resolve => {
				const startTime = Date.now();
				while (Date.now() < startTime + 100) { ; };
				resolve();
			});
		});
		it("sleep random ms #", function sleepRandom(done) { 
			const startTime = Date.now(),
				extra = (Math.random()*100);
			while (Date.now() < startTime + extra) { ; };
			done();
		});
		it("loop 10000 #", function loop10000(done) { let i=0; while(i++<10000) i++; done(); });
		it("use heap #",function(done) {
			heap.push(new Array(1000).fill("        "));
			done();
		});
		it("no-benchtest", function(done) { done(); });
	});
});


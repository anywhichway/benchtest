var mocha,
	chai,
	expect;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	const benchtest = require("../index.js");
	//beforeEach(function() { if(!benchtest.testable(this.currentTest)) this.currentTest.skip(); })
	afterEach(function () { benchtest.test(this.currentTest); });
	after(() => benchtest.run({log:"md"}));
}


describe("Test",function() {
	it("overhead (time for () => true to run) ##", function(done) { done(); });
	it("random sleep done #", function(done) { 
		const startTime = Date.now();
		while (Date.now() < startTime + (Math.random()*1000));
		done();
	});
	it("random sleep Promise #", function() { 
		return new Promise(resolve => {
			const startTime = Date.now();
			while (Date.now() < startTime + (Math.random()*1000));
			resolve();
		});
	});
	it("error (expected and no benchmark) #", function(done) { 
		done(new Error("test"));
	});
	it("no-op (should be at or close to zero) #", function(done) { done(); });
	it("no-benchtest", function(done) { done(); });
});



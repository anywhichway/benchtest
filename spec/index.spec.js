import {benchtest} from "../index.js";

it = benchtest(it);

const garbage = [];
describe("main tests", () => {

    const randomFileName = () => {
        return (Math.random()+"").substring(2)+".txt";
    }

    const metrics = {memory:true, cpu:true, performance:true, pendingPromises: true,unresolvedAsyncs:true,activeResources:true},
        cycles = 100;

    it("Promise",() => {
        const promise = new Promise((resolve,reject) => {});
        expect(promise).toBeInstanceOf(Promise)
    },{metrics:{pendingPromises: 1}})

    xit("Promise should fail",() => {
        const promise = new Promise((resolve,reject) => {});
        expect(promise).toBeInstanceOf(Promise)
    },{metrics:{pendingPromises: 0}})

    it("async returning primitive",() => {
        const promise = (async () => 1)();
        expect(promise.constructor.name).toBe("Promise");
    },{metrics:{pendingPromises: 0}}) // asyncs that return primitives automatically resolve

    it("async returning Object",() => {
        const promise = (async () => {
            return {}
        })();
        expect(promise.constructor.name).toBe("Promise");
    },{metrics:{pendingPromises: 0}}) // asyncs that return non-thenable objects automatically resolve

    it("async returning thenable Object",() => {
        const promise = (async () => {
            return {then(f) { return }}
        })();
        expect(promise.constructor.name).toBe("Promise");
    },{metrics:{pendingPromises: 1}}) // asyncs that return non-thenable objects do not automatically resolve (they are implicitly promises)

    it("async returning resolved promise",() => {
        const promise = (async () => new Promise((resolve,reject)=> resolve()))();
        expect(promise.constructor.name).toBe("Promise");
    },{metrics:{pendingPromises: 1}})  // asyncs that return resolved Promises do not automatically resolve

    it("async returning unresolved promise",() => {
        const promise = (async () => new Promise((resolve,reject)=> {}))();
        expect(promise.constructor.name).toBe("Promise");
    },{metrics:{pendingPromises: 2}})

    it("memtest1",() => {
        const text = "".padStart(1024,"a");
    }, {metrics:{pendingPromises:false,activeResources:false, cpu: false, memory: {rss:false,external:false,heapTotal:false,heapUsed:0}}})

    it("memtest2",() => {
       garbage.push("".padStart(1024,"a"));
    },{metrics:{pendingPromises:false,activeResources:false, cpu: false, memory: {rss:false,external:false,heapTotal:false,heapUsed:0}}})

    afterAll(() => {
        const metrics = benchtest.metrics(),
            summary = benchtest.summarize(metrics),
           issues = benchtest.issues(summary);
        console.log("Summary:",JSON.stringify(summary,null,2));
        console.log("Issues:",JSON.stringify(issues,null,2));
    })

})







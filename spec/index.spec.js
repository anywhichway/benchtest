import {benchtest} from "../index.js";

it = benchtest(it);

const garbage = [];
describe("main tests", () => {

    const randomFileName = () => {
        return (Math.random()+"").substring(2)+".txt";
    }

    const metrics = {memory:true, cpu:true, performance:true, unresolvedPromises: true,unresolvedAsyncs:true,activeResources:true},
        cycles = 100;

    it("Promise test 1",() => {
        const promise = new Promise(() => {});
        expect(promise).toBeInstanceOf(Promise)
    },{metrics:{unresolvedPromises: 1,unresolvedAsyncs:1}})

    it("Promise test 1 - fail",() => {
        const promise = new Promise(() => {});
        expect(promise).toBeInstanceOf(Promise)
    },{metrics:{unresolvedPromises: 0,unresolvedAsyncs:0}})

    it("Promise test 2",() => {
        const promise = (async () => new Promise((resolve)=> resolve()))();
        expect(promise.constructor.name).toBe("Promise");
    },{metrics:{unresolvedPromises: 1,unresolvedAsyncs:1}})

    it("memtest1",() => {
        const text = "".padStart(1024,"a");
    }, {metrics:{memory: {rss:false,external:false,heapTotal:false,heapUsed:0}}})

    it("memtest2",() => {
       garbage.push("".padStart(1024,"a"));
    },{metrics:{memory: {rss:false,external:false,heapTotal:false,heapUsed:0}}})

    afterAll(() => {
        const metrics = benchtest.metrics(),
            summary = benchtest.summarize(metrics),
           issues = benchtest.issues(summary);
        console.log("Summary:",JSON.stringify(summary,null,2));
        console.log("Issues:",JSON.stringify(issues,null,2));
    })

})







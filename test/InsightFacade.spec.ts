import { expect } from "chai";
import * as chai from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import { InsightDataset, InsightDatasetKind, InsightError, NotFoundError } from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List CoursesDataset", function () {
    this.timeout(15000);
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        coursesSmall: "./test/data/coursesSmall.zip",
        coursesInvalid: "./test/data/coursesInvalid.zip",
        coursesText: "./test/data/coursesText.txt",
        coursesPNG: "./test/data/coursesPNG.zip",
        coursesWrongDirectory1: "./test/data/coursesWrongDirectory2.zip",
        coursesWrongDirectory2: "./test/data/coursesWrongDirectory1.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        chai.use(chaiAsPromised);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            // fs.removeSync(cacheDir);
            // fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    it("New Insight Facade", function () {
        insightFacade = new InsightFacade();
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> =
            insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add the coursesSmall dataset", function () {
        const id: string = "coursesSmall";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should reject the valid coursesInvalid dataset", () => {
        const id: string = "coursesInvalid";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.deep.equal(["coursesInvalid"]);
    });

    it("Should reject the invalid coursesWrongDirectory1 dataset", () => {
        const id: string = "coursesWrongDirectory1";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should reject the invalid coursesWrongDirectory2 dataset", () => {
        const id: string = "coursesWrongDirectory2";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should reject the invalid coursesPNG dataset", () => {
        const id: string = "coursesPNG";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should reject the invalid coursesText dataset", () => {
        const id: string = "coursesText";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });

    it("Adding from valid imported datasets", () => {
        const id1: string = "courses";
        const id2: string = "coursesSmall";
        const expected: string[] = [id1, id2];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses
        ).then((res) => {
            expect(res).to.deep.equal([id1]);
            return insightFacade.addDataset(
                id2,
                datasets[id2],
                InsightDatasetKind.Courses
            );
        });
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Adding dataset with same id should fail", () => {
        const id1: string = "courses";
        const id2: string = "courses";
        const expected: string[] = [id1];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses
        ).then(() => {
            return expect(insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses
            )).to.eventually.be.rejectedWith(InsightError);
        });
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Adding dataset with invalid id", () => {
        const id1: string = "courses_",
            id2: string = " ",
            id3: string = undefined,
            id4: string = "_ ",
            id5: string = "";

        return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses).then((res) => {
            expect(res).to.eventually.be.rejectedWith(InsightError);
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((res) => {
            expect(res).to.eventually.be.rejectedWith(InsightError);
            return insightFacade.addDataset(id3, datasets[id3], InsightDatasetKind.Courses);
        }).then((res) => {
            expect(res).to.eventually.be.rejectedWith(InsightError);
            return insightFacade.addDataset(id4, datasets[id4], InsightDatasetKind.Courses);
        }).then((res) => {
            expect(res).to.eventually.be.rejectedWith(InsightError);
            return insightFacade.addDataset(id5, datasets[id5], InsightDatasetKind.Courses);
        }).then((res) => {
            return expect(res).to.eventually.be.rejectedWith(InsightError);
        });
    });

    it("Adding dataset with invalid whitespace", () => {
        const id: string = "courses whitespace";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.be.deep.equal(expected);
    });

    it("Removing valid dataset", () => {
        const id: string = "courses";
        const expected: string[] = [];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        ).then((res) => {
            expect(res).to.be.equal(["courses"]);
            return expect(insightFacade.removeDataset(id)).to.eventually.deep.equal(id);
        });
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Invalid removal of un-added dataset", () => {
        const id: string = "courses";
        return insightFacade.removeDataset(id).then((res) => {
            return expect(res).to.eventually.be.rejectedWith(NotFoundError);
        });
    });

    it("Removing invalid datasets", () => {
        const id1: string = "courses_",
            id2: string = " ",
            id3: string = undefined,
            id4: string = "_ ",
            id5: string = "";
        return insightFacade.removeDataset(id1).then((res) => {
            expect(res).to.eventually.be.rejectedWith(InsightError);
            return insightFacade.removeDataset(id2);
        }).then((res) => {
            expect(res).to.eventually.be.rejectedWith(InsightError);
            return insightFacade.removeDataset(id3);
        }).then((res) => {
            expect(res).to.eventually.be.rejectedWith(InsightError);
            return insightFacade.removeDataset(id4);
        }).then((res) => {
            expect(res).to.eventually.be.rejectedWith(InsightError);
            return insightFacade.removeDataset(id5);
        }).then((res) => {
            return expect(res).to.eventually.be.rejectedWith(InsightError);
        });
    });

    it("Valid sequence of adds and removes", () => {
        const id1: string = "courses";
        const id2: string = "coursesSmall";
        const expected: string[] = [];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id1, datasets[id1], InsightDatasetKind.Courses
        ).then((res) => {
            expect(res).to.deep.equal([id1]);
            return insightFacade.removeDataset(id1);
        }).then((res: string) => {
            expect(res).to.deep.equal(id1);
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((res: string[]) => {
            expect(res).deep.equal([id2]);
            return expect(insightFacade.removeDataset(id2)).to.eventually.deep.equal(id2);
        });
        return expect(futureResult).to.eventually.deep.equal(expected);
    });


    // double check
    it("Removing a dataset multiple times", () => {
        const id: string = "courses";
        const expected: string[] = [];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id, datasets[id], InsightDatasetKind.Courses
        ).then((res: string[]) => {
            expect(res).to.deep.equal([id]);
            return insightFacade.removeDataset(id);
        }).then((res: string) => {
            expect(res).to.deep.equal(id);
            return expect(insightFacade.removeDataset(id)).to.eventually.be.rejectedWith(NotFoundError);
        });
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Sequence continuing after error is thrown", () => {
        const id1: string = "courses";
        const id2: string = "coursesSmall";
        const expected: string[] = [id1, id2];
        const futureResult: Promise<string[]> = insightFacade.removeDataset("test").then((res) => {
            expect(res).to.eventually.be.rejectedWith(NotFoundError);
            return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        }).then((res) => {
            expect(res).to.eventually.equal([id1]);
            return insightFacade.removeDataset("_ ");
        }).then((res) => {
            expect(res).to.eventually.be.rejectedWith(InsightError);
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("List a valid array of datasets", () => {
        const id: string = "courses";
        const expected: InsightDataset[] = [{
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        }];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((res) => {
            return expect(insightFacade.listDatasets()).to.eventually.deep.equal(expected);
        });
    });

    it("List an empty dataset", () => {
        const expected: InsightDataset[] = [];
        const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid sequence of add, remove, and list", () => {
        const id: string = "courses";
        const expectedCheckpoint: InsightDataset[] = [
            {
                id: "courses",
                kind: InsightDatasetKind.Courses,
                numRows: 2
            }
        ];
        const expected: InsightDataset[] = [];
        const futureResult: Promise<InsightDataset[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        ).then((res) => {
            expect(res).to.eventually.deep.equal([id]);
            return insightFacade.listDatasets();
        }).then((res) => {
            expect(res).to.eventually.deep.equal([expectedCheckpoint]);
            return insightFacade.removeDataset(id);
        }).then((res) => {
            expect(res).to.eventually.deep.equal(id);
            return insightFacade.listDatasets();
        });
        return expect(futureResult).to.eventually.deep.equal(expected);
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", function () {
    this.timeout(15000);
    const datasetsToQuery: { [id: string]: { path: string, kind: InsightDatasetKind } } = {
        courses: { path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses },
        rooms: { path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms }
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];
    const cacheDir = __dirname + "/../data";

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.

        /* commented out temporarily */
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.

        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            // return Promise.resolve("HACK TO LET QUERIES RUN");
            return Promise.reject(err);
        });
        /* ----- */
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it

    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<any[]> = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });

});

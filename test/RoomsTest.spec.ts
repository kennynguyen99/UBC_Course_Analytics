import * as chai from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import { InsightDataset, InsightDatasetKind, InsightError, NotFoundError } from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import { RoomsDataset } from "../src/controller/RoomsDataset";
import { expect } from "chai";

describe("Testing Rooms Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        // add the datasets here
        rooms: "./test/data/rooms.zip",
        courses: "./test/data/courses.zip",
        validDataset: "./test/data/validDataset.zip",
    };

    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade = new InsightFacade();
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
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });


    it("testing add RoomsDataset", async function () {
        let id = "rooms";


        insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((IDs: string[]) => {
            return expect(IDs).to.deep.equal([id]);
        }
        );

    });


    it("Should list 1 dataset, added 2 removed 1 Rooms version", function () {

        const id: string = "rooms";
        const id2: string = "validDataset";

        const expected: InsightDataset[] =
            [{ id: id, kind: InsightDatasetKind.Rooms, numRows: 364 }];

        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((IDs: string[]) => {
            expect(IDs).to.deep.equal([id]);
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);

        }).then(() => {
            return insightFacade.removeDataset(id2);
        }).then(() => {
            const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
            return expect(futureResult).to.eventually.deep.equal(expected);
        });

    });

    it("Removing a rooms dataset multiple times with different IF", () => {
        const id: string = "rooms";

        return insightFacade.addDataset(
            id, datasets[id], InsightDatasetKind.Rooms
        ).then((res: string[]) => {
            expect(res).to.deep.equal([id]);
            return new InsightFacade().removeDataset(id);
        }).then((res: string) => {
            expect(res).to.deep.equal(id);
            return expect(new InsightFacade().removeDataset(id)).to.eventually.be.rejectedWith(NotFoundError);
        });
    });

    it("Make sure the dataset persists onto disk with room dataset", function () {
        const id: string = "rooms";

        // we make a new InsightFacade object and see if calling addDataset will return an InsightError
        // if it does, we know the dataset persists onto disk
        const futureResult = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return new InsightFacade().addDataset(id, datasets[id], InsightDatasetKind.Courses);
        });

        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Removing a rooms dataset multiple times", () => {
        const id: string = "rooms";

        return insightFacade.addDataset(
            id, datasets[id], InsightDatasetKind.Rooms
        ).then((res: string[]) => {
            expect(res).to.deep.equal([id]);
            return insightFacade.removeDataset(id);
        }).then((res: string) => {
            expect(res).to.deep.equal(id);
            return expect(insightFacade.removeDataset(id)).to.eventually.be.rejectedWith(NotFoundError);
        });
    });

});

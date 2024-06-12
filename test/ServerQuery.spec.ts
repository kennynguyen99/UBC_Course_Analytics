import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import * as fs from "fs-extra";


describe("Facade Server", function () {
    this.timeout(40000);
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        rooms: "./test/data/rooms.zip",
        courses: "./test/data/courses.zip",
        coursesSmall: "./test/data/coursesSmall.zip"
    };

    let datasets: { [id: string]: Buffer } = {};
    const cacheDir = __dirname + "/../data";
    let server: Server = null;

    const SERVER_URL: string = "http://localhost:4321";
    const ROOMS_ZIP_FILE_DATA: Buffer = fs.readFileSync("./test/data/rooms.zip");
    const COURSES_ZIP_FILE_DATA: Buffer = fs.readFileSync("./test/data/courses.zip");

    chai.use(chaiHttp);

    before(function () {
        Log.test(`Before all`);

        server = new Server(4321);

        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]);
        }

        // TODO: start server here once and handle errors properly
        server.start().then((hasStarted) => {
            if (hasStarted) {
                Log.trace("Server has successfully started");
            } else {
                Log.trace("Server has not successfully started");
            }
        });
    });

    after(function () {
        // TODO: stop server here once!
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
        } catch (err) {
            Log.error(err);
        }
        server.stop();
        Log.test(`After: ${this.test.parent.title}`);
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("testing Very Invalid Query, should fail", () => {
        const id = "courses";
        const ENDPOINT1: string = "/dataset/" + id + "/courses";
        let query: any = { OPTIONS: {} };


        try {

            return chai.request(SERVER_URL)
                .put(ENDPOINT1)
                .send(COURSES_ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(Array.isArray(res.body.result));
                    expect(res.status).to.be.equal(200);
                    return chai.request(SERVER_URL)
                        .post("/query")
                        .send(query);
                }).then((res: Response) => {
                    expect.fail();
                }).catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(`Error Occurred: ${err.message}\n`);
            expect.fail();
        }
    });


    it("testing Complex Query, should pass", () => {
        const id = "courses";
        const ENDPOINT1: string = "/dataset/" + id + "/courses";
        let query: any = {
            WHERE: {
                OR: [{ AND: [{ GT: {courses_avg: 90}}, { IS: { courses_dept: "adhe"}}]}, { EQ: { courses_avg: 95}}]
            },
            OPTIONS: {
            COLUMNS: ["courses_dept", "courses_id", "courses_avg"],
                ORDER: "courses_avg"
            }
        };

        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT1)
                .send(COURSES_ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("Server successfully returned response:\n");
                    Log.trace(`status: ${res.status}\n`);
                    Log.trace(`result: ${res.body.result}\n`);
                    expect(Array.isArray(res.body.result));
                    expect(res.status).to.be.equal(200);
                    return chai.request(SERVER_URL)
                        .post("/query")
                        .send(query)
                        .set("Content-Type", "application/json");
                }).then((res: Response) => {
                    Log.trace("Server successfully returned response:\n");
                    Log.trace(`status: ${res.status}\n`);
                    expect(res.status).to.be.equal(200);
                }).catch(function (err) {
                    // Log.trace(`Promised rejected: ${err}\n`);
                    Log.trace(err.message);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(`Error Occurred: ${err.message}\n`);
            expect.fail();
        }

    });


});



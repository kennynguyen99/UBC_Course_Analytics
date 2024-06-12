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
    let facade: InsightFacade = null;
    let server: Server = null;

    const SERVER_URL: string = "http://localhost:4321";
    const ROOMS_ZIP_FILE_DATA: Buffer = fs.readFileSync("./test/data/rooms.zip");
    const COURSES_ZIP_FILE_DATA: Buffer = fs.readFileSync("./test/data/courses.zip");

    chai.use(chaiHttp);

    before(function () {
        Log.test(`Before all`);

        facade = new InsightFacade();
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
            facade = new InsightFacade();
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

    // Sample on how to format PUT requests
    /*
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    */

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
    it("PUT test for 1 courses dataset", function () {
        const id = "courses";
        const ENDPOINT1: string = "/dataset/" + id + "/courses";

        try {

            return chai.request(SERVER_URL)
                .put(ENDPOINT1)
                .send(COURSES_ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("Server successfully returned response:\n");
                    expect(Array.isArray(res.body.result));
                    expect(res.status).to.be.equal(200);
                }).catch(function (err) {
                    // some logging here please!
                    Log.trace(`Promised rejected: ${err}\n`);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(`Error Occurred: ${err.message}\n`);
            expect.fail();
        }
    });

    it("PUT test for courses dataset", function () {
        const id = "coursesSmall";
        const id2 = "secondCourses";
        const ENDPOINT1: string = "/dataset/" + id + "/courses";
        const ENDPOINT2: string = "/dataset/" + id2 + "/courses";
        try {

            return chai.request(SERVER_URL)
                .put(ENDPOINT1)
                .send(datasets[id])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    /*
                    Log.trace("Server successfully returned response:\n");
                    Log.trace(`status: ${res.status}\n`);
                    Log.trace(`result: ${res.body.result}\n`);*/
                    expect(Array.isArray(res.body.result));
                    expect(res.status).to.be.equal(200);
                    return chai.request(SERVER_URL)
                        .put(ENDPOINT2)
                        .send(datasets[id])
                        .set("Content-Type", "application/x-zip-compressed");
                }).then(function (res: Response) {
                    Log.trace("Server successfully returned response:\n");
                    expect(Array.isArray(res.body.result));
                    expect(res.status).to.be.equal(200);
                }).catch(function (err) {
                    // some logging here please!
                    Log.trace(`Promised rejected: ${err}\n`);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(`Error Occurred: ${err.message}\n`);
            expect.fail();
        }
    });

    it("Removing a dataset not added, should fail", () => {

        const id = "coursesSmall";

        const ENDPOINT1: string = "/dataset/" + id;

        try {

            return chai.request(SERVER_URL)
                .del(ENDPOINT1)
                .send(id)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("Server successfully returned response:\n");
                    expect(res.status).to.be.equal(404);
                }).catch((error) => {
                    expect(error.status).to.equal(404);
                    Log.trace("request failed\n");

                });
        } catch (err) {
            // and some more logging here!
            Log.trace(`Error Occurred: ${err.message}\n`);
        }
    });

    /*
    it("Removing a dataset that's added, should pass", () => {

        const id = "coursesSmall";
        const ENDPOINT1: string = "/dataset/" + id + "/courses";

        const deleteEndpoint: string = "/dataset/" + id;

        try {

            return chai.request(SERVER_URL)
                .put(ENDPOINT1)
                .send(datasets[id])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("Server successfully returned response:\n");
                    expect(Array.isArray(res.body.result));
                    expect(res.status).to.be.equal(200);
                    return chai.request(SERVER_URL).del(deleteEndpoint);
                }).then((res: Response) => {
                    Log.trace("Server successfully returned response:\n");
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.be.equal(id);
                }).catch(function (err) {
                    // some logging here please!
                    Log.trace(`Promised rejected: ${err}\n`);
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(`Error Occurred: ${err.message}\n`);
            expect.fail();
        }
    });

    it("Removing a dataset that's added after server reset, should pass", () => {

        const id = "courses";
        const ENDPOINT1: string = "/dataset/" + id + "/courses";

        const deleteEndpoint: string = "/dataset/" + id;

        try {

            return chai.request(SERVER_URL)
                .put(ENDPOINT1)
                .send(COURSES_ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("Server successfully returned response:\n");
                    expect(Array.isArray(res.body.result));
                    expect(res.status).to.be.equal(200);
                    return server.stop();
                }).then(() => {
                    return server.start();
                }).then(() => {
                    return chai.request(SERVER_URL).del(deleteEndpoint);
                }).then((res: Response) => {
                    Log.trace("Server successfully returned response:\n");
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.be.equal(id);
                }).catch(function (err) {
                    Log.trace(`Promised rejected: ${err}\n`);
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(`Error Occurred: ${err.message}\n`);
            expect.fail();
        }
    });

    it("Adding a rooms dataset that's added after server reset, should fail", () => {

        const id = "coursesSmall";
        const ENDPOINT1: string = "/dataset/" + id + "/courses";
        try {

            return chai.request(SERVER_URL)
                .put(ENDPOINT1)
                .send(datasets[id])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(Array.isArray(res.body.result));
                    expect(res.status).to.be.equal(200);
                    return chai.request(SERVER_URL)
                        .put(ENDPOINT1)
                        .send(datasets[id])
                        .set("Content-Type", "application/x-zip-compressed");
                }).then(function (res: Response) {
                    expect(Array.isArray(res.body.result));
                    expect(res.status).to.be.equal(400);
                }).catch(function (err) {
                    Log.trace(`Promised rejected: ${err}\n`);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(`Error Occurred: ${err.message}\n`);
            expect.fail();
        }
    });*/

    it("testing Query", () => {
        const id = "courses";
        const ENDPOINT1: string = "/dataset/" + id + "/courses";
        let query: any = {
                WHERE: {
                    GT: {
                        courses_avg: 97
                    }
                },
                OPTIONS: {
                    COLUMNS: ["courses_dept", "courses_avg"],
                    ORDER: "courses_avg"
                }
            };


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
                    expect(res.status).to.be.equal(200);
                }).catch(function (err) {
                    // some logging here please!
                    Log.trace(`Promised rejected: ${err}\n`);
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(`Error Occurred: ${err.message}\n`);
            expect.fail();
        }

    });


    it("GET Datasets Test", function () {
        const id = "courses";
        const ADDENDPOINT: string = "/dataset/" + id + "/courses";

        try {

            return chai.request(SERVER_URL)
                .put(ADDENDPOINT)
                .send(COURSES_ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(Array.isArray(res.body.result));
                    expect(res.status).to.be.equal(200);
                    return chai.request(SERVER_URL)
                        .get("/datasets")
                        .set("Content-Type", "application/x-zip-compressed");
                }).then((res: Response) => {
                    Log.trace("Server successfully returned response:\n");
                    Log.trace(`status: ${res.status}\n`);
                    expect(Array.isArray(res.body.result));
                    for (let insightDataset of res.body.result) {
                        Log.trace(`ID: ${insightDataset.id}\n`);
                        Log.trace(`Kind: ${insightDataset.kind}\n`);
                        Log.trace(`NumRows: ${insightDataset.numRows}\n`);
                    }
                }).catch(function (err) {
                    Log.trace(`Promised rejected: ${err}\n`);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace(`Error Occurred: ${err.message}\n`);
            expect.fail();
        }
    });

    it("PUT test for rooms dataset, successfully added", function () {

        const ROOMS_ID: string = "rooms";
        const ENDPOINT: string = "/dataset/" + ROOMS_ID + "/rooms";

        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT)
                .send(ROOMS_ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    const containsRoomsId = (res.body.result.indexOf(ROOMS_ID) !== -1);
                    expect(containsRoomsId).to.be.equal(true);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err: Error) {
                    Log.error(err);
                    expect.fail(err.message);
                });
        } catch (err) {
            Log.error("PUT test for rooms dataset, successfully added - ERROR: " + err.message);
        }
    });


    it("PUT test for courses dataset, fail. Wrong dataset kind for courses file", function () {

        const ROOMS_ID: string = "rooms2";
        const ENDPOINT: string = "/dataset/" + ROOMS_ID + "/rooms";

        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT)
                .send(COURSES_ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    expect.fail(res, "should not get here and pass");
                })
                .catch(function (err: any) {
                    // should go here
                    expect(err.message).to.not.be.equal(undefined);
                });
        } catch (err) {
            Log.error("PUT test for courses dataset, fail. Wrong dataset kind for courses file -ERROR: " + err.message);
        }
    });
});



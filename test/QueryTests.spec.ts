import { expect } from "chai";
import * as chai from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import { InsightDataset, InsightDatasetKind, InsightError, NotFoundError } from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

import Course, { CourseSection } from "../src/controller/Course";
import Query from "../src/controller/Query";

import { queryValidatorBody } from "../src/controller/QueryUtils/QueryValidators/QueryValidatorBody";
import { queryValidatorOptions } from "../src/controller/QueryUtils/QueryValidators/QueryValidatorOptions";
import { queryValidatorFinal } from "../src/controller/QueryUtils/QueryValidators/QueryValidatorMain";
import { queryPerformerBody } from "../src/controller/QueryUtils/QueryPerformers/QueryPerformerBody";
import { queryItem, runQueryOnDataset } from "../src/controller/QueryUtils/QueryPerformers/QueryDataset";
import { applyTransformations, groupQueries } from "../src/controller/QueryUtils/QueryPerformers/QueryTransformer";
import { Transformations } from "../src/controller/QueryUtils/QueryUtils";
import { CoursesDataset } from "../src/controller/CoursesDataset";
import { filter } from "jszip";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery External", function () {
    this.timeout(15000);

    const obj = {
        WHERE: {
            IS: {
                courses_instructor: "elisa"
            }
        },
        OPTIONS: {
            COLUMNS: ["courses_title", "courses_avg"],
            ORDER: "courses_avg"
        }
    };
    const validIds = ["courses"];
    const query: Query = new Query(obj, validIds);


    const datasetsToQuery: { [id: string]: { path: string, kind: InsightDatasetKind } } = {
        coursesSmall: { path: "./test/data/coursesSmall.zip", kind: InsightDatasetKind.Courses },
    };
    let insightFacade: InsightFacade;

    before(function () {
        chai.use(chaiAsPromised);
        Log.test(`Before: ${this.test.parent.title}`);
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
            return Promise.resolve("HACK TO LET QUERIES RUN");
            // return Promise.reject(err);
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Perform query invalid", () => {
        const futureResult: Promise<any[]> = insightFacade.performQuery(
            {
                WHERE: {
                    OR: [
                        {
                            GT: {
                                coursesSmall_avg: 80
                            }
                        },
                        {
                            EQ: {
                                coursesSmall_avg: 76
                            }
                        }
                    ]
                },
                OPTIONS: {
                    ERR: [
                        "coursesSmall_avg", "coursesSmall_title"
                    ]
                }
            }
        );
        // return TestUtil.verifyQueryResult(futureResult, null);
        expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });

    const invalidBody = {
    };
    const invalidGT = {
        GT: {
            courses_avg: "string"
        }
    };
    const validBodyBasic = {
        GT: {
            courses_avg: 2
        }
    };
    const validBodyNOT = {
        NOT: {
            GT: {
                courses_avg: 2
            }
        }
    };
    const invalidBodyNOT1 = {
        NOT: {

        }
    };
    const invalidBodyNOT2 = {
        NOT: [
            {}
        ]
    };
    const invalidBodyNOT3 = {
        NOT: {
            GT: {
                courses_avg: 2
            },
            LT: {
                courses_avg: 2
            }
        }
    };
    const validBodyAND1 = {
        AND: [
            {
                GT: {
                    courses_avg: 2
                }
            }
        ]
    };
    const validBodyComplex = {
        OR: [
            {
                NOT: {
                    GT: {
                        courses_avg: 2
                    }
                }
            },
            {
                EQ: {
                    courses_avg: 2
                }
            }
        ]
    };
    const validOptions = {
        COLUMNS: ["courses_title", "courses_avg"],
        ORDER: "courses_avg"
    };
    const invalidOptions1 = {
        COLUMNS: ["courses_avg"],
        ORDER: "courses_title"
    };
    const invalidOptions2 = {
        COLUMNS: ["courses_avg"],
        random: "courses_title"
    };
    const invalidOptions3 = {
        COLUMNS: ["random_avg"],
    };

    const validCompleteQuery = {
        WHERE: {
            OR: [
                {
                    NOT: {
                        GT: {
                            courses_avg: 2
                        }
                    }
                },
                {
                    EQ: {
                        courses_avg: 2
                    }
                }
            ]
        },
        OPTIONS: {
            COLUMNS: ["courses_title", "courses_avg"],
            ORDER: "courses_avg"
        }
    };

    const validDatasetIds = ["courses"];

    it("Invalid query body", () => {
        const result = queryValidatorBody(invalidBody, ["courses"]);
        expect(result).to.deep.equal(false);
    });
    it("Invalid GT body", () => {
        const result = queryValidatorBody(invalidGT, ["courses"]);
        expect(result).to.deep.equal(false);
    });
    it("Valid query GT basic body", () => {
        const result = queryValidatorBody(validBodyBasic, ["courses"]);
        expect(result).to.deep.equal(true);
    });
    it("Valid query NOT body", () => {
        const result = queryValidatorBody(validBodyNOT, ["courses"]);
        expect(result).to.deep.equal(true);
    });
    it("Invalid query NOT empty", () => {
        const result = queryValidatorBody(invalidBodyNOT1, ["courses"]);
        expect(result).to.deep.equal(false);
    });
    it("Invalid query NOT is array", () => {
        const result = queryValidatorBody(invalidBodyNOT2, ["courses"]);
        expect(result).to.deep.equal(false);
    });
    it("Invalid query NOT multiple keys", () => {
        const result = queryValidatorBody(invalidBodyNOT3, ["courses"]);
        expect(result).to.deep.equal(false);
    });
    it("Valid query AND1 body", () => {
        const result = queryValidatorBody(validBodyAND1, ["courses"]);
        expect(result).to.deep.equal(true);
    });
    it("Valid query complex body", () => {
        const result = queryValidatorBody(validBodyComplex, ["courses"]);
        expect(result).to.deep.equal(true);
    });
    it("Valid OPTIONS", () => {
        const result = queryValidatorOptions(validOptions, ["courses"]);
        expect(result).to.deep.equal(true);
    });
    it("Invalid OPTIONS 1", () => {
        const result = queryValidatorOptions(invalidOptions1, ["courses"]);
        expect(result).to.deep.equal(false);
    });
    it("Invalid OPTIONS 2", () => {
        const result = queryValidatorOptions(invalidOptions2, ["courses"]);
        expect(result).to.deep.equal(false);
    });
    it("Invalid OPTIONS 3", () => {
        const result = queryValidatorOptions(invalidOptions3, ["courses"]);
        expect(result).to.deep.equal(false);
    });
    it("Valid complete query", () => {
        const result = queryValidatorFinal(validCompleteQuery, ["courses"]);
        expect(result).to.deep.equal(true);
    });

    const testCS = {
        dept: "cs",
        id: "310ishardXD",
        avg: 4,
        instructor: "elisa",
        title: "cpsc310",
        pass: 4,
        fail: 4,
        audit: 4,
        uuid: "whatEvenIsAUUIDMan",
        year: 4
    };
    const testQ1: object = {
        EQ: {
            courses_year: 4
        }
    };
    const testQ2: object = {
        IS: {
            courses_instructor: "elisa"
        }
    };
    const testQ3: object = {
        IS: {
            courses_instructor: "elis*"
        }
    };
    const testQ4: object = {
        IS: {
            courses_instructor: "*lisa"
        }
    };
    const testQ5: object = {
        IS: {
            courses_instructor: "*lis*"
        }
    };
    const complexQ: object = {
        OR: [
            {
                NOT: {
                    IS: {
                        courses_instructor: "elisa"
                    }
                }
            },
            {
                EQ: {
                    courses_year: 4
                }
            }
        ]
    };

    it("Query EQ true", () => {

        const result = queryPerformerBody(testCS, testQ1, "courseSection");
        expect(result).to.deep.equal(true);
    });
    it("Query IS true", () => {
        const result = queryPerformerBody(testCS, testQ2, "courseSection");
        expect(result).to.deep.equal(true);
    });
    it("Query IS* true", () => {
        const result = queryPerformerBody(testCS, testQ3, "courseSection");
        expect(result).to.deep.equal(true);
    });
    it("Query *IS true", () => {
        const result = queryPerformerBody(testCS, testQ4, "courseSection");
        expect(result).to.deep.equal(true);
    });
    it("Query *IS* true", () => {
        const result = queryPerformerBody(testCS, testQ5, "courseSection");
        expect(result).to.deep.equal(true);
    });
    it("Query complex true", () => {
        const result = queryPerformerBody(testCS, complexQ, "courseSection");
        expect(result).to.deep.equal(true);
    });

    const extractee: CourseSection = {
        dept: "cs",
        id: "310ishardXD",
        avg: 4,
        instructor: "elisa",
        title: "cpsc310",
        pass: 4,
        fail: 4,
        audit: 4,
        uuid: "whatEvenIsAUUIDMan",
        year: 4,
    };

    const testQueryObj = {
        WHERE: {
            IS: {
                courses_instructor: "elisa"
            }
        },
        OPTIONS: {
            COLUMNS: ["courses_title", "courses_avg"],
            ORDER: "courses_avg"
        }
    };

    it("Test column extraction", () => {
        const testCourse = new Course("test");
        const idList = ["courses"];
        const testQuery = new Query(testQueryObj, idList);
        testCourse.addSection(extractee);
        const expected = [{ courses_avg: 4, courses_title: "cpsc310" }];
        expect(queryItem(testCourse, testQuery, "courses")).to.eventually.deep.equal(expected);
    });

    const validQueryTransformation: any = {
        WHERE: {
            AND: [{
                IS: {
                    rooms_furniture: "*Tables*"
                }
            }, {
                GT: {
                    rooms_seats: 300
                }
            }]
        },
        OPTIONS: {
            COLUMNS: [
                "rooms_shortname",
                "maxSeats"
            ],
            ORDER: {
                dir: "DOWN",
                keys: ["maxSeats"]
            }
        },
        TRANSFORMATIONS: {
            GROUP: ["rooms_shortname"],
            APPLY: [{
                maxSeats: {
                    MAX: "rooms_seats"
                }
            }]
        }
    };

    it("Valid query with transformation", () => {
        const result = queryValidatorFinal(validQueryTransformation, ["rooms"]);
        expect(result).to.deep.equal(true);
    });

    const invalidTransformationApplyIsObject: any = {
        WHERE: {
            AND: [{
                IS: {
                    rooms_furniture: "*Tables*"
                }
            }, {
                GT: {
                    rooms_seats: 300
                }
            }]
        },
        OPTIONS: {
            COLUMNS: [
                "rooms_shortname",
                "maxSeats"
            ],
            ORDER: {
                dir: "DOWN",
                keys: ["maxSeats"]
            }
        },
        TRANSFORMATIONS: {
            GROUP: ["rooms_shortname"],
            APPLY: {}
        }
    };

    it("Invalid apply is an object", () => {
        const result = queryValidatorFinal(invalidTransformationApplyIsObject, ["rooms"]);
        expect(result).to.deep.equal(false);
    });

    const invalidTransformationIsArray: any = {
        WHERE: {
            AND: [{
                IS: {
                    rooms_furniture: "*Tables*"
                }
            }, {
                GT: {
                    rooms_seats: 300
                }
            }]
        },
        OPTIONS: {
            COLUMNS: [
                "rooms_shortname",
                "maxSeats"
            ],
            ORDER: {
                dir: "DOWN",
                keys: ["maxSeats"]
            }
        },
        TRANSFORMATIONS: []
    };

    it("Invalid transformations is array", () => {
        const result = queryValidatorFinal(invalidTransformationIsArray, ["rooms"]);
        expect(result).to.deep.equal(false);
    });

    const arrayToBeGrouped = [
        { courses_uuid: "1", courses_instructor: "Jean", courses_avg: 90, courses_title: "310" },
        { courses_uuid: "2", courses_instructor: "Jean", courses_avg: 80, courses_title: "310" },
        { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title: "310" },
        { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title: "310" },
        { courses_uuid: "5", courses_instructor: "Kelly", courses_avg: 74, courses_title: "210" },
        { courses_uuid: "6", courses_instructor: "Kelly", courses_avg: 78, courses_title: "210" },
        { courses_uuid: "7", courses_instructor: "Kelly", courses_avg: 72, courses_title: "210" },
        { courses_uuid: "8", courses_instructor: "Eli", courses_avg: 85, courses_title: "210" }
    ];
    const resultOfGrouping = [
        [
            { courses_uuid: "1", courses_instructor: "Jean", courses_avg: 90, courses_title: "310" },
            { courses_uuid: "2", courses_instructor: "Jean", courses_avg: 80, courses_title: "310" },
            { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title: "310" },
            { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title: "310" }
        ],
        [
            { courses_uuid: "5", courses_instructor: "Kelly", courses_avg: 74, courses_title: "210" },
            { courses_uuid: "6", courses_instructor: "Kelly", courses_avg: 78, courses_title: "210" },
            { courses_uuid: "7", courses_instructor: "Kelly", courses_avg: 72, courses_title: "210" },
            { courses_uuid: "8", courses_instructor: "Eli", courses_avg: 85, courses_title: "210" }
        ]
    ];

    it("Grouping by courses_title", () => {
        const result = groupQueries(arrayToBeGrouped, ["courses_title"]);
        expect(result).to.deep.equal(resultOfGrouping);
    });

    const transformationObj: any = {
        GROUP: ["courses_title"],
        APPLY: [{
            overallAvg: {
                AVG: "courses_avg"
            }
        }]
    };

    const applyResult = [
        { courses_title: "310", overallAvg: 87.5 },
        { courses_title: "210", overallAvg: 77.25 }
    ];

    it("Applying transformation", () => {
        const result = applyTransformations(resultOfGrouping, transformationObj);
        expect(result).to.deep.equal(applyResult);
    });

    it("Query dataset", () => {
        const course = new Course("testCourse");
        const section = {
            dept: "cs",
            id: "310ishardXD",
            avg: 99.15,
            instructor: "elisa",
            title: "cpsc310",
            pass: 4,
            fail: 4,
            audit: 4,
            uuid: "whatEvenIsAUUIDMan",
            year: 4,
        };
        const queryObj = {
            WHERE: {
                NOT: {
                    NOT: {
                        GT: {
                            courses_avg: 99
                        }
                    }
                }
            },
            OPTIONS: {
                COLUMNS: ["courses_title", "courses_avg"],
                ORDER: "courses_avg"
            }
        };
        const queryStruct = new Query(queryObj, ["courses"]);
        course.addSection(section);
        const result = queryItem(course, queryStruct, "courses");
        const expected = [
            {
                courses_title: "cpsc310",
                courses_avg: 99.15
            }
        ];
        expect(result).to.eventually.deep.equal(expected);
    });
});

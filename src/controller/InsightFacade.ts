import Log from "../Util";
import { IInsightFacade, InsightDataset, InsightDatasetKind } from "./IInsightFacade";
import { InsightError, NotFoundError } from "./IInsightFacade";
import { CoursesDataset } from "./CoursesDataset";
import { Dataset } from "./Dataset";
import { RoomsDataset } from "./RoomsDataset";
import * as fs from "fs";
import Query from "./Query";
import { runQueryOnDataset } from "./QueryUtils/QueryPerformers/QueryDataset";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {


    private datasetDict: { [id: string]: Dataset };


    constructor() {

        try {

            if (!fs.existsSync(__dirname + "/../../data/ValidCoursesDatasets.json")) {
                fs.writeFileSync(__dirname + "/../../data/ValidCoursesDatasets.json", "{}");
            }

            if (!fs.existsSync(__dirname + "/../../data/ValidRoomsDatasets.json")) {
                fs.writeFileSync(__dirname + "/../../data/ValidRoomsDatasets.json", "{}");
            }

        } catch (err) {
            Log.trace("Could not create a data cache");
        }
        this.datasetDict = {};
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

        if (id == null || content == null || kind == null) {
            return Promise.reject(new InsightError("Arguments cannot be null"));
        }

        if (!this.isIDValid(id)) {
            return Promise.reject(new InsightError("ID is invalid"));
        }

        return new Promise((resolve, reject) => {

            let newDataset: Dataset;

            if (kind === InsightDatasetKind.Courses) {
                newDataset = new CoursesDataset(id, content);
            } else if (kind === InsightDatasetKind.Rooms) {
                newDataset = new RoomsDataset(id, content);
            }

            this.readDatasetsFromDisk().then(() => {
                // temporary bypass
                if (id in this.datasetDict) {
                    reject(new InsightError("CoursesDataset ID has already been added"));
                }

                return newDataset.readZipFile();
            }).then(() => {
                this.datasetDict[id] = newDataset;
                this.writeDatasetsToDisk();
                resolve(Object.keys(this.datasetDict));
            }).catch((err: any) => {
                reject(new InsightError("Invalid dataset or invalid zip file"));
            });
        });
    }


    public removeDataset(id: string): Promise<string> {
        if (id == null) {
            return Promise.reject(new InsightError("argument ID cannot be null"));
        }

        return new Promise((resolve, reject) => {
            this.readDatasetsFromDisk().then(() => {
                if (!this.isIDValid(id)) {
                    reject(new InsightError("ID is invalid"));
                }

                if (id in this.datasetDict) {
                    delete this.datasetDict[id];
                    this.writeDatasetsToDisk();
                    resolve(id);
                } else {
                    reject(new NotFoundError());
                }
            });
        });
    }

    public performQuery(query: any): Promise<any[]> {
        const validIdList = Object.keys(this.datasetDict);
        const datasetList = Object.values(this.datasetDict);
        if (!(typeof query === "object" && query !== null)) {
            return Promise.reject(new InsightError("Query is not an object"));
        }

        return new Promise((resolve, reject) => {
            this.readDatasetsFromDisk().then(() => {
                let queryStruct;
                try {
                    // tries to create a valid query
                    queryStruct = new Query(query, validIdList);
                } catch (err) {
                    reject(err);
                }
                // queryStruct is valid
                const dataset = this.datasetDict[queryStruct.getQueryId()];

                let type = dataset.getDatasetKind();
                let datasetToQuery: any = dataset;
                if (type === "courses") {
                    datasetToQuery = datasetToQuery as CoursesDataset;
                } else {
                    datasetToQuery = datasetToQuery as RoomsDataset;
                }

                return runQueryOnDataset(datasetToQuery, queryStruct).then((res) => {
                    resolve(res);
                }).catch((err: any) => {
                    reject(err);
                });
            });
        });

    }

    public listDatasets(): Promise<InsightDataset[]> {
        let insightDatasets: InsightDataset[] = [];

        let dataset: Dataset;

        return new Promise((resolve, reject) => {
            this.readDatasetsFromDisk().then(() => {
                for (let id in this.datasetDict) {
                    dataset = this.datasetDict[id];
                    insightDatasets.push(dataset.getInsightDataset());
                }
                resolve(insightDatasets);
            });
        });
    }

    public isSyncWithDisk(coursesFileObj: any, roomsFileObj: any): boolean {
        for (let id in coursesFileObj) {
            if (!(id in this.datasetDict)) {
                return false;
            }
        }

        for (let id in roomsFileObj) {
            if (!(id in this.datasetDict)) {
                return false;
            }
        }

        return true;
    }


    // Writes all the valid datasets saved in this IF object to the file
    private writeDatasetsToDisk(): void {
        let coursesDataset: { [id: string]: Dataset } = {};
        let roomsDataset: { [id: string]: Dataset } = {};
        let coursesDatasetRawContent: { [id: string]: string } = {};
        let roomsDatasetRawContent: { [id: string]: string } = {};

        for (let id of Object.keys(this.datasetDict)) {
            if (this.datasetDict[id].getDatasetKind() === InsightDatasetKind.Courses) {
                coursesDataset[id] = this.datasetDict[id];
                coursesDatasetRawContent[id] = this.datasetDict[id].getRawContent();
            } else {
                roomsDataset[id] = this.datasetDict[id];
                roomsDatasetRawContent[id] = this.datasetDict[id].getRawContent();
            }
        }
        let writeString = JSON.stringify(coursesDatasetRawContent);
        fs.writeFileSync(__dirname + "/../../data/ValidCoursesDatasets.json", writeString);

        writeString = JSON.stringify(roomsDatasetRawContent);
        fs.writeFileSync(__dirname + "/../../data/ValidRoomsDatasets.json", writeString);
    }

    // Reads all the datasets saved in disk to this IF object. Overwrites any datasets saved in memory.
    // Only resolves. Resolves when finished reading and datasets are initialized.
    public readDatasetsFromDisk(): Promise<any> {
        let fileCoursesContent: string = fs.readFileSync(__dirname + "/../../data/ValidCoursesDatasets.json", "UTF-8");
        let fileRoomsContent: string = fs.readFileSync(__dirname + "/../../data/ValidRoomsDatasets.json", "UTF-8");

        let coursesFileObj = JSON.parse(fileCoursesContent);
        let roomsFileObj = JSON.parse(fileRoomsContent);

        // check if this instance is synced
        if (this.isSyncWithDisk(coursesFileObj, roomsFileObj)) {
            return Promise.resolve("IF is already synced with disk");
        }

        this.datasetDict = {};

        let promiseList: Array<Promise<any>> = [];

        let newDataset: Dataset;
        for (let id in coursesFileObj) {
            newDataset = new CoursesDataset(id, coursesFileObj[id]);
            promiseList.push(newDataset.readZipFile());
            this.datasetDict[id] = newDataset;
        }

        for (let id in roomsFileObj) {
            newDataset = new RoomsDataset(id, roomsFileObj[id]);
            promiseList.push(newDataset.readZipFile());
            this.datasetDict[id] = newDataset;
        }

        return Promise.all(promiseList);
    }

    // Input: string
    // Output: boolean whether string is a valid id
    public isIDValid(id: string): boolean {
        if (id.includes("_")) {
            return false;
        }
        // if id contains only whitespace
        if (!id.replace(/\s/g, "").length) {
            return false;
        }

        return true;
    }
}

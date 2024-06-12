import Log from "../Util";
import Course, { CourseSection } from "./Course";
import { CoursesDataset } from "./CoursesDataset";
import { InsightError, ResultTooLargeError } from "./IInsightFacade";
import { idExtractor, QueryStructure } from "./QueryUtils/QueryUtils";
import { queryValidatorFinal } from "./QueryUtils/QueryValidators/QueryValidatorMain";
import { queryPerformerBody } from "./QueryUtils/QueryPerformers/QueryPerformerBody";

interface ResultObject {
    [key: string]: string | number;
}

export default class Query {

    private queryStructure: QueryStructure;
    private results: ResultObject[] = [];
    private validDatasetIds: string[];
    public queryId: string;

    /**
     * @constructor
     * @param {QueryStructure} queryObj - query object to pass in
     * @param idList - list of valid dataset ids
     */
    constructor(queryObj: QueryStructure, idList: string[]) {
        this.queryStructure = this.queryBuilder(queryObj, idList);
        this.queryId = idExtractor(this.queryStructure["OPTIONS"]["COLUMNS"], idList);
    }

    /**
     * Builds the query if valid, throw InsightError otherwise
     * @param {any} obj - the query object to validate
     * @param {string[]} idList - a list of valid id strings (from all the datasets)
     */
    private queryBuilder(obj: any, idList: string[]): QueryStructure {
        if (queryValidatorFinal(obj, idList)) {
            this.validDatasetIds = idList;
            return obj;
        } else {
            // Log.trace(obj);
            throw new InsightError("Invalid query");
        }
    }

    /**
     * Gets the list of results
     * @returns {ResultObject[]}
     */
    public getResults(): ResultObject[] {
        return this.results;
    }

    /**
     * Gets the valid queryStructure
     */
    public getQueryStructure(): QueryStructure {
        return this.queryStructure;
    }

    /**
     * Gets the idstring of the query (refers to which dataset to query)
     */
    public getQueryId(): string {
        return this.queryId;
    }

    /**
     * Gets the COLUMNS array
     */
    public getColumns() {
        return this.getQueryStructure()["OPTIONS"]["COLUMNS"];
    }
}

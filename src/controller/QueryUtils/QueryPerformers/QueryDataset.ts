import Course, { CourseSection } from "../../Course";
import Building, { Room } from "../../Building";
import { Dataset } from "../../Dataset";
import { InsightDatasetKind, ResultTooLargeError } from "../../IInsightFacade";
import Query from "../../Query";
import {
    columnExtractor,
    isCourseSection,
    isRoom,
    OrderObject,
    QueryStructure,
    ResultObject,
    resultObjectConverter
} from "../QueryUtils";
import { queryPerformerBody } from "./QueryPerformerBody";
import { applyTransformationsFinal } from "./QueryTransformer";
import Log from "../../../Util";

/**
 * For each course in dataset's courselist, run queryCourse()
 * @param {Dataset} dataset - dataset to be queried
 * @param {Query} query - valid query object
 * @returns {Promise<ResultObject[]>}
 */
const runQueryOnDataset = (dataset: Dataset, query: Query): Promise<ResultObject[]> => {
    const promiseList: Array<Promise<ResultObject[]>> = [];
    const datasetKind: string = dataset.getDatasetKind();
    const datasetContents = Object.values(dataset.getDataset());
    datasetContents.forEach((item) => {
        promiseList.push(queryItem(item, query, datasetKind));
    });
    return Promise.all(promiseList).then((arrayOfArrays: ResultObject[][]) => {
        let resArray: ResultObject[] = [].concat(...arrayOfArrays);

        // Apply transformations
        if (query.getQueryStructure()["TRANSFORMATIONS"]) {
            resArray = applyTransformationsFinal(resArray, query.getQueryStructure()["TRANSFORMATIONS"]);
        } else {
            const extractedArray: ResultObject[] = [];
            const allowedColumns = query.getColumns();
            const id = query.getQueryId();
            resArray.forEach((obj) => {
                extractedArray.push(columnExtractor(obj, allowedColumns, id));
            });
            resArray = extractedArray;
        }

        if (query.getQueryStructure().OPTIONS.ORDER) {
            // Log.trace("sorting!!");
            const orderObj = query.getQueryStructure().OPTIONS.ORDER;
            resArray = sortArray(resArray, orderObj);
            // Log.trace("resArray", resArray);
        }

        if (resArray.length > 5000) {
            throw new ResultTooLargeError();
        }

        return resArray;
    });
};

/**
 * Sorts the given array
 * @param {ResultObject[]} array - array to be sorted
 * @param {OrderObject | string} order - the order object to refer to for sorting rules
 */
const sortArray = (array: ResultObject[], order: OrderObject | string): ResultObject[] => {
    switch (typeof order) {
        case "object":
            const dir: string = order["dir"];
            const keys: string[] = order["keys"];
            return objectSortHelper(array, keys, dir);
        case "string":
            const key = order as string;
            // Log.trace("sorting by string", order);
            const sortedArray = array.sort((a, b) => {
                if (a[key] < b[key]) {
                    return -1;
                }
                if (a[key] > b[key]) {
                    return 1;
                }
                return 0;
            });
            return sortedArray;
        default:
            return array;
    }
};

/**
 * Helper for sortArray (for object cases)
 * @param {ResultObject[]} array - array to sort
 * @param {string[]} keys - list of keys in order of sorting priority
 * @param {string} dir - direction (ascending / descending)
 */
const objectSortHelper = (array: ResultObject[], keys: string[], dir: string): ResultObject[] => {
    switch (dir) {
        case "UP":
            return array.sort((a, b) => {
                return sortAscendingHelper(a, b, keys);
            });
        case "DOWN":
            return array.sort((a, b) => {
                return sortDescendingHelper(a, b, keys);
            });
        default:
            return array;
    }
};

/**
 * Helper for ascending sorts
 * @param {ResultObject} a - first of a pair of objects to sort
 * @param {ResultObject} b - second of a pair of objects to sort
 * @param {string[]} keys - list of keys in order of sorting priority
 */
const sortAscendingHelper = (a: ResultObject, b: ResultObject, keys: string[]): number => {
    if (keys.length === 0) {
        // no more keys to use as tiebreaker
        return 0;
    } else {
        const param = keys[0];
        if (a[param] < b[param]) {
            return -1;
        } else if (a[param] > b[param]) {
            return 1;
        } else {
            return sortAscendingHelper(a, b, keys.slice(1, keys.length));
        }
    }
};

/**
 * Helper for descending sorts
 * @param {ResultObject} a - first of a pair of objects to sort
 * @param {ResultObject} b - second of a pair of objects to sort
 * @param {string[]} keys - list of keys in order of sorting priority
 */
const sortDescendingHelper = (a: ResultObject, b: ResultObject, keys: string[]): number => {
    if (keys.length === 0) {
        // no more keys to use as tiebreaker
        return 0;
    } else {
        const param = keys[0];
        if (a[param] < b[param]) {
            return 1;
        } else if (a[param] > b[param]) {
            return -1;
        } else {
            return sortAscendingHelper(a, b, keys.slice(1, keys.length));
        }
    }
};

/**
 * Queries a Course or Building
 * @param {Course | Building} item - the Course or Building to Query
 * @param {Query} query - the valid query object to refer to
 * @param {string} datasetKind - either "courses" or "rooms"
 * @returns {Promise<ResultObject[]>}
 */
const queryItem = (item: Course | Building, query: Query, datasetKind: string): Promise<ResultObject[]> => {
    const resultList: ResultObject[] = [];
    if (datasetKind === "courses") {
        item = item as Course;
        item.getSections().forEach((section: CourseSection) => {
            const filterObject = query.getQueryStructure()["WHERE"];
            if (queryRoomOrCourse(section, filterObject)) {
                resultList.push(resultObjectConverter(section, query.getQueryId()));
            }
        });
    } else {
        item = item as Building;
        item.getRooms().forEach((room: Room) => {
            const filterObject = query.getQueryStructure()["WHERE"];
            if (queryRoomOrCourse(room, filterObject)) {
                resultList.push(resultObjectConverter(room, query.getQueryId()));
            }
        });
    }
    return Promise.resolve(resultList);
};

/**
 * Decides whether or not the courseSection fits the criteria
 * @param {CourseSection} courseSection - courseSection in courses to iterate through
 * @param {object} filterObject - the WHERE clause of a query object
 */
const queryRoomOrCourse = (item: CourseSection | Room, filterObject: object): boolean => {
    if (Object.keys(filterObject).length === 0) {
        return true;
    } else {
        if (isCourseSection(item)) {
            return queryPerformerBody(item, filterObject, "courseSection");
        } else if (isRoom(item)) {
            return queryPerformerBody(item, filterObject, "room");
        } else {
            return false;
        }
    }
};

export { runQueryOnDataset, queryItem };

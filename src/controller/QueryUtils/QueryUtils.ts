import Log from "../../Util";
import { Room } from "../Building";
import { CourseSection } from "../Course";
export interface MComparison {
    mkey: number;
}

export interface SComparison {
    skey: string;
}

export interface LComparison {
    operator: Filter[];
}

export interface Negation {
    filter: Filter;
}

export type Filter = MComparison | SComparison | LComparison | Negation;

export interface QueryStructure {
    "WHERE": object;
    "OPTIONS": Options;
    "TRANSFORMATIONS"?: Transformations;
}

export interface Options {
    "COLUMNS": string[];
    "ORDER"?: OrderObject | string;
    // temporary bypass
    // "ORDER"?: any;
}

export interface OrderObject {
    "dir": "UP" | "DOWN";
    "keys": string[];
}

export interface Transformations {
    "GROUP": string[];
    "APPLY": Apply[];
}

export interface Apply {
    [key: string]: ApplyObject;
}

export interface ApplyObject {
    [key: string]: string;
}

export interface ResultObject {
    [key: string]: string | number;
}

/**
 * Determines whether a key is valid and refers to an added dataset
 * @param {string} key - the key to check
 * @param {string[]} idList - list of valid ids
 * @param {string} keyType (optional) - skey | mkey
 */
const keyValidator = (key: string, idList: string[], keyType?: string): boolean => {
    if (idList.includes(key)) {
        // this means mkey is something like "courses" without the idstring
        return false;
    } else {
        const id = key.split("_")[0];
        const field = key.split("_")[1];
        const validMFields = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
        const validSFields = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname",
            "number", "name", "address", "type", "furniture", "href"];
        if (keyType) {
            switch (keyType) {
                case "mkey":
                    return idList && idList.includes(id) && validMFields.includes(field);
                case "skey":
                    return idList && idList.includes(id) && validSFields.includes(field);
            }
        } else {
            return idList && idList.includes(id) && (validMFields.includes(field) || validSFields.includes(field));
        }

    }
};

/**
 * Extracts a valid idstring if found, false otherwise
 * @param {string[]} arr - the COLUMNS array
 * @param {string[]} idList - list of valid ids
 */
const idExtractor = (arr: string[], idList: string[]): any => {
    const checkableIds: string[] = [];
    arr.forEach((el) => {
        if (el.includes("_")) {
            checkableIds.push(el);
        }
    });
    const columnIds = checkableIds.map((el) => {
        return el.split("_")[0];
    });
    if (columnIds.every((el) => el === columnIds[0]) && idList.includes(columnIds[0])) {
        return columnIds[0];
    } else {
        return false;
    }
};

/**
 * Helper function to quickly extract values from courseSection and query
 * @param {any} kindObject - either CourseSection or Room
 * @param {object} obj
 */
const valueExtractor = (kindObject: any, obj: object, type: string): any[] => {
    const queryValue: string | number = Object.values(obj)[0];
    const commonKey: string = Object.keys(obj)[0].split("_")[1];
    const sectionKey: string = Object.keys(kindObject).find((k) => k === commonKey);
    let csValue;
    if (type === "courseSection") {
        switch (commonKey) {
            case "dept":
            case "id":
            case "instructor":
            case "title":
            case "uuid":
                csValue = kindObject[sectionKey];
                csValue = csValue as number;
                return [queryValue, csValue];
            case "avg":
            case "pass":
            case "fail":
            case "audit":
            case "year":
                csValue = kindObject[sectionKey];
                csValue = csValue as string;
                return [queryValue, csValue];
        }
    } else {
        switch (commonKey) {
            case "fullname":
            case "shortname":
            case "number":
            case "name":
            case "address":
            case "type":
            case "furniture":
            case "href":
                csValue = kindObject[sectionKey];
                csValue = csValue as string;
                return [queryValue, csValue];
            case "lat":
            case "lon":
            case "seats":
                csValue = kindObject[sectionKey];
                csValue = csValue as number;
                return [queryValue, csValue];
        }
    }
};

const isCourseSection = (arg: any): arg is CourseSection => {
    return arg && Object.keys(arg).length === 10;
};

const isRoom = (arg: any): arg is Room => {
    return arg && Object.keys(arg).length === 11;
};

const isApply = (arg: any): arg is object => {
    return arg &&
        arg instanceof Object &&
        !(arg instanceof Array) &&
        Object.keys(arg).length === 1 &&
        arg !== null &&
        arg !== undefined &&
        typeof arg === "object";
};

const isApplyObject = (arg: any): arg is object => {
    return arg &&
        arg instanceof Object &&
        !(arg instanceof Array) &&
        Object.keys(arg).length === 1 &&
        arg !== null &&
        arg !== undefined &&
        typeof arg === "object";
};

/**
 * Extracts all the applykeys from the applyrules (assuming the object is valid)
 * @param {Transformations} obj - transformation object
 */
const transformationKeysExtractor = (obj: Transformations): string[] => {
    const group = obj["GROUP"];
    const apply = obj["APPLY"];
    const allKeys: string[] = [];
    apply.forEach((applyRule: object) => {
        allKeys.push(Object.keys(applyRule)[0]);
    });
    group.forEach((key: string) => {
        allKeys.push(key);
    });
    return allKeys;
};

/**
 * Returns a filtered object with only specified columns
 * @param {ResultObject} item - object to filter
 * @param {string[]} allowedColumns - columns to keep
 * @param {string} id - id of the dataset to query
 */
const columnExtractor = (item: ResultObject, allowedColumns: string[], id: string): ResultObject => {
    allowedColumns = allowedColumns.map((key) => {
        return key.split("_")[1];
    });
    const sectionKeys = Object.keys(item);
    const sectionValues = Object.values(item);
    const filtered: ResultObject = {};
    sectionKeys.forEach((key: string) => {
        const field = key.split("_")[1];
        if (allowedColumns.includes(field)) {
            filtered[`${id}_${field}`] = sectionValues[sectionKeys.indexOf(key)];
        }
    });
    return filtered;
};

/**
 * Returns a ResultObject from a courseSection or room object
 * @param {CourseSection | Room} item - object to convert
 * @param {string} id - valid dataset id
 */
const resultObjectConverter = (item: CourseSection | Room, id: string): ResultObject => {
    const result: ResultObject = {};
    const itemKeys = Object.keys(item);
    const itemValues = Object.values(item);
    itemKeys.forEach((key: string) => {
        result[`${id}_${key}`] = itemValues[itemKeys.indexOf(key)];
    });
    return result;
};

export {
    idExtractor,
    keyValidator,
    valueExtractor,
    transformationKeysExtractor,
    isCourseSection,
    isRoom,
    isApply,
    isApplyObject,
    columnExtractor,
    resultObjectConverter
};

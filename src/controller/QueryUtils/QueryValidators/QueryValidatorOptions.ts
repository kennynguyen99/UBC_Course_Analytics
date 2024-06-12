import Log from "../../../Util";
import { keyValidator, Options, OrderObject, Transformations } from "../QueryUtils";
import { transformationKeysExtractor } from "../QueryUtils";
import { queryValidatorTransformations } from "./QueryValidatorTransformations";

/**
 * Validates the Options part of the query
 * @param {Options} obj - contains "COLUMNS" and maybe "SORT"
 * @param {string[]} idList - list of valid IDs
 * @param {Transformations} transformations? - VALID transformations object
 */
const queryValidatorOptions = (obj: Options, idList: string[], transformations?: Transformations): boolean => {
    const keys = Object.keys(obj);
    if (!isOptions(obj)) {
        return false;
    } else {
        const columns: string[] = obj["COLUMNS"];
        if (queryValidatorTransformations(transformations, idList)) {
            const transformationKeys = transformationKeysExtractor(transformations);
            if (keys.includes("ORDER") && keys.length === 2) {
                const order = obj["ORDER"];
                return queryValidatorOrder(order, idList, columns) &&
                    queryValidatorColumns(columns, idList, transformationKeys);
            } else {
                return keys.length === 1 &&
                    queryValidatorColumns(columns, idList, transformationKeys);
            }
        } else {
            if (keys.includes("ORDER") && keys.length === 2) {
                const order = obj["ORDER"];
                return queryValidatorOrder(order, idList, columns) &&
                    queryValidatorColumns(columns, idList);
            } else {
                return keys.length === 1 &&
                    queryValidatorColumns(columns, idList);
            }
        }
    }
};

/**
 * Validates the OrderObject
 * @param {OrderObject | string} order
 * @param {string[]} idList
 * @param {string[]} keyList
 */
const queryValidatorOrder = (order: OrderObject | string, idList: string[], keyList: string[]): boolean => {
    switch (typeof order) {
        case "object":
            if (!isOrderObject(order)) {
                return false;
            } else {
                const orderKeys = order["keys"];
                const dir = order["dir"];
                return orderKeys.every((key) => {
                    if (key.includes("_")) {
                        return keyList.includes(key) && keyValidator(key, idList);
                    } else {
                        return keyList.includes(key);
                    }
                }) && isValidDirection(dir);
            }
        case "string":
            return keyValidator(order as string, idList) && keyList.includes(order as string);
        default:
    }
};

/**
 * Checks if the passed argument is of type Options during runtime
 * @param arg
 */
const isOptions = (arg: any): arg is Options => {
    // return arg && arg["COLUMNS"] && arg["COLUMNS"] instanceof Array;
    const keys = Object.keys(arg);
    const vagueArgValue: any = arg["COLUMNS"];
    return arg &&
        keys.includes("COLUMNS") &&
        keys.length <= 2 &&
        vagueArgValue instanceof Array &&
        vagueArgValue.every((el: any) => typeof el === "string");

};

/**
 * Validifies the COLUMNS array
 * @param {string[]} columns - e.g. ["courses_avg", "overallAvg"]
 * @param {string[]} idList - e.g. "courses"
 * @param {string[]} transformationKeys? (optional) - e.g. ["overallAvg"]
 */
const queryValidatorColumns = (columns: string[], idList: string[], transformationKeys?: string[]): boolean => {
    if (columns.length < 1) {
        return false;
    }
    if (transformationKeys) {
        return columns.every((key) => {
            return transformationKeys.includes(key)
                // || keyValidator(key, idList)
                ;
        });
    } else {
        return columns.every((key) => {
            const bool = keyValidator(key, idList);
            return bool;
        });
    }
};

/**
 * Checks if an arg is an OrderObject
 * @param arg
 */
const isOrderObject = (arg: any): arg is OrderObject => {
    const keys = Object.keys(arg);
    return arg &&
        keys.length === 2 &&
        arg["keys"] &&
        arg["dir"];
};

/**
 * Validates the direction
 * @param arg
 */
const isValidDirection = (arg: any): arg is string => {
    return arg === "UP" || arg === "DOWN";
};

export { queryValidatorOptions };

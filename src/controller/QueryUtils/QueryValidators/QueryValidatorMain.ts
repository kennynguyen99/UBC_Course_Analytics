import { queryValidatorBody } from "./QueryValidatorBody";
import { queryValidatorOptions } from "./QueryValidatorOptions";
import { Filter, QueryStructure } from "../QueryUtils";
import { queryValidatorTransformations } from "./QueryValidatorTransformations";
import Log from "../../../Util";

/**
 * Validates the query BODY and OPTIONS
 * @param {string[]} columns
 * @param {string[]} idList - list of valid IDs
 */
const queryValidatorFinal = (obj: QueryStructure, idList: string[]): boolean => {
    if (!isQueryStructure(obj)) {
        return false;
    } else {
        if (!isBodyStructure(obj["WHERE"])) {
            return false;
        } else {
            const body = obj["WHERE"];
            const options = obj["OPTIONS"];
            if (obj["TRANSFORMATIONS"]) {
                const transformations = obj["TRANSFORMATIONS"];
                if (Object.keys(body).length === 0) {
                    return queryValidatorTransformations(transformations, idList) ?
                        queryValidatorOptions(options, idList, transformations) :
                        false;
                } else {

                    return queryValidatorTransformations(transformations, idList) ?
                        queryValidatorOptions(options, idList, transformations) && queryValidatorBody(body, idList) :
                        false;
                }
            } else {
                return Object.keys(body).length === 0 ?
                    queryValidatorOptions(options, idList) :
                    queryValidatorBody(body, idList) && queryValidatorOptions(options, idList);
            }
        }
    }
};

/**
 * Validates a query
 * @param arg
 */
const isQueryStructure = (arg: any): arg is QueryStructure => {
    const keys = Object.keys(arg);
    return keys.length >= 2 &&
        keys.length <= 3 &&
        keys.includes("WHERE") &&
        keys.includes("OPTIONS");
};

/**
 * Validates the body section of a query
 * @param arg
 */
const isBodyStructure = (arg: any): arg is Filter => {
    return arg && arg instanceof Object && !(arg instanceof Array);
};

export { queryValidatorFinal };

import Log from "../../../Util";
import { Room } from "../../Building";
import { CourseSection } from "../../Course";
import { valueExtractor, isCourseSection, isRoom } from "../QueryUtils";
/**
 * Recursive helper function for queryCourseSection
 * @param {CourseSection | Room} querySubject
 * @param {object} queryContext
 * @param {string} kind
 */
const queryPerformerBody = (querySubject: CourseSection | Room, queryContext: object, kind: string): boolean => {
    const conditionKey: string = Object.keys(queryContext)[0];
    const conditionValue = Object.values(queryContext)[0];
    switch (conditionKey) {
        case "GT":
        case "LT":
        case "EQ":
            return conditionValue instanceof Object ?
                queryMComparison(querySubject, conditionValue, conditionKey, kind) :
                false;

        case "IS":
            return conditionValue instanceof Object ?
                querySComparison(querySubject, conditionValue, kind) :
                false;

        case "NOT":
            return conditionValue instanceof Object ?
                !queryPerformerBody(querySubject, conditionValue, kind) :
                false;

        case "AND":
        case "OR":
            return conditionValue instanceof Array ?
                queryLComparison(querySubject, conditionValue, conditionKey, kind) :
                false;
    }
};

/**
 * Helper for LComparisons
 * @param {CourseSection | Room} querySubject
 * @param {object[]} arr
 * @param {string} condition
 * @param {string} kind
 */
const queryLComparison = (querySubject: CourseSection | Room, arr: object[], condition: string, kind: string):
    boolean => {
    switch (condition) {
        case "OR":
            return arr.some((obj: object) => {
                return queryPerformerBody(querySubject, obj, kind);
            });
        case "AND":
            return arr.every((obj: object) => {
                return queryPerformerBody(querySubject, obj, kind);
            });
        default:
            return false;
    }
};

/**
 * Helper for MComparisons
 * @param {CourseSection | Room} querySubject - object of which to get the value of
 * @param obj - the MComparison object to carry out the comparison with
 * @param {string} condition - one of "GT", "LT", or "EQ"
 * @param {string} kind
 */
const queryMComparison = (querySubject: CourseSection | Room, obj: object, condition: string, kind: string):
    boolean => {
    const [queryValue, csValue] = valueExtractor(querySubject, obj, kind);
    switch (condition) {
        case "GT":
            return csValue > queryValue;
        case "LT":
            return csValue < queryValue;
        case "EQ":
            return csValue === queryValue;
    }
};

/**
 * Helper for SComparisons
 * @param {CourseSection | Room} courseSection
 * @param obj
 * @param {string} kind
 */
const querySComparison = (querySubject: CourseSection | Room, obj: object, kind: string): boolean => {
    let [queryValue, csValue] = valueExtractor(querySubject, obj, kind);
    switch (true) {
        // *string*
        case queryValue === "*":
            return true;
        case queryValue.startsWith("*") && queryValue.endsWith("*"):
            if (queryValue === "***") {
                return false;
            } else {
                const querySubstr: string = queryValue.substring(1, queryValue.length - 1);
                return csValue.includes(querySubstr) && !querySubstr.includes("*");
            }

        // string*
        case queryValue.endsWith("*"):
            return csValue.startsWith(queryValue.substring(0, queryValue.length - 1));

        // *string
        case queryValue.startsWith("*"):
            return csValue.endsWith(queryValue.substring(1, queryValue.length));

        // string without asterisk
        default:
            return csValue === queryValue;

    }
};

export { queryPerformerBody };

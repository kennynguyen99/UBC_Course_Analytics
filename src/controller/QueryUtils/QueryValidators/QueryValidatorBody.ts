import { Filter, SComparison, MComparison, keyValidator } from "../QueryUtils";

/**
 * Validates the query's body (inside the WHERE)
 * @param {object} obj - query object
 * @param {string[]} idList
 */
const queryValidatorBody = (obj: object, idList: string[]): boolean => {

    if (Object.keys(obj).length > 1) {
        return false;
    } else {
        const filterKey: string = Object.keys(obj)[0];
        const filterValue = Object.values(obj)[0];

        switch (filterKey) {
            // go to LOGICCOMPARISON helper
            case "OR":
            case "AND":
                return filterValue instanceof Array ?
                    idList && queryValidatorLogic(filterValue, idList) :
                    false;

            // recurse
            case "NOT":
                return filterValue instanceof Object ?
                    idList && queryValidatorBody(filterValue, idList) :
                    false;

            // go to MCOMPARISON helper
            case "LT":
            case "GT":
            case "EQ":
                return filterValue instanceof Object ?
                    idList && queryValidatorMComparison(filterValue, idList) :
                    false;
            // might need a stronger typecheck


            // go to SCOMPARISON helper
            case "IS":
                return filterValue instanceof Object ?
                    idList && queryValidatorSComparison(filterValue, idList) :
                    false;

            // every other input
            default:
                return false;
        }
    }
};

/**
 * Checks if array is empty, else recurse back to queryValidatorBody to continue checking down the tree
 * @param {Filter[]} arr - a list of objects to call queryValidatorBody on (to recurse)
 * @param {string[]} idList
 */
const queryValidatorLogic = (arr: Filter[], idList: string[]): boolean => {
    if (arr.length < 1) {
        return false;
    } else {
        return arr.every((obj) => {

            // loop back to queryValidatorBody
            return queryValidatorBody(obj, idList);
        });
    }
};

/**
 * Checks if the passed object only has 1 key-value pair with a valid mKey
 * @param {MComparison} obj
 * @param {string[]} idList
 */
const queryValidatorMComparison = (obj: MComparison, idList: string[]): boolean => {
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    if (keys.length !== 1) {
        return false;
    } else {
        return keyValidator(keys[0], idList, "mkey") && typeof values[0] === "number";
    }
};

/**
 * Checks if the passed object only has 1 key-value pair with a valid sKey
 * @param {SComparison} obj - object in question
 * @param {string[]} idList
 */
const queryValidatorSComparison = (obj: SComparison, idList: string[]): boolean => {
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    if (keys.length !== 1) {
        return false;
    } else {
        const skey = keys[0];
        if (typeof (values[0]) !== "string") {
            return false;
        } else {
            const input: string = values[0];
            const iskeyValid = keyValidator(skey, idList, "skey") && typeof input === "string";
            let querySubstr: string;
            switch (true) {
                case input === "*":
                    return true;
                case input.startsWith("*") && input.endsWith("*"):
                    if (input === "***") {
                        return false;
                    } else {
                        querySubstr = input.substring(1, input.length - 1);
                        return iskeyValid && !querySubstr.includes("*");
                    }

                // string*
                case input.endsWith("*"):
                    querySubstr = input.substring(0, input.length - 1);
                    return iskeyValid && !querySubstr.includes("*");

                // *string
                case input.startsWith("*"):
                    querySubstr = input.substring(1, input.length);
                    return iskeyValid && !querySubstr.includes("*");

                // string without asterisk
                default:
                    return iskeyValid;
            }
        }
    }
};

export { queryValidatorBody };

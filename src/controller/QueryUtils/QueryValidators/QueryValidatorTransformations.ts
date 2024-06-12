import Log from "../../../Util";
import { Transformations, keyValidator, Apply, ApplyObject } from "../QueryUtils";

/**
 * Validates the transformation object
 * @param obj
 * @param idList
 */
const queryValidatorTransformations = (obj: Transformations, idList: string[]): boolean => {
    // explicit object check
    if (!(typeof obj === "object" && obj !== null) || !(obj instanceof Object)) {
        return false;
    }
    if (!Object.keys(obj).includes("GROUP") || !Object.keys(obj).includes("APPLY") || Object.keys(obj).length !== 2) {
        return false;
    } else {
        const group = obj["GROUP"];
        const apply = obj["APPLY"];
        return idList && queryValidatorGroup(group, idList) && queryValidatorApply(apply, idList);
    }
};

/**
 * Validates the Group in Transformations
 * @param {string[]} arr
 * @param {string[]} idList
 */
const queryValidatorGroup = (arr: string[], idList: string[]): boolean => {
    return isGroupArray(arr) && arr.length >= 1 && arr.every((key) => {
        return typeof key === "string" && keyValidator(key, idList);
    });
};

/**
 * Validates the Apply in Transformations
 * @param {object[]} arr
 * @param {string[]} idList
 */
const queryValidatorApply = (arr: object[], idList: string[]): boolean => {
    if (arr.length === 0) {
        return true;
    } else {
        const validApplyTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
        const applyKeys: string[] = [];
        return isApplyArray(arr) && arr.every((applyRule) => {
            if (Object.keys(applyRule).length !== 1) {
                return false;
            }
            const applyKey = Object.keys(applyRule)[0];
            if (applyKeys.includes(applyKey) || applyKey.includes("_")) {
                return false;
            } else {
                applyKeys.push(applyKey);
                const applyObject: ApplyObject = Object.values(applyRule)[0];

                const applyTokens = Object.keys(applyObject);
                const key = Object.values(applyObject)[0];
                let validApplyTokenKey = validateApplyTokenType(applyTokens[0], key);
                return idList &&
                    applyTokens.length === 1 &&
                    validApplyTokenKey &&
                    keyValidator(key, idList);
            }
        });
    }
};

/**
 * Validates the applytoken
 * @param applyToken
 * @param key
 */
const validateApplyTokenType = (applyToken: string, key: string) => {
    const field = key.split("_")[1];
    const numberFields = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    const stringFields = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname",
        "number", "name", "address", "type", "furniture", "href"];
    switch (applyToken) {
        case "MAX":
        case "MIN":
        case "AVG":
        case "SUM":
            return numberFields.includes(field);
        case "COUNT":
            return numberFields.includes(field) || stringFields.includes(field);
        default:
            return false;
    }
};

const isApplyArray = (arg: any): arg is Apply[] => {
    return arg && arg instanceof Array;
};

const isGroupArray = (arg: any): arg is string[] => {
    return arg &&
        arg instanceof Array &&
        arg.length >= 1;
};

export { queryValidatorTransformations };

import { Apply, ApplyObject, isApply, isApplyObject, ResultObject, Transformations } from "../QueryUtils";
import Decimal from "decimal.js";
import Log from "../../../Util";

/**
 * Applies transformations on a given array
 * @param {ResultObject[]} arrayOfArrays
 * @param {Transformations} transObj
 */
const applyTransformationsFinal = (arrayOfArrays: ResultObject[], transObj: Transformations): ResultObject[] => {
    const groupParams = transObj["GROUP"];
    const grouped = groupQueries(arrayOfArrays, groupParams);
    return applyTransformations(grouped, transObj);
};

/**
 * Returns a 2D array of grouped arrays
 * @param {ResultObject[]} initArray - initial array of all the objects
 * @param {string[]} groupParameters - group parameters to check
 */
const groupQueries = (initArray: ResultObject[], groupParameters: string[]): ResultObject[][] => {
    let arrayOfArrays: ResultObject[][] = [];
    initArray.forEach((obj: ResultObject) => {
        if (arrayOfArrays.length < 1) {
            arrayOfArrays.push([obj]);
        } else {
            // tries to find an array to group the object with
            const foundArray = arrayOfArrays.find((array: ResultObject[]) => {
                return isObjectGroupable(array, obj, groupParameters);
            });

            if (foundArray) {
                foundArray.push(obj);
            } else {
                arrayOfArrays.push([obj]);
            }
        }
    });
    return arrayOfArrays;
};

/**
 * Checks if an object is groupable with elements in an array
 * @param {ResultObject[]} array
 * @param {ResultObject} obj
 * @param {string[]} groupParameters
 */
const isObjectGroupable = (array: ResultObject[], obj: ResultObject, groupParameters: string[]): boolean => {
    const existingObj: any = array[0];
    return groupParameters.every((parameter) => {
        return obj[parameter] === existingObj[parameter];
    });
};

/**
 * Applies transformations
 * @param {ResultObject[][]} arrayOfArrays
 * @param {Transformations} transformations
 */
const applyTransformations = (arrayOfArrays: ResultObject[][], transformations: Transformations): ResultObject[] => {
    const groupParameters = transformations["GROUP"];
    const applyParameters = transformations["APPLY"];

    return arrayOfArrays.reduce((resArray, currArray) => {
        resArray.push(applyHelper(currArray, groupParameters, applyParameters));
        return resArray;
    }, []);
};

/**
 * Handles transformations according to valid applyTokens
 * @param {ResultObject[]} array
 * @param {string[]} groupParameters
 * @param {Apply[]} applyParameters
 */
const applyHelper = (array: ResultObject[], groupParameters: string[], applyParameters: Apply[]): ResultObject => {
    let resObj: ResultObject = {};
    groupParameters.forEach((parameter) => {
        resObj[parameter] = array[0][parameter];
    });
    applyParameters.forEach((parameter: Apply) => {
        const [applyKey, applyToken, comparedGroup] = applyExtractor(parameter);
        switch (applyToken) {
            case "MAX":
                resObj[applyKey] = maxHelper(array, comparedGroup);
                return;
            case "MIN":
                resObj[applyKey] = minHelper(array, comparedGroup);
                return;
            case "SUM":
                resObj[applyKey] = sumHelper(array, comparedGroup);
                return;
            case "AVG":
                resObj[applyKey] = avgHelper(array, comparedGroup);
                return;
            case "COUNT":
                resObj[applyKey] = countUnique(array, comparedGroup);
                return;
        }
    });
    return resObj;
};

/**
 * Helper for MAX transformations
 * @param {ResultObject[]} array - array of objects to perform transformations on
 * @param {parameter} parameter - parameter to compare
 */
const maxHelper = (array: ResultObject[], parameter: string) => {
    let max = 0;
    array.forEach((obj) => {
        const objValue = obj[parameter] as number;
        max = Math.max(objValue, max);
    });
    return max;
};

/**
 * Helper for MIN transformations
 * @param {ResultObject[]} array - array of objects to perform transformations on
 * @param {parameter} parameter - parameter to compare
 */
const minHelper = (array: ResultObject[], parameter: string) => {
    let min = Infinity;
    array.forEach((obj) => {
        const objValue = obj[parameter] as number;
        min = Math.min(objValue, min);
    });
    return min;
};

/**
 * Helper for SUM transformations
 * @param {ResultObject[]} array - array of objects to perform transformations on
 * @param {parameter} parameter - parameter to compare
 */
const sumHelper = (array: ResultObject[], parameter: string) => {
    let sum = 0;
    array.forEach((obj) => {
        const objValue = obj[parameter] as number;
        sum += objValue;
    });
    return Number(sum.toFixed(2));
};

/**
 * Helper for AVG transformations
 * @param {ResultObject[]} array - array of objects to perform transformations on
 * @param {parameter} parameter - parameter to compare
 */
const avgHelper = (array: ResultObject[], parameter: string) => {
    let currSum = new Decimal(0);
    let numObj = 0;
    array.forEach((obj) => {
        const objValue = new Decimal(obj[parameter] as number);
        currSum = Decimal.add(currSum, objValue);
        numObj++;
    });
    return Number((currSum.toNumber() / numObj).toFixed(2));
};

/**
 * Helper for COUNT transformations
 * @param {ResultObject[]} array - array of objects to perform transformations on
 * @param {parameter} parameter - parameter to compare
 */
const countUnique = (array: ResultObject[], parameter: string): number => {
    const checkpoint: any[] = [];
    array.forEach((obj) => {
        if (!checkpoint.includes(obj[parameter])) {
            checkpoint.push(obj[parameter]);
        }
    });
    return checkpoint.length;
};

/**
 * Extracts the applyKey, applyToken, and the group to compare from the ApplyRule
 * @param parameter
 */
const applyExtractor = (parameter: object) => {
    let applyKey, applyObj, applyToken, comparedGroup: string;
    if (isApply(parameter)) {
        applyKey = Object.keys(parameter)[0];
        applyObj = Object.values(parameter)[0];
        if (isApplyObject(applyObj)) {
            applyToken = Object.keys(applyObj)[0];
            comparedGroup = Object.values(applyObj)[0] as string;
        }
    }
    return [applyKey, applyToken, comparedGroup];
};

export { groupQueries, applyTransformations, applyTransformationsFinal };

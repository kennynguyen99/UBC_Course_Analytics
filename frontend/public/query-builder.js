/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = () => {
    let query = {};
    const datatype = getActiveTab();
    query["WHERE"] = buildBody(datatype);
    query["OPTIONS"] = buildOptions(datatype);
    const trans = buildTransformations(datatype);
    if (trans) {
        query["TRANSFORMATIONS"] = buildTransformations(datatype);
    }

    return query;
};

/* MAIN BUILDERS */
const buildBody = (type) => {
    let body = {};
    const condType = getConditionType(type);
    const conditions = getConditions(type);
    if (conditions.length === 0) {
        return body;
    }
    else if (conditions.length === 1 && condType !== "none") {
        return conditions[0];
    } else if (conditions.length === 1 && condType === "none") {
        body["NOT"] = conditions[0];
        return body;
    } else {
        switch (condType) {
            case "all":
                body["AND"] = conditions;
                break;
            case "any":
                body["OR"] = conditions
                break;
            case "none":
                let tempObj = {};
                tempObj["OR"] = conditions;
                body["NOT"] = tempObj;
                break;
        }
        return body;
    }
}

const buildOptions = (type) => {
    let options = {};
    options["COLUMNS"] = getAllColumnCheckboxes(type);
    const orderObj = getOrder(type);
    if (Object.keys(orderObj).length >= 1) {
        options["ORDER"] = orderObj;
    }
    return options;
}

const buildTransformations = (type) => {
    let transformations = {};
    const groups = getGroups(type);
    const apply = getApply(type);
    if (groups.length < 1) {
        return;
    }
    transformations["GROUP"] = groups;
    transformations["APPLY"] = apply;
    return transformations;
}

/* GENERAL HELPERS */

const getActiveTab = () => {
    return document.querySelector("a.nav-item.tab.active").getAttribute("data-type");
}

/* BODY HELPERS */

const getConditionType = (type) => {
    return document.querySelector(`div#tab-${type} > form > div.conditions > div.condition-type > div.control > input[checked]`).value;
}

const getConditions = (type) => {
    const resArray = [];
    const conditions = document.querySelectorAll(`div#tab-${type} > form > .conditions > .conditions-container > .condition`);
    conditions.forEach(el => {
        let resObj = {};

        let not = el.children[0].children[0].checked;
        let field = el.children[1].children[0].value;
        let operator = el.children[2].children[0].value;
        let term = el.children[3].children[0].value;
        switch (operator) {
            case "GT":
            case "LT":
            case "EQ":
                term = Number(term);
                break;
            default:
                break;
        }
        let comparison = {};
        let comparator = {};
        comparison[`${type}_${field}`] = term;
        comparator[operator] = comparison;
        switch (not) {
            case true:
                resObj["NOT"] = comparator;
                break;
            case false:
                resObj = comparator;
                break;
            default:
                break;
        }
        if (term !== "") {
            resArray.push(resObj);
        }
    });
    return resArray;
}

/* OPTIONS HELPERS */

const getAllColumnCheckboxes = (type) => {
    const resArray = [];
    const fieldColumns = document.querySelectorAll(`div#tab-${type} > form > div.columns > div.control-group > div.control.field > input[checked]`);
    const transColumns = document.querySelectorAll(`div#tab-${type} > form > div.columns > div.control-group > div.control.transformation > input[checked]`);
    // append dataset id to original column names
    fieldColumns.forEach(el => {
        resArray.push(`${type}_${el.value}`);
    });
    // but not to transformation columns
    transColumns.forEach(el => {
        resArray.push(el.value);
    })
    return resArray;
}

const getOrder = (type) => {
    let orderArray = document.querySelectorAll(`div#tab-${type} > form > .order > .control-group > .fields > select > option[selected]:not(.transformation)`);
    let transArray = document.querySelectorAll(`div#tab-${type} > form > .order > .control-group > .fields > select > option[selected].transformation`);
    const descending = document.querySelector(`div#tab-${type} > form > .order > .control-group > .descending`).children[0].checked;
    orderArray = Array.from(orderArray);
    orderArray = orderArray.map(el => {
        return `${type}_${el.value}`;
    });
    transArray = Array.from(transArray);
    transArray = transArray.map(el => {
        return el.value;
    })
    const finalArray = orderArray.concat(transArray);
    if (finalArray.length < 1) {
        return {};
    } else if (finalArray.length === 1 && !descending) {
        return finalArray[0];
    } else {
        let resObj = {};
        resObj["dir"] = descending ? "DOWN" : "UP";
        resObj["keys"] = finalArray;
        return resObj;
    }

}

const getGroups = (type) => {
    const resArray = [];
    const groups = document.querySelectorAll(`div#tab-${type} > form > div.groups > div.control-group > div.control.field > input[checked]`);
    groups.forEach(el => {
        resArray.push(`${type}_${el.value}`);
    });
    return resArray;
}

const getApply = (type) => {
    const resArray = [];
    const transformations = document.querySelectorAll(`div#tab-${type} > form > .transformations > .transformations-container > .transformation`);
    transformations.forEach(el => {
        let resObj = {};
        const term = el.children[0].children[0].value;
        const operator = el.children[1].children[0].value;
        const field = el.children[2].children[0].value;

        let transSubj = {};
        transSubj[operator] = `${type}_${field}`;
        resObj[term] = transSubj;
        if (term !== "") {
            resArray.push(resObj);
        }
    });
    return resArray;
}

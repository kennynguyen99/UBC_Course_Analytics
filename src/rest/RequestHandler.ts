import InsightFacade from "../controller/InsightFacade";
import restify = require("restify");
import {InsightDataset, InsightError, NotFoundError} from "../controller/IInsightFacade";


let insightFacade = new InsightFacade();

export default {


    putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        let id = req.params.id;
        let zipContent = Buffer.from(req.body).toString("base64");
        let kind = req.params.kind;


        try {
            return insightFacade.addDataset(id, zipContent, kind).then((idArray: string[]) => {
                res.json(200, {result: idArray});
                return next();
            }).catch((error) => {
                res.json(400, {error: error.message});
                return next();
            });
        } catch (error) {
            res.send(400, {error: error.message});
            return next();
        }
    },

    deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        let id = req.params.id;

        try {
            return insightFacade.removeDataset(id).then((result: string) => {
                res.json(200, {result: result});
            }).catch((error) => {
                if (error instanceof NotFoundError) {
                    res.json(404, {error: error.message});
                    return next();
                } else {
                    res.json(400, {error: error.message});
                    return next();
                }
            });
        } catch (error) {
            res.json(400, {error: error.message});
            return next();
        }
    },

    postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        let query: any = req.params.body;

        try {
            return insightFacade.performQuery(query).then((queryResult: any[]) => {
                res.json(200, {result: queryResult});
                return next();
            }).catch((error) => {
                res.json(400, {error: error.message});
                return next();

            });
        } catch (error) {
            res.json(400, {error: error.message});
            return next();
        }
    },

    getDatasets(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            return insightFacade.listDatasets().then((insightDatasets: InsightDataset[]) => {
                res.json(200, {result: insightDatasets});
                return next();
            }).catch((error) => {
                res.json(400, {error: error.message});
                return next();

            });
        } catch (error) {
            res.json(400, {error: error.message});
            return next();
        }
    }
};

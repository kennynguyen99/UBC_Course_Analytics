import * as JSZip from "jszip";
import { InsightDataset, InsightDatasetKind } from "./IInsightFacade";
import Building from "./Building";


export class Dataset {
    // zip is the JSZip object of this dataset. An instance of JSzip represents a set of files.
    protected zip: JSZip;
    protected id: string;
    protected rawContent: string;
    protected datasetKind: InsightDatasetKind;
    // protected datasetKind: string;

    constructor(id: string, rawContent: string) {
        this.zip = new JSZip();
        this.id = id;
        this.rawContent = rawContent;
    }

    public getDatasetKind(): string {
        return this.datasetKind;
        // throw new Error("Method getDatasetKind() must be implemented!");
    }

    public readZipFile(): Promise<any> {
        throw new Error("Method readZipFile() must be implemented!");
    }

    public getRawContent(): string {
        return this.rawContent;
    }

    public getDataset(): { [datasetName: string]: any } {
        throw new Error("Method getDataset() must be implemented!");
    }

    public getInsightDataset(): InsightDataset {
        throw new Error("Method getInsightDataset() must be implemented!");
    }

}

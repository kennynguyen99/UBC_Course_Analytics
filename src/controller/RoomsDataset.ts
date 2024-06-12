import { Dataset } from "./Dataset";
import * as JSZip from "jszip";
import { InsightDataset, InsightDatasetKind } from "./IInsightFacade";
import * as parse5 from "parse5";
import Building, { Room } from "./Building";
import { HTMLTreeParser } from "./HTMLTreeParser";
import * as http from "http";


export class RoomsDataset extends Dataset {

    private roomsZip: JSZip;

    private buildings: { [buildingName: string]: Building };
    private htmlParser: HTMLTreeParser;

    constructor(id: string, rawContent: string) {
        super(id, rawContent);
        this.datasetKind = InsightDatasetKind.Rooms;
        this.htmlParser = new HTMLTreeParser();

        this.buildings = {};
    }

    public getDatasetKind() {
        return InsightDatasetKind.Rooms;
    }

    public readZipFile(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.zip.loadAsync(this.rawContent, { base64: true }).then((zip: JSZip) => {
                // make sure there's a rooms folder
                this.roomsZip = zip.folder("rooms");
                return this.initializeDataset();
            }).then(() => {
                resolve();
            }).catch((errorString: string) => {
                reject(errorString);
            });

        });
    }

    private initializeDataset(): Promise<any> {
        return new Promise((resolve, reject) => {
            let indexFile: JSZip.JSZipObject | null = this.roomsZip.file("index.htm");

            if (indexFile === null) {
                reject("Cannot find index file");
            }

            indexFile.async("string").then((contentString: string) => {
                let document: any = parse5.parse(contentString);
                return this.parseIndexDocument(document);

            }).then(() => {
                resolve("Done initializing dataset");
            });

        });

    }

    public getInsightDataset(): InsightDataset {
        let numRooms = this.getTotalNumRooms();

        return { id: this.id, kind: InsightDatasetKind.Rooms, numRows: numRooms };
    }

    private getTotalNumRooms(): number {
        let sum: number = 0;
        for (let id in this.buildings) {
            sum += this.buildings[id].getNumRooms();
        }

        return sum;
    }

    // Dictionary with building short name as key and value is a Building object
    public getDataset(): { [buildingName: string]: any } {
        return this.buildings;
    }


    // parses the document object into fields
    public parseIndexDocument(doc: any): Promise<any> {
        // get the HTML object inside the doc
        let htmlNode = doc.childNodes.find((node: any) => {
            return node.nodeName === "html";
        });

        let bodyNode = htmlNode.childNodes.find((node: any) => {
            return node.nodeName === "body";
        });

        return this.parseBodyNode(bodyNode);
    }

    // parses the body node in the document object
    public parseBodyNode(bodyNode: any): Promise<any> {
        let buildingNodes: any[] = [];

        return new Promise((resolve, reject) => {
            // let contentNode: any = this.getContentNode(bodyNode);
            let contentNode: any = this.htmlParser.getContentNode(bodyNode);
            if (contentNode == null) {
                reject("Cannot find content node");
            }

            let tableBodyNode: any[] = [];

            this.getNodes(contentNode, tableBodyNode, (node: any) => {
                return node.nodeName === "tbody";
            });

            this.getNodes(tableBodyNode[0], buildingNodes, (node: any) => {
                return node.nodeName === "tr";
            });

            this.parseBuildingNodes(buildingNodes).then(() => {
                resolve();
            });
        });


    }

    // find and adds all the wanted nodes to an array
    public getNodes(startNode: any, resultsArr: any[], isTargetNode: (node: any) => boolean) {
        if (isTargetNode(startNode)) {
            resultsArr.push(startNode);
        }

        if ("childNodes" in startNode && isIterable(startNode.childNodes)) {
            for (let childNode of startNode.childNodes) {
                this.getNodes(childNode, resultsArr, isTargetNode);
            }
        }
    }

    // Resolves when all the buildings have been added to this instance of RoomsDataset
    public parseBuildingNodes(buildingNodes: any[]): Promise<any> {
        let buildingPromises: Array<Promise<Building>> = [];
        for (let buildingNode of buildingNodes) {
            buildingPromises.push(this.parseBuildingRow(buildingNode));
        }
        return new Promise((resolve, reject) => {
            Promise.all(buildingPromises).then((buildings: Building[]) => {
                let nonNullBuildings: Building[] = buildings.filter((building) => {
                    return building != null;
                });

                for (let building of nonNullBuildings) {
                    this.buildings[building.getShortName()] = building;
                }
                resolve();
            });
        });
    }

    // Resolves with the building with all the rooms on success
    // Rejects with null if building has no rooms or requesting a coordinate throws an error
    public parseBuildingRow(buildingNode: any): Promise<Building> {
        return new Promise((resolve, reject) => {
            let parser: HTMLTreeParser = new HTMLTreeParser();

            let buildingLink: string = parser.getBuildingLink(buildingNode);

            let buildingCode: string = parser.getCodeFromBuildingNode(buildingNode);
            let buildingAddress: string = parser.getAddressFromBuildingNode(buildingNode);
            let buildingName: string = parser.getBuildingName(buildingNode);

            // remove "./" from beginning of link and add "rooms/" in front of the link
            buildingLink = "rooms/" + buildingLink.replace("./", "");

            RoomsDataset.getCoordinates(buildingAddress).then((location: any) => {
                // Log.trace("Building Code: " + buildingCode);
                // Log.trace("Building Name: " + buildingName);
                // Log.trace("Building Address: " + buildingAddress);
                // Log.trace("Building Link: " + buildingLink);
                // Log.trace("Latitude is " + location.lat);
                // Log.trace("Longitude is " + location.lat);
                // Log.trace();

                let building: Building = new Building(buildingName, buildingCode, buildingAddress,
                    location.lat, location.lon);

                this.zip.file(buildingLink).async("string").then((linkedBuilingHTML: string) => {
                    // TODO: parse linked building html
                    let htmlNode: any = parse5.parse(linkedBuilingHTML);

                    if (htmlNode == null) {
                        resolve(null);
                    }

                    building = this.htmlParser.parseRoomHTML(htmlNode, building);

                    if (building.getRooms().length < 1) {
                        resolve(null);
                    }
                    resolve(building);
                });
            }).catch((error) => {
                resolve(null);
            });


        });

    }

    // Input: the address of the building
    // Ouput: Promise resolve with an object with lat and lon field if successful
    // Rejects if error
    private static getCoordinates(address: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team210/" + encodeURI(address);
            http.get(url, (response: any) => {
                if (response.code === 404) {
                    reject("Invalid URL");
                }

                let location: any;
                // IncomingMessage object extends readable (stream)
                // .on listens to events and responds to them with callback
                response.on("data", (data: any) => {
                    location = JSON.parse(data);
                });

                response.on("end", () => {
                    resolve(location);
                });
            }).on("error", (error: any) => {
                reject(error);
            });
        });
    }
}


export function isIterable(obj: any): boolean {
    if (obj == null) {
        return false;
    }

    return typeof obj[Symbol.iterator] === "function";
}

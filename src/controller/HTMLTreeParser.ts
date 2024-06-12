import { isIterable } from "./RoomsDataset";
import Log from "../Util";
import Building, { createRoom, Room } from "./Building";


export class HTMLTreeParser {

    constructor() {
        // Log.trace();
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

    // Input a node that contains the content node
    // Output: the content node
    public getContentNode(bodyNode: any): any {
        let contentNode: any[] = [];

        this.getNodes(bodyNode, contentNode, (node: any) => {
            if (node.nodeName === "div" && isIterable(node.attrs)) {
                for (let attribute of node.attrs) {
                    if (attribute.name === "id" && attribute.value === "content") {
                        return true;
                    }
                }
            }
            return false;
        });

        if (contentNode.length === 1) {
            return contentNode[0];
        }
        return null;
    }

    // Input: an object representing the room html file and building object and the location object
    // Output: a building object with all the rooms added
    public parseRoomHTML(roomHTMLNode: any, building: Building): Building {

        let contentNode = this.getContentNode(roomHTMLNode);
        let tableBodyNode: any[] = [];
        let roomRowNodes: any[] = [];
        let roomColumnNodes: any[] = [];


        this.getNodes(contentNode, tableBodyNode, (node) => {
            return node.nodeName === "tbody";
        });

        if (tableBodyNode.length !== 1) {
            return building;
        }

        this.getNodes(tableBodyNode[0], roomRowNodes, (node) => {
            return node.nodeName === "tr";
        });

        if (roomRowNodes.length < 1) {
            return building;
        }

        for (let node of roomRowNodes) {
            roomColumnNodes = [];
            this.getNodes(node, roomColumnNodes, (currNode) => {
                if (currNode.nodeName === "td" && isIterable(currNode.attrs)) {
                    for (let attribute of currNode.attrs) {
                        return attribute.name === "class";
                    }
                }
                return false;
            });

            building.addRoom(this.buildRoom(roomColumnNodes, building));
        }

        // Log.trace(building.getRooms());

        return building;

    }

    // Returns a created room
    private buildRoom(roomColumns: any[], building: Building): Room {
        let roomNumber: string = "";
        let href: string = "";
        let capacity: number = 0;
        let furnitureType: string = "";
        let roomType: string = "";

        for (let node of roomColumns) {
            for (let attribute of node.attrs) {
                if (attribute.value.indexOf("room-number") >= 0) {
                    roomNumber = this.getRoomNumber(node);
                    href = this.getHREF(node);
                } else if (attribute.value.indexOf("room-capacity") >= 0) {
                    capacity = this.getCapacity(node);
                } else if (attribute.value.indexOf("room-furniture") >= 0) {
                    furnitureType = this.getFurnitureType(node);
                } else if (attribute.value.indexOf("room-type") >= 0) {
                    roomType = this.getRoomType(node);
                }
            }
        }

        let room: Room = createRoom(
            building.getBuildingName(),
            building.getShortName(),
            roomNumber,
            building.getShortName() + "_" + roomNumber,
            building.getBuildingAddress(),
            building.getLatitude(),
            building.getLongitude(),
            capacity,
            roomType,
            furnitureType,
            href
        );

        return room;
    }

    private getHREF(roomNumberNode: any): string {

        let roomNumber: any[] = [];
        this.getNodes(roomNumberNode, roomNumber, (node: any) => {
            return node.nodeName === "a" && isIterable(node.attrs) && node.attrs[0].name === "href";
        });

        return roomNumber[0].attrs[0].value;
    }

    private getCapacity(roomCapacityNode: any): number {
        return parseInt(roomCapacityNode.childNodes[0].value.trim(), 10);
    }

    private getFurnitureType(furnitureTypeNode: any): string {
        return furnitureTypeNode.childNodes[0].value.trim();
    }

    private getRoomType(roomTypeNode: any) {
        return roomTypeNode.childNodes[0].value.trim();
    }

    private getRoomNumber(roomNumberNode: any): string {
        let roomNumber: any[] = [];
        this.getNodes(roomNumberNode, roomNumber, (node: any) => {
            return node.nodeName === "a" && isIterable(node.attrs) && node.attrs[1].name === "title"
                && node.attrs[1].value === "Room Details";
        });

        // Log.trace(roomNumber[0].childNodes[0].value);
        return roomNumber[0].childNodes[0].value;
    }

    // Input: table row node representing a building
    public getTitleFieldNode(buildingNode: any): any {
        let titleFieldNode: any[] = [];
        this.getNodes(buildingNode, titleFieldNode, (node: any) => {
            if (isIterable(node.attrs)) {
                for (let attribute of node.attrs) {
                    if (attribute.name === "class" && attribute.value.indexOf("title") >= 0) {

                        return true;
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        });

        return titleFieldNode[0];
    }

    // Input: table row node representing a building
    public getBuildingLink(buildingNode: any): string {
        let titleFieldNode: any = this.getTitleFieldNode(buildingNode);

        for (let childNode of titleFieldNode.childNodes) {
            if (childNode.nodeName === "a" && isIterable(childNode.attrs)) {
                for (let attribute of childNode.attrs) {
                    if (attribute.name === "href") {
                        return attribute.value;
                    }
                }
            }
        }

        return null;
    }

    // Input: table row node representing a building
    public getBuildingName(buildingNode: any): string {
        let titleFieldNode: any = this.getTitleFieldNode(buildingNode);

        for (let childNode of titleFieldNode.childNodes) {
            if (childNode.nodeName === "a" && isIterable(childNode.attrs)) {
                for (let attribute of childNode.attrs) {
                    if (attribute.name === "href") {
                        for (let node of childNode.childNodes) {
                            if (node.nodeName === "#text") {
                                return node.value;
                            }
                        }
                    }
                }
            }
        }

        return null;
    }


    // Input: table row node representing a building
    // Ouput: building code
    public getCodeFromBuildingNode(buildingNode: any): string {
        let buildingCodeTD: any[] = [];
        this.getNodes(buildingNode, buildingCodeTD, (node: any) => {
            if (isIterable(node.attrs)) {
                for (let attribute of node.attrs) {
                    if (attribute.name === "class" && attribute.value.indexOf("building-code") >= 0) {

                        return true;
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        });

        for (let childNode of buildingCodeTD[0].childNodes) {
            if (childNode.nodeName === "#text") {
                return childNode.value.trim();
            }
        }

        return null;
    }

    public getAddressFromBuildingNode(buildingNode: any): string {
        let buildingAddressTD: any[] = [];
        this.getNodes(buildingNode, buildingAddressTD, (node: any) => {
            if (isIterable(node.attrs)) {
                for (let attribute of node.attrs) {
                    if (attribute.name === "class" &&
                        attribute.value.indexOf("building-address") >= 0) {
                        return true;
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        });

        for (let childNode of buildingAddressTD[0].childNodes) {
            if (childNode.nodeName === "#text") {
                return childNode.value.trim();
            }
        }

        return null;
    }
}

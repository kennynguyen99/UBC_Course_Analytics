
export default class Building {
    private buildingName: string;
    private buildingAddress: string;
    private buildingShortName: string;
    private buildingLat: number;
    private buildingLon: number;

    private rooms: Room[];

    constructor(buildingName: string, buildingShortName: string, buildingAddress: string, lat: number, lon: number)  {
        this.buildingName = buildingName;
        this.buildingShortName = buildingShortName;
        this.buildingAddress = buildingAddress;
        this.buildingLat = lat;
        this.buildingLon = lon;
        this.rooms = [];
    }

    public getLatitude(): number {
        return this.buildingLat;
    }

    public getLongitude(): number {
        return this.buildingLon;
    }

    public getBuildingName(): string {
        return this.buildingName;
    }

    public getBuildingAddress(): string {
        return this.buildingAddress;
    }

    public getShortName(): string {
        return this.buildingShortName;
    }

    public getNumRooms(): number {
        return this.rooms.length;
    }

    public getRooms(): Room[] {
        return this.rooms;
    }

    public addRoom(room: Room) {
        this.rooms.push(room);
    }

    public getName(): string {
        return this.buildingName;
    }


}


export interface Room {
    fullname: string;
    shortname: string;
    number: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
    seats: number;
    type: string;
    furniture: string;
    href: string;
}


export function createRoom(
    fullname: string,
    shortname: string,
    roomnumber: string,
    name: string,
    address: string,
    lat: number,
    lon: number,
    seats: number,
    type: string,
    furniture: string,
    href: string): Room {
    return {
        fullname: fullname,
        shortname: shortname,
        number: roomnumber,
        name: name,
        address: address,
        lat: lat,
        lon: lon,
        seats: seats,
        type: type,
        furniture: furniture,
        href: href,
    };
}

import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {Helpers} from "./SchedulerUtil";
import Log from "../Util";

const  NUM_TIME_SLOTS: number = 15;
const timeSlots: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200",
    "MWF 1200-1300", "MWF 1300-1400", "MWF 1400-1500", "MWF 1500-1600",
    "MWF 1600-1700", "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
    "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];
const MAX_DISTANCE_BETWEEN_ANY_ROOMS = 1372;

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {

        // a matrix where each row is a schedule of a room with the 15 time slots
        let roomsTimelineMatrix: SchedSection[][] = [];
        let schedule: Array<[SchedRoom, SchedSection, TimeSlot]> = [];


        for (let j = 0; j < rooms.length; j++) {
            roomsTimelineMatrix[j] = [null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null];
        }

        let bestFitSectionIndex: number = -1;
        let timeslotIndex: number = -1;

        sections.sort((section1: SchedSection, section2: SchedSection) => {
            return Helpers.getAmountofStudents(section2) - Helpers.getAmountofStudents(section1);
        });

        rooms.sort((room1: SchedRoom, room2: SchedRoom) => {
            return room2.rooms_seats - room1.rooms_seats;
        });

        let currRoomIndex = 0;
        for (let room of rooms) {
            // add the best fit section for each of the room's timeslot
            for (let k = 0; k < NUM_TIME_SLOTS; k++) {
                bestFitSectionIndex = this.findBestFitSection(currRoomIndex, room, sections, roomsTimelineMatrix);

                if (bestFitSectionIndex === -1) {
                    break;
                }

                timeslotIndex = this.getValidSlot(sections[bestFitSectionIndex], currRoomIndex, roomsTimelineMatrix);

                if (timeslotIndex === -1) {
                    break;
                }

                schedule.push([room, sections[bestFitSectionIndex], timeSlots[timeslotIndex]]);

                roomsTimelineMatrix[currRoomIndex][timeslotIndex] = sections[bestFitSectionIndex];
                // delete the added section
                sections.splice(bestFitSectionIndex, 1);
            }
            currRoomIndex++;
        }

        return schedule;
    }

    // Finds if there's any other sections of the same course as the parameter in the given timeslot
    public hasNoCourseConflict(section: SchedSection, timeSlotIndex: number, roomsTimeline: SchedSection[][]): boolean {
        let numOccurrences: number = 0;

        for (let roomTimeline of roomsTimeline) {
            let currSlot = roomTimeline[timeSlotIndex];
            if (currSlot !== null && currSlot.courses_dept === section.courses_dept
                && currSlot.courses_id === section.courses_id) {
                numOccurrences++;
            }
        }

        if (numOccurrences === 0) {
            return true;
        } else {
            return false;
        }
    }

    // find the index of the best fit room (smallest delta) that still has valid slots available for a section
    public findBestFitRoom(section: SchedSection, rooms: SchedRoom[], roomsTimeLine: SchedSection[][]): number {
        let currBestFit: SchedRoom =  null;
        let delta: number = 1000;
        let currDiff: number;
        let currBestFitIndex = -1;

        for (let i = 0; i < rooms.length; i++) {
            if (this.hasValidSlot(section, i, roomsTimeLine) && this.doesFit(section, rooms[i])) {
                currDiff = (rooms[i].rooms_seats - Helpers.getAmountofStudents(section));
                if (currDiff < delta) {
                    currBestFit = rooms[i];
                    currBestFitIndex = i;
                    delta = currDiff;
                }
            }
        }
        return currBestFitIndex;
    }

    // find the index of the best fit section (smallest delta) for a given room
    public findBestFitSection(roomIndex: number, room: SchedRoom, sections: SchedSection[],
                              roomsTimeLine: SchedSection[][]): number {
        let currSection: SchedSection;
        let delta: number = 1000000;
        let currDiff: number;
        let currBestFitIndex = -1;

        for (let i = 0; i < sections.length; i++) {
            currSection = sections[i];
            if (this.hasValidSlot(currSection, roomIndex, roomsTimeLine) && this.doesFit(currSection, room)) {
                currDiff = (room.rooms_seats - Helpers.getAmountofStudents(currSection));
                if (currDiff < delta) {
                    currBestFitIndex = i;
                    delta = currDiff;
                }
            }
        }
        return currBestFitIndex;
    }

    // get the first valid slot of a room for a section
    // returns -1 if no valid slot
    public getValidSlot(section: SchedSection, roomIndex: number, roomsTimeline: SchedSection[][]): number {
        for (let i = 0; i < NUM_TIME_SLOTS; i++) {
            if (roomsTimeline[roomIndex][i] === null && this.hasNoCourseConflict(section, i, roomsTimeline)) {
                return i;
            }
        }
        return -1;
    }

    public doesFit(section: SchedSection, room: SchedRoom): boolean {
        return Helpers.getAmountofStudents(section) <= room.rooms_seats;
    }

    public hasValidSlot(section: SchedSection, roomIndex: number, roomsTimeline: SchedSection[][]): boolean {
        for (let timeSlotIndex = 0; timeSlotIndex < NUM_TIME_SLOTS; timeSlotIndex++) {
            if (roomsTimeline[roomIndex][timeSlotIndex] === null
                && this.hasNoCourseConflict(section, timeSlotIndex, roomsTimeline)) {
                return true;
            }
        }
        return false;
    }
}



import {SchedSection, TimeSlot} from "./IScheduler";

export class Helpers {

    public static getAmountofStudents(section: SchedSection): number {
        return section.courses_audit + section.courses_pass + section.courses_fail;
    }

    public static getTimeSlotFromIndex(timeSlotIndex: number): TimeSlot {
        let result: TimeSlot;
        switch (timeSlotIndex) {
            case 0:
                result = "MWF 0800-0900";
                break;
            case 1:
                result = "MWF 0900-1000";
                break;
            case 2:
                result = "MWF 1000-1100";
                break;
            case 3:
                result = "MWF 1100-1200";
                break;
            case 4:
                result = "MWF 1200-1300";
                break;
            case 5:
                result = "MWF 1300-1400";
                break;
            case 6:
                result = "MWF 1400-1500";
                break;
            case 7:
                result = "MWF 1500-1600";
                break;
            case 8:
                result = "MWF 1600-1700";
                break;
            case 9:
                result = "TR  0800-0930";
                break;
            case 10:
                result = "TR  0930-1100";
                break;
            case 11:
                result = "TR  1100-1230";
                break;
            case 12:
                result = "TR  1230-1400";
                break;
            case 13:
                result = "TR  1400-1530";
                break;
            case 14:
                result = "TR  1530-1700";
        }
        return result;
    }
}


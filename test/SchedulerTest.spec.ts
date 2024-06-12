
import Log from "../src/Util";

import {SchedRoom, SchedSection, TimeSlot} from "../src/scheduler/IScheduler";
import Scheduler from "../src/scheduler/Scheduler";

describe("Facade D3", function () {
    let scheduler: Scheduler;

    let sampleSections: SchedSection[] = [
        {courses_dept: "cpsc", courses_id: "340", courses_uuid: "1319", courses_pass: 101,
            courses_fail: 7, courses_audit: 2},
        {courses_dept: "cpsc", courses_id: "340", courses_uuid: "3397", courses_pass: 171,
            courses_fail: 3, courses_audit: 1},
        {courses_dept: "cpsc", courses_id: "340", courses_uuid: "3397", courses_pass: 275,
            courses_fail: 0, courses_audit: 0},
        {courses_dept: "cpsc", courses_id: "344", courses_uuid: "62413", courses_pass: 93,
            courses_fail: 2, courses_audit: 0},
        {courses_dept: "cpsc", courses_id: "344", courses_uuid: "72385", courses_pass: 43,
            courses_fail: 1, courses_audit: 0},
        {courses_dept: "math", courses_id: "101", courses_uuid: "23673", courses_pass: 93,
            courses_fail: 1, courses_audit: 0}];

    let sampleRooms: SchedRoom[] = [
        {rooms_shortname: "AERL", rooms_number: "120", rooms_seats: 144, rooms_lat: 49.26372, rooms_lon: -123.25099},
        {rooms_shortname: "ALRD", rooms_number: "105", rooms_seats: 94, rooms_lat: 49.2699, rooms_lon: -123.25318},
        {rooms_shortname: "ANGU", rooms_number: "098", rooms_seats: 260, rooms_lat: 49.26486, rooms_lon: -123.25364},
        {rooms_shortname: "BUCH", rooms_number: "A101", rooms_seats: 275, rooms_lat: 49.26826, rooms_lon: -123.25468}
    ];

    before(function () {
        Log.test(`Before all`);
        scheduler = new Scheduler();
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
        scheduler = new Scheduler();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("testing scheduler with sample", () => {
        let outputSchedule: Array<[SchedRoom, SchedSection, TimeSlot]> =
            scheduler.schedule(sampleSections, sampleRooms);

        Log.trace(outputSchedule);
    });


    it("testing scheduler with >15 same courses", () => {
        let sampleSections2: SchedSection[] = [
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "1", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "2", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "3", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "4", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "5", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "6", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "7", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "8", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "9", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "10", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "11", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "12", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "13", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "14", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "15", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "16", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "17", courses_pass: 94,
                courses_fail: 0, courses_audit: 0},
            {courses_dept: "cpsc", courses_id: "340", courses_uuid: "18", courses_pass: 94,
                courses_fail: 0, courses_audit: 0}];

        let outputSchedule: Array<[SchedRoom, SchedSection, TimeSlot]> =
            scheduler.schedule(sampleSections2, sampleRooms);

        Log.trace(outputSchedule);
    });
});

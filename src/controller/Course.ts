export default class Course {
    private name: string;
    private sections: CourseSection[];

    constructor(courseName: string) {
        this.name = courseName;
        this.sections = new Array<CourseSection>();
    }

    public getName(): string {
        return this.name;
    }

    public getSections(): CourseSection[] {
        return this.sections;
    }

    public addSection(sectionData: CourseSection) {
        this.sections.push(sectionData);
    }

    public getNumSections(): number {
        return this.sections.length;
    }
}

export interface CourseSection {
    dept: string;
    id: string;
    avg: number;
    instructor: string;
    title: string;
    pass: number;
    fail: number;
    audit: number;
    uuid: string;
    year: number;
}


export function createCourseSection(
    dept: string,
    id: string,
    avg: number,
    instr: string,
    title: string,
    pass: number,
    fail: number,
    audit: number,
    uuid: string,
    year: number): CourseSection {
    return {
        dept: dept,
        id: id,
        avg: avg,
        instructor: instr,
        title: title,
        pass: pass,
        fail: fail,
        audit: audit,
        uuid: uuid,
        year: year
    };


}

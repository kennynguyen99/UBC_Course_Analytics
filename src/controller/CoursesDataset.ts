import Course, { CourseSection, createCourseSection } from "./Course";
import * as JSZip from "jszip";
import { InsightDataset, InsightDatasetKind } from "./IInsightFacade";
import { Dataset } from "./Dataset";


export class CoursesDataset extends Dataset {
    // zip is the JSZip object of this dataset. An instance of JSzip represents a set of files.
    private courses: { [courseName: string]: Course };

    constructor(id: string, rawContent: string) {
        super(id, rawContent);
        this.datasetKind = InsightDatasetKind.Courses;
        this.courses = {};
    }

    public getDatasetKind() {
        return InsightDatasetKind.Courses;
    }

    // reads the content of the zip file in base 64 encoding into the CoursesDataset object
    // Need to call this function with the zip content after creating the CoursesDataset object
    // Only call this once to initialize the dataset
    // promise is resolved if zip file is read
    // reject if rawContent is an invalid zip file or invalid dataset
    public readZipFile(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.zip.loadAsync(this.rawContent, { base64: true }).then((zip: JSZip) => {
                // make sure there's a courses folder
                this.zip = zip.folder("courses");
                return this.initializeDataset();
            }).then(() => {
                if (Object.keys(this.courses).length === 0) {
                    reject("No valid courses in dataset");
                } else {
                    resolve("Finished initializing dataset");
                }
            }).catch(() => {
                // if dataset is not valid zip data and cannot be loaded
                reject("Invalid zip data");
            });
        });
    }

    // This function initializes the courses field
    private initializeDataset(): Promise<any> {
        let promiseCourseArray: Array<Promise<Course>> = [];
        // Every json file in the zip has the same relative path so relative path is just the course name
        this.zip.forEach((relativePath: string, file: JSZip.JSZipObject) => {
            // add the Promise<course> object to the array
            promiseCourseArray.push(this.getCourse(relativePath));
        });
        return new Promise((resolve, reject) => {
            Promise.all(promiseCourseArray).then((courseArray: Course[]) => {

                for (let course of courseArray) {
                    if (course !== null) {
                        this.courses[course.getName()] = course;
                    }
                }

                resolve("Finished initializing courses in dataset");
            }).catch(() => {
                reject("Should never had rejected since getCourse only resolves");
            });

        });
    }

    public getRawContent(): string {
        return this.rawContent;
    }

    public getID(): string {
        return this.id;
    }

    // Returns the number of sections in the dataset
    public getNumSections(): number {
        let sum: number = 0;

        for (let id in this.courses) {
            sum += this.courses[id].getNumSections();
        }

        return sum;
    }

    public getInsightDataset(): InsightDataset {

        let numSections = this.getNumSections();

        return { id: this.id, kind: InsightDatasetKind.Courses, numRows: numSections };

    }

    // Returns the whole dataset as a dictionary of courseName (string): Course
    // Only returns course with valid sections. The invalid sections will be left out of the
    // course object.
    public getDataset(): { [courseName: string]: any } {

        return this.courses;

    }


    // Input: name of the Course
    // Resolves Promise<course> if course is found in the dataset
    // Resolves with null otherwise
    public getCourse(courseName: string): Promise<Course> {

        let courseFile: JSZip.JSZipObject | null = this.zip.file(courseName);

        return new Promise((resolve, reject) => {
            if (courseFile !== null) {
                // request the content of the file as string
                courseFile.async("string").then((contentString: string) => {
                    let course: Course = this.parseCourseData(courseName, contentString);
                    if (course !== null) {
                        resolve(course);
                    } else {
                        resolve(null);
                    }
                });
            } else {
                resolve(null);
            }
        });
    }


    // Try to parse a JSON string as a valid course and returns a course Object
    // containing all the course sections
    // returns null if JSON string in invalid file format
    public parseCourseData(courseName: string, courseDataJSON: string): Course {
        let jsonObj;

        // try to parse the JSON string into an object
        try {
            jsonObj = JSON.parse(courseDataJSON);
        } catch (error) {
            return null;

        }


        if (!("result" in jsonObj) || !("rank" in jsonObj)) {
            // Log.trace("No result or rank\n");
            return null;
        }

        let course = new Course(courseName);
        let courseSection: CourseSection;

        // Iterate through the result array. Each object represents a section
        for (let section of jsonObj.result) {
            courseSection = this.parseCourseSection(section);
            if (courseSection !== null) {
                course.addSection(courseSection);
            }
        }

        // Log.trace(course);
        return course;
    }

    // Returns a CourseSection if there are the required keys in the argument object
    // section is an object in the format of each section in the results array of the JSON file
    public parseCourseSection(courseSection: any): CourseSection {
        const necessaryKeys: string[] = ["Subject", "Course", "Avg", "Professor",
            "Title", "Pass", "Fail", "Audit", "id", "Year"];
        // check if the courseSection object has all the necessary keys
        for (let key of necessaryKeys) {
            if (!(key in courseSection)) {
                return null;
            }
        }
        let year: number;
        if (courseSection["Section"] === "overall") {
            year = 1900;
        } else {
            year = parseInt(courseSection["Year"], 10);
        }

        courseSection
            = createCourseSection(
                courseSection["Subject"],
                courseSection["Course"],
                courseSection["Avg"],
                courseSection["Professor"],
                courseSection["Title"],
                courseSection["Pass"],
                courseSection["Fail"],
                courseSection["Audit"],
                courseSection["id"].toString(),
                year
            );

        return courseSection;
    }

}

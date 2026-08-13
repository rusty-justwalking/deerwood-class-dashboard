import { describe, expect, it } from "vitest";
import seed from "@/data/fall-2026.json";
import { EMPTY_FILTERS, filterClasses } from "@/lib/filter";
import type { ScheduleData } from "@/lib/types";

const data = seed as ScheduleData;

describe("combined filters", () => {
  it("returns only source session 1 records in Full Term", () => {
    const results = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session: "Full Term" });
    expect(results).toHaveLength(62);
    expect(new Set(results.map((item) => item.sessionRaw))).toEqual(new Set(["1"]));
  });
  it("returns only A-prefixed records in A Session", () => {
    const results = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session: "A Session" });
    expect(results).toHaveLength(39);
    expect(new Set(results.map((item) => item.sessionRaw))).toEqual(new Set(["A7", "A12"]));
    expect(results.some((item) => item.sessionRaw === "1")).toBe(false);
  });
  it("combines A Session, Monday, and 9:30 AM filters", () => {
    const results = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session: "A Session", day: "Monday", startTime: "570" });
    expect(results).toHaveLength(1);
    expect(results.every((item) => item.sessionGroup === "A Session" && item.weekdays.includes("Monday") && item.startMinutes === 570)).toBe(true);
  });
  it.each([["Full Term", 62], ["A Session", 39], ["B Session", 49], ["C Session", 42]])("keeps the %s filter working", (session, count) => {
    expect(filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session })).toHaveLength(count);
  });
  it("keeps ECO 2013 #3771 in Full Term and out of A Session", () => {
    const course = data.classes.find((item) => item.courseCode === "ECO 2013" && item.classNumber === "3771");
    expect(course).toMatchObject({ sessionRaw: "1", sessionGroup: "Full Term" });

    const aSession = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session: "A Session" });
    expect(aSession).not.toContainEqual(course);
  });
  it("keeps ENC 1101 #1453 with raw A7 in A Session", () => {
    const course = data.classes.find((item) => item.courseCode === "ENC 1101" && item.classNumber === "1453");
    expect(course).toMatchObject({ sessionRaw: "A7", sessionGroup: "A Session" });
  });
  it("accounts for all 192 classes across the four public session groups", () => {
    const total = ["Full Term", "A Session", "B Session", "C Session"].reduce(
      (sum, session) => sum + filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session }).length,
      0,
    );
    expect(total).toBe(192);
  });
  it("searches instructor, course, class number, and room", () => {
    for (const search of ["McCormick", "AMH 2010", "3754", "F1605"]) {
      expect(filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", search }).length).toBeGreaterThan(0);
    }
  });
  it("expands multi-day patterns in day counts", () => {
    const monday = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", day: "Monday" });
    expect(monday.some((item) => item.meetingPatternRaw === "MW")).toBe(true);
  });
});

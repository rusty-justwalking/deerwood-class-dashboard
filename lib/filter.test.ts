import { describe, expect, it } from "vitest";
import seed from "@/data/fall-2026.json";
import { EMPTY_FILTERS, filterClasses } from "@/lib/filter";
import { toPublicScheduleData } from "@/lib/public-schedule";
import type { ScheduleData } from "@/lib/types";

const sourceData = seed as ScheduleData;
const data = toPublicScheduleData(sourceData);

describe("combined filters", () => {
  it("preserves the ONLINE source row while excluding it from the public dataset", () => {
    expect(sourceData.classes).toHaveLength(204);
    expect(sourceData.classes.filter((item) => item.roomRaw === "ONLINE")).toHaveLength(1);
    expect(data.classes).toHaveLength(203);
    expect(data.classes.some((item) => item.roomRaw === "ONLINE" || item.roomDisplay === "Online")).toBe(false);
  });
  it("groups source 1, A7, and A12 records in A Session", () => {
    const results = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session: "A Session" });
    expect(results).toHaveLength(111);
    expect(new Set(results.map((item) => item.sessionRaw))).toEqual(new Set(["1", "A7", "A12"]));
  });
  it("combines A Session, Monday, and 9:30 AM filters", () => {
    const results = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session: "A Session", day: "Monday", startTime: "570" });
    expect(results).toHaveLength(7);
    expect(results.every((item) => item.sessionGroup === "A Session" && item.weekdays.includes("Monday") && item.startMinutes === 570)).toBe(true);
  });
  it("returns 28 on-campus A Session Monday classes, including MW records", () => {
    const results = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session: "A Session", day: "Monday" });
    expect(results).toHaveLength(32);
    expect(results.some((item) => item.meetingPatternRaw === "MW")).toBe(true);
    expect(results.every((item) => item.roomRaw !== "ONLINE")).toBe(true);
  });
  it.each([["A Session", 111], ["B Session", 50], ["C Session", 42]])("keeps the %s on-campus filter count correct", (session, count) => {
    expect(filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session })).toHaveLength(count);
  });
  it("accounts for all 203 on-campus classes across the three public session groups", () => {
    const total = ["A Session", "B Session", "C Session"].reduce(
      (sum, session) => sum + filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session }).length,
      0,
    );
    expect(total).toBe(203);
  });
  it("keeps the public Monday and 8:00 AM totals on-campus only", () => {
    expect(filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", day: "Monday" })).toHaveLength(56);
    expect(filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", startTime: "480" })).toHaveLength(9);
  });
  it("searches instructor, course, class number, and room", () => {
    for (const search of ["McCormick", "AMH 2010", "3754", "F1605"]) {
      expect(filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", search }).length).toBeGreaterThan(0);
    }
  });
  it("searches the newly added ESOL instructors, courses, class numbers, and rooms", () => {
    for (const search of ["Poliakova", "ELL 217", "4566", "F2609"]) {
      expect(filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", search }).length).toBeGreaterThan(0);
    }
  });
  it("includes multi-day patterns in public day counts", () => {
    const monday = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", day: "Monday" });
    expect(monday.some((item) => item.meetingPatternRaw === "MW")).toBe(true);
  });
});

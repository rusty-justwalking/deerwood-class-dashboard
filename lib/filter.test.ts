import { describe, expect, it } from "vitest";
import seed from "@/data/fall-2026.json";
import { EMPTY_FILTERS, filterClasses } from "@/lib/filter";
import type { ScheduleData } from "@/lib/types";

const data = seed as ScheduleData;

describe("combined filters", () => {
  it("returns source 1 and A-prefixed records in A Session", () => {
    const results = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session: "A Session" });
    expect(results).toHaveLength(101);
    expect(new Set(results.map((item) => item.sessionRaw))).toEqual(new Set(["1", "A7", "A12"]));
  });
  it("combines A Session, Monday, and 9:30 AM filters", () => {
    const results = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session: "A Session", day: "Monday", startTime: "570" });
    expect(results).toHaveLength(7);
    expect(results.every((item) => item.sessionGroup === "A Session" && item.weekdays.includes("Monday") && item.startMinutes === 570)).toBe(true);
  });
  it.each([["B Session", 49], ["C Session", 42]])("keeps the %s filter working", (session, count) => {
    expect(filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session })).toHaveLength(count);
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

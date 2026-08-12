import { describe, expect, it } from "vitest";
import seed from "@/data/fall-2026.json";
import { EMPTY_FILTERS, filterClasses } from "@/lib/filter";
import type { ScheduleData } from "@/lib/types";

const data = seed as ScheduleData;

describe("combined filters", () => {
  it("returns only A Session Monday classes beginning at 8:00 AM", () => {
    const results = filterClasses(data.classes, { ...EMPTY_FILTERS, termId: "fall-2026", session: "A Session", day: "Monday", startTime: "480" });
    expect(results.every((item) => item.sessionGroup === "A Session" && item.weekdays.includes("Monday") && item.startMinutes === 480)).toBe(true);
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

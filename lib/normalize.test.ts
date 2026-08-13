import { describe, expect, it } from "vitest";
import { expandMeetingDays, groupSession, normalizeRoom, normalizeRow, normalizeTime } from "@/lib/normalize";

describe("session normalization", () => {
  it.each([
    ["1", "A Session"],
    ["A7", "A Session"],
    ["A12", "A Session"],
    ["B12", "B Session"],
    ["C7", "C Session"],
  ])("groups source session %s as %s", (raw, group) => {
    expect(groupSession(raw)).toBe(group);
  });

  it("preserves source session 1 while grouping it as A Session", () => {
    const { normalized } = normalizeRow({ Session: 1 }, 2);

    expect(normalized.sessionRaw).toBe("1");
    expect(normalized.sessionGroup).toBe("A Session");
  });
});

describe("room normalization", () => {
  it.each([["G701F16050", "F1605"], ["G701D14020", "D1402"], ["G701G27210", "G2721"]])("normalizes %s", (raw, display) => {
    expect(normalizeRoom(raw)).toMatchObject({ raw, display, recognized: true });
  });
  it("preserves online and missing values", () => {
    expect(normalizeRoom("ONLINE").display).toBe("Online");
    expect(normalizeRoom(null).display).toBe("TBA");
  });
});

describe("meeting day expansion", () => {
  it.each([["M", ["Monday"]], ["MW", ["Monday", "Wednesday"]], ["TR", ["Tuesday", "Thursday"]], ["WF", ["Wednesday", "Friday"]]])("expands %s", (pattern, expected) => {
    expect(expandMeetingDays(pattern).days).toEqual(expected);
  });
});

describe("time normalization", () => {
  it("normalizes and sorts source times as minutes since midnight", () => {
    const values = ["12.30.pm", "08.00.am", "05.30.pm"].map(normalizeTime).sort((a, b) => a.minutes - b.minutes);
    expect(values.map((value) => value.display)).toEqual(["8:00 AM", "12:30 PM", "5:30 PM"]);
    expect(values.map((value) => value.minutes)).toEqual([480, 750, 1050]);
  });
});

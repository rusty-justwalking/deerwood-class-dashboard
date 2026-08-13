import type { ImportWarning, RawScheduleRow, ScheduleClass, Weekday } from "@/lib/types";

const DAY_MAP: Record<string, Weekday> = {
  M: "Monday",
  T: "Tuesday",
  W: "Wednesday",
  R: "Thursday",
  F: "Friday",
  S: "Saturday",
};

const text = (value: unknown) => (value == null ? "" : String(value).trim());

export function normalizeRoom(value: unknown): { raw: string; display: string; recognized: boolean } {
  const raw = text(value).toUpperCase();
  if (!raw) return { raw, display: "TBA", recognized: false };
  if (raw === "ONLINE") return { raw, display: "Online", recognized: true };
  const match = raw.match(/^G701([A-Z]\d{4})0$/);
  return match
    ? { raw, display: match[1], recognized: true }
    : { raw, display: raw, recognized: false };
}

export function expandMeetingDays(value: unknown): { raw: string; days: Weekday[]; recognized: boolean } {
  const raw = text(value).toUpperCase().replace(/\s+/g, "");
  if (!raw) return { raw, days: [], recognized: false };
  const days: Weekday[] = [];
  for (const code of raw) {
    const day = DAY_MAP[code];
    if (!day) return { raw, days: [], recognized: false };
    if (!days.includes(day)) days.push(day);
  }
  return { raw, days, recognized: days.length > 0 };
}

export function normalizeTime(value: unknown): { raw: string; minutes: number; display: string; valid: boolean } {
  const raw = text(value);
  const match = raw.toLowerCase().match(/^(\d{1,2})[.:](\d{2})[.:](am|pm)$/);
  if (!match) return { raw, minutes: -1, display: raw || "TBA", valid: false };
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3];
  if (hour < 1 || hour > 12 || minute > 59) return { raw, minutes: -1, display: raw, valid: false };
  if (hour === 12) hour = 0;
  if (meridiem === "pm") hour += 12;
  const minutes = hour * 60 + minute;
  const displayHour = ((hour + 11) % 12) + 1;
  return { raw, minutes, display: `${displayHour}:${String(minute).padStart(2, "0")} ${meridiem.toUpperCase()}`, valid: true };
}

export function excelDateToIso(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(Date.UTC(1899, 11, 30 + Math.floor(value))).toISOString().slice(0, 10);
  }
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function groupSession(value: unknown): string {
  const raw = text(value).toUpperCase();
  if (raw === "1" || raw.startsWith("A")) return "A Session";
  if (raw.startsWith("B")) return "B Session";
  if (raw.startsWith("C")) return "C Session";
  return raw ? `${raw} Session` : "Unspecified";
}

export function normalizeRow(row: RawScheduleRow, sourceRow: number, termId = "fall-2026") {
  const warnings: ImportWarning[] = [];
  const subject = text(row.Subject).toUpperCase();
  const catalog = text(row.Catalog).toUpperCase();
  const title = text(row.Descr);
  const classNumber = text(row["Class Nbr"]);
  const room = normalizeRoom(row["Facil ID"]);
  const days = expandMeetingDays(row.Class_Mtg);
  const start = normalizeTime(row.Mtg_Start);
  const end = normalizeTime(row.Mtg_End);
  const instructorFirst = text(row["First Name"]);
  const instructorLast = text(row.Last);

  if (!subject || !catalog || !title) warnings.push({ row: sourceRow, code: "missing_course", message: "Missing subject, catalog, or course description." });
  if (!room.raw) warnings.push({ row: sourceRow, code: "missing_room", message: "Room is missing; displayed as TBA." });
  else if (!room.recognized) warnings.push({ row: sourceRow, code: "unrecognized_room", message: `Room format “${room.raw}” was preserved unchanged.` });
  if (!days.recognized) warnings.push({ row: sourceRow, code: "unknown_meeting_pattern", message: `Meeting pattern “${days.raw || "blank"}” was not recognized.` });
  if (!start.valid || !end.valid) warnings.push({ row: sourceRow, code: "invalid_time", message: "Start or end time could not be normalized." });
  if (!instructorFirst && !instructorLast) warnings.push({ row: sourceRow, code: "missing_instructor", message: "Instructor is missing; displayed as Staff TBA." });

  const normalized: ScheduleClass = {
    id: `${termId}-${classNumber || sourceRow}-${sourceRow}`,
    termId,
    sessionRaw: text(row.Session),
    sessionGroup: groupSession(row.Session),
    subject,
    catalog,
    courseCode: [subject, catalog].filter(Boolean).join(" "),
    title,
    classNumber,
    enrollment: Number.isFinite(Number(row["Tot Enrl"])) ? Number(row["Tot Enrl"]) : null,
    locationRaw: text(row.Location),
    startDate: excelDateToIso(row["Start Date"]),
    endDate: excelDateToIso(row["End Date"]),
    roomRaw: room.raw,
    roomDisplay: room.display,
    startTimeRaw: start.raw,
    endTimeRaw: end.raw,
    startMinutes: start.minutes,
    endMinutes: end.minutes,
    startTimeDisplay: start.display,
    endTimeDisplay: end.display,
    meetingPatternRaw: days.raw,
    weekdays: days.days,
    instructorFirst,
    instructorLast,
    instructorDisplay: [instructorFirst, instructorLast].filter(Boolean).join(" ") || "Staff TBA",
    sourceRow,
  };
  return { normalized, warnings };
}

export function normalizeRows(rows: RawScheduleRow[], termId = "fall-2026") {
  const classes: ScheduleClass[] = [];
  const warnings: ImportWarning[] = [];
  rows.forEach((row, index) => {
    const result = normalizeRow(row, index + 2, termId);
    classes.push(result.normalized);
    warnings.push(...result.warnings);
  });
  classes.sort((a, b) => a.startMinutes - b.startMinutes || a.courseCode.localeCompare(b.courseCode));
  return { classes, warnings };
}

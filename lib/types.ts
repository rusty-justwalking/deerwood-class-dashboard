export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type ImportWarning = {
  row: number;
  code: "unknown_meeting_pattern" | "unrecognized_room" | "invalid_time" | "missing_instructor" | "missing_course" | "missing_room";
  message: string;
};

export type RawScheduleRow = {
  Session?: unknown;
  Subject?: unknown;
  Catalog?: unknown;
  Descr?: unknown;
  "Class Nbr"?: unknown;
  "Tot Enrl"?: unknown;
  Location?: unknown;
  "Start Date"?: unknown;
  "End Date"?: unknown;
  "Facil ID"?: unknown;
  Mtg_Start?: unknown;
  Mtg_End?: unknown;
  Class_Mtg?: unknown;
  "First Name"?: unknown;
  Last?: unknown;
};

export type ScheduleClass = {
  id: string;
  termId: string;
  sessionRaw: string;
  sessionGroup: string;
  subject: string;
  catalog: string;
  courseCode: string;
  title: string;
  classNumber: string;
  enrollment: number | null;
  locationRaw: string;
  startDate: string;
  endDate: string;
  roomRaw: string;
  roomDisplay: string;
  startTimeRaw: string;
  endTimeRaw: string;
  startMinutes: number;
  endMinutes: number;
  startTimeDisplay: string;
  endTimeDisplay: string;
  meetingPatternRaw: string;
  weekdays: Weekday[];
  instructorFirst: string;
  instructorLast: string;
  instructorDisplay: string;
  sourceRow: number;
};

export type AcademicTerm = {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  isPublished: boolean;
};

export type ScheduleData = { terms: AcademicTerm[]; classes: ScheduleClass[] };

export type Filters = {
  search: string;
  termId: string;
  session: string;
  day: string;
  startTime: string;
  instructor: string;
  course: string;
  room: string;
};

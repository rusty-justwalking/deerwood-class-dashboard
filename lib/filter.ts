import type { Filters, ScheduleClass } from "@/lib/types";

export const EMPTY_FILTERS: Filters = { search: "", termId: "", session: "", day: "", startTime: "", instructor: "", course: "", room: "" };

export function filterClasses(classes: ScheduleClass[], filters: Filters) {
  const query = filters.search.trim().toLocaleLowerCase();
  return classes.filter((item) => {
    const haystack = [item.instructorDisplay, item.courseCode, item.title, item.classNumber, item.roomDisplay, item.roomRaw].join(" ").toLocaleLowerCase();
    return (!filters.termId || item.termId === filters.termId)
      && (!filters.session || item.sessionGroup === filters.session)
      && (!filters.day || item.weekdays.includes(filters.day as never))
      && (!filters.startTime || String(item.startMinutes) === filters.startTime)
      && (!filters.instructor || item.instructorDisplay === filters.instructor)
      && (!filters.course || item.courseCode === filters.course)
      && (!filters.room || item.roomDisplay === filters.room)
      && (!query || haystack.includes(query));
  }).sort((a, b) => a.startMinutes - b.startMinutes || a.courseCode.localeCompare(b.courseCode));
}

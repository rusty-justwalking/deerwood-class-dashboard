import type { ScheduleClass, ScheduleData } from "@/lib/types";

const normalized = (value: string) => value.trim().toUpperCase();

export function isOnCampusClass(item: ScheduleClass) {
  return ![item.locationRaw, item.roomRaw, item.roomDisplay].some((value) => normalized(value) === "ONLINE");
}

export function toPublicScheduleData(data: ScheduleData): ScheduleData {
  return { ...data, classes: data.classes.filter(isOnCampusClass) };
}

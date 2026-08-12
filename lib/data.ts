import seed from "@/data/fall-2026.json";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase";
import type { AcademicTerm, ScheduleClass, ScheduleData } from "@/lib/types";

type DbTerm = { id: string; name: string; slug: string; is_default: boolean; is_published: boolean };
type DbClass = Record<string, unknown>;

const mapTerm = (row: DbTerm): AcademicTerm => ({ id: row.id, name: row.name, slug: row.slug, isDefault: row.is_default, isPublished: row.is_published });
const mapClass = (row: DbClass): ScheduleClass => ({
  id: String(row.id), termId: String(row.term_id), sessionRaw: String(row.session_raw), sessionGroup: String(row.session_group),
  subject: String(row.subject), catalog: String(row.catalog), courseCode: String(row.course_code), title: String(row.title), classNumber: String(row.class_number),
  enrollment: row.enrollment == null ? null : Number(row.enrollment), locationRaw: String(row.location_raw ?? ""), startDate: String(row.start_date), endDate: String(row.end_date),
  roomRaw: String(row.room_raw ?? ""), roomDisplay: String(row.room_display), startTimeRaw: String(row.start_time_raw), endTimeRaw: String(row.end_time_raw),
  startMinutes: Number(row.start_minutes), endMinutes: Number(row.end_minutes), startTimeDisplay: String(row.start_time_display), endTimeDisplay: String(row.end_time_display),
  meetingPatternRaw: String(row.meeting_pattern_raw), weekdays: row.weekdays as ScheduleClass["weekdays"], instructorFirst: String(row.instructor_first ?? ""),
  instructorLast: String(row.instructor_last ?? ""), instructorDisplay: String(row.instructor_display), sourceRow: Number(row.source_row),
});

export async function getScheduleData(): Promise<ScheduleData> {
  if (!hasSupabaseConfig()) return seed as ScheduleData;
  try {
    const supabase = createAdminClient();
    const [{ data: termRows, error: termError }, { data: classRows, error: classError }] = await Promise.all([
      supabase.from("academic_terms").select("id,name,slug,is_default,is_published").eq("is_published", true).order("name", { ascending: false }),
      supabase.from("schedule_classes").select("*").order("start_minutes"),
    ]);
    if (termError || classError || !termRows?.length) throw termError ?? classError ?? new Error("No published terms");
    const publishedIds = new Set(termRows.map((term) => term.id));
    return { terms: (termRows as DbTerm[]).map(mapTerm), classes: (classRows ?? []).filter((row) => publishedIds.has(row.term_id)).map(mapClass) };
  } catch (error) {
    console.error("Falling back to bundled Fall 2026 schedule:", error);
    return seed as ScheduleData;
  }
}

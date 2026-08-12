import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";
import type { ImportWarning, ScheduleClass } from "@/lib/types";

const dbClass = (item: ScheduleClass, termId: string, importId: string) => ({
  id: `${termId}-${item.classNumber}-${item.sourceRow}`, term_id: termId, import_id: importId, session_raw: item.sessionRaw, session_group: item.sessionGroup,
  subject: item.subject, catalog: item.catalog, course_code: item.courseCode, title: item.title, class_number: item.classNumber, enrollment: item.enrollment,
  location_raw: item.locationRaw, start_date: item.startDate, end_date: item.endDate, room_raw: item.roomRaw, room_display: item.roomDisplay,
  start_time_raw: item.startTimeRaw, end_time_raw: item.endTimeRaw, start_minutes: item.startMinutes, end_minutes: item.endMinutes,
  start_time_display: item.startTimeDisplay, end_time_display: item.endTimeDisplay, meeting_pattern_raw: item.meetingPatternRaw, weekdays: item.weekdays,
  instructor_first: item.instructorFirst, instructor_last: item.instructorLast, instructor_display: item.instructorDisplay, source_row: item.sourceRow,
});

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const body = await request.json() as { termName: string; slug: string; fileName: string; sheetName: string; classes: ScheduleClass[]; warnings: ImportWarning[]; publish: boolean };
    if (!body.termName || !body.slug || !body.classes?.length) return NextResponse.json({ error: "Term and schedule rows are required." }, { status: 400 });
    const supabase = createAdminClient();
    let { data: term } = await supabase.from("academic_terms").select("id").eq("slug", body.slug).maybeSingle();
    if (!term) {
      const result = await supabase.from("academic_terms").insert({ name: body.termName, slug: body.slug, is_default: false, is_published: false }).select("id").single();
      if (result.error) throw result.error; term = result.data;
    }
    const importResult = await supabase.from("schedule_imports").insert({ term_id: term.id, source_filename: body.fileName, source_sheet: body.sheetName, row_count: body.classes.length, warning_count: body.warnings.length, status: "processing" }).select("id").single();
    if (importResult.error) throw importResult.error;
    const importId = importResult.data.id;
    const deleted = await supabase.from("schedule_classes").delete().eq("term_id", term.id);
    if (deleted.error) throw deleted.error;
    for (let index = 0; index < body.classes.length; index += 200) {
      const inserted = await supabase.from("schedule_classes").insert(body.classes.slice(index, index + 200).map((item) => dbClass(item, term.id, importId)));
      if (inserted.error) throw inserted.error;
    }
    if (body.warnings.length) {
      const warningResult = await supabase.from("import_warnings").insert(body.warnings.map((warning) => ({ import_id: importId, source_row: warning.row, code: warning.code, message: warning.message })));
      if (warningResult.error) throw warningResult.error;
    }
    if (body.publish) {
      await supabase.from("academic_terms").update({ is_published: true }).eq("id", term.id);
      const defaults = await supabase.from("academic_terms").select("id").eq("is_default", true);
      if (!defaults.data?.length) await supabase.from("academic_terms").update({ is_default: true }).eq("id", term.id);
    }
    await supabase.from("schedule_imports").update({ status: "completed" }).eq("id", importId);
    return NextResponse.json({ ok: true, classCount: body.classes.length, warningCount: body.warnings.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed." }, { status: 500 });
  }
}

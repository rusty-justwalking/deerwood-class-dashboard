"use client";

import { useMemo, useState } from "react";
import { BookOpen, Building2, CalendarDays, ChevronDown, Download, GraduationCap, MapPin, Printer, Search, SlidersHorizontal, UserRound, X } from "lucide-react";
import { EMPTY_FILTERS, filterClasses } from "@/lib/filter";
import { WEEKDAYS, type Filters, type ScheduleClass, type ScheduleData } from "@/lib/types";

const unique = (items: string[]) => [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b));
const csvCell = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function exportCsv(classes: ScheduleClass[], termName: string) {
  const headers = ["Start", "End", "Days", "Course", "Title", "Class Number", "Instructor", "Room", "Session", "Start Date", "End Date"];
  const rows = classes.map((item) => [item.startTimeDisplay, item.endTimeDisplay, item.meetingPatternRaw, item.courseCode, item.title, item.classNumber, item.instructorDisplay, item.roomDisplay, item.sessionRaw, item.startDate, item.endDate]);
  const blob = new Blob([[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `deerwood-${termName.toLowerCase().replaceAll(" ", "-")}-filtered.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function SelectFilter({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <label className="select-wrap"><span>{label}</span><span className="select-control"><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">All {label}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>;
}

function ClassCard({ item, onFilter }: { item: ScheduleClass; onFilter: (key: keyof Filters, value: string) => void }) {
  const [open, setOpen] = useState(false);
  return <article className="class-card">
    <button className="class-card-main" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="time-block"><strong>{item.startTimeDisplay}</strong><span>to {item.endTimeDisplay}</span></span>
      <span className="course-block"><span className="course-code">{item.courseCode}</span><strong>{item.title}</strong><span className="class-number">Class #{item.classNumber} · {item.meetingPatternRaw}</span></span>
      <span className="room-block"><MapPin size={18} aria-hidden="true" /><span><small>Room</small><strong>{item.roomDisplay}</strong></span></span>
      <span className="instructor-block"><UserRound size={18} aria-hidden="true" /><span><small>Instructor</small><strong>{item.instructorDisplay}</strong></span></span>
      <ChevronDown className={open ? "rotate" : ""} size={19} aria-hidden="true" />
    </button>
    {open && <div className="class-details">
      <div><span>Meeting days</span><strong>{item.weekdays.join(", ")}</strong></div>
      <div><span>Session</span><strong>{item.sessionGroup} ({item.sessionRaw})</strong></div>
      <div><span>Dates</span><strong>{item.startDate} – {item.endDate}</strong></div>
      <div><span>Enrollment</span><strong>{item.enrollment ?? "—"}</strong></div>
      <div className="detail-actions"><button onClick={() => onFilter("instructor", item.instructorDisplay)}>All by this instructor</button><button onClick={() => onFilter("room", item.roomDisplay)}>All in this room</button></div>
    </div>}
  </article>;
}

export function Dashboard({ data }: { data: ScheduleData }) {
  const defaultTerm = data.terms.find((term) => term.isDefault)?.id ?? data.terms[0]?.id ?? "";
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, termId: defaultTerm });
  const [showFilters, setShowFilters] = useState(false);
  const termClasses = useMemo(() => data.classes.filter((item) => item.termId === filters.termId), [data.classes, filters.termId]);
  const results = useMemo(() => filterClasses(data.classes, filters), [data.classes, filters]);
  const term = data.terms.find((item) => item.id === filters.termId) ?? data.terms[0];
  const setFilter = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const dayCounts = Object.fromEntries(WEEKDAYS.map((day) => [day, termClasses.filter((item) => item.weekdays.includes(day)).length]));
  const startCounts = useMemo(() => {
    const counts = new Map<number, number>();
    termClasses.forEach((item) => counts.set(item.startMinutes, (counts.get(item.startMinutes) ?? 0) + 1));
    return [...counts].sort((a, b) => a[0] - b[0]);
  }, [termClasses]);
  const maxStart = Math.max(...startCounts.map(([, count]) => count), 1);
  const activeFilters = Object.entries(filters).filter(([key, value]) => key !== "termId" && value);
  const timeOptions = unique(termClasses.map((item) => `${item.startMinutes}|${item.startTimeDisplay}`)).sort((a, b) => Number(a.split("|")[0]) - Number(b.split("|")[0])).map((value) => ({ value: value.split("|")[0], label: value.split("|")[1] }));

  return <main>
    <header className="site-header">
      <a className="brand" href="#top"><span className="brand-mark"><GraduationCap size={25} /></span><span><strong>Deerwood</strong><small>Class Dashboard</small></span></a>
      <div className="term-chip"><CalendarDays size={16} /><span>{term?.name ?? "Schedule"}</span></div>
      <a className="admin-link" href="/admin">Administrator</a>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy"><span className="eyebrow">FSCJ Deerwood Center</span><h1>Find the right class,<br /><em>right now.</em></h1><p>Search the published schedule by instructor, course, class number, or room.</p></div>
      <div className="hero-search"><Search size={23} aria-hidden="true" /><input aria-label="Search classes" value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Try “ENC 1101”, “McCormick”, or “F1605”" />{filters.search && <button aria-label="Clear search" onClick={() => setFilter("search", "")}><X size={18} /></button>}</div>
    </section>

    <div className="dashboard-shell">
      <section aria-labelledby="week-heading"><div className="section-heading"><div><span className="eyebrow dark">Weekly overview</span><h2 id="week-heading">Classes by day</h2></div><p>Choose a day to narrow the schedule</p></div>
        <div className="weekday-grid">{WEEKDAYS.map((day, index) => <button key={day} className={`day-card tone-${index + 1} ${filters.day === day ? "selected" : ""}`} onClick={() => setFilter("day", filters.day === day ? "" : day)} aria-pressed={filters.day === day}><span>{day.slice(0, 3)}</span><strong>{dayCounts[day]}</strong><small>classes</small></button>)}</div>
      </section>

      <section className="activity-panel" aria-labelledby="time-heading"><div className="section-heading"><div><span className="eyebrow dark">Daily rhythm</span><h2 id="time-heading">Classes by start time</h2></div><p>Tap a bar to filter</p></div><div className="time-chart">{startCounts.map(([minutes, count]) => { const label = termClasses.find((item) => item.startMinutes === minutes)?.startTimeDisplay ?? ""; return <button key={minutes} className={filters.startTime === String(minutes) ? "active" : ""} onClick={() => setFilter("startTime", filters.startTime === String(minutes) ? "" : String(minutes))} title={`${count} classes start at ${label}`}><span className="bar-value">{count}</span><span className="bar" style={{ height: `${Math.max(10, count / maxStart * 90)}px` }} /><small>{label.replace(":00", "").replace(" ", "\n")}</small></button>; })}</div></section>

      <section className="results-section" aria-labelledby="results-heading">
        <div className="results-toolbar"><div><span className="eyebrow dark">Published schedule</span><h2 id="results-heading">{results.length} matching {results.length === 1 ? "class" : "classes"}</h2></div><div className="toolbar-actions"><button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={17} /> Filters{activeFilters.length > 0 && <b>{activeFilters.length}</b>}</button><button onClick={() => window.print()}><Printer size={17} /> Print</button><button onClick={() => exportCsv(results, term?.name ?? "schedule")}><Download size={17} /> Export CSV</button></div></div>

        <div className={`filters ${showFilters ? "show" : ""}`}>
          <SelectFilter label="Term" value={filters.termId} onChange={(value) => setFilters({ ...EMPTY_FILTERS, termId: value })} options={data.terms.map((item) => ({ value: item.id, label: item.name }))} />
          <SelectFilter label="Session" value={filters.session} onChange={(value) => setFilter("session", value)} options={unique(termClasses.map((item) => item.sessionGroup)).map((value) => ({ value, label: value }))} />
          <SelectFilter label="Day" value={filters.day} onChange={(value) => setFilter("day", value)} options={WEEKDAYS.map((value) => ({ value, label: value }))} />
          <SelectFilter label="Start Time" value={filters.startTime} onChange={(value) => setFilter("startTime", value)} options={timeOptions} />
          <SelectFilter label="Instructor" value={filters.instructor} onChange={(value) => setFilter("instructor", value)} options={unique(termClasses.map((item) => item.instructorDisplay)).map((value) => ({ value, label: value }))} />
          <SelectFilter label="Course" value={filters.course} onChange={(value) => setFilter("course", value)} options={unique(termClasses.map((item) => item.courseCode)).map((value) => ({ value, label: value }))} />
          <SelectFilter label="Room" value={filters.room} onChange={(value) => setFilter("room", value)} options={unique(termClasses.map((item) => item.roomDisplay)).map((value) => ({ value, label: value }))} />
          <button className="clear-button" onClick={() => setFilters({ ...EMPTY_FILTERS, termId: defaultTerm })}><X size={16} /> Clear filters</button>
        </div>

        {activeFilters.length > 0 && <div className="active-chips"><span>Showing:</span>{activeFilters.map(([key, value]) => <button key={key} onClick={() => setFilter(key as keyof Filters, "")}>{key === "startTime" ? timeOptions.find((item) => item.value === value)?.label : value}<X size={13} /></button>)}</div>}
        <div className="print-heading"><h1>Deerwood Class Dashboard</h1><p>{term?.name} · {results.length} matching classes</p><p>Filters: {activeFilters.map(([, value]) => value).join(", ") || "None"}</p></div>
        <div className="result-list">{results.length ? results.map((item) => <ClassCard key={item.id} item={item} onFilter={setFilter} />) : <div className="empty-state"><BookOpen size={34} /><h3>No classes match those filters</h3><p>Clear one or more filters and try again.</p><button onClick={() => setFilters({ ...EMPTY_FILTERS, termId: defaultTerm })}>Clear filters</button></div>}</div>
      </section>
    </div>
    <footer><span><Building2 size={17} /> FSCJ Deerwood Center</span><span>Schedule data is provided for planning assistance. Confirm changes with the college.</span></footer>
  </main>;
}

"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, LoaderCircle, UploadCloud } from "lucide-react";
import { parseWorkbook } from "@/lib/workbook";
import type { ImportWarning, ScheduleClass } from "@/lib/types";

type Preview = { fileName: string; sheetName: string; rowCount: number; classes: ScheduleClass[]; warnings: ImportWarning[] };

export function AdminImporter() {
  const [termName, setTermName] = useState("Fall 2026");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const slug = termName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  async function chooseFile(file?: File) {
    if (!file) return;
    setError(""); setSuccess("");
    try {
      const parsed = parseWorkbook(await file.arrayBuffer(), slug || "new-term");
      setPreview({ fileName: file.name, ...parsed });
    } catch (caught) { setPreview(null); setError(caught instanceof Error ? caught.message : "Could not parse this workbook."); }
  }

  async function publish() {
    if (!preview || !termName.trim()) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ termName, slug, fileName: preview.fileName, sheetName: preview.sheetName, classes: preview.classes, warnings: preview.warnings, publish: true }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Import failed.");
      setSuccess(`${result.classCount} classes were imported and ${termName} is published.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Import failed."); }
    finally { setSaving(false); }
  }

  return <div className="import-workflow">
    <div className="workflow-steps"><span className="active">1 <b>Term & file</b></span><span className={preview ? "active" : ""}>2 <b>Review</b></span><span className={success ? "active" : ""}>3 <b>Publish</b></span></div>
    <section className="import-card"><h2>1. Select an academic term</h2><p>Existing data for a term is replaced only after you confirm the import.</p><label className="term-input"><span>Term name</span><input value={termName} onChange={(event) => { setTermName(event.target.value); setPreview(null); setSuccess(""); }} placeholder="Spring 2027" /></label>
      <label className="upload-zone"><input type="file" accept=".xlsx,.xls" onChange={(event) => chooseFile(event.target.files?.[0])} /><UploadCloud size={34} /><strong>Choose an FSCJ schedule workbook</strong><span>Excel .xlsx or .xls · First worksheet is parsed</span></label>
    </section>
    {error && <div className="status-message error"><AlertTriangle size={18} />{error}</div>}
    {success && <div className="status-message success"><CheckCircle2 size={18} />{success}</div>}
    {preview && <section className="import-card"><div className="preview-heading"><div><span className="eyebrow dark">Ready to review</span><h2>{preview.fileName}</h2></div><FileSpreadsheet size={30} /></div><div className="import-stats"><div><strong>{preview.rowCount}</strong><span>schedule rows</span></div><div><strong>{new Set(preview.classes.map((item) => item.courseCode)).size}</strong><span>courses</span></div><div className={preview.warnings.length ? "warning" : ""}><strong>{preview.warnings.length}</strong><span>warnings</span></div></div>
      {preview.warnings.length > 0 && <div className="warning-list"><h3>Items to review</h3>{preview.warnings.map((warning, index) => <div key={`${warning.row}-${warning.code}-${index}`}><AlertTriangle size={14} /><span><b>Row {warning.row}</b> · {warning.message}</span></div>)}</div>}
      <h3>Representative records</h3><div className="preview-table"><table><thead><tr><th>Time</th><th>Days</th><th>Course</th><th>Instructor</th><th>Room</th><th>Session</th></tr></thead><tbody>{preview.classes.slice(0, 8).map((item) => <tr key={item.id}><td>{item.startTimeDisplay}</td><td>{item.meetingPatternRaw}</td><td><b>{item.courseCode}</b><br />{item.title}</td><td>{item.instructorDisplay}</td><td>{item.roomDisplay}</td><td>{item.sessionRaw}</td></tr>)}</tbody></table></div>
      <div className="publish-row"><div><strong>Publish immediately</strong><span>The public dashboard will use this term as soon as the import completes.</span></div><button onClick={publish} disabled={saving}>{saving ? <><LoaderCircle className="spin" size={17} /> Publishing…</> : "Confirm import & publish"}</button></div>
    </section>}
  </div>;
}

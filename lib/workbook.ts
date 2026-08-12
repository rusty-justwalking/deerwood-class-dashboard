import * as XLSX from "xlsx";
import { normalizeRows } from "@/lib/normalize";
import type { RawScheduleRow } from "@/lib/types";

export const REQUIRED_COLUMNS = ["Session", "Subject", "Catalog", "Descr", "Class Nbr", "Start Date", "End Date", "Facil ID", "Mtg_Start", "Mtg_End", "Class_Mtg", "First Name", "Last"];

export function parseWorkbook(data: ArrayBuffer, termId: string) {
  const workbook = XLSX.read(data, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("The workbook does not contain a worksheet.");
  const rows = XLSX.utils.sheet_to_json<RawScheduleRow>(workbook.Sheets[sheetName], { defval: null, raw: true });
  if (!rows.length) throw new Error("The first worksheet does not contain schedule rows.");
  const available = new Set(Object.keys(rows[0]));
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !available.has(column));
  if (missingColumns.length) throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  return { sheetName, rowCount: rows.length, ...normalizeRows(rows, termId) };
}

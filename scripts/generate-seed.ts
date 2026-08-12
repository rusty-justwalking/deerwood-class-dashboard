import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import { normalizeRows } from "../lib/normalize";
import type { RawScheduleRow, ScheduleData } from "../lib/types";

async function main() {
  const source = process.argv[2] ?? path.resolve(process.cwd(), "../DWC Fall 2026.xlsx");
  const workbook = XLSX.read(await fs.readFile(source), { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<RawScheduleRow>(workbook.Sheets[sheetName], { defval: null, raw: true });
  const { classes, warnings } = normalizeRows(rows, "fall-2026");
  const data: ScheduleData = {
    terms: [{ id: "fall-2026", name: "Fall 2026", slug: "fall-2026", isDefault: true, isPublished: true }],
    classes,
  };
  await fs.mkdir(path.resolve(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(path.resolve(process.cwd(), "data/fall-2026.json"), `${JSON.stringify(data, null, 2)}\n`);
  await fs.writeFile(path.resolve(process.cwd(), "data/fall-2026-import-report.json"), `${JSON.stringify({ source: path.basename(source), sheetName, rowCount: rows.length, warningCount: warnings.length, warnings }, null, 2)}\n`);
  console.log(`Generated ${classes.length} classes with ${warnings.length} warnings from ${sheetName}.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

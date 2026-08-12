# Implementation decisions

## Isolation

This repository, its Vercel project, and its Supabase project must all be named `deerwood-class-dashboard` and remain independent from FSCJ-Welcome / Signup Crew.

## Source-of-truth flow

Excel is an import source, not a request-time data source. Imports are normalized once and stored in Postgres. The checked-in Fall JSON is a deployment-safe baseline and test fixture, generated from the real workbook.

## Data model

`academic_terms` owns publication/default state. `schedule_imports` provides import audit history. `schedule_classes` retains normalized and raw values. `import_warnings` ensures malformed or incomplete source rows are never silently discarded.

## Administrator access

Version 1 uses one strong password stored in Vercel environment variables and an HMAC-signed, HTTP-only, eight-hour cookie. There are deliberately no roles or organizations. A later version can replace this with Supabase Auth without changing schedule ownership.

## Fall 2026 findings

- One worksheet (`Sheet1`), 193 total rows including headers, 15 columns, 192 class rows.
- Sessions: `1` (62), `A7` (38), `A12` (1), `B12` (49), `C7` (42).
- Meeting patterns: `M`, `T`, `W`, `R`, `F`, `S`, `MW`, `TR`, `WF`.
- Every one of 190 on-campus room values matches `G701` + display room + trailing zero. Exceptions: one `ONLINE` and one blank.
- Two rows have no instructor. No rows are missing course information or valid times.

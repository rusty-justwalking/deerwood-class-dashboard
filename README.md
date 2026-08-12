# Deerwood Class Dashboard

A responsive public schedule dashboard and single-administrator import workflow for FSCJ Deerwood Center. This project is intentionally independent from FSCJ-Welcome / Signup Crew.

## Version 1 capabilities

- Fall 2026 is generated from the real `DWC Fall 2026.xlsx` workbook (192 rows).
- Instant universal search plus combinable term, session, weekday, start-time, instructor, course, and room filters.
- Weekday summary cards, start-time activity chart, chronological class cards, and instructor/room drill-downs.
- Filter-aware print layout and CSV export.
- Password-protected Excel import, warning review, representative-record preview, replace, and publish workflow.
- Multiple published terms and a default-term designation.
- Responsive, keyboard-accessible desktop, tablet, and mobile layouts.

## Architecture

- Next.js 16 App Router, React 19, and TypeScript.
- A bundled normalized JSON snapshot provides a resilient Fall 2026 baseline.
- Supabase Postgres is the durable store for academic terms, imports, classes, and import warnings.
- Public pages read only published terms. Admin writes occur only in server route handlers with a secret key.
- Row Level Security is enabled on every public-schema table. Only published terms/classes are granted public `SELECT`; no public writes are granted.

## Local development

```bash
npm install
npm run seed:generate
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without Supabase variables, the public dashboard uses `data/fall-2026.json`. Admin upload preview still works, but publish requires Supabase configuration.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL of the dedicated Deerwood Supabase project. |
| `SUPABASE_SECRET_KEY` | Server-only secret key; never expose it in browser code. |
| `ADMIN_PASSWORD` | Password for the single Version 1 administrator. |
| `AUTH_SECRET` | Long random value used to sign the eight-hour admin cookie. |

## Excel import behavior

The importer reads the first worksheet and validates the expected FSCJ column names. It preserves raw fields and normalizes:

- `G701F16050` → `F1605`; `G701D14020` → `D1402`.
- `M`, `T`, `W`, `R`, `F`, `S`, and combined patterns such as `MW`, `TR`, `WF` into explicit weekday arrays.
- Session codes into `Full / Session 1`, `A Session`, `B Session`, or `C Session`, while retaining the original code.
- Source strings such as `08.00.am` into sortable minutes and `8:00 AM` display values.
- Excel serial dates into ISO dates.

Malformed but usable rows are retained with warnings. The Fall workbook has three warnings: two missing instructors and one missing room. `ONLINE` is treated as a recognized location.

Regenerate the bundled dataset from the workbook in the parent folder:

```bash
npm run seed:generate
```

## Database and deployment

Apply `supabase/migrations/202608120001_initial_schema.sql` to a new, dedicated Deerwood Supabase project. Configure the four environment variables in a new Vercel project named `deerwood-class-dashboard`, then deploy. Never point these variables at FSCJ-Welcome resources.

## Verification

```bash
npm test
npm run lint
npm run build
```

Tests cover room cleanup, day expansion, time normalization and ordering, combined filters, and universal search.

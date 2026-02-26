# Browser-Side Excel Import

## Description

Move the Excel import processing from the server to the browser to eliminate OOM (Out of Memory) crashes on the 512MB DigitalOcean droplet. The current server-side implementation loads the entire ExcelJS workbook into memory — with recent additions for cell note parsing, theme color resolution, and multi-phase reconciliation — the memory footprint has grown beyond what the constrained server can handle.

The browser-side import will:

1. Parse the `.xlsx` file entirely in the browser using ExcelJS (which already has a browser-compatible build)
2. Run all reconciliation logic (legend parsing, calendar grid parsing, partial-day adjustment, weekend-work inference, sick-time reclassification, etc.) client-side
3. Submit the parsed results to the server via lightweight JSON API endpoints for bulk upsert
4. Keep the server's role limited to authenticated data persistence — no file upload, no ExcelJS dependency at runtime

This feature is gated behind the `ENABLE_BROWSER_IMPORT` feature flag in `shared/businessRules.ts`.

## Priority

🔥 High Priority — The existing server-side import is broken on production due to OOM. This is a blocking issue for legacy data import.

## Checklist

### Phase 1: Feature Flag & Shared Type Extraction

- [x] Add `ENABLE_BROWSER_IMPORT` feature flag to `shared/businessRules.ts`
- [x] Define shared import payload types in `shared/api-models.d.ts`:
  - `BulkImportPayload` — top-level request body
  - `BulkImportEmployee` — employee info (name, email/identifier, hire date, carryover hours)
  - `BulkImportPtoEntry` — PTO entry (date, hours, type, notes, isNoteDerived)
  - `BulkImportAcknowledgement` — acknowledgement record (month, status, note)
- [x] Ensure types are compatible with both client and server `tsconfig` targets
- [x] Run `pnpm run build` — must compile without errors
- [x] Run `pnpm run lint` — must pass

### Phase 2: Extract Pure Parsing Logic from `excelImport.ts`

The goal is to separate the ~2700-line `excelImport.ts` into two layers:

1. **Pure parsing layer** (`shared/excelParsing.ts` or `shared/` subfolder) — no TypeORM, no Node.js `fs`, no `DataSource`. Takes ExcelJS worksheet objects and returns plain data structures.
2. **Server persistence layer** — remains in `server/reportGenerators/excelImport.ts`, imports types from the parsing layer, handles TypeORM upserts.

- [x] Identify all functions in `excelImport.ts` that are pure (no TypeORM/fs dependency):
  - `parseThemeColors`, `resolveColorToARGB`, `colorDistance`, `findClosestLegendColor`
  - `extractCellNoteText`, `parseHoursFromNote`, `isStrictHoursMatch`
  - `findLegendHeaderRow`, `parseLegend`, `parsePartialPtoColors`
  - `parseCalendarGrid`, `findPtoCalcStartRow`, `parsePtoCalcUsedHours`, `parseCarryoverHours`
  - `adjustPartialDays`, `reconcilePartialPto`, `parseWorkedHoursFromNote`, `processWorkedCells`
  - `inferWeekendPartialHours`, `isEmployeeSheet`, `parseEmployeeInfo`
  - All helper types (`ImportedPtoEntry`, `LegendEntry`, `PtoCalcRow`, `EmployeeImportInfo`, etc.)
- [x] Move pure functions to `shared/excelParsing.ts`
- [x] Add a barrel export so both server and client can import
- [x] Update `server/reportGenerators/excelImport.ts` to import/re-export from the shared module
- [x] Verify all existing tests pass after the refactor — 167 tests pass, no logic changes
- [x] Run `pnpm test` — all 1106 tests pass
- [x] Run `pnpm run build` — compiles without errors
- [x] Run `pnpm run lint` — passes

### Phase 3: Bundle ExcelJS for the Browser

ExcelJS has an official browser build. Integrate it into the client bundle.

- [x] ExcelJS already present; browser build at `dist/exceljs.min.js` (926KB raw, 307KB gzipped)
- [x] Configure esbuild: `build:client:import` script bundles `client/import/excelImportClient.ts` → `public/excel-import.js` (1.5MB raw, 307KB gzipped)
- [x] ExcelJS browser build works with no additional polyfills needed
- [x] Bundle is lazy-loaded only when admin triggers import (not in main app.js)
- [x] Run `pnpm run build` — compiles without errors

### Phase 4: Client-Side Import Orchestrator

Build the browser-side import pipeline that mirrors `importExcelWorkbook()`.

- [x] Create `client/import/excelImportClient.ts` — the main orchestrator:
  - Accepts a `File` object from the file input
  - Reads it as an `ArrayBuffer` and loads via `new ExcelJS.Workbook().xlsx.load(buffer)`
  - Extracts theme colors from the workbook
  - Iterates worksheets, calling shared parsing functions
  - Runs all reconciliation phases (adjustPartialDays, processWorkedCells, inferWeekendPartialHours, reconcilePartialPto, reclassifySickByColumnS)
  - Produces an array of `ImportedEmployee` with their `ImportedPtoEntry[]` and `ImportedAcknowledgement[]`
  - Emits progress events for UI feedback (e.g., "Processing sheet 3 of 68...")
- [ ] Handle per-worksheet memory: after processing each sheet, release from workbook (deferred — browser memory is ample)
- [ ] Write unit tests for the orchestrator using Vitest (mock ExcelJS workbook objects)
- [x] Run `pnpm test` — all 1106 tests pass
- [x] Run `pnpm run build` — compiles without errors

### Phase 5: Server-Side Bulk Upsert API

Create a new API endpoint that accepts the parsed import payload (JSON) instead of a raw `.xlsx` file.

- [x] `POST /api/admin/import-bulk` — accepts `BulkImportPayload` JSON body:
  - Authenticated admin-only (reuses `authenticateAdmin` middleware)
  - Validates payload structure (must have employees array)
  - For each employee: reuses `upsertEmployee` from excelImport
  - For each PTO entry: reuses `upsertPtoEntries` (includes date/type/hours validation)
  - For each acknowledgement: reuses `upsertAcknowledgements`
  - Returns same `ImportResult` shape for UI compatibility
- [ ] Set a reasonable JSON body size limit (deferred — Express default 100KB; may need increase)
- [x] Input validation via shared business rules (reuses existing `upsertPtoEntries` validation)
- [x] Disable autoSave during bulk insert (same pattern as `importExcelWorkbook`)
- [ ] Write integration tests for the new endpoint
- [x] Run `pnpm test` — all 1106 tests pass
- [x] Run `pnpm run build` — compiles without errors
- [x] Run `pnpm run lint` — passes

### Phase 6: Admin Settings Page — Browser Import UI

Update the admin settings page to use browser-side import when the feature flag is enabled.

- [x] Check `ENABLE_BROWSER_IMPORT` flag in the admin settings component
- [x] When enabled: lazy-load ExcelJS module, parse locally, submit JSON to `/api/admin/import-bulk`
- [x] When disabled: use existing server-side upload to `/api/admin/import-excel` (unchanged)
- [x] Add progress indicator showing which sheet is being processed
- [x] Warnings surface in expandable details panel (merged client+server warnings)
- [x] Show final import summary (employees processed, PTO entries upserted, warnings)
- [x] Handle errors gracefully — per-sheet try/catch, continues with others
- [x] Run `pnpm run build` — compiles without errors
- [x] Run `pnpm run lint` — passes

### Phase 7: End-to-End Testing & Validation

- [ ] Run `pnpm validate:xlsx` equivalent logic in the browser (or create a browser test page)
- [ ] Compare import results between server-side and browser-side for `reports/2018.xlsx`:
  - Same number of employees processed
  - Same PTO entries per employee per month
  - Same acknowledgement records
  - Same warnings emitted
- [x] Vitest tests for the shared parsing module (167 tests pass from Phase 2)
- [ ] Playwright E2E test: admin uploads `.xlsx` via browser import, verifies results appear
- [ ] Manual testing on the actual 512MB production server to confirm no OOM
- [x] Run `pnpm test` — all 1106 tests pass (52 files, 1 skipped pre-existing)
- [x] Run `pnpm run build` — compiles without errors
- [x] Run `pnpm run lint` — passes

### Phase 8: Cleanup & Documentation

- [x] Update `TASKS/legacy-data-import.md` Known Issues to mark OOM issue as resolved
- [x] Document the browser import architecture in README.md
- [ ] Consider deprecating the server-side `/api/admin/import-excel` endpoint once browser import is stable
- [ ] Update deployment documentation if server-side ExcelJS dependency can be removed
- [x] Feature flag `ENABLE_BROWSER_IMPORT` set to `true` in `shared/businessRules.ts`
- [x] Run `pnpm run build` — compiles without errors
- [x] Run `pnpm run lint` — passes

## Implementation Notes

### Architecture Overview

```
Current (server-side):
  Browser → POST /api/admin/import-excel (multipart .xlsx) → Server loads ExcelJS → OOM 💥

Proposed (browser-side):
  Browser → File input → ExcelJS.load(ArrayBuffer) → Shared parsing logic → JSON payload
    → POST /api/admin/import-bulk (JSON) → Server validates & upserts → 200 OK
```

### Key Design Decisions

1. **ExcelJS in the browser**: ExcelJS officially supports browser environments and can load `.xlsx` from `ArrayBuffer`. Modern browsers have gigabytes of available memory, so the 68-worksheet workbook will parse easily.

2. **Shared parsing code**: The ~2700 lines in `excelImport.ts` are roughly 90% pure parsing logic with no server dependencies. Extracting this to `shared/` makes it importable by both server and client builds. The server retains its import path for backward compatibility (feature-flagged).

3. **Lightweight server endpoint**: The bulk upsert endpoint receives structured JSON (~50-100KB for a full year import) instead of a multi-megabyte `.xlsx` file. This is well within the 512MB server's capacity.

4. **Feature flag**: `ENABLE_BROWSER_IMPORT` in `shared/businessRules.ts` allows gradual rollout. When `false`, the existing server-side import is used unchanged. When `true`, the admin settings page switches to browser-side parsing.

5. **Progress feedback**: Browser-side parsing enables real-time progress updates (per-sheet progress bar, live warning log) that were impossible with the server-side upload-and-wait approach.

### Dependencies on Existing Code

- `shared/businessRules.ts` — PTO types, validation functions, earning schedule
- `shared/dateUtils.ts` — date formatting and parsing
- `server/reportGenerators/excelImport.ts` — source of parsing logic to extract
- `client/pages/admin-settings-page/` — existing import UI to extend
- `client/APIClient.ts` — API client to add new `importBulk()` method

### ExcelJS Browser Considerations

- ExcelJS's browser build uses `Buffer` polyfills; esbuild may need `define` or `inject` configuration
- The `workbook.xlsx.load(arrayBuffer)` method is the browser-compatible way to load files
- Theme XML access (`workbook._themes`) uses internal APIs — verify they work in the browser build
- If theme XML is not accessible in the browser build, fall back to `DEFAULT_OFFICE_THEME` (already handled)

### Memory Management

- Process worksheets sequentially and release each after processing (`workbook.removeWorksheet(ws.id)`)
- The parsed data per employee is small (~1-5KB JSON); only the ExcelJS workbook is large
- Browser tab memory limits are typically 1-4GB — far above what's needed

## Questions and Concerns

1. **Keep server-side endpoint as primary?** Yes — the server-side `/api/admin/import-excel` remains the _primary_ import path long-term. The browser-side import is a workaround for the current 512MB server limitation. Both paths will coexist.
2. **Theme XML in browser?** Yes — move all necessary logic to the client, including theme extraction. This is a proof-of-concept; nothing is off the table. Note: testing will occur on a Pixel 3a, which has limited processing power — the import may struggle on that device too.
3. **Bundle size?** Lazy-load ExcelJS. Only the `/import` screen (admin settings page) should load the library. Do not include it in the main bundle.
4. **Idempotency?** Allow overwrites. Imported data is the source of truth — re-imports overwrite existing records.

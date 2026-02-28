# Employee Spreadsheet Upload

## Description

Allow authenticated employees to upload their own PTO spreadsheet (`.xlsx`) to bulk-import PTO entries. The server validates that the spreadsheet belongs to the uploading employee by matching Employee Name (J2) and Hire Date (R2) against the database. The import focuses exclusively on PTO calendar data (colored cells) and Employee Initials (column X), ignoring admin-only fields such as carryover (L42), admin acknowledgements (column Y), and all admin-computed totals.

### User Access

- **Primary menu item**: A new "Upload Timesheet" item is added to `DashboardNavigationMenu` for **all authenticated users** (employees and admins). It appears in the employee section of the menu (above admin-only items), routing to `/upload-timesheet`.
- **Admin Settings page**: The admin retains access to the existing bulk multi-employee import on `/admin/settings`. The new "Upload Timesheet" route is for uploading a **single personal** timesheet.
- **Route**: `/upload-timesheet` — authenticated, no role restriction. The page renders the `<timesheet-upload-form>` web component.

### Key Behaviors

- **Identity verification**: J2 (Employee Name) and R2 (Hire Date) must exactly match the logged-in employee's database record (case-insensitive, whitespace-normalized — no partial or fuzzy matching). Mismatch → reject the entire upload.
- **Data conflict detection**: For each month, the sum of PTO hours derived from colored calendar cells must exactly match the declared PTO hours in column S. Any mismatch → reject the entire upload with a detailed error listing every discrepancy.
- **Admin-locked month protection**: Months that have been acknowledged (locked) by an admin are skipped — the upload does not overwrite admin-locked data. If **all** months in the uploaded year are admin-locked, return 409 Conflict.
- **Unlocked month handling**: For unlocked months, **all** existing PTO entries (including previously-approved entries) are deleted and replaced with the spreadsheet data (full overwrite semantics).
- **Business rule warnings**: If the import would cause the employee to exceed PTO limits (e.g., annual PTO cap, sick-hour limits, borrowing violations), report warnings but **allow** the upload. This facilitates migration from the legacy spreadsheet system.
- **Standard approval flow**: Imported entries follow the same approval rules as manually-submitted PTO requests — they are **not** auto-approved. All entries enter the admin PTO Request Queue for review.
- **All PTO types**: The upload parses all legend-colored PTO types (Sick, PTO, Bereavement, Jury Duty, Planned PTO, Partial PTO with cell notes for hours).

## Priority

🟡 Medium Priority

This feature depends on the existing authentication system, employee database, PTO entry schema, and the admin Excel import parsing infrastructure (shared parsing logic from `shared/excelParsing.ts`). It extends the core import capability to employees.

## Checklist

### Phase 1: API Endpoint & Identity Verification

- [ ] Create `POST /api/employee/import-bulk` endpoint (authenticated, employee-only) accepting browser-parsed JSON
- [ ] Create client-side identity verification: extract Employee Name from J2 and Hire Date from R2 using ExcelJS in the browser
- [ ] Compare J2/R2 against the authenticated employee's `name` and `hire_date` (exact match, case-insensitive, whitespace-normalized)
- [ ] Block submission client-side with descriptive error if name or hire date does not match; also validate server-side (return 403)
- [ ] Write Vitest unit tests for identity verification logic
- [ ] **Validate**: `pnpm run build && pnpm run lint` pass; unit tests pass

### Phase 2: Calendar Parsing & Column S Reconciliation (Browser-Side)

- [ ] Reuse/refactor calendar parsing from `shared/excelParsing.ts` to extract colored PTO cells per month (runs in browser via ExcelJS)
- [ ] Sum PTO hours from calendar cells (8h for full-day, note-hours for partial) per month
- [ ] Read column S (rows 42–53) for declared PTO hours per month
- [ ] Compare calendar sums against column S values for each month
- [ ] If any month has a mismatch, block submission client-side with a detailed error listing every discrepant month, the calendar sum, and the declared value
- [ ] Write Vitest unit tests for calendar-vs-column-S reconciliation
- [ ] **Validate**: `pnpm run build && pnpm run lint` pass; unit tests pass

### Phase 3: Admin-Lock Detection & Overwrite Logic

- [ ] Query admin acknowledgement status for each month of the uploaded year
- [ ] Skip (do not overwrite) any month that has been admin-acknowledged
- [ ] If **all** months are admin-locked, return 409 Conflict with a message listing the locked months
- [ ] For unlocked months, delete **all** existing PTO entries for the employee/month (including approved entries), then insert spreadsheet entries
- [ ] Parse Employee Initials from column X (rows 42–53) and write employee acknowledgements for imported months
- [ ] Return per-month breakdown response: `perMonth[]` array with `{ month, status, entriesImported, entriesDeleted, warnings }` for each month (status: `"imported"` | `"skipped-locked"`)
- [ ] Write Vitest unit tests for lock-detection, overwrite behavior, and all-locked 409 response
- [ ] **Validate**: `pnpm run build && pnpm run lint` pass; unit tests pass

### Phase 4: Business Rule Warnings & Approval Flow

- [ ] Run standard business rule validations on the imported entries (annual PTO cap, sick-hour limit, bereavement limit, borrowing checks)
- [ ] Collect warnings for any violations but do NOT reject the upload
- [ ] Ensure all imported entries are created with `approved_by = NULL` (unapproved, entering the admin queue)
- [ ] Include warnings in the JSON response body, associated with the relevant month in the `perMonth[]` breakdown
- [ ] Write Vitest unit tests for warning generation and approval status
- [ ] **Validate**: `pnpm run build && pnpm run lint` pass; unit tests pass

### Phase 5: `<timesheet-upload-form>` Web Component & Navigation

#### 5a: Component scaffold (BaseComponent)

- [ ] Create `client/components/timesheet-upload-form/index.ts` extending `BaseComponent`
- [ ] Create `client/components/timesheet-upload-form/css.ts` with exported `styles` template string using design tokens from `tokens.css`
- [ ] Define `static get observedAttributes()` — no external attributes needed (component is self-contained)
- [ ] Implement `render()` returning declarative template: file input, submit button, status/results area
- [ ] Use `handleDelegatedClick` / `handleDelegatedSubmit` for event handling (no inline handlers)
- [ ] Register element: `customElements.define("timesheet-upload-form", TimesheetUploadForm)`
- [ ] Export from `client/components/index.ts`

#### 5b: Upload logic (browser-side ExcelJS parsing)

- [ ] On file select: parse `.xlsx` with ExcelJS in the browser
- [ ] Extract J2 (Employee Name) and R2 (Hire Date); compare against current user's profile (fetched via API or passed as complex property)
- [ ] Run calendar-vs-column-S reconciliation; display mismatches as inline errors (no submission)
- [ ] On valid parse: submit structured JSON to `POST /api/employee/import-bulk`
- [ ] Display per-month results (`perMonth[]`): imported months, skipped (locked) months, warnings, and errors
- [ ] Show clear error messages for identity verification failures and column S discrepancies

#### 5c: Route & navigation integration

- [ ] Add route `{ path: "/upload-timesheet", component: "upload-timesheet-page", name: "Upload Timesheet", meta: { title: "Upload Timesheet", requiresAuth: true } }` to `client/router/routes.ts` (no `roles` restriction — available to all authenticated users)
- [ ] Create `client/pages/upload-timesheet-page/index.ts` page component that hosts `<timesheet-upload-form>`
- [ ] Add `"upload-timesheet"` to the `Page` type union in `client/components/dashboard-navigation-menu/index.ts`
- [ ] Add `{ id: "upload-timesheet", label: "Upload Timesheet" }` to `menuItems` array in `DashboardNavigationMenu.render()` — placed after "Prior Year Summary" and before admin-only items

#### 5d: Test harness

- [ ] Create `client/components/timesheet-upload-form/test.html` following the project test.html pattern
- [ ] Create `client/components/timesheet-upload-form/test.ts` with `playground()` function
- [ ] Add playground import/export to `client/components/test.ts`
- [ ] **Validate**: `pnpm run build && pnpm run lint` pass; manual testing of upload flow

### Phase 6: E2E & Integration Testing

- [ ] Write Playwright E2E test: successful employee upload with valid spreadsheet
- [ ] Write Playwright E2E test: rejected upload due to name/hire-date mismatch
- [ ] Write Playwright E2E test: rejected upload due to column S discrepancy
- [ ] Write Playwright E2E test: upload with admin-locked months (verify skipped)
- [ ] Write Playwright E2E test: upload with business rule warnings (verify warnings shown but upload succeeds)
- [ ] Verify all existing admin import tests still pass (no regressions)
- [ ] **Validate**: `pnpm run build && pnpm run lint` pass; all E2E tests pass

### Phase 7: Documentation & Final Quality Gates

- [ ] Update API documentation with the new endpoint
- [ ] Update README.md with employee upload instructions
- [ ] Manual testing of the full upload flow (happy path + error cases)
- [ ] Code review and final linting

## Implementation Notes

- **Reuse parsing infrastructure**: The existing `shared/excelParsing.ts` already handles calendar cell parsing, legend detection, note extraction, and row-offset anomaly detection. Extract reusable functions rather than duplicating logic.
- **Browser-side parsing required**: The 512 MB production droplet cannot safely parse `.xlsx` server-side (same OOM risk as admin imports). Employee uploads must use browser-side ExcelJS parsing — the client parses the spreadsheet, performs identity verification and column S reconciliation locally, then submits structured JSON to a lightweight bulk-upsert API endpoint (similar to the admin `POST /api/admin/import-bulk` pattern).
- **Identity matching**: Name comparison should be case-insensitive and whitespace-normalized. Hire date comparison should parse the R2 format ("Hire Date: M/D/YY") and compare against the database `hire_date` field.
- **Column S location**: PTO hours per month are in column S (column index 19), rows 42–53, one row per month (Jan=42, Dec=53). These are merged cells S-T per the spreadsheet layout spec.
- **Column X location**: Employee initials are in column X (column index 24), rows 42–53.
- **Admin lock check**: Use the existing `acknowledgements` table — a month is admin-locked if there is an admin acknowledgement record for that employee/month.
- **Overwrite semantics for unlocked months**: Delete **all** PTO entries for the employee in the target month — including previously-approved entries — then insert the new entries. This gives the employee a clean re-import path. Approved entries are not preserved; the admin will need to re-approve after re-upload.
- **No carryover import**: Ignore cell L42 (prior-year carryover) entirely — only admins set carryover.
- **Security**: The endpoint accepts imports only for the authenticated user's own data (enforced server-side via session identity). Both employees and admins can upload their personal timesheets. Rate-limit uploads to prevent abuse (e.g., max 5 uploads per hour).
- **Web component conventions**: `<timesheet-upload-form>` extends `BaseComponent`, uses a separate `css.ts` file for styles, declarative `render()` method, and `handleDelegatedClick`/`handleDelegatedSubmit` for events. No direct API calls — the component dispatches custom events and the page component (or the component itself, if self-contained) handles API interaction. Follow the Named Slots pattern if composing child components.
- **Navigation placement**: "Upload Timesheet" appears as a primary menu item for all users (not under Settings). It sits after "Prior Year Summary" in the `DashboardNavigationMenu` menu items array, before admin-only items. The route `/upload-timesheet` has `requiresAuth: true` but no `roles` restriction.
- **Admin bulk import remains separate**: The existing admin multi-employee import on `/admin/settings` is unchanged. The new feature is for single personal timesheet uploads only.

## Questions and Concerns

1. **Exact name matching** — Yes. J2 must exactly match (case-insensitive, whitespace-normalized). No partial or fuzzy matching. ✅
2. **409 Conflict on all-locked** — Yes. If every month in the uploaded year is admin-locked, return 409 Conflict. ✅
3. **Browser-side parsing** — Must use browser-side ExcelJS parsing to stay safe on the 512 MB droplet. ✅
4. **Overwrite everything in unlocked months** — Yes. All existing PTO entries (including approved) are deleted and replaced on re-upload. ✅
5. **Per-month response breakdown** — Yes. Response includes `perMonth[]` with entries imported, skipped, and warnings per month. ✅

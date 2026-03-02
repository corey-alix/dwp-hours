# Timesheet-Based Login

## Description

Allow unauthenticated users to sign in (or sign up) by uploading a valid PTO spreadsheet (`.xlsx`) directly from the login page. The spreadsheet acts as a possession-based credential: if the file parses successfully and the employee name + hire date resolve to a known (or new) employee, the server authenticates the user and returns a session token — no magic link required.

This feature merges the login page (`<login-page>`) and the timesheet upload concept (`<timesheet-upload-form>`) into a single unauthenticated flow:

1. **Existing user**: The spreadsheet's Employee Name (J2) and Hire Date (R2) match a database record → sign the user in, import the data (following all existing rules), and redirect to the dashboard.
2. **New user**: No matching employee exists → auto-provision the employee from the spreadsheet metadata, import the data, sign the user in, and redirect to the dashboard.
3. **Locked data safety**: If the sheet has already been fully imported and all months are admin-locked, the import returns 409 but the authentication still succeeds (the user proved possession of a valid spreadsheet). The user sees a message that their data is already up to date.
4. **Standard import rules**: All existing upload rules apply — admin-locked month protection, column S reconciliation, business rule warnings, unapproved entry status, etc.

### User-Facing Flow

1. On the login page, below the existing email/magic-link form, a new section reads: **"Or sign in with your timesheet"** with a file picker for `.xlsx`.
2. User selects their spreadsheet and clicks **"Sign In with Timesheet"**.
3. The client parses the file in-browser (ExcelJS), extracts employee metadata, and sends the bulk payload to a new unauthenticated endpoint.
4. The server validates the spreadsheet data, upserts the employee, imports PTO entries, generates a session JWT, and returns it.
5. The client stores the session token (cookie) and dispatches `login-success`, redirecting to the dashboard.

## Priority

🟡 Medium Priority

This feature depends on the existing authentication system (JWT session tokens, `AuthService`), the employee database, PTO entry schema, and the shared Excel parsing infrastructure (`shared/excelParsing.ts`, `client/import/excelImportClient.ts`). It extends both the login flow and the employee import capability.

## Checklist

### Phase 1: API Endpoint — Unauthenticated Timesheet Auth

- [x] Create `POST /api/auth/timesheet-login` endpoint (unauthenticated)
- [x] Accept `BulkImportPayload` JSON body (single employee) with parsed spreadsheet data
- [x] Validate payload: exactly one employee, non-empty name, non-empty hireDate
- [x] Upsert employee via existing `upsertEmployee()` — create if new, match if existing (case-insensitive name + hire date match)
- [x] If employee exists but hire date does not match → return 403 with clear error message
- [x] Import PTO entries via existing `upsertPtoEntries()` following standard rules (locked-month skip, overwrite unlocked, etc.)
- [x] Generate JWT session token for the resolved employee (reuse existing token generation from auth routes)
- [x] Return `{ authToken, employee: { id, name, role }, importResult: { ... } }` on success
- [x] Return 409 with `{ authToken, employee, message }` when all months are locked (auth succeeds, import skipped)
- [x] Apply rate limiting to prevent brute-force abuse (e.g., 5 requests per IP per minute)
- [ ] Write Vitest unit tests for endpoint logic (happy path, new user, existing user, hire-date mismatch, all-locked)
- [x] **Validate**: `pnpm run build && pnpm run lint` pass; unit tests pass

### Phase 2: Client-Side Parsing on Login Page

- [x] Add a "Sign in with Timesheet" section to the `<login-page>` component below the existing magic-link form
- [x] Add file input (`.xlsx` only) and submit button styled consistently with the existing login form
- [x] On submit, lazy-load `excelImportClient.ts` and call `parseExcelInBrowser()` to parse the file
- [x] Extract exactly one employee sheet (reject multi-employee workbooks with clear error)
- [x] Show parsing progress (loading, parsing phases) in the login message area
- [x] Display client-side validation errors (column S reconciliation mismatches, no employee sheets found) inline
- [x] Write Vitest unit tests for the login-page integration (form rendering, submit handling, error display)
- [x] **Validate**: `pnpm run build && pnpm run lint` pass; unit tests pass

### Phase 3: Session Establishment & Redirect

- [x] On successful API response, call `AuthService.setAuthCookie()` with the returned `authToken`
- [x] Dispatch `login-success` custom event with user data (same pattern as magic-link login)
- [x] Router redirects to dashboard (existing behavior on `login-success`)
- [x] Show import summary (entries imported, warnings, locked months skipped) via notification toaster after redirect
- [x] Handle 403 (hire-date mismatch) — display inline error: "The spreadsheet does not match any account. Check your hire date."
- [x] Handle 409 (all months locked) — still authenticate but show info message: "Signed in successfully. Your timesheet data is already up to date."
- [x] Handle network/server errors gracefully with user-friendly messages
- [x] Write Vitest unit tests for session establishment and error handling branches
- [x] **Validate**: `pnpm run build && pnpm run lint` pass; unit tests pass

### Phase 4: Security Hardening

- [x] Add express-rate-limit middleware to `/api/auth/timesheet-login` (stricter than other auth endpoints)
- [x] Validate payload size limit (reject files/payloads above reasonable threshold, e.g., 2 MB JSON)
- [x] Log all timesheet-login attempts (IP, employee name, success/failure) for audit trail
- [x] Ensure no sensitive data (full PTO breakdown) leaks in error responses to unauthenticated callers
- [ ] Write Vitest tests for rate limiting and payload size validation
- [x] **Validate**: `pnpm run build && pnpm run lint` pass; unit tests pass

### Phase 5: E2E Tests & Documentation

- [ ] Write Playwright E2E test: new user signs in via timesheet upload → dashboard loads, employee created
- [ ] Write Playwright E2E test: existing user signs in via timesheet upload → dashboard loads, data imported
- [ ] Write Playwright E2E test: hire-date mismatch → error displayed, no authentication
- [ ] Write Playwright E2E test: all months locked → user authenticated, info message shown
- [ ] Update login page `test.html` playground with timesheet login section
- [ ] Update API documentation with new endpoint
- [ ] Manual testing of full flow (new user, existing user, locked data, error cases)
- [ ] `pnpm run build && pnpm run lint` pass; all E2E tests pass

## Implementation Notes

- **Reuse existing infrastructure**: The server-side `upsertEmployee()` and `upsertPtoEntries()` from `server/reportGenerators/excelImport.ts` handle all the heavy lifting. The new endpoint is a thin orchestrator that calls these, then generates a JWT.
- **Browser-side parsing**: The client reuses `parseExcelInBrowser()` from `client/import/excelImportClient.ts`, which lazy-loads ExcelJS. This keeps the main bundle small and moves the CPU-intensive parsing off the server.
- **Single-employee constraint**: The login endpoint only accepts a single-employee workbook payload. Multi-employee workbooks (admin bulk imports) remain admin-only.
- **JWT generation**: Reuse the existing `generateToken()` / session creation logic from the magic-link auth routes in `server/server.mts`. The timesheet-login endpoint generates the same JWT format.
- **Hire-date as second factor**: The hire date parsed from R2 serves as a lightweight second factor — an attacker would need both the employee's name and hire date to forge a login. This is comparable to the security of a magic-link email.
- **Locked-month behavior**: If all months are locked, the 409 response still includes `authToken` so the user is signed in. The import is a no-op, but authentication succeeds because possession of a valid spreadsheet was proven.
- **Rate limiting**: Since this endpoint is unauthenticated and accepts file data, aggressive rate limiting (5 req/min/IP) prevents abuse without impacting legitimate use.
- **No changes to existing upload-timesheet-page**: The authenticated `/upload-timesheet` route and `<timesheet-upload-form>` component remain unchanged. This feature only adds an alternative entry point on the login page.
- **Date handling**: All date operations must use `shared/dateUtils.ts` string-based YYYY-MM-DD format per project conventions.

## Questions and Concerns

1. **Should the timesheet login bypass column S reconciliation checks to reduce friction for first-time users?** Default: No — apply the same validation as the authenticated upload to ensure data integrity from day one.

2. **Should the server accept the raw `.xlsx` file (multipart upload) instead of browser-parsed JSON to avoid client-side ExcelJS dependency on the login page?** Default: No — browser-side parsing keeps the server memory-safe (512 MB droplet) and reuses the existing `parseExcelInBrowser()` pipeline.

3. **Should a successful timesheet login auto-approve the imported PTO entries (since the employee themselves is uploading)?** Default: No — entries should remain unapproved and enter the admin queue, consistent with the existing employee upload flow.

4. **Should the login page timesheet upload support drag-and-drop in addition to the file picker?** Default: Yes — it improves UX with minimal implementation effort and follows the pattern already used in the admin import.

5. **Should the rate limit on the timesheet-login endpoint be shared with the magic-link request endpoint or tracked independently?** Default: Independently — the timesheet endpoint has a larger attack surface (file parsing) and warrants its own stricter limit.

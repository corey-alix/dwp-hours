# API Access Skill

## Description

Create a specialized agent skill that documents how to authenticate with and query the DWP Hours Tracker REST API. This skill captures the authentication flow, common endpoints, and curl-based access patterns so agents can efficiently query the running server for data.

## Priority

🟢 Low Priority (Documentation & Tooling)

## Checklist

### Phase 1: Skill Documentation (Complete)

- [x] Create `.github/skills/api-access-assistant/` directory
- [x] Create `SKILL.md` with authentication flow documentation
- [x] Document the two-step magic-link authentication process
- [x] Document common API endpoints (public, employee, admin, test)
- [x] Include curl one-liner helpers for quick authentication
- [x] Document response patterns for key endpoints
- [x] Document cookie name (`auth_hash`) and JWT details

### Phase 2: Database Seeding

- [x] Document the `POST /api/test/seed` endpoint (requires `x-test-seed: true` header)
- [x] Document the `pnpm run seed` CLI script for offline seeding
- [x] Document the `POST /api/test/reload-database` endpoint (requires `x-test-reload: true` header)
- [x] Document the `pnpm run server:reload` convenience script

### Phase 3: Excel Import

- [x] Document the `POST /api/admin/import-excel` endpoint (multipart form, admin auth required)
- [x] Document the curl command for uploading `.xlsx` files via `-F "file=@path"`
- [x] Document the full flow: seed → authenticate as admin → import Excel
- [x] Verify import of `reports/2018.xlsx` succeeds (66 employees, 2396 PTO entries)

### Phase 4: Employee Listing

- [x] Document `GET /api/employees` endpoint (admin auth, returns all employees sorted by name)
- [x] Document `GET /api/employees/:id` endpoint (admin auth, returns single employee)
- [x] Document response shape differences (list uses camelCase, single uses snake_case)
- [x] Include filtering example with python3

### Phase 5: Copilot Instructions Integration

- [ ] Register the skill in `.github/copilot-instructions.md` skills list
- [ ] Verify skill triggers work with example queries

### Phase 6: Validation

- [ ] Test authentication flow against running server
- [ ] Verify documented endpoints match current server routes
- [ ] Confirm response patterns are accurate
- [ ] Build and lint pass (`pnpm run build && pnpm run lint`)

## Implementation Notes

- The authentication endpoint is `POST /api/auth/request-link` (not `/api/auth/magic-link`)
- The `x-test-mode: true` header or non-production environment causes magic links to be returned directly in the response
- Session tokens are long-lived (10-year expiry) JWT tokens stored in the `auth_hash` cookie
- Admin endpoints use `authenticateAdmin()` middleware which checks `employee.role === "Admin"`
- Auto-provisioning creates new employee records for unknown email addresses with allowed domains
- Month format for API endpoints is `YYYY-MM` (e.g., `2018-05`)
- **Database seeding**: Use `POST /api/test/seed` with `x-test-seed: true` header, or `pnpm run seed` offline. The API endpoint clears all tables and re-inserts seed data. After offline seeding, call `POST /api/test/reload-database` (with `x-test-reload: true`) to reload the running server's in-memory database from disk.
- **Excel import**: Use `POST /api/admin/import-excel` with admin auth and multipart form data (`-F "file=@path.xlsx"`). The endpoint uses multer with disk storage to `/tmp`, accepts only `.xlsx` files up to 10MB. It processes all sheets in the workbook, creating/updating employees and upserting PTO entries. The response includes per-employee details and warnings about data mismatches.
- **Complete reset + import flow**: Seed → re-authenticate as admin → import Excel file. Seeding clears and re-creates base employees, then the Excel import adds/merges the spreadsheet data on top.

## Questions and Concerns

1. Should the skill include scripting helpers (e.g., a reusable shell function for auth)?
2. Should response schemas be formally documented with TypeScript types?
3. Are there rate limiting or security considerations to document for API access?
4. Should the seeding flow also document the `pnpm run playwright:seed` convenience script (seed + reload)?
5. How should duplicate employees be handled when importing the same Excel file twice?

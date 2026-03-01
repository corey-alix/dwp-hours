# Admin View Employee Year Summary

## Description

Allow administrators to view the Current Year Summary page (`current-year-summary-page`) for any employee by passing an `employeeId` query parameter (e.g., `/current-year-summary?employeeId=5`). The admin accesses this view from the Employee Management page (`admin-employees-page`), where each employee card gains a new **"View"** action button placed after "View Calendar" and before "Edit".

When an admin navigates to `/current-year-summary?employeeId=<id>`:

- The page heading should include the employee's name (e.g., "2026 Year Summary — Jane Doe").
- PTO status, entries, and accrual data are fetched for the target employee (not the logged-in admin).
- Employee info card displays the target employee's data.
- The page is read-only; no submit/schedule actions are exposed.

When a non-admin user visits the page (or no `employeeId` param is provided), the existing behaviour is preserved — the page loads the authenticated user's own data.

## Priority

🟡 Medium Priority

This is a core admin feature that improves visibility into individual employee PTO data from the existing employee management workflow. It depends on existing database schema, authentication, and PTO calculation infrastructure (all complete).

## Checklist

### Phase 1: API — Admin PTO Status Endpoint

- [x] Add `getAdminEmployeePTOStatus(employeeId)` method to `client/APIClient.ts` that calls `GET /api/admin/employees/:id/pto-status`
- [x] Add `getAdminEmployeePTOEntries(employeeId)` method to `client/APIClient.ts` (or verify existing `getAdminPTOEntries({ employeeId })` is sufficient)
- [x] Add `GET /api/admin/employees/:id/pto-status` server endpoint in `server/server.mts` (admin-only, reuses `calculatePTOStatus` with the target employee's data)
- [x] Add admin role guard to the new endpoint
- [x] Add input validation (employee ID must be a positive integer, employee must exist)
- [ ] **Validate**: `pnpm run build` passes; endpoint returns correct PTO status for a given employee when tested via `curl`

### Phase 2: Route Loader — Employee-Scoped Data Fetch

- [x] Update the `/current-year-summary` route loader in `client/router/routes.ts` to detect `?employeeId=<id>` search param
- [x] When `employeeId` is present, call the admin API endpoints instead of the self-service endpoints
- [x] Pass the employee name and `employeeId` through `loaderData` so the page can render a heading with the employee name
- [x] When `employeeId` is absent, preserve existing loader behaviour (fetch authenticated user's own data)
- [ ] **Validate**: `pnpm run build` passes; navigating to `/current-year-summary?employeeId=5` loads that employee's data

### Phase 3: Page Component — Admin-Aware Rendering

- [x] Update `CurrentYearSummaryPage.onRouteEnter()` to read `employeeId` from search params
- [x] When viewing another employee, display their name in the page heading (e.g., "2026 Year Summary — Jane Doe")
- [x] Use the employee name from loader data (not `localStorage.currentUser`) for the info card when `employeeId` is present
- [x] Hide or disable any self-service actions (e.g., "navigate-to-month" → Submit Time Off) when viewing another employee's data
- [ ] **Validate**: `pnpm run build` passes; page heading and info card reflect the target employee

### Phase 4: Employee List — "View" Action Button

- [x] Add a "View" button to the employee card in `client/components/employee-list/index.ts`, positioned after "View Calendar" and before "Edit"
- [x] The "View" button dispatches a `router-navigate` event to `/current-year-summary?employeeId=<id>`
- [x] Style the "View" button consistently with existing action buttons
- [ ] **Validate**: `pnpm run build` passes; clicking "View" on an employee card navigates to their year summary

### Phase 5: Testing

- [x] Add unit test for the new `getAdminEmployeePTOStatus` APIClient method
- [ ] Add unit test for the admin PTO status server endpoint (happy path + unauthorized + not found)
- [ ] Add unit test for `CurrentYearSummaryPage` rendering with `employeeId` search param
- [x] Add unit test for the "View" button in `employee-list`
- [x] Run `pnpm run build` and `pnpm run lint` — both pass
- [ ] Manual testing: navigate from Employee Management → View → verify year summary shows correct employee data
- [ ] Manual testing: verify non-admin users cannot access another employee's data via query param

### Phase 6: Documentation

- [ ] Update README.md API endpoint documentation if needed
- [ ] Update this task checklist as items are completed

## Implementation Notes

- **Server Endpoint**: The existing `GET /api/pto/status` only returns the authenticated user's data. A new admin-only endpoint `GET /api/admin/employees/:id/pto-status` should reuse `calculatePTOStatus()` but look up the target employee by ID. Apply the same `authenticate` + admin role check used by other `/api/admin/*` routes.
- **PTO Entries**: The existing `getAdminPTOEntries({ employeeId })` APIClient method already supports filtering by employee ID. Verify this returns all fields needed by the year summary page (including `date`, `type`, `hours`, `approved_by`, `createdAt`).
- **Route Loader**: The loader in `routes.ts` receives the search params from the URL. Use a conditional path: if `employeeId` param exists, call admin APIs; otherwise, call the existing self-service APIs.
- **Employee Name**: The admin API should return the employee name alongside PTO status (or the loader can fetch it via `getEmployees()` / a dedicated endpoint). The page heading and info card should reflect the target employee, not the logged-in admin.
- **Security**: The server endpoint must verify the requesting user has the `Admin` role. Non-admin requests should receive a 403 Forbidden response. The client should not expose the `employeeId` param to non-admin users.
- **Read-Only View**: When displaying another employee's data, the "navigate-to-month" event from `pto-pto-card` should either be suppressed or redirect to a read-only view rather than the Submit Time Off page.
- **Employee List Integration**: The `employee-list` component already emits `employee-edit` and `employee-delete` custom events. The "View" button can use `window.dispatchEvent(new CustomEvent('router-navigate', { detail: { path } }))` directly, consistent with how navigation events work elsewhere in the app.

## Questions and Concerns

1.
2.
3.

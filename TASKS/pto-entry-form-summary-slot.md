# PTO Entry Form Summary Slot

## Description

Add a named slot to the `pto-entry-form` web component so that a `pto-summary-card` (or any summary element) can be injected between the "form-header" and "calendar-view" sections. This lets users see their total used PTO for the year, grouped by PTO type, while filling out a new time-off request — providing immediate context about remaining balances without leaving the form.

The slot is declared inside `pto-entry-form`'s shadow DOM template; the actual `<pto-summary-card>` element is placed in light DOM via `index.html`, assigned to `slot="pto-summary"`.

## Priority

🟢 Low Priority (Frontend/UI Feature)

## Checklist

### Stage 1 — Shadow DOM Slot Declaration (pto-entry-form)

- [x] Add `<slot name="pto-summary"></slot>` to the `pto-entry-form` shadow DOM template between `.form-header` and `.calendar-view`
- [x] Add styling for the slot area (spacing, optional separator)
- [x] Verify the slot renders as empty when no light-DOM child is assigned (no visual regression)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 2 — Light DOM Composition (index.html)

- [x] Add a `<pto-summary-card slot="pto-summary">` child inside `<pto-entry-form>` in `client/index.html`
- [x] Confirm the summary card renders in the correct position between header and calendar
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] Manual visual verification

### Stage 3 — Data Wiring

- [x] Ensure the injected `pto-summary-card` receives PTO data (via the existing `pto-data-request` / `setPtoData` flow or attribute injection from the app controller)
- [x] Summary card displays total used PTO grouped by type (PTO, Sick, Bereavement, Jury Duty)
- [x] Data stays in sync when PTO entries are added/removed from the calendar
- [x] `pnpm run build` passes

### Stage 4 — Testing

- [x] Add/extend Vitest unit test: `pto-entry-form` renders slot placeholder when no child assigned
- [x] Add/extend Vitest unit test: slotted `pto-summary-card` appears in correct DOM position
- [ ] Add/extend Playwright E2E test: navigate to PTO form page, verify summary card is visible with correct data
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 5 — Documentation & Cleanup

- [x] Update this task checklist with completion status
- [ ] Update TASKS/README.md status if needed
- [ ] Manual end-to-end walkthrough of Submit Time Off page

## Implementation Notes

- **Named Slots over Component Embedding** — per the web-components-assistant skill, never create child web components inside a parent's shadow DOM template. Use `<slot name="...">` and let the consumer (`index.html`) compose children in light DOM.
- `pto-entry-form` currently extends `HTMLElement` directly (not `BaseComponent`), so the slot is added directly in the `render()` method's template string.
- The `pto-summary-card` already exists and accepts data via `.summary` and `.fullPtoEntries` setters. The app controller that handles `pto-data-request` events should also populate this card with the current year's PTO status.
- The slot element should have minimal default styling — just enough margin/padding to visually separate the header from the calendar.

## Questions and Concerns

1.
2.
3.

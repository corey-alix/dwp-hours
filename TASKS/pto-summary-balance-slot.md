# PTO Summary Balance Slot

## Description

Add a new named slot (`balance-summary`) to the `<pto-summary-card>` component so that a `<month-summary>` element can be injected at the bottom of the card to display the remaining available hours for each PTO type (PTO, Sick, Bereavement, Jury Duty) for the current year. This gives employees immediate visibility into their remaining balances when submitting time-off requests via the PTO entry form.

The `<pto-summary-card>` already renders a `<slot name="balance-summary">` placeholder (added in the existing render method). From `index.html`, a `<month-summary>` element will be slotted into that position inside the `<pto-summary-card>` that lives within the `<pto-entry-form>` on the "pto-form" page. The app controller will wire up the remaining-balance data (computed from annual allocation minus used hours per type) to the `<month-summary>` component's attributes.

The `<month-summary>` component (from the `month-summary-component.md` task) already supports displaying hour values for PTO, Sick, Bereavement, and Jury Duty via attributes (`pto-hours`, `sick-hours`, `bereavement-hours`, `jury-duty-hours`). Here, it will be repurposed to show **remaining available** hours rather than **used** hours — a presentation concern handled by the data wiring in the controller, not by the component itself.

## Priority

🟢 Low Priority (Frontend/UI Feature — extends existing slot infrastructure)

## Checklist

### Stage 1 — Slot Verification & Light DOM Composition

- [x] Verify `<slot name="balance-summary">` exists in `pto-summary-card` render output (it already appears in the current `render()` method)
- [x] Add a `<month-summary slot="balance-summary">` child inside the `<pto-summary-card>` that is nested within `<pto-entry-form>` in `client/index.html`
- [x] Add a heading or label above the `<month-summary>` to indicate "Remaining Balance" context (e.g., via a wrapper `<div>` with a heading in light DOM, or a label attribute on the month-summary)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Manual visual verification: month-summary appears at the bottom of pto-summary-card on the Submit Time Off page

### Stage 2 — Data Wiring (Controller)

- [x] In the app controller (or the PTO data flow that already populates `pto-summary-card`), compute remaining available hours per PTO type for the current year:
  - PTO: `annualAllocation + carryover - usedPTO`
  - Sick: `sickAllocation - usedSick`
  - Bereavement: `bereavementAllocation - usedBereavement`
  - Jury Duty: `juryDutyAllocation - usedJuryDuty`
- [x] Set `pto-hours`, `sick-hours`, `bereavement-hours`, `jury-duty-hours` attributes on the slotted `<month-summary>` element with the computed remaining values
- [x] Data stays in sync when PTO entries are added/removed (re-compute on data change events)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 3 — Styling

- [x] Add CSS for the slotted `<month-summary>` within `pto-summary-card` context (spacing, optional divider above the balance section)
- [x] Ensure visual consistency with the rest of the card (font sizes, colors, alignment)
- [ ] Verify light/dark theme compatibility
- [x] Follow CSS animation policy for any transitions
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 4 — Testing

- [x] Add/extend Vitest unit test: `pto-summary-card` renders `<slot name="balance-summary">` in shadow DOM
- [x] Add/extend Vitest unit test: slotted `<month-summary>` renders with correct attribute values when data is set
- [ ] Add/extend Playwright E2E test: navigate to Submit Time Off page, verify `<month-summary>` is visible inside `pto-summary-card` with correct remaining balance data
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 5 — Pending Delta Display on Form Balance Summary

- [ ] Extract the delta computation logic from `CurrentYearPtoScheduler.handleSelectionChanged()` into a shared utility function (e.g., `computeSelectionDeltas(selectedRequests, existingEntries)` in `client/components/utils/` or `shared/businessRules.ts`) that both `current-year-pto-scheduler` and the entry form can call
- [ ] Refactor `CurrentYearPtoScheduler.handleSelectionChanged()` to use the extracted utility
- [ ] In `UIManager` (or `pto-entry-form`), listen for `selection-changed` events from the entry form's `pto-calendar` and compute deltas using the shared utility
- [ ] Set the `deltas` property on the slotted `<month-summary id="form-balance-summary">` element so pending `+N`/`-N` indicators appear alongside the remaining balance values
- [ ] Clear deltas when the form is reset or PTO is submitted
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Manual visual verification: selecting dates in the entry form calendar shows pending deltas on the remaining balance summary

### Stage 6 — Documentation & Cleanup

- [x] Update `client/components/pto-summary-card/README.md` to document the `balance-summary` slot and its intended usage
- [x] Update `client/components/month-summary/README.md` to note the "remaining balance" use case
- [x] Update this task checklist with completion status
- [ ] Update TASKS/README.md status if needed
- [ ] Manual end-to-end walkthrough of Submit Time Off page confirming balance display

## Implementation Notes

- **Existing Slot**: The `pto-summary-card` `render()` method already emits `<slot name="balance-summary"></slot>` at the bottom of its template. No shadow DOM changes are needed for Stage 1 unless styling adjustments are required.
- **Month-Summary Reuse**: The `<month-summary>` component is presentation-only. It displays whatever hour values are set on its attributes. The "remaining balance" semantic is purely a matter of what data the controller computes and passes in.
- **Business Rules**: Allocation values per PTO type should come from `shared/businessRules.ts` or the employee record. Do not hardcode allocation constants in the controller — import them from the shared module.
- **No New API Endpoints**: All required data (annual allocations, used hours by type) is already available from the existing PTO data flow. The controller just needs to compute `available = allocated - used` per type.
- **Date Handling**: Use `shared/dateUtils.ts` for current-year determination. Do not use `new Date()` directly.
- **Composition Pattern**: This follows the same light-DOM slot injection pattern used by `pto-entry-form-summary-slot.md` — the `<month-summary>` lives in light DOM in `index.html` and is projected into the shadow DOM slot.
- **Pending Delta Code Reuse**: `CurrentYearPtoScheduler.handleSelectionChanged()` (lines ~103–143 of `current-year-pto-scheduler/index.ts`) contains the delta computation logic: for each selected request, it finds the matching existing entry by date, computes `delta = request.hours - existingHours`, and accumulates deltas per PTO type into a `Record<string, number>`. This exact pattern is needed for the entry form's balance summary. Extract it into a shared function with signature: `computeSelectionDeltas(selectedRequests: Array<{date: string, type: string, hours: number}>, existingEntries: Array<{date: string, type: string, hours: number}>): Record<string, number>`. Both `CurrentYearPtoScheduler` and the UIManager/entry-form delta wiring should call this function. Place it in `client/components/utils/` (component-level utility) since it's UI-layer logic, not a business rule.
- **Event Flow for Entry Form Deltas**: The `pto-entry-form` contains a `pto-calendar` in its shadow DOM. That calendar emits `selection-changed` events. The UIManager already listens to the entry form for `pto-submit` and `pto-data-request` events. Add a `selection-changed` listener (on the entry form, which should re-dispatch or bubble the calendar's event) so the UIManager can compute deltas and update the slotted `<month-summary>`'s `deltas` property. Alternatively, the entry form itself can handle the event internally and expose a `balanceDeltas` property or event.

## Questions and Concerns

1.
2.
3.

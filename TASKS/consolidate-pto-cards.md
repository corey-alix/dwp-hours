# Consolidate PTO Cards into Month-Summary + Unified Detail Card

## Description

Replace the four individual PTO card components (`<pto-pto-card>`, `<pto-sick-card>`, `<pto-bereavement-card>`, `<pto-jury-duty-card>`) in the `current-year-summary-page` with:

1. A single `<month-summary>` component that renders each PTO type's balance as "allocated−used" (e.g. `96-24`). The `month-summary` component already supports this via its `balances` property.
2. A re-purposed `<pto-pto-card>` component as a unified **PTO Schedule Detail Card** that shows a table of `| Date | PTO Type | Hours |` for **all** scheduled PTO entries (PTO, Sick, Bereavement, Jury Duty) with the existing "approved" indicator.

The three other card components (`pto-sick-card`, `pto-bereavement-card`, `pto-jury-duty-card`) will be removed from the application entirely.

## Priority

🟢 Low Priority (Frontend/UI Feature — polish & consolidation)

## Checklist

### Stage 1: Re-purpose `<pto-pto-card>` as Unified Detail Card

- [x] Rename the card's title from "PTO" to "Scheduled Time Off" (or similar)
- [x] Accept **all** PTO entries (all types) instead of only "PTO"-type entries
- [x] Render a table with columns: **Date**, **PTO Type**, **Hours** (hours color-coded by PTO type)
- [x] Show an "approved" indicator per row (green checkmark or CSS class as today)
- [x] Keep existing clickable-date → `navigate-to-month` event behavior
- [x] Keep existing expand/collapse "Show Details" toggle
- [x] Remove the "Allowed / Used / Remaining" summary rows (month-summary handles that now)
- [x] Update `pto-pto-card` tests (`test.ts`, `test.html`) to cover multi-type entries
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] Manual visual verification in `test.html`

### Stage 2: Wire `<month-summary>` Balances in `current-year-summary-page`

- [x] Replace the four `<pto-*-card>` elements in the page's `render()` with one `<month-summary>` and one `<pto-pto-card>`
- [x] In `populateCards()`, set `month-summary.balances` from the status buckets (allocated per type)
- [x] In `populateCards()`, set `month-summary` hours attributes from usage totals per type
- [x] Pass **all** year entries to the re-purposed `<pto-pto-card>` (no type filter)
- [x] Remove imports for `PtoSickCard`, `PtoBereavementCard`, `PtoJuryDutyCard`
- [x] Remove `buildUsageEntries` per-type calls for the deleted cards
- [x] Update `setupCardListeners()` — only listen on the single `<pto-pto-card>`
- [x] Update `current-year-summary-page` tests (`test.ts`, `test.html`)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] Manual visual verification of summary page

### Stage 3: Remove Unused PTO Card Components

- [x] Delete `client/components/pto-sick-card/` folder
- [x] Delete `client/components/pto-bereavement-card/` folder
- [x] Delete `client/components/pto-jury-duty-card/` folder
- [x] Remove their `customElements.define` registrations / imports from any barrel files
- [x] Remove references from any other pages or components
- [x] Remove shared helpers in `utils/pto-card-helpers.ts` if no longer used (or trim unused functions)
- [x] Remove `utils/pto-card-css.ts` if no longer used (or trim)
- [x] Search codebase for remaining references to the deleted tags
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 4: Update Documentation & Tests

- [x] Update `pto-pto-card/README.md` to reflect new "unified detail card" purpose
- [x] Update `month-summary/README.md` if new usage patterns apply
- [x] Run full E2E test suite (`pnpm run test:e2e`) — fix any failures
- [x] Run unit test suite (`pnpm run test`) — fix any failures
- [x] Final manual smoke test of current-year-summary-page
- [x] Update this task checklist with completion status

## Implementation Notes

- The `month-summary` component already supports `balances` property which renders "available−scheduled" format. Wire the PTO status buckets' `allowed` values as balances and `used` values as the hours attributes.
- The re-purposed `<pto-pto-card>` should sort entries in **reverse chronological** order across all types, not group by type.
- Color-code the hours column per PTO type using the existing color tokens (`--color-pto-vacation`, `--color-pto-sick`, `--color-pto-bereavement`, `--color-pto-jury-duty`).
- The `renderBucketBody` helper in `utils/pto-card-helpers.ts` renders "Allowed / Used / Remaining" rows — this is no longer needed in the card since `month-summary` handles balances. Replace with a simple table/list rendering.
- The `renderUsageList` helper already renders clickable dates with approval indicators — adapt it to include a "Type" column.
- The `CARD_CSS` in `utils/pto-card-css.ts` may need updates for the new table layout, or can be inlined in the card's own styles.
- Consider keeping the `navigate-to-month` event on clickable dates so users can still jump to the calendar.

## Questions and Concerns

1. Flat reverse-chronological list. Color-code the hours value to indicate the PTO type (reuse the existing PTO-type color tokens: `--color-pto-vacation`, `--color-pto-sick`, `--color-pto-bereavement`, `--color-pto-jury-duty`).
2. Render `<totalAllocated> - <totalScheduled>` (e.g. `96-24`). This is consistent with the `admin-review-month-summary-integration` task, which is fully implemented — the `month-summary` component's `balances` property already produces this format.
3. Delete the folders outright — no archiving.

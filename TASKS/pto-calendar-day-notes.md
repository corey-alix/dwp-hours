# PTO Calendar Day Notes & Custom Hours

## Description

Extend the `<pto-calendar>` component to allow employees to add notes to individual days and specify custom hour values beyond the current 0/4/8 cycle. This enables two critical workflows:

1. **Day notes** — employees can attach a textual note to any calendar day (e.g., "Worked from home to make up Monday PTO").
2. **Custom hours on noted days** — when adding a note, the employee can enter an arbitrary numeric value (including fractional hours like 2.5).
3. **Weekend/non-working-day entries with negative hours** — employees who work weekends to compensate for PTO can add notes on non-working days and specify negative hours (credits).

### Interaction Design

- **Mouse/pointer devices**: When an editable day cell is focused/selected, a small **note icon placeholder** appears in the upper-left corner of the cell. Clicking the icon opens a dialog to edit/add the note and specify a custom hour value.
- **Touch devices**: A **long-press** (≥500 ms) on an editable day cell opens the same note/hours dialog.
- **The dialog** contains:
  - A text input/textarea for the note content
  - A numeric input for custom hours (prefilled with the current selection or existing entry hours)
  - Save and Cancel buttons
- The existing click-to-cycle (8 → 4 → 0) behavior remains unchanged for quick entry; the note dialog is an alternative path for more detailed entries.

## Priority

🟡 Medium Priority

This feature is a core usability improvement that directly supports employee workflows (weekend make-up time) and auditing (notes on PTO days). It builds on the existing calendar component and PTO entry system without requiring foundation changes.

## Checklist

### Phase 1: Note Dialog Component

- [x] Create `<day-note-dialog>` web component in `client/components/day-note-dialog/`
  - [x] Dialog UI: note textarea (cols="60" rows="5"), hours numeric input, Save/Cancel buttons
  - [x] Accept `date`, `currentNote`, `currentHours` as properties
  - [x] Dispatch `day-note-save` custom event with `{ date, note, hours }` detail
  - [x] Dispatch `day-note-cancel` custom event on cancel/close
  - [x] Support keyboard: Escape to close, Enter in hours field to save
  - [x] Add CSS in `day-note-dialog/css.ts` following project token conventions
  - [x] Accessibility: focus trap inside dialog, ARIA roles
  - [x] Hours input defaults to current value (0, 4, or 8 from cycle); if user does not change it, original value is preserved
- [x] Write Vitest unit tests for the dialog component
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Phase 2: Calendar Integration — Mouse/Pointer

- [x] Add note-icon placeholder element to editable day cells (visible on hover/focus)
  - [x] Icon appears in upper-left corner (same position as existing `note-indicator` for read-only)
  - [x] Only shown when cell is in editable mode (`readonly="false"`)
- [x] Clicking the note icon opens `<day-note-dialog>` for that date
  - [x] Pre-populate dialog with existing entry's note and hours (if any)
  - [x] Pre-populate with selected hours from `_selectedCells` (if any)
- [x] Handle `day-note-save` event:
  - [x] Update `_selectedCells` with the custom hours value
  - [x] Store note text in a new `_selectedNotes: Map<string, string>` view-model
  - [x] Show note indicator on the cell after note is saved
  - [x] Dispatch `selection-changed` event
- [x] Handle `day-note-cancel`: close dialog, no changes
- [x] Update `getSelectedRequests()` to include notes in returned `CalendarEntry` objects
- [x] Write Vitest unit tests for note-icon interaction
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Phase 3: Calendar Integration — Touch/Long-Press

- [x] Implement long-press detection on editable day cells
  - [x] Long-press duration constant defined in `client/css-extensions/` (e.g., `LONG_PRESS_MS`) alongside other interaction constants
  - [x] Use `pointerdown`/`pointerup` timing (not `touchstart`/`touchend`) for cross-device support
  - [x] Cancel long-press if pointer moves beyond a small threshold (prevent accidental triggers during scroll)
  - [x] Prevent default context menu on long-press
- [x] Long-press opens `<day-note-dialog>` for the pressed date
- [x] Ensure short taps still trigger the existing hour-cycle behavior
- [ ] Write Vitest unit tests for long-press detection
- [ ] Manual testing on touch viewport (Chrome DevTools device emulation)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Phase 4: Weekend/Non-Working Day Support

- [x] Make non-working day cells interactive when a note is being added
  - [x] Weekend cells gain `clickable` class only via note-icon or long-press path (not regular click-cycle)
  - [x] Long-press on weekend cells opens the note dialog
  - [x] On pointer devices, show note-icon on weekend cells on hover when in edit mode
- [x] Allow negative hours in the dialog's numeric input for non-working days
  - [x] Validate: negative hours only permitted on non-working days (use `isWorkingDay()` from `shared/businessRules.ts`)
  - [x] Show validation error in dialog if negative hours entered on a working day
- [x] Update `renderDayCell()` to show credit styling for negative-hour selections (existing `.credit` class)
- [x] Weekend cells remain non-navigable via keyboard (no arrow-key access) to prevent accidental weekend PTO
- [x] Write Vitest unit tests for negative-hour validation
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Phase 5: API & Data Layer Integration

- [x] Update `CalendarEntry` interface to include optional `notes?: string` field
- [x] Ensure `pto-request-submit` event detail includes notes for each entry
- [x] Update `pto-entry-form` (or consuming controller) to pass notes to API when submitting PTO requests
- [x] Verify API endpoint (`POST /api/pto`) already supports `notes` field (schema has `notes TEXT` column)
- [ ] Round-trip test: submit entry with note → reload → note appears in calendar
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Phase 6: Testing & Quality Gates

- [x] Update `tests/components/pto-calendar.test.ts` with scenarios:
  - [x] Note icon appears on editable day cells
  - [x] Dialog opens/closes correctly (tested via day-note-dialog.test.ts)
  - [x] Custom hours saved to selection (tested via day-note-dialog.test.ts)
  - [ ] Weekend long-press opens dialog (requires manual testing)
  - [x] Negative hours only on non-working days
  - [x] Notes included in `getSelectedRequests()` output
- [x] Create `tests/components/day-note-dialog.test.ts` with 16 unit tests
- [ ] E2E test: employee adds note with custom hours and submits
- [ ] E2E test: employee adds weekend make-up hours with note
- [ ] Manual testing of dialog on desktop (mouse) and mobile viewport (touch emulation)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] `pnpm run lint:css` passes

### Phase 7: Documentation

- [ ] Update `client/components/pto-calendar/README.md` with:
  - [ ] New note-icon interaction description
  - [ ] Long-press behavior documentation
  - [ ] Updated `CalendarEntry` interface with `notes` field
  - [ ] Updated public API table (new `_selectedNotes` / note methods)
- [x] Create `client/components/day-note-dialog/README.md`
- [ ] Update `test.html` demo page to showcase note functionality

## Implementation Notes

- **Design Constitution**: All visual decisions in this task must comply with `.github/skills/design-constitution/SKILL.md`. Key policies: **Policy 4** (TL corner is reserved for notes/annotations — confirmed correct for note icon), **Policy 2** (cell state hierarchy), **Policy 3** (44 px touch targets), **Policy 6** (interaction patterns — long-press constant in `css-extensions/`).
- The database schema already supports notes via `pto_entries.notes TEXT` column — no migration needed.
- Notes are already visible to admins via the existing monthly review view (reads `pto_entries.notes`) — no admin-side changes required.
- The existing `note-indicator` (▾ triangle) in read-only mode displays entry notes as toast on click. The new feature extends this to editable mode with add/edit capability.
- Use `pointerdown`/`pointerup` events for long-press detection rather than touch-specific events, ensuring compatibility with both mouse and touch.
- The long-press duration constant should live in `client/css-extensions/` alongside other shared interaction constants (e.g., animation durations). Export it from the facade so components can import it.
- The `<day-note-dialog>` should be a standalone web component that can be reused (e.g., admin could annotate days in the future).
- **Textarea sizing**: 60 columns × 5 rows — no character limit enforced, just a sensible input size.
- **Hours default behavior**: The dialog pre-fills with the current hours value (0, 4, or 8 from click-cycle, or existing entry hours). If the user does not modify the hours field, the original value is preserved — no forced change.
- **Weekend keyboard navigation**: Weekend cells intentionally remain non-navigable via arrow keys. This prevents accidental PTO scheduling on weekends. Weekend note entry is only possible via note-icon click or long-press (deliberate actions).
- Business rule: `validateHours()` already permits negative hours. The guard for "negative only on non-working days" should use `isWorkingDay()` from `shared/businessRules.ts`.
- Follow the CSS Animation Policy for any dialog open/close transitions (use `transform`/`opacity` only, respect `prefers-reduced-motion`).
- **Note icon placement** (Design Constitution Policy 4): The Top-Left corner is reserved for notes/annotations. The "add note" placeholder uses an outlined/ghost icon; the "has note" indicator uses a filled icon. Both occupy TL — never place note icons in other corners.

## Questions and Concerns

1. ~~Should the note dialog enforce a maximum character limit on notes?~~ **Resolved**: No limit enforced. Textarea sized to 60×5 (cols×rows).
2. ~~Should notes be visible to admins in the monthly review view?~~ **Resolved**: Already visible — notes map to `pto_entries.notes` which admins can already review.
3. ~~Should the long-press duration be configurable?~~ **Resolved**: Define as a constant in `client/css-extensions/` alongside other interaction constants.
4. ~~Should existing hours be preserved when note is added without hour change?~~ **Resolved**: Yes — default to current value; if user doesn't change it, value is preserved.
5. ~~Should weekend cells be keyboard-navigable?~~ **Resolved**: No. Weekend cells remain non-navigable via arrow keys to prevent accidental weekend PTO. Only note-icon click or long-press (deliberate actions) can open the dialog on weekends.

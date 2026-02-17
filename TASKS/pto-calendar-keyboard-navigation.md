# PTO Calendar Keyboard Navigation

## Description

Enhance the PTO calendar component to support keyboard navigation for scheduling PTO, allowing users to tab through every day of the current month when in edit mode. Update the test.html page to enable editing, month changing, edit/view mode toggling, and keyboard navigation for manual testing.

## Priority

🟢 Low Priority

## Checklist

- [x] **Stage 1: Enable Edit Mode Toggle in test.html**
  - Add UI controls to toggle between view and edit modes
  - Ensure edit mode enables PTO scheduling interactions
  - Validation: Manual test that toggle works and changes calendar behavior

- [x] **Stage 2: Enable Month Navigation in test.html**
  - Add controls to change months in the calendar
  - Ensure navigation updates the displayed month correctly
  - Validation: Manual test month changing, build passes, lint passes

- [x] **Stage 3: Implement Keyboard Navigation**
  - Add `tabindex` HTML attributes with roving tabindex pattern (one element has `tabindex="0"`, others `tabindex="-1"`)
  - Add `:focus-visible` styles for visible focus indicators on days and legend items
  - Implement focus restoration after re-render (track focused element by `data-date`/`data-type`, restore after `render()`)
  - Arrow key navigation within calendar grid (Left/Right/Up/Down, skipping weekends and non-current-month days)
  - Arrow key navigation within legend items (Left/Right/Up/Down to cycle through PTO types)
  - Enter/Space to toggle day selection and PTO type selection
  - Tab flow: legend group (single tab stop) → calendar grid (single tab stop) → hours editor (when visible) → submit button
  - Replace per-cell hours inputs with single floating hours editor panel
  - Skip weekend days during keyboard navigation
  - test.html renders seed data and starts in edit mode
  - Validation: build passes, lint passes, all unit tests pass

- [ ] **Stage 4: Testing and Validation**
  - Write unit tests for keyboard navigation logic
  - Add E2E tests for keyboard-only PTO scheduling workflow
  - Manual testing of full keyboard-only workflow (select type → select days → adjust hours → submit)
  - Verify focus indicator visibility
  - Code review, build and lint pass
  - Update documentation

## Implementation Notes

- Use the web-components-assistant skill for component modifications
- Follow keyboard accessibility best practices (focus management, ARIA if needed)
- Ensure compatibility with existing PTO scheduling logic
- Test with various calendar states (different months, holidays)

## Current Understanding

The goal is to allow a keyboard-only user (no mouse, no touchscreen) to fully schedule PTO using the `pto-calendar` component. The workflow a keyboard user accomplishes:

1. **Select a PTO type** — Tab into the legend area, use Arrow keys to move between PTO types, press Enter/Space to select.
2. **Navigate calendar days** — Tab into the calendar grid, use Arrow keys (Left/Right/Up/Down) to move between weekday cells.
3. **Toggle day selection** — Press Enter/Space on a day to select/deselect it for PTO scheduling.
4. **Adjust hours** — When a day is selected, a floating hours editor appears below the grid. Tab into it, select hours (4 or 8), and press Enter or click OK.
5. **Submit** — Tab to the submit button and press Enter.

### Implementation Details

- **Roving tabindex**: Both the legend and grid act as single tab stops. Within each group, arrow keys move focus. Only one element per group has `tabindex="0"`; the rest have `tabindex="-1"`.
- **Weekend skipping**: Weekend cells are not `.clickable` and have no `tabindex`, so they are unreachable via both Tab and arrow keys.
- **Focus restoration**: Before each `render()`, the component saves which area had focus (legend or grid) and which specific element (by `data-date` or legend index). After `innerHTML` replacement, focus is restored to the corresponding new element.
- **Single hours editor**: Instead of per-cell `<input>` elements, a single `<select>` dropdown with OK/Cancel buttons appears below the grid when a day is selected. Enter accepts, Escape cancels.
- **ARIA attributes**: Grid cells have `role="gridcell"`, legend has `role="listbox"`, legend items have `role="option"` with `aria-selected`.

### Issues Found and Resolved

All issues from the prior implementation have been fixed:

1. ~~`tabindex` in CSS~~ → Removed invalid CSS property, added proper HTML `tabindex` attributes
2. ~~Tab key trapped~~ → Replaced Tab navigation with arrow key navigation; Tab now moves between widget groups
3. ~~Legend items not focusable~~ → Added `tabindex` with roving tabindex pattern
4. ~~Day cells not focusable~~ → Added `tabindex` with roving tabindex pattern
5. ~~Focus destroyed on re-render~~ → Implemented `restoreFocus()` using `lastFocusArea` and `focusedDate`/`focusedLegendIndex`
6. ~~No visible focus indicator~~ → Added `:focus-visible` styles with outline and box-shadow
7. ~~Arrow key navigation not supported~~ → Implemented full arrow key navigation for both grid and legend

## Questions and Concerns

1. **Tab vs. Arrow key navigation** — **RESOLVED**: Use WAI-ARIA grid pattern. Arrow keys navigate within the calendar grid and legend group. Tab moves between groups (legend → grid → hours editor → submit).

2. **Focus restoration after re-render** — **RESOLVED**: Implemented focus restoration by saving `lastFocusArea` (legend/grid), `focusedDate`, and `focusedLegendIndex` before render, then restoring focus to the matching element after innerHTML replacement. For a general solution, `BaseComponent.renderTemplate()` already preserves focus by element ID and cursor position. The remaining concern is that full innerHTML replacement is inherently destructive to input state (selection, scroll position); a DOM diffing approach would be the ultimate general solution but is out of scope for now.

3. **PTO type selection order** — **RESOLVED**: Leave as-is. PTO type must be selected before days can be toggled. Legend items also use arrow keys for navigation.

4. **Hours input navigation** — **RESOLVED**: Replaced per-cell `<input>` elements with a single floating hours editor panel (a `<select>` with OK/Cancel buttons) that appears below the grid when a day is selected. This avoids the input-inside-cell focus management problem entirely.

5. **Scope of edit mode** — **RESOLVED**: Edit mode toggle is for testing only. Users never toggle it in production. The test.html now starts in edit mode.

6. **Weekend days** — **RESOLVED**: Weekend cells are skipped during keyboard navigation. They are not rendered with `.clickable` class or `tabindex`, making them unreachable via both Tab and arrow keys.

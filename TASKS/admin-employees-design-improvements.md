# Admin Employees Design Improvements

## Description

Address design and usability issues identified during a design review of the Admin Employees page (`/admin/employees`). The page displays employee cards with PTO rates, carryover hours, and per-employee balance summaries, plus search/filter and CRUD operations. Issues target inconsistent heading patterns, missing balance context labels, CSS performance anti-patterns, missing accessibility features, layout inconsistencies compared to recently improved pages, unused CSS selectors, and role badge omission.

## Priority

🟢 Low Priority — Visual polish and consistency. The page functions correctly (employee CRUD, inline editing, balance summaries, search/filter all work) but has UX and code quality issues compared to the recently improved `/admin/pto-requests`, `/current-year-summary`, and `/prior-year-summary` pages. No business logic changes required.

## Design Review Findings

Screenshot and shadow DOM captured via `pnpm screenshot /admin/employees admin@example.com`. Key observations:

1. **Duplicate/inconsistent page heading** — The page template renders `<p class="capitalize">Review and Modify Employee PTO Rates and Carry Over hours</p>` using a `<p>` element. The `/admin/pto-requests` and `/current-year-summary` pages use a `<h2 class="page-heading">` pattern with design tokens. This page should follow the same pattern.
2. **Semantic heading violation** — A `<p>` element is used for what is functionally a page heading. Should be `<h2>` for proper heading hierarchy.
3. **Balance summaries lack context label** — Each employee card has a slotted `<month-summary>` showing PTO/Sick/Bereavement/Jury Duty balance values with "avail" sub-labels, but there's no heading like "Available Balance" to explain what the numbers represent. The submit-time-off and admin-pto-requests pages established a `<div class="balance-heading">` pattern — this page should follow suit.
4. **`transition: all` performance anti-pattern** — The `.action-btn` CSS in `employee-list/css.ts` uses `transition: all 0.3s ease` which animates all properties (including layout-triggering ones). Should transition only specific properties (`background-color`, `color`, `border-color`). The `.employee-card` also uses `transition: box-shadow 0.3s ease` which is already specific — good.
5. **No `prefers-reduced-motion` support** — The card hover and button transitions don't include a `@media (prefers-reduced-motion: reduce)` fallback. The project's CSS Animation Policy requires honoring reduced motion preferences.
6. **Unused CSS selectors** — `.employee-header`, `.employee-name`, `.employee-role`, `.action-buttons`, `.btn`, `.btn-primary` are defined in `employee-list/css.ts` but not used in the rendered template. The card template uses `.employee-details` directly without a `.employee-header` wrapper. This dead CSS should be removed.
7. **Employee role not displayed on card** — The CSS defines `.employee-role` styles (pill badge) but the card template doesn't render the employee's role anywhere. Admin vs Employee distinction is invisible. The role should be shown as a badge in the card header.
8. **Card layout not mobile-first** — The `.employee-grid` uses `grid-template-columns: repeat(auto-fill, minmax(18em, 1fr))`. Other pages have been migrated to mobile-first CSS with `grid-template-columns: 1fr` by default and `@media (min-width: 768px)` breakpoints (Implementation Learning #8). Cards should default to single-column on mobile.
9. **"Acknowledge" button is unnecessary** — The "Acknowledge" button duplicates the monthly review feature at `/admin/monthly-review`. It should be removed to reduce action bar clutter.
10. **No delete confirmation differentiation** — The delete action uses a confirmation dialog (good).
11. **CSS fallback values in page css.ts** — The page's `css.ts` uses hardcoded fallback values like `var(--space-md, 16px)` and `var(--color-primary, #007bff)`. Other pages have removed fallbacks since the design token system is established. These should be cleaned up for consistency.
12. **month-summary margin uses `1em` instead of design token** — The `month-summary { margin-bottom: 1em; }` rule in the page's `css.ts` should use `var(--space-md)` instead of a hardcoded `1em` value.
13. **Add-Employee form renders at top of page instead of near button** — When clicking the "Add Employee" button at the bottom of the page, the `<employee-form>` appears above the `<employee-list>` at the top, forcing the user to scroll up. The form should render just above the "Add Employee" button so the user stays in context.

## Checklist

### Stage 1: Fix Page Heading and Semantic Hierarchy

The page uses a `<p>` element for its heading. Consolidate to the project's standard `<h2 class="page-heading">` pattern.

- [x] Replace `<p class="capitalize">Review and Modify Employee PTO Rates and Carry Over hours</p>` with `<h2 class="page-heading">Employee Management</h2>` in the page template
- [x] Add `.page-heading` styles to the page's `css.ts` file (matching pattern: centered, `var(--font-size-xl)`, `var(--font-weight-semibold)`)
- [x] Remove the now-redundant `.capitalize` class usage
- [x] Clean up CSS fallback values — remove hardcoded fallbacks like `16px`, `#007bff`, `#333`, `4px`, `8px`, `1rem` from `css.ts`
- [x] Replace `margin-bottom: 1em` on `month-summary` with `margin-bottom: var(--space-md)`
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 2: Add Balance Context Labels

The balance summaries need heading labels to explain what the numbers mean (Implementation Learning #1).

- [x] Add a `<div class="balance-heading">Available Balance</div>` label above each slotted `<month-summary>` element in the page template (sibling div wrapping approach, matching admin-pto-requests pattern)
- [x] Style the balance heading using existing design tokens (matching the pattern from submit-time-off and admin-pto-requests pages)
- [x] Ensure the label is visible on mobile viewports
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 3: Add Employee Role Badge to Cards

The role (Admin/Employee) is stored but not displayed. Show it as a pill badge on each card.

- [x] Add a role badge element to the card template in `renderEmployeeCard()` — use the existing `.employee-role` CSS class (already defined, just unused)
- [x] Position the role badge in a card header row alongside the employee name
- [x] Use distinct colors for Admin vs Employee roles (e.g., Admin uses `--color-primary`, Employee uses `--color-text-secondary` or a neutral badge)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 4: Fix CSS Transitions and Add Reduced Motion Support

The CSS has performance anti-patterns and missing accessibility features.

- [x] Replace `transition: all 0.3s ease` on `.action-btn` with `transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease` (animate only properties that change on hover)
- [x] Add `@media (prefers-reduced-motion: reduce)` block to disable/reduce transitions on `.action-btn`, `.employee-card`, `.btn`, and any other animated elements
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] `pnpm run lint:css` passes

### Stage 5: Remove Unused CSS Selectors

Dead CSS adds maintenance burden and confusion. Clean up selectors not used in templates.

- [x] Remove `.employee-header` (not used in card template — card uses `.employee-details` directly)
- [x] Remove `.employee-name` (card uses `.detail-value.employee-identifier` for the name, not `.employee-name`)
- [x] Remove `.action-buttons` (not used in any template)
- [x] Remove `.btn` and `.btn-primary` if not used in any template (the toolbar uses `.action-btn` classes instead)
- [x] Verify each removal by grep-searching for the class name in `employee-list/index.ts` and any test files
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 6: Switch to Mobile-First Card Layout

The card layout should follow the project's mobile-first CSS pattern (Implementation Learning #8).

- [x] Replace `.employee-grid` `grid-template-columns: repeat(auto-fill, minmax(18em, 1fr))` with `grid-template-columns: 1fr` (single column on mobile)
- [x] Add `@media (min-width: 768px)` breakpoint with multi-column grid layout (e.g., `repeat(auto-fill, minmax(18em, 1fr))`)
- [x] Verify card rendering at 375px viewport width
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 7: Remove "Acknowledge" Button

The "Acknowledge" button on employee cards is unclear and not needed — monthly acknowledgment is handled on `/admin/monthly-review`.

- [x] Remove the "Acknowledge" button from `renderEmployeeCard()` in `employee-list/index.ts`
- [x] Remove the `.action-btn.acknowledge` and `.action-btn.acknowledge:hover` CSS rules from `employee-list/css.ts`
- [x] Remove the `employee-acknowledge` event handler in `admin-employees-page/index.ts` if one exists, or verify no handler is wired up
- [x] Update Vitest tests if they reference the Acknowledge button
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 8: Increase Edit/Delete Button Size

The Edit and Delete action buttons on employee cards are too small for comfortable interaction, especially on touch devices. They should meet the WCAG minimum touch target size of 44×44px.

- [x] Increase `.action-btn` padding from `var(--space-xs) var(--space-sm)` to `var(--space-sm) var(--space-md)` in `employee-list/css.ts`
- [x] Increase `.action-btn` font-size from `var(--font-size-xs)` to `var(--font-size-sm)`
- [x] Add `min-height: 44px` and `min-width: 44px` to `.action-btn` for WCAG touch target compliance
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 9: Animate Inline Editor Reveal

When clicking "Edit", the inline editor appears instantly. It should use a slide-down animation following the CSS Animation Assistant rules: hardware-accelerated properties only (`transform`, `opacity`), decelerate easing on open, `prefers-reduced-motion` support.

- [x] Import `adoptAnimations` from `css-extensions/animations` in `employee-list/index.ts`
- [x] Call `adoptAnimations(this.shadowRoot)` in the employee-list's `connectedCallback` (or equivalent setup)
- [x] Add the `anim-slide-down-in` utility class to the `.inline-editor` element in `renderInlineEditor()`
- [x] The existing animation CSS already includes `@media (prefers-reduced-motion: reduce)` support — verify no extra work needed
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 10: Fix Enter/Escape Keyboard Shortcuts in Employee Form

Pressing Enter while focused on any input in the "Edit Employee" form should trigger the "Update Employee" button. Pressing Escape should trigger "Cancel". The current `handleDelegatedKeydown` in `employee-form/index.ts` has an early return for `HTMLInputElement` that prevents Enter from submitting.

- [x] Fix `handleDelegatedKeydown` in `employee-form/index.ts`: when Enter is pressed on an `HTMLInputElement`, prevent default and click the submit button instead of returning early
- [x] Verify Escape handling already works correctly (code review shows it does)
- [ ] Update Vitest tests to cover Enter-to-submit and Escape-to-cancel keyboard shortcuts
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 11: Replace Delete Confirmation Dialog with Long-Press

The delete button currently shows a `<confirmation-dialog>`. Replace it with a long-press (press-and-hold ~1.5s) gesture that provides visual feedback during the hold, and auto-executes deletion on completion. No confirmation dialog.

- [x] Remove the `confirmation-dialog` creation from `handleDeleteEmployee` in `admin-employees-page/index.ts`
- [x] Implement long-press detection in `employee-list/index.ts` using `pointerdown`/`pointerup`/`pointerleave` events on `.action-btn.delete`
- [x] Add a CSS `@keyframes delete-fill` animation on the delete button that fills the background from left to right over 1.5s, triggered on pointerdown
- [x] Cancel the animation and timer if the pointer is released or leaves the button before 1.5s
- [x] On successful long-press completion, dispatch the `employee-delete` custom event (same as current click behavior)
- [x] Remove the single-click delete dispatch from `handleDelegatedClick` for the delete action
- [x] Add `prefers-reduced-motion` support: when reduced motion is preferred, use a numeric countdown or opacity change instead of the fill animation
- [x] Animate only `transform`, `opacity`, or `background` (use a pseudo-element `::after` with `transform: scaleX()` for the fill effect — GPU-accelerated)
- [ ] Update Vitest tests for the long-press behavior
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 12: Skip Auto-Focus on Mobile to Prevent Keyboard Pop-Up

When the inline editor opens on mobile, `connectedCallback` immediately focuses the "Full Name" input, which triggers the on-screen keyboard. On mobile viewports the user should tap the field they want — auto-focus should only apply on desktop.

- [x] Guard `focusFirstField()` in `employee-form/index.ts` with a viewport-width check (e.g., `window.innerWidth >= 768`) or `window.matchMedia('(pointer: fine)')` so it only fires on non-touch/desktop devices
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 13: Animate Card-to-Editor Transition on Mobile

When clicking "Edit" on mobile, the full `innerHTML` re-render resets the `.employee-grid` scroll position to 0, causing the card to vanish and the page to jump to the top while the editor appears off-screen below. The card should fade out in-place, then the editor should fade in at the same scroll position.

Root cause: `BaseComponent.renderTemplate()` replaces all shadow DOM content via `innerHTML`, which destroys the scroll container and resets scroll to 0. On desktop multi-column this is less noticeable but on mobile single-column it's jarring.

- [x] In `employee-list/index.ts`, override `attributeChangedCallback` for `editing-employee-id`: when transitioning from card → editor (null → value), run an animated transition instead of calling `requestUpdate()` immediately
- [x] Phase 1 — Fade out the target card: apply inline `opacity: 0` transition (accelerate easing, `--duration-normal`) on the `.employee-card[data-employee-id]` element
- [x] Phase 2 — On transition completion: capture `.employee-grid` `scrollTop`, call `requestUpdate()`, restore `scrollTop` synchronously (no `requestAnimationFrame`), do NOT call `scrollIntoView`
- [x] Follow CSS Animation Assistant lessons: filter `transitionend` by `e.propertyName === 'opacity'`, add `setTimeout` fallback (300ms), deduplicate completion logic, clean up inline styles
- [x] Respect `prefers-reduced-motion`: skip animation, just re-render with scroll preservation
- [x] Change inline editor class from `anim-slide-down-in` to `anim-fade-in` — fade matches the crossfade intent better than slide-down on mobile
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Current solution (v3)**: `transitionCardToEditor()` captures the card's screen position (`card.getBoundingClientRect().top`) before the fade-out animation. After the fade completes, `renderEditorInPlace()` does a synchronous `requestUpdate()` (innerHTML replacement), then reads the editor's screen position (`editor.getBoundingClientRect().top`) and calls `window.scrollBy(0, drift)` to eliminate the position difference. This works because `getBoundingClientRect()` forces a synchronous layout before the browser paints, so the scroll adjustment is invisible. Verified via Playwright E2E test (`e2e/employee-edit-scroll.spec.ts`): position drift is <1px.

**Previous issues resolved**:

- v1: Used `requestAnimationFrame` + `scrollIntoView` → caused two-step scroll (flash at top, then smooth scroll to editor)
- v2: Restored old `grid.scrollTop` synchronously without `scrollIntoView` → grid.scrollTop was always 0 because the grid is NOT a scroll container (scrollHeight === clientHeight). The `overflow-y: auto` on `.employee-grid` never activates because the flex/height chain doesn't constrain the grid height — it grows freely with content. Manipulating grid.scrollTop was a no-op.
- v2.5: Used `grid.scrollTop = editor.offsetTop - cardVisualOffset` with grid-relative offsets → same root cause as v2 (grid doesn't scroll), so this was also a no-op. The editor drifted 450px from the card position.

**Root cause discovery**: The `.employee-grid` has `overflow-y: auto` and `flex: 1`, but its parent chain (`:host { height: 100% }` → `<employee-list>` → `<admin-employees-page>` → `<main id="router-outlet">`) doesn't establish a fixed-height constraint. The `100%` height cascades up to an unconstrained parent, so the grid grows freely. The actual scroll container is the **document body/window**, not the grid. E2E test confirmed: `scrollHeight === clientHeight` on the grid (always 0 scroll).

### Stage 14: Move Add-Employee Form Next to Add Button

When clicking "Add Employee" at the bottom of the page, the `<employee-form>` renders above the `<employee-list>`, forcing the user to scroll back to the top to fill it in. The form should appear just above the "Add Employee" button so the user stays in context.

Root cause: In `admin-employees-page/index.ts` `render()`, the `${this._showForm ? "<employee-form></employee-form>" : ""}` block is positioned before `<employee-list>` in the template. The "Add Employee" button is in a `.toolbar` div after `<employee-list>`.

- [x] Move the `<employee-form>` block in `render()` from above `<employee-list>` to just above the `.toolbar` div (between `</employee-list>` and `<div class="toolbar">`)
- [x] After `requestUpdate()` in the add-employee click handler, scroll the form into view so it's visible without manual scrolling (e.g., query `employee-form` in shadow DOM and call `scrollIntoView({ behavior: 'smooth', block: 'nearest' })`)
- [x] Respect `prefers-reduced-motion`: use `behavior: 'auto'` instead of `'smooth'` when reduced motion is preferred
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

## Implementation Notes

- Page component: [client/pages/admin-employees-page/index.ts](../client/pages/admin-employees-page/index.ts) (324 lines)
- Page CSS: [client/pages/admin-employees-page/css.ts](../client/pages/admin-employees-page/css.ts) (35 lines — minimal, uses hardcoded fallbacks)
- List component: [client/components/employee-list/index.ts](../client/components/employee-list/index.ts) (200 lines)
- List CSS: [client/components/employee-list/css.ts](../client/components/employee-list/css.ts) (216 lines — has unused selectors)
- Form component: [client/components/employee-form/index.ts](../client/components/employee-form/index.ts)
- Existing Vitest tests: [tests/components/employee-list.test.ts](../tests/components/employee-list.test.ts)
- Balance hydration: already implemented in page component — uses `BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS` for limits
- Follow existing design token patterns from `tokens.css` for any new color/spacing values
- All CSS changes must use `rgb()` with alpha percentages, not `rgba()`
- Use `pnpm screenshot /admin/employees admin@example.com` to capture screenshots for visual verification
- The balance heading pattern was established in the submit-time-off page — reuse the same approach (sibling `<div class="balance-heading">` above `<month-summary>`)

## Implementation Learnings (from prior pages)

1. **Balance heading added as sibling div, not inside `<month-summary>`** — The "Available Balance" label should be added as a `<div class="balance-heading">` above `<month-summary>` in the page template, rather than modifying the `month-summary` component. This keeps `month-summary` generic and reusable.
2. **Day cell min-size change is global** — Any shared component CSS changes affect ALL consumers. Be cautious with `employee-list` style changes if the component is used elsewhere.
3. **Generic screenshot utility** — Use `pnpm screenshot <route> [user] [component]` to capture any page. Output goes to `/tmp/<slug>.png` and `/tmp/<slug>-shadow.html`.
4. **PTO type color tokens already exist in `tokens.css`** — `--color-pto-vacation`, `--color-pto-sick`, `--color-pto-bereavement`, `--color-pto-jury-duty` are defined for both light and dark themes.
5. **Dead code removal was safe** — Unused CSS selectors (`.employee-header`, `.employee-name`, `.employee-role`) are defined but never referenced in the template. Removing them has no behavioral impact — confirm with grep first.
6. **Toggle state persistence via `localStorage`** — Reuse pattern from `pto-pto-card` if adding collapsible sections.
7. **Mobile-first card layout** — Use `grid-template-columns: 1fr` by default, with `@media (min-width: 768px)` breakpoint for multi-column. Do NOT use `max-width` media queries.
8. **CSS fallback cleanup** — The `css.ts` file uses `var(--token, fallback)` pattern throughout, but the design token system is fully established. Remove fallbacks to keep CSS clean and consistent with other pages.

9. **Existing animation library supports inline-editor reveal** — `adoptAnimations` + `anim-slide-down-in` class is all that's needed. The shared animation CSS already handles `prefers-reduced-motion`. No new keyframes needed.
10. **Employee form already has keyboard handlers** — `handleDelegatedKeydown` in `employee-form/index.ts` already handles Enter and Escape, but the Enter handler has a bug: it returns early when `e.target instanceof HTMLInputElement`, thinking native form submission will handle it. Since the buttons are `type="button"` (not `type="submit"`), native submission never fires. Fix: remove the early return and always trigger the submit button click on Enter.
11. **Long-press pattern uses pointer events** — `pointerdown`/`pointerup`/`pointerleave` provide unified mouse+touch handling. Use a `setTimeout` for the 1.5s hold duration, clear it on up/leave. The CSS fill effect uses `::after` pseudo-element with `transform: scaleX(0→1)` for GPU acceleration per the animation policy.
12. **WCAG touch target minimum** — 44×44px minimum for interactive elements. The current `space-xs` + `space-sm` padding on action buttons is below this threshold.
13. **Skip auto-focus on mobile** — `window.matchMedia("(pointer: fine)")` distinguishes mouse/trackpad (desktop) from touch (mobile). Auto-focusing an input on mobile opens the on-screen keyboard immediately, which is disruptive. Only auto-focus on `pointer: fine` devices.
14. **innerHTML re-render resets scroll — use screen coordinates, not container scroll** — `BaseComponent.renderTemplate()` replaces all shadow DOM via `innerHTML`. The `.employee-grid` has `overflow-y: auto` but is NOT actually a scroll container — `scrollHeight === clientHeight` because the flex/height chain doesn't constrain it. The real scroll container is the window/body. Don't manipulate `grid.scrollTop` (it's always 0). Instead: (1) capture `card.getBoundingClientRect().top` before re-render, (2) call `requestUpdate()` (synchronous), (3) read `editor.getBoundingClientRect().top` (forces layout before paint), (4) call `window.scrollBy(0, drift)`. This positions the editor at the card's exact screen location with <1px drift.

15. **Add-Employee form position matters for UX** — The `render()` template in `admin-employees-page` places `<employee-form>` before `<employee-list>`. Moving it between `</employee-list>` and the `.toolbar` div puts it adjacent to the "Add Employee" button. After `requestUpdate()`, scroll the form into view with `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` (use `behavior: 'auto'` for `prefers-reduced-motion`).

## Questions and Concerns

1. What does the "Acknowledge" button do on an employee card?
   REMOVE IT. It duplicates the monthly review feature and clutters the card action bar.
2. Should the "Add Employee" button remain in the page template or move into the `<employee-list>` component?
   KEEP IN PAGE TEMPLATE. Simpler implementation, avoids component API changes.
3. Should employee cards show computed annual PTO hours (ptoRate × workdays) in addition to the daily rate?
   NO. The daily rate is all the admin needs to see.

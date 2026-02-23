# Submit Time Off Page Design Improvements

## Description

Address design and usability issues identified during a design review of the Submit Time Off page (`/submit-time-off`). The page is the primary employee interface for scheduling PTO, Sick, Bereavement, and Jury Duty time using an interactive calendar grid. Issues target toolbar placement, balance summary clarity, lock-state UX, calendar grid density, and button styling inconsistencies.

## Priority

🟡 Medium Priority — Core feature polish. The page functions correctly but has UX/readability issues that reduce usability for employees.

## Checklist

### Stage 1: Fix Toolbar Positioning and Stickiness

The toolbar (Lock Month / Cancel / Submit buttons) renders at the very bottom of the page, below all 12 calendar months. On a long scrolling page the user must scroll past the entire calendar grid to reach the primary actions. The toolbar should be sticky or repositioned for easy access.

- [x] Move the `.toolbar` div to be sticky at the bottom of the viewport (or immediately below the sticky `<month-summary>` bar)
- [x] Ensure the toolbar does not overlap calendar content — add appropriate bottom padding/margin to the calendar container
- [x] Verify toolbar remains accessible on mobile viewports
- [x] Verify the toolbar does not interfere with the lock banner when visible
- [x] Manual testing at various scroll positions
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 2: Improve Button Visual Hierarchy

The three toolbar buttons (Lock Month, Cancel, Submit) have competing visual weight. "Submit" is the primary action but "Lock Month" (yellow/warning color) draws more attention. "Cancel" and "Submit" lack sufficient visual differentiation.

- [x] Make "Submit" the most visually prominent button (primary color, larger or bolder)
- [x] Make "Cancel" an outlined/ghost button to reduce its visual weight
- [x] Consider reordering buttons: Submit first (or rightmost per convention), then Cancel, then Lock Month
- [x] Ensure "Lock Month" does not overpower the primary action — consider a more neutral color or icon-only treatment
- [x] Verify button states (disabled, hover) are visually distinct for each variant
- [x] Manual testing across button states (unlocked, employee-locked, admin-locked)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 3: Improve Balance Summary Context for Employees

The top-level `<month-summary>` bar shows aggregate available balances (e.g., PTO: 113, Sick: 0, Bereavement: 32) but provides no context that these are _remaining annual balances_ versus monthly usage. Additionally, the per-month summaries inside each calendar card show hours scheduled for that month but lack labels.

- [x] Add a heading or sub-label to the top-level balance summary clarifying "Available Balance" or "Remaining This Year"
- [x] Add a sub-label to per-month card summaries clarifying "Scheduled This Month"
- [x] Ensure delta indicators (pending selection changes) remain visible and unambiguous
- [x] Verify the summary updates correctly when selections are made on calendar days
- [x] Write or update Vitest unit tests for balance summary labeling
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 4: Improve Lock State Visual Feedback

When the month is employee-locked, the lock banner appears with a yellow background and the calendar becomes readonly, but the visual transition is subtle. Users may not notice the state change, especially if the banner scrolls out of view.

- [x] Make the lock-state transition more obvious — consider dimming/graying the calendar grid when locked
- [x] Ensure the lock banner is sticky or repeated near the toolbar so it is always visible
- [x] Add a visual indicator on the Lock/Unlock button showing current state (e.g., filled lock icon vs outline)
- [x] Consider disabling pointer events on calendar day cells when locked (in addition to `readonly` attribute)
- [x] Verify admin-locked state correctly disables all editing UI and shows the admin lock banner
- [x] Manual testing of lock → unlock → admin-lock transitions
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 5: Calendar Day Cell Accessibility and Touch Targets

Calendar day cells use `aspect-ratio: 1` and `min-width: 3ch` which can produce very small touch targets on narrow viewports or when 6 columns are shown in multi-calendar mode. The hours text is positioned absolutely at `bottom: 2px; right: 2px` which may be clipped or hard to read.

- [x] Evaluate minimum touch target sizes against WCAG 2.5.5 (44×44 CSS pixels recommended)
- [x] Consider increasing `min-width` or adding a `min-height` to day cells in multi-calendar mode
- [x] Ensure the hours text is legible at small cell sizes — consider dynamic font sizing or repositioning
- [x] Verify keyboard navigation works correctly in multi-calendar mode (focus moves between months)
- [x] Manual testing on narrow (375px) and wide (1920px) viewports
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

## Implementation Notes

- Page component: [client/pages/submit-time-off-page/index.ts](../client/pages/submit-time-off-page/index.ts) (465 lines)
- Page CSS: [client/pages/submit-time-off-page/css.ts](../client/pages/submit-time-off-page/css.ts)
- Toolbar CSS is adopted via constructable stylesheet from [client/css-extensions/toolbar/toolbar.ts](../client/css-extensions/toolbar/toolbar.ts) — changes to toolbar layout may need to go there for consistency across pages
- Inner form: [client/components/pto-entry-form/index.ts](../client/components/pto-entry-form/index.ts) (816 lines) — handles single vs multi-calendar mode
- Calendar component: [client/components/pto-calendar/index.ts](../client/components/pto-calendar/index.ts) (735 lines)
- Balance summary: [client/components/month-summary/index.ts](../client/components/month-summary/index.ts) — used both at page level (available balance) and per-month card level (scheduled hours)
- Follow existing design token patterns from `tokens.css` for any new color/spacing values
- All CSS changes must use `rgb()` with alpha percentages, not `rgba()`
- Animations must respect `prefers-reduced-motion`
- Use `scripts/review-screenshot.mjs` (modified for this page) to capture screenshots for visual verification

## Implementation Learnings

1. **`position: fixed` not `sticky` for bottom toolbar** — `sticky` doesn't work for bottom-of-viewport anchoring inside a shadow root because the containing block is the `:host` element, not the viewport. `position: fixed` is the correct approach. Requires matching `padding-bottom` on `:host` (72px) to prevent content from being hidden behind the toolbar.
2. **Shared toolbar CSS coexists with page-level overrides** — The `adoptToolbar()` constructable stylesheet provides base flex layout (`.toolbar { display: flex; justify-content: space-around }`). Page-level `<style>` rules in `css.ts` override positioning (`position: fixed; bottom: 0`) without conflicting, because the constructable sheet has lower specificity than `<style>` in the shadow root.
3. **Lock state visual feedback uses class on `pto-entry-form` host** — Adding `.locked` to the `<pto-entry-form>` element and styling it from the parent's shadow CSS (`pto-entry-form.locked { opacity: 0.5; pointer-events: none }`) works because parent CSS can style the outer element of a child web component. Cannot reach into child shadow DOM internals.
4. **`hide-header` is NOT set in multi-calendar mode** — Only `hide-legend="true"` is passed to `<pto-calendar>` instances. The calendar header (month name) is already visible. This was incorrectly assumed during the initial design review and the stage was removed.
5. **Day cell min-size change is global** — Changing `.day { min-width: max(3ch, 32px); min-height: 32px }` in `pto-calendar/css.ts` affects ALL consumers (admin monthly review cards, submit-time-off, etc.). This is intentional — touch targets should be consistent everywhere.
6. **Balance heading added as sibling div, not inside `<month-summary>`** — The "Available Balance" label was added as a `<div class="balance-heading">` above `<month-summary>` in the page template, rather than modifying the `month-summary` component. This keeps `month-summary` generic and reusable across contexts (admin review, per-month card summaries, etc.).
7. **Playwright screenshot script must run from project root** — The script imports `playwright` which is installed as a devDependency. Running from `/tmp/` fails with `ERR_MODULE_NOT_FOUND`. Copy into project root or use `scripts/` directory.
8. **Employee vs Admin auth for page capture** — `/submit-time-off` requires employee login (`john.doe@example.com`). Admin pages use `admin@example.com`. The magic link endpoint is `POST /api/auth/request-link` with `{ identifier }` body.

## Questions and Concerns

1. Should the toolbar be sticky at the bottom of the viewport, or sticky below the balance summary bar at the top?
   BOTTOM OF VIEWPORT.
2. ~~In multi-calendar mode, should month labels appear above or inside each calendar card?~~
   N/A — month headers are already visible (only `hide-legend` is set, not `hide-header`). Stage removed.
3. Should the lock banner be duplicated near the toolbar, or should the toolbar itself change appearance when locked?
   Disable toolbar items when locked. Employee can unlock if admin hasn't also locked it.

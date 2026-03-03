# PTO Calendar Container-Relative Font Sizing

## Description

The PTO calendar day cells currently use absolute font sizes via design tokens (`--font-size-xs`, `--font-size-xxs`, `--font-size-sm`) for all child elements: the day-of-month number, hours display, type-indicator dot, note indicators, overuse "!" badge, reconciled "†" badge, and checkmark. These sizes remain fixed regardless of how large or small the day cell renders.

The goal is to make all font sizes within the `.day` cell **proportional to the container**, so that when the calendar is rendered at a larger size (e.g., in an admin inline calendar or a wider viewport), the day cell grows and all inner text/icons scale up proportionally, preserving the current visual ratios.

## Priority

🟢 Low Priority — Polish & visual refinement; no functional or data impact.

## Checklist

### Phase 1: Audit & Design (Research)

- [x] Catalog every font-size declaration inside `.day` and its descendants in `pto-calendar/css.ts`
- [x] Document the current absolute sizes and their visual ratios relative to `.day .date`
- [x] Decide on implementation approach: CSS `container` queries with `cqi`/`cqw` units, or `em`-based sizing anchored to `.day` font-size
- [x] Verify browser support (Chrome-only target) for chosen approach

### Phase 2: Implement Container-Relative Sizing

- [x] If using container queries: add `container-type: inline-size` to `.calendar-grid`
- [x] Convert `.day` font-size from `clamp(var(--font-size-xs), 2vw, var(--font-size-sm))` to `2em`
- [x] Convert `.day .hours` font-size to `1em` (inherits from `.day`)
- [x] Convert `.day .checkmark` font-size from `var(--font-size-xxs)` to `0.65em`
- [x] Convert `.type-dot` font-size from `var(--font-size-xxs)` to `0.65em` (controls `0.5em` width/height)
- [x] Convert `.note-indicator` font-size from `var(--font-size-xs)` to `1em`
- [x] Convert `.edit-note-icon` font-size from `var(--font-size-xs)` to `1em`
- [x] Convert `.overuse-indicator` font-size from `var(--font-size-xxs)` to `0.65em`
- [x] Convert `.reconciled-indicator` font-size from `var(--font-size-xxs)` to `0.65em`
- [x] Convert `.date sup.partial-hours` sizing (`0.65em`) — verify it chains correctly with new base
- [x] Ensure `.day` base font-size scales proportionally via `2em` inheritance

### Phase 3: Preserve Visual Ratios

- [x] Verify the proportional relationship between date number, hours, and badge elements matches current design
- [ ] Confirm `.day.today .date` scale(2) transform still looks correct at larger sizes
- [ ] Test that `clamp()` fallbacks prevent text from becoming unreadably small or excessively large
- [ ] Verify legend text and swatches remain visually balanced (legend is outside `.day`, may not need changes)

### Phase 4: Cross-Context Testing

- [ ] Test in employee Submit Time Off calendar (standard size)
- [ ] Test in admin inline calendar (potentially larger cells)
- [ ] Test at narrow viewport (480px) — verify mobile sizing is acceptable
- [ ] Test at wide viewport (1920px+) — verify scaling doesn't overshoot
- [ ] Verify `prefers-reduced-motion` styles still apply correctly

### Phase 5: Quality Gates

- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] `pnpm run lint:css` passes (stylelint)
- [ ] Manual visual inspection at multiple viewport widths
- [x] No regressions in existing Vitest calendar tests (48/48 passed)
- [ ] No regressions in Playwright E2E screenshot tests

## Conversion Table

Mapping from previous absolute token values to container-relative `em` sizing (relative to `.day { font-size: 2em }`):

| Selector                  | Before (absolute)                                      | After (relative)     | Ratio to `.day`  | Notes                                                                        |
| ------------------------- | ------------------------------------------------------ | -------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `.day`                    | `clamp(var(--font-size-xs), 2vw, var(--font-size-sm))` | `2em`                | 1.0×             | Inherits from parent; no clamp needed — parent context controls size         |
| `.day .date`              | (inherited from `.day`)                                | (inherited)          | 1.0×             | Unchanged                                                                    |
| `.day .hours`             | `clamp(var(--font-size-xs), 2vw, var(--font-size-sm))` | `1em`                | 1.0×             | Same as `.day` base                                                          |
| `.day .checkmark`         | `var(--font-size-xxs)` = 0.5rem                        | `0.65em`             | 0.65×            | Badge-sized; slightly larger than strict xxs/md ratio (0.5×) for readability |
| `.type-dot`               | `var(--font-size-xxs)` = 0.5rem                        | `0.65em`             | 0.65×            | Controls dot via `width/height: 0.5em` → effective 0.325× of `.day`          |
| `.note-indicator`         | `var(--font-size-xs)` = 0.75rem                        | `1em`                | 1.0×             | Icon sized to match day number                                               |
| `.edit-note-icon`         | `var(--font-size-xs)` = 0.75rem                        | `1em`                | 1.0×             | Ghost icon, same position as note-indicator                                  |
| `.overuse-indicator`      | `var(--font-size-xxs)` = 0.5rem                        | `0.65em`             | 0.65×            | "!" badge                                                                    |
| `.reconciled-indicator`   | `var(--font-size-xxs)` = 0.5rem                        | `0.65em`             | 0.65×            | "†" badge                                                                    |
| `.date sup.partial-hours` | `0.65em` of parent `.date`                             | `0.65em` (unchanged) | 0.65× of `.date` | Chains correctly off inherited base                                          |

**Token reference** (from `tokens.css`):

| Token             | Value    |
| ----------------- | -------- |
| `--font-size-xxs` | 0.5rem   |
| `--font-size-xs`  | 0.75rem  |
| `--font-size-sm`  | 0.875rem |
| `--font-size-md`  | 1rem     |

**Why no clamp on `.day`**: The previous `clamp(0.5rem, 2.6cqi, 2.5rem)` used raw rem values instead of tokens and imposed arbitrary bounds. With `2em`, the `.day` cell font scales naturally from its parent context. Consumers that embed the calendar control the size by setting `font-size` on the calendar host or an ancestor — no guardrails bypass the token system.

## Implementation Notes

- **Chosen approach**: `container-type: inline-size` on `.calendar-grid` (parent of all `.day` cells), then `.day` sets `font-size: 2em` to scale proportionally from inherited context. Children use `em` units to maintain proportional ratios.
- **Ratios preserved**: Elements at 1.0× base (`.date`, `.hours`, `.note-indicator`, `.edit-note-icon`) use `1em`/inherit. Elements at ~0.65× base (`.checkmark`, `.type-dot`, `.overuse-indicator`, `.reconciled-indicator`) use `0.65em`.
- **Why `.calendar-grid` as container**: `container-type: inline-size` is declared so future refinements could add `@container` queries. Currently `.day` uses `2em` (inherited sizing) rather than `cqi` units.
- **Scaling behavior**: At default 16px body → `.day` = 32px. Parent can override by setting `font-size` on the calendar host. Responsive scaling is delegated to the embedding context.
- The `.type-dot` uses `width: 0.5em; height: 0.5em` which chains off its own `0.65em` font-size — the dot itself is ~0.325em of the `.day` base, preserving current proportions.
- The `sup.partial-hours` uses `font-size: 0.65em` which chains off the parent `.date` — this works automatically since `.date` inherits `.day`'s font-size.

## Questions and Concerns

1.
2.
3.

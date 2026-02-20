# Orchestration: Tasks 28 & 29 Implementation

## Overview

This document tracks the implementation of two related tasks:

- **Task 28**: `ui-page-consolidation.md` — Consolidate dashboard pages
- **Task 29**: `pto-entry-form-multi-calendar.md` — Render all 12 months on large viewports

Task 29 depends on Task 28 being completed first.

## Progress Tracker

### Task 28: UI Page Consolidation

| Stage | Description                                                                                     | Status   | Notes                                                         |
| ----- | ----------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| 1     | Remove "Schedule PTO" page (default page, `current-year-pto-scheduler`)                         | COMPLETE | Deleted HTML, nav menu entry, UIManager refs, component files |
| 2     | Remove "Employee Information" page, relocate `pto-employee-info-card` to "Current Year Summary" | COMPLETE | Moved card, updated nav, re-wired data loading                |
| 3     | Remove `pto-accrual-card` from "Current Year Summary"                                           | COMPLETE | Deleted HTML, UIManager refs, component files                 |
| 4     | Extend `pto-employee-info-card` with accrual data                                               | COMPLETE | businessRules, card UI, UIManager wiring                      |
| 5     | Re-wire `navigate-to-month` → "Submit Time Off" page                                            | COMPLETE | Done as part of Stage 3                                       |
| 6     | Remove duplicate `<h2>Submit Time Off</h2>` header in `pto-entry-form`                          | COMPLETE |                                                               |
| 7     | Cleanup and validation                                                                          | COMPLETE | Dead imports removed, all lints pass                          |

### Task 29: PTO Entry Form Multi-Calendar

| Stage | Description                                              | Status   | Notes                                                      |
| ----- | -------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| 1     | Responsive layout scaffolding (CSS media queries)        | COMPLETE | :host(.multi-calendar) + CSS grid breakpoints              |
| 2     | Multi-calendar rendering (12 `pto-calendar` instances)   | COMPLETE | rebuildCalendars() creates 12 month-cards                  |
| 3     | Selection and submission across all calendars            | COMPLETE | getSelectedRequests aggregates, month-summary deltas       |
| 4     | Navigate-to-month integration (scroll to month)          | COMPLETE | scrollIntoView + highlightPulse animation                  |
| 5     | Viewport resize handling (`ResizeObserver`/`matchMedia`) | COMPLETE | matchMedia listener + PTO entries preserved on switch      |
| 6     | Testing and validation                                   | COMPLETE | lint:client/server/test ✅, build ✅, test:unit 417/417 ✅ |

## Key Files

### Modified

| File                                                   | Task  | Changes                                                                                                                                |
| ------------------------------------------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `client/index.html`                                    | 28    | Remove `#default-page`, `#employee-info-page`, `<pto-accrual-card>`, accrual `<style>`; add `<pto-employee-info-card>` to summary page |
| `client/UIManager.ts`                                  | 28    | Remove dead page branches/methods/imports; re-wire navigate-to-month                                                                   |
| `client/components/dashboard-navigation-menu/index.ts` | 28    | Remove "Schedule PTO" and "Employee Information" from menu and Page type                                                               |
| `client/components/pto-entry-form/index.ts`            | 28+29 | Add `navigateToMonth()`, multi-calendar layout                                                                                         |
| `client/components/pto-employee-info-card/index.ts`    | 28    | Extend with accrual data fields                                                                                                        |
| `shared/businessRules.ts`                              | 28    | Add `computeAccrualToDate()`                                                                                                           |
| `client/components/index.ts`                           | 28    | Remove deleted component exports                                                                                                       |

### Deleted

| File/Directory                                  | Task       | Reason                           |
| ----------------------------------------------- | ---------- | -------------------------------- |
| `client/components/current-year-pto-scheduler/` | 28 Stage 1 | Replaced by pto-entry-form       |
| `client/components/pto-accrual-card/`           | 28 Stage 3 | Data moved to employee-info-card |

## Lint Command

```bash
pnpm run lint:client
```

Run after each stage to verify no broken code.

## Session Notes

### Session 1 (2026-02-20)

- Created orchestration document
- Starting Task 28 Stage 1

### Session 2 (continued)

- Completed Task 28 Stages 1–7
- Completed Task 29 Stages 1–6
- All implementation done in `client/components/pto-entry-form/index.ts`
- Key changes: added `matchMedia`-based multi-calendar mode detection, `rebuildCalendars()` creates 12 month-card wrappers with pto-calendar + month-summary, CSS grid with breakpoints at 960/1200/1600px, aggregated selection/submission, navigate-to-month scrollIntoView with highlight animation
- All lints pass (client, server, test), build passes, 417/417 unit tests pass

### Session 3 — Bug fixes and open issue

#### Bug fix: empty calendar container on narrow viewports

- **Symptom**: "Submit Time Off" page showed no calendar at all (empty `#calendar-container`).
- **Root cause**: `setMultiCalendarMode(false)` had a guard `if (enabled === this.isMultiCalendar) return` — on first load both values were `false`, so `rebuildCalendars()` was never called.
- **Fix**: `setupMultiCalendarDetection()` now directly sets the class and calls `rebuildCalendars()` on initial setup, bypassing the no-change guard.

#### ✅ Resolved: PTO entries not decorated on first load

- **Symptom**: Calendar renders but existing PTO entries are not decorated on the day cells. Resizing the browser window triggers `rebuildCalendars()`, after which entries render correctly.
- **Root cause**: The calendars are not visually refreshing when `setPtoData()` delivers data on startup. The data IS stored (proven by resize collecting it via `collectPtoEntries()`), but the `PtoCalendar` re-render triggered by `set ptoEntries` → `requestUpdate()` does not visually update the day cells after the initial render.
- **Why resize works**: `rebuildCalendars()` creates brand-new calendar elements with entries already set before appending to DOM, so entries are present for the initial `connectedCallback` render.
- **Solution**: In `UIManager.handlePtoDataRequest()`, call `ptoForm.rebuildCalendars()` immediately after `ptoForm.setPtoData(entries)`. This forces a DOM rebuild with the newly loaded PTO data, ensuring visual decoration of existing entries on first load. The rebuild preserves all data and selections while fixing the render issue.

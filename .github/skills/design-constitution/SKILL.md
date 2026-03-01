---
name: design-constitution
description: Authoritative design constitution defining visual hierarchy, interaction patterns, and component behavior policies for the DWP Hours Tracker UI.
---

# Design Constitution — DWP Hours Tracker

## Description

The design constitution is the authoritative reference for UI design decisions across the DWP Hours Tracker. It codifies visual hierarchy, interaction patterns, and component behavior policies that all contributors must follow. Where the CSS Theming Assistant skill governs _how_ tokens are authored, this constitution governs _what_ the design should look and feel like.

Every new component, feature task, or CSS extension should be evaluated against these policies before implementation begins.

## Trigger

Activate this skill when users:

- Propose new UI elements or interactions and need design guidance
- Question where to place indicators, icons, or badges inside a cell or card
- Need to determine the correct visual precedence for overlapping states
- Are implementing calendar, form, or dialog components
- Want to add utility classes or CSS extensions
- Need to decide between competing interaction patterns (e.g., click vs. long-press)

## Policies

### Policy 1 — Color Semantics for PTO Types

Each PTO type has a **single, exclusive** color token. These tokens must never be reused for unrelated purposes.

| PTO Type    | Token                     | Palette Family |
| ----------- | ------------------------- | -------------- |
| Vacation    | `--color-pto-vacation`    | Blue           |
| Sick        | `--color-pto-sick`        | Red / Orange   |
| Bereavement | `--color-pto-bereavement` | Purple         |
| Jury Duty   | `--color-pto-jury-duty`   | Green          |
| Holiday     | `--color-pto-holiday`     | Orange         |

**Rules:**

- PTO type colors are applied as **background fills** on calendar day cells (via the `pto-day-colors` CSS extension) or as **colored dots / left-border accents** depending on context density.
- Text on PTO-colored backgrounds must use `--color-text-inverse` for contrast.
- New PTO types require a new dedicated token added to `tokens.css` before any component references the color.
- The `pto-day-colors` CSS extension (`client/css-extensions/pto-day-colors/`) is the single source of truth for type-to-color class mappings.

### Policy 2 — Calendar Cell Visual State Hierarchy

When multiple visual states overlap on a single calendar day cell, apply them in this **strict precedence order** (highest visual weight first):

| Priority | State               | Visual Treatment                                                              |
| -------- | ------------------- | ----------------------------------------------------------------------------- |
| 1        | Approved PTO        | Solid PTO-type background color                                               |
| 2        | Pending approval    | Lighter tint of PTO-type color + dashed border (`border-style: dashed`)       |
| 3        | Denied / rejected   | Strikethrough date text + muted red overlay (`--color-error` at 30 % opacity) |
| 4        | Weekend / holiday   | `--color-surface` background, **no** hover effect, non-interactive by default |
| 5        | Today               | Subtle ring using `--color-primary` (2 px inset border or `::after` pseudo)   |
| 6        | Selectable future   | `--color-surface-hover` on hover, pointer cursor                              |
| 7        | Past / unselectable | Opacity 0.4–0.6 + `cursor: not-allowed`                                       |

**Rules:**

- A cell may exhibit **at most two** overlapping states at once (e.g., "Approved PTO" + "Today"). When this happens, the higher-priority state controls the background and the lower-priority state adds a secondary indicator (e.g., the today ring appears _on top of_ the approved-PTO background).
- Indicators occupy **fixed corner positions** inside the cell (see Policy 4). Never stack two indicators in the same corner.

### Policy 3 — Touch Target & Density

All interactive calendar cells and actionable UI elements must meet minimum touch-target requirements.

| Constraint               | Value                        | Rationale                        |
| ------------------------ | ---------------------------- | -------------------------------- |
| Minimum touch target     | 44 × 44 px                   | WCAG 2.5.5 / Apple HIG guideline |
| Calendar cell min-height | 44 px                        | Ensures tappability on mobile    |
| Calendar cell aspect     | `aspect-ratio: 1`            | Consistent square grid           |
| Touch action (calendar)  | `touch-action: manipulation` | Prevents double-tap zoom         |

**Mobile (<720 px) adaptations:**

- Display 2-digit date only (hide superscript indicators if they create clutter).
- Collapse month name + year into a single line; truncate with ellipsis if needed.
- Swipe gestures for month navigation should use `touch-action: pan-y` on the calendar wrapper to allow vertical scroll while capturing horizontal swipes.

### Policy 4 — Cell Corner Allocation

Calendar day cells have **four corners**. Each corner is reserved for a specific category of indicator. This prevents ad-hoc icon placement and visual collisions.

```
┌──────────────┐
│ TL        TR │
│              │
│   (content)  │
│              │
│ BL        BR │
└──────────────┘
```

| Corner            | Reserved For                  | Current Occupant(s)                |
| ----------------- | ----------------------------- | ---------------------------------- |
| Top-Left (TL)     | **Notes / annotations**       | Note indicator (▾), edit-note icon |
| Top-Right (TR)    | **Approval / reconciliation** | Checkmark (✓), reconciled (†)      |
| Bottom-Left (BL)  | **Warnings / overuse**        | Overuse indicator (!)              |
| Bottom-Right (BR) | **Hours display & type dot**  | Hours text, PTO type dot           |

**Rules:**

- A corner may contain **at most one** indicator at a time. If two indicators compete for the same corner, the higher-priority state (per Policy 2) wins and the other is suppressed or moved to a tooltip.
- New features requiring cell indicators **must** claim an existing corner or propose reallocation in the task spec. Indicators must never float outside the four-corner grid.
- The note icon in TL is appropriate for both "has note" (read-only indicator) and "add/edit note" (interactive placeholder). Differentiate via visual treatment: filled icon = has note, outlined/ghost icon = add note.

### Policy 5 — Progressive Disclosure

UI should reveal complexity only when the user asks for it.

- **Default view**: Show current month + next month only (or current month in single-calendar views).
- **Expand/collapse**: Older months are collapsed behind a "Show earlier months" toggle. Use a smooth `max-height` or `transform: scaleY` transition (`--duration-normal`).
- **Full-year view**: A "Show full year" toggle reveals a 12-mini-calendar grid layout (4 × 3 on desktop, 2 × 6 on tablet, 1 × 12 stacked on mobile).
- **Dialogs & modals**: Prefer _inline_ expansion or _bottom-sheet_ patterns over centered modals when the content is small (e.g., a note + hours input). Reserve centered modals for confirmation flows or multi-step forms.

### Policy 6 — Interaction Patterns

Define consistent interaction semantics across input modalities.

| Action             | Mouse / Pointer             | Touch                                  | Keyboard                      |
| ------------------ | --------------------------- | -------------------------------------- | ----------------------------- |
| Quick toggle hours | Click day cell              | Tap day cell                           | Enter / Space on focused cell |
| Open note dialog   | Click note icon (TL corner) | Long-press day cell (≥ duration const) | — (future: Shift+Enter)       |
| Navigate months    | Click nav arrows            | Swipe left/right                       | — (future: Page Up/Down)      |
| Select PTO type    | Click legend item           | Tap legend item                        | Arrow keys in legend listbox  |

**Rules:**

- The long-press duration constant must be defined in `client/css-extensions/` and exported from the facade so all components share the same value.
- Long-press must be cancelled if the pointer/finger moves beyond a small threshold (≥ 10 px) to avoid false triggers during scrolling.
- Prevent the native context menu on long-press (call `preventDefault()` on `contextmenu` event).

### Policy 7 — Form + Calendar Integration

When a form (e.g., PTO request) and a calendar are displayed together:

- Selected dates in the calendar highlight their corresponding summary in the form using `--color-primary-light` background.
- Live validation feedback: green border (`--color-success`) on valid input, red border (`--color-error`) on conflict or overlap.
- "Quick-add" pattern: tapping a day opens a minimal dialog pre-filled with the most-recently-used PTO type. This is the **note dialog**, not a separate component.

### Policy 8 — Error & Success Feedback

- **Submission success**: Toast notification + optimistic UI update (entry appears immediately; reverted on server failure).
- **Quota / balance errors**: Inline warning text + remaining balance highlighted in `--color-warning`.
- **Network failure**: Retry button inside the affected component + global offline indicator.
- **Validation errors**: Red border on the offending field + descriptive message below it. Never use `alert()`.

### Policy 9 — Conflict & Overlap Visualization

- **Partial-day overlap**: Show split background (top half = type A color, bottom half = type B color) or a diagonal gradient.
- **Overlap warning**: Small pill badge in the cell's BL corner using `--color-warning`. This shares the BL corner with the overuse indicator; overlap badge takes precedence over overuse when both are present.
- **Team calendar view** (future): Use avatar initials + PTO type color dot instead of full employee names.

### Policy 10 — Utility Classes for PTO States

Add high-leverage utility classes to the atomic CSS layer or as a new CSS extension. These build directly on existing tokens with minimal new surface area.

```css
/* PTO type backgrounds — white text for contrast */
.bg-pto-vacation {
  background-color: var(--color-pto-vacation);
  color: var(--color-text-inverse);
}
.bg-pto-sick {
  background-color: var(--color-pto-sick);
  color: var(--color-text-inverse);
}
.bg-pto-bereavement {
  background-color: var(--color-pto-bereavement);
  color: var(--color-text-inverse);
}
.bg-pto-jury-duty {
  background-color: var(--color-pto-jury-duty);
  color: var(--color-text-inverse);
}
.bg-pto-holiday {
  background-color: var(--color-pto-holiday);
  color: var(--color-text-inverse);
}

/* Pending state — diagonal hatch */
.bg-pto-pending {
  background: repeating-linear-gradient(
    135deg,
    var(--color-warning-light) 0,
    var(--color-warning-light) 4px,
    transparent 4px,
    transparent 8px
  );
}

/* Calendar cell baseline — touch-target safe */
.calendar-cell {
  min-height: 44px;
  aspect-ratio: 1 / 1;
  touch-action: manipulation;
}

/* Today ring (applied via ::after) */
.today {
  position: relative;
}
.today::after {
  content: "";
  position: absolute;
  inset: 2px;
  border: 2px solid var(--color-primary);
  border-radius: inherit;
  pointer-events: none;
}

/* Strike-through for denied/rejected */
.text-strike {
  text-decoration: line-through;
  opacity: 0.7;
}
```

These may live in `client/css-extensions/pto-states/` as a constructable stylesheet or in `client/atomic.css` — choose based on whether they are needed inside shadow DOM (use extension) or only in light DOM (use atomic).

## Response Pattern

When this skill is activated:

1. **Identify the relevant policy** — determine which of the 10 policies applies to the user's question.
2. **Check existing implementation** — read the component's CSS and markup to see if the policy is already followed.
3. **Recommend changes** — if the implementation diverges from policy, specify the exact CSS/HTML changes needed, referencing token names and corner allocations.
4. **Validate** — confirm the change respects the cell state hierarchy (Policy 2) and corner allocation (Policy 4) without collisions.
5. **Update task spec** — if the feature is tracked in `TASKS/`, note the policy reference in the implementation notes.

## Examples

- "Where should I put a new badge on a calendar cell?" → Policy 4 (corner allocation).
- "How should I style a pending PTO entry?" → Policy 2 (state hierarchy, priority 2).
- "The note icon feels wrong in the top-left corner." → Policy 4 confirms TL is the correct corner for notes/annotations.
- "What color should a new PTO type use?" → Policy 1 (add a new exclusive token first).
- "How do I handle a tap vs. long-press on mobile?" → Policy 6 (interaction patterns).
- "Should I use a modal or inline expansion for the note editor?" → Policy 5 (progressive disclosure — prefer inline/bottom-sheet for small content).

## Additional Context

- This constitution builds on top of the token system documented in the **CSS Theming Assistant** skill. Token creation and naming conventions are still governed there; this skill governs _usage_ and _visual behavior_.
- The **CSS Animation Policy** (in `copilot-instructions.md`) governs animation performance and accessibility. This constitution does not override it but adds higher-level UX constraints (e.g., progressive disclosure transitions).
- Policies should be versioned. When a policy is amended, note the date and rationale in a comment at the end of this file.

<!-- Policy log -->
<!-- 2026-03-01: Initial constitution created with Policies 1–10. -->

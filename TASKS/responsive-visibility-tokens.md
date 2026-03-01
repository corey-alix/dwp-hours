# Responsive Visibility Tokens

## Description

Elevate the component-specific `compact-only` and `wide-only` responsive visibility classes from `monthly-accrual-table/css.ts` into a shared, reusable responsive visibility system. Define standard breakpoint tiers, a clear naming convention, and exportable CSS that any web component can adopt via its `css.ts` file.

The current implementation in `monthly-accrual-table` uses `compact-only` (hidden below 360px) and `wide-only` (hidden below 540px) as ad-hoc classes. The names are ambiguous — `compact-only` reads as "visible exclusively in compact mode" but actually means "visible at compact **and above**." This task introduces a 7-tier system using t-shirt sizes (xxs–xxl) with an `if-*` prefix, aligned with Tailwind CSS container query breakpoints. The naming is easy to remember, composable, and shared across components.

## Priority

🟢 Low Priority (Polish & Production — Design System)

## Naming Convention

### Tier Model

Seven exclusive container-width tiers using t-shirt sizing, aligned with Tailwind CSS `@container` breakpoints (plus `xxs` and `xxl` extensions). Values use `rem` to respect user font-size preferences.

| Tier    | Min width | px equiv | Typical use case                        |
| ------- | --------- | -------- | --------------------------------------- |
| **xxs** | < 20rem   | < 320    | Minimal: label + single value           |
| **xs**  | ≥ 20rem   | 320      | Small cards: add a secondary column     |
| **sm**  | ≥ 24rem   | 384      | Compact tables: 3–4 columns             |
| **md**  | ≥ 28rem   | 448      | Standard layout: most detail visible    |
| **lg**  | ≥ 32rem   | 512      | Comfortable: all columns, some spacing  |
| **xl**  | ≥ 36rem   | 576      | Spacious: extra detail, wider gutters   |
| **xxl** | ≥ 48rem   | 768      | 4K / ultrawide: dashboards, full detail |

### Class Names

Use the `if-{tier}` prefix. Each class makes an element **visible at exactly that tier** and hidden at all others. Classes are composable — combine multiple `if-*` classes to show at multiple tiers.

| Class                            | xxs | xs  | sm  | md  | lg  | xl  | xxl |
| -------------------------------- | --- | --- | --- | --- | --- | --- | --- |
| `if-xxs`                         | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  |
| `if-xs`                          | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  |
| `if-sm`                          | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  |
| `if-md`                          | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  |
| `if-lg`                          | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  |
| `if-xl`                          | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  |
| `if-xxl`                         | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  |
| `if-sm if-md if-lg if-xl if-xxl` | ❌  | ❌  | ✅  | ✅  | ✅  | ✅  | ✅  |
| `if-xl if-xxl`                   | ❌  | ❌  | ❌  | ❌  | ❌  | ✅  | ✅  |
| _(no class)_                     | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  |

In practice, most elements only need 1–3 `if-*` classes. The full 7 tiers exist so components can pick the breakpoints that matter to them.

### Migration Mapping

| Old class      | New equivalent                   | Behavior                   |
| -------------- | -------------------------------- | -------------------------- |
| `compact-only` | `if-sm if-md if-lg if-xl if-xxl` | Visible at ≥ 24rem (384px) |
| `wide-only`    | `if-xl if-xxl`                   | Visible at ≥ 36rem (576px) |

Note: The old breakpoint values (360px → 384px, 540px → 576px) shift slightly to align with the Tailwind standard. Visual impact is negligible.

### Why `if-*` Instead of `*-only`

- `compact-only` is ambiguous: "only show in compact" vs "show starting at compact"
- `if-sm` reads as a clear conditional: **if** the container is sm, show this element
- Composability: `if-sm if-md` means "if sm **or** md" — combining `*-only` classes would be contradictory ("compact-only wide-only" sounds impossible)
- T-shirt sizes are universally recognized and easy to remember across 7 tiers
- Aligned with Tailwind: developers familiar with Tailwind immediately understand the breakpoint values

## CSS Variable Approach — Design Discussion

### Can CSS Variables Be Leveraged?

**Partially.** CSS custom properties **cannot** be used inside `@container` or `@media` query conditions (e.g., `@container (inline-size >= var(--bp-compact))` is invalid). However, they **can** propagate tier state to descendant elements using the wrapper pattern:

```css
:host {
  container-type: inline-size;
}

/* Wrapper element inside shadow DOM receives tier flags */
.responsive-root {
  --_tier-xxs: block;
  --_tier-xs: none;
  --_tier-sm: none;
  --_tier-md: none;
  --_tier-lg: none;
  --_tier-xl: none;
  --_tier-xxl: none;
}

@container (inline-size >= 20rem) {
  .responsive-root {
    --_tier-xxs: none;
    --_tier-xs: block;
  }
}

@container (inline-size >= 24rem) {
  .responsive-root {
    --_tier-xs: none;
    --_tier-sm: block;
  }
}

/* ... and so on for md, lg, xl, xxl */

/* Utility classes consume inherited tier flags */
.if-xxs {
  display: var(--_tier-xxs);
}
.if-xs {
  display: var(--_tier-xs);
}
.if-sm {
  display: var(--_tier-sm);
}
/* ... etc */
```

With 7 tiers the variable approach requires 7 custom properties, 7 `@container` rules each resetting multiple vars, and complex fallback chains for composability. This makes it significantly harder to maintain.

**Tradeoffs:**

| Aspect            | Variable approach                         | Direct `@container` approach           |
| ----------------- | ----------------------------------------- | -------------------------------------- |
| Wrapper required  | Yes (`.responsive-root` div)              | No                                     |
| Composability     | Needs fallback chains (7 tiers = complex) | Just toggle `display` per class        |
| Breakpoint values | Still hardcoded in `@container`           | Hardcoded in `@container`              |
| Extensibility     | Add var + `@container` rule               | Add class + `@container` rule          |
| Maintainability   | 7 vars × 7 rules = 49 assignments         | 7 `@container` rules, simple selectors |
| Simplicity        | High indirection                          | Straightforward                        |

**Recommendation:** Use the **direct `@container` approach**. The variable approach's complexity scales poorly with 7 tiers. If a future need arises for JS-driven tier detection, the variable approach can be layered in.

### Recommended Direct Approach

```css
/* === Responsive Visibility Utilities === */
/* T-shirt tier system: xxs, xs, sm, md, lg, xl, xxl                  */
/* Aligned with Tailwind @container breakpoints (rem-based)           */
/* Each if-* class shows the element at exactly that tier.            */
/* Compose multiple if-* classes to show at multiple tiers.           */
/* Elements with NO if-* class are always visible.                    */

/* All if-* classes are hidden by default */
.if-xxs,
.if-xs,
.if-sm,
.if-md,
.if-lg,
.if-xl,
.if-xxl {
  display: none;
}

/* xxs tier: < 20rem (default — smallest containers) */
.if-xxs {
  display: block;
}

/* xs tier: >= 20rem (320px) */
@container (inline-size >= 20rem) {
  .if-xxs:not(.if-xs) {
    display: none;
  }
  .if-xs {
    display: block;
  }
}

/* sm tier: >= 24rem (384px) */
@container (inline-size >= 24rem) {
  .if-xs:not(.if-sm) {
    display: none;
  }
  .if-sm {
    display: block;
  }
}

/* md tier: >= 28rem (448px) */
@container (inline-size >= 28rem) {
  .if-sm:not(.if-md) {
    display: none;
  }
  .if-md {
    display: block;
  }
}

/* lg tier: >= 32rem (512px) */
@container (inline-size >= 32rem) {
  .if-md:not(.if-lg) {
    display: none;
  }
  .if-lg {
    display: block;
  }
}

/* xl tier: >= 36rem (576px) */
@container (inline-size >= 36rem) {
  .if-lg:not(.if-xl) {
    display: none;
  }
  .if-xl {
    display: block;
  }
}

/* xxl tier: >= 48rem (768px) */
@container (inline-size >= 48rem) {
  .if-xl:not(.if-xxl) {
    display: none;
  }
  .if-xxl {
    display: block;
  }
}
```

### Breakpoint Tokens in tokens.css

While the breakpoint values can't be consumed in `@container` conditions, they should be documented in `tokens.css` as reference tokens for consistency and as a single source of truth:

```css
/* Responsive Breakpoint Tokens (container query reference values)       */
/* NOTE: CSS custom properties cannot be used in @container conditions.  */
/* These are documented here for reference; actual query values live in  */
/* shared/responsive.css.ts utility classes.                             */
/* Aligned with Tailwind CSS @container breakpoints + xxs/xxl.          */
:root {
  --bp-xxs: 0rem; /* < 20rem — default smallest tier */
  --bp-xs: 20rem; /* 320px */
  --bp-sm: 24rem; /* 384px */
  --bp-md: 28rem; /* 448px */
  --bp-lg: 32rem; /* 512px */
  --bp-xl: 36rem; /* 576px */
  --bp-xxl: 48rem; /* 768px */
}
```

## Checklist

### Phase 1 — Design & Token Documentation

- [ ] Add breakpoint token comments/values to `client/tokens.css`
- [ ] Create `client/shared/responsive.css.ts` exporting the responsive visibility utility CSS as a template string
- [ ] Document the tier model and class names in code comments
- [ ] Validate: `pnpm run build` passes

### Phase 2 — Migrate monthly-accrual-table

- [ ] Import `responsive.css.ts` into `monthly-accrual-table/css.ts`
- [ ] Replace `compact-only` → `if-sm if-md if-lg if-xl if-xxl` in component HTML
- [ ] Replace `wide-only` → `if-xl if-xxl` in component HTML
- [ ] Update local `@container` grid-column rules to use rem breakpoints (24rem, 36rem)
- [ ] Remove local `compact-only` / `wide-only` rules and `@container` visibility toggles from `css.ts` (keep grid column changes)
- [ ] Validate: component renders identically across tiers
- [ ] Validate: `pnpm run build` and `pnpm run lint` pass
- [ ] Run existing unit tests for the component

### Phase 3 — Audit & Adopt in Other Components

- [ ] Search codebase for other responsive visibility patterns (media queries, container queries toggling display)
- [ ] Identify candidate components for migration
- [ ] Migrate candidates to use `if-*` classes
- [ ] Validate: `pnpm run build` and `pnpm run lint` pass

### Phase 4 — Testing & Documentation

- [ ] Add Vitest tests verifying visibility class behavior (happy-dom container query support permitting)
- [ ] Manual testing across multiple tiers (xxs through xxl)
- [ ] Test on 4K / ultrawide viewport to verify xxl tier activates
- [ ] Update `README.md` Development Best Practices section if appropriate
- [ ] Code review and final lint pass

## Implementation Notes

- **Shadow DOM isolation**: Each web component must include the shared responsive CSS in its shadow root. Export a composable template string from `responsive.css.ts` that components concatenate into their styles.
- **Container context**: Components opting in must set `container-type: inline-size` on `:host` (or a wrapper). The `:host` pattern is already established in `monthly-accrual-table`.
- **Grid column changes stay local**: The `@container` rules that change `grid-template-columns` remain in each component's `css.ts` — only the visibility toggle classes are shared.
- **`display: block` default**: The utility classes assume `display: block` when visible. Components needing `display: flex` or `display: grid` at a tier should override locally (e.g., `.if-sm.my-flex-item { display: flex; }`).
- **rem-based breakpoints**: Using `rem` respects the user's font-size preference, improving accessibility. This is consistent with `tokens.css` which already uses `rem` for font sizes.
- **Tailwind alignment**: The 5 core breakpoints (xs–xl) match Tailwind's `@container` breakpoints exactly. Developers familiar with Tailwind will recognize the values instantly.
- **Only use what you need**: Most components will use 2–3 of the 7 tiers. The full set exists so each component can pick the breakpoints that matter to its layout.
- **No framework dependency**: Pure CSS, no JS runtime. Aligns with the vanilla TypeScript + web components stack.

## Questions and Concerns

1. Should `if-*` classes support `display: flex` / `display: grid` variants (e.g., `if-sm-flex`), or is `display: block` + local overrides sufficient?
2. For the variable-based approach: is the wrapper element requirement acceptable long-term, or does the extra DOM node add unwanted complexity?
3. Should composable combinations be validated with stylelint rules to catch near-always-visible patterns (e.g., applying all 7 `if-*` classes)?
4. The migration shifts breakpoints slightly (360→384, 540→576). Should we verify visually that no component layout breaks at the adjusted values?
5. Should the `xxl` breakpoint be higher (e.g., 64rem / 1024px) for true 4K optimization, or is 48rem (768px) a good starting point?

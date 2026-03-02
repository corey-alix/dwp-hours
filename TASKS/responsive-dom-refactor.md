# Responsive DOM Refactor

## Description

Refactor components that use imperative DOM manipulation for responsive modes (e.g., PtoEntryForm rebuilding calendars based on media queries). Replace with CSS-driven layouts using grid/flexbox and declarative templates. Handle mode switches via attributes or slots to separate layout logic from rendering logic.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Analysis and Design

- [x] Identify all components using imperative DOM for responsive behavior
- [ ] Document current responsive patterns and media query usage
- [ ] Design CSS-driven alternatives using grid/flexbox layouts
- [ ] Define attribute/slot-based mode switching patterns
- [ ] Create responsive design system guidelines
- [ ] Update architecture-guidance skill with responsive patterns
- [ ] Manual review of design approach

**Discovery Findings:**

- **Primary component with imperative responsive DOM:** `PtoEntryForm` (`client/components/pto-entry-form/index.ts`)
- **Imperative patterns identified:**
  - Uses `window.matchMedia()` with `(min-width: ${MULTI_CALENDAR_BREAKPOINT}px)` (line 89)
  - `rebuildCalendars()` method (lines 125-200+) dynamically creates/removes calendar elements based on viewport
  - Creates 1 calendar in single mode, 12 calendars in multi-calendar mode
  - Uses `document.createElement()` and `appendChild()` for dynamic DOM construction
  - Media query listener bound with `addListener()` for cleanup (line 95)
- **Other media query usage (non-imperative):**
  - `prefers-reduced-motion` checks in multiple components
  - `pointer: fine` detection for desktop vs mobile behavior
- **Impact:** PtoEntryForm has extensive imperative DOM manipulation justified as "dynamic child count cannot be expressed in static template"

### Phase 2: CSS Layout Foundation

- [ ] Implement responsive CSS grid/flexbox layouts in component styles
- [ ] Create CSS custom properties for responsive breakpoints
- [ ] Add container queries support where needed
- [ ] Define declarative template structures
- [ ] Test layouts across different viewport sizes
- [ ] Build passes, lint passes

### Phase 3: Component Template Updates

- [ ] Update PtoEntryForm to use declarative calendar rendering
- [ ] Remove imperative element creation/rebuilding logic
- [ ] Implement attribute-based mode switching
- [ ] Add slot-based content injection where appropriate
- [ ] Update component lifecycle methods
- [ ] Manual testing of responsive behavior

### Phase 4: Mode Switching Implementation

- [ ] Implement CSS-driven mode transitions
- [ ] Add attribute observers for dynamic mode changes
- [ ] Update media query listeners to use CSS containment
- [ ] Remove JavaScript-based DOM manipulation
- [ ] Test mode switching across devices
- [ ] Build passes, lint passes

### Phase 5: Testing and Validation

- [ ] Update vitest + happy-dom unit tests to verify declarative rendering and mode attributes
- [ ] Add vitest tests for attribute-driven mode switching (set attribute, assert DOM structure)
- [ ] Add Playwright E2E tests only where a real viewport is required (visual regression screenshots)
- [ ] Performance testing for layout shifts
- [ ] Code review and accessibility audit
- [ ] Documentation updates
- [ ] Build passes, lint passes, all tests pass

## Implementation Notes

- **CSS-First Approach**: Use CSS grid/flexbox for all responsive layouts
- **Declarative Templates**: Keep HTML templates static and data-driven
- **Attribute-Based Switching**: Use observed attributes for mode changes
- **Performance**: Minimize layout thrashing with CSS containment
- **Accessibility**: Ensure responsive layouts maintain accessibility
- **Backwards Compatibility**: Maintain existing responsive behavior during transition

## Questions and Concerns

1. **How to handle complex responsive interactions that require JavaScript?**
   Keep pure layout (columns, stacking, sizing) in CSS via grid/flex/container queries. Reserve JS for behavior only: user-driven state, data-dependent rendering, animations needing JS timing. Pattern: observed attributes for mode (single vs multi-calendar), CSS handles structural changes via `[data-mode="multi"]` selectors or container queries, JS only toggles the attribute on resize/mount — no direct DOM creation/removal. This eliminates `rebuildCalendars()` thrashing while keeping necessary logic.

2. **Should we implement container queries for component-level responsiveness?**
   Yes — selectively and incrementally, especially for PtoEntryForm calendars. Browser support is excellent (>95% global in 2026). Enables true component independence: calendars adapt to available space inside form/tabs/sidebars, not just viewport. Use media queries for page-level layout shifts, container queries for inner component variants. Avoid overusing on every element — apply only where parent size matters more than viewport.

3. **How to test responsive behavior reliably in automated tests?**
   Strongly prefer **vitest + happy-dom** for all structural/attribute assertions: set the mode attribute on the component, assert rendered DOM (calendar count, classes, slots) — no real browser needed. Because the refactor moves responsive logic into observed attributes + CSS, most behavior is testable by setting `data-mode="multi"` or `data-mode="single"` in happy-dom and verifying the resulting shadow DOM structure. Reserve **Playwright only** for true viewport-dependent visual regression (screenshot diffs at breakpoints). Avoid duplicating structural assertions in E2E tests that vitest already covers.

4. **What fallback patterns for older browsers without modern CSS support?**
   Container queries have ~95%+ support in 2026 — low risk. Use progressive enhancement: mobile-first single-column default, `@supports (container-type: inline-size)` for container queries, viewport-based `@media` fallback for very old browsers. Prioritize mobile-first + feature queries over polyfills (maintenance cost too high).

5. **How to coordinate responsive behavior across nested components?**
   Single source of truth via attributes down the tree, in order of preference: (a) observed attribute on root — descendants use `[data-mode]` selectors (simplest, zero JS coordination); (b) CSS custom properties on ancestor — children query via `@container`; (c) context/provide-inject only if CSS propagation fails. Avoid direct parent-child JS coupling. Start with attribute + container queries on PtoEntryForm, remove imperative rebuild logic, add viewport-based E2E tests immediately.

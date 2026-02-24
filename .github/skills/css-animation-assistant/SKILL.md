---
name: css-animation-assistant
description: Specialized assistant for implementing CSS animations in the DWP Hours Tracker frontend, ensuring compliance with performance, accessibility, and maintainability standards.
---

# CSS Animation Assistant

## Description

Specialized assistant for implementing CSS animations in the DWP Hours Tracker frontend, ensuring compliance with performance, accessibility, and maintainability standards. This skill guides the creation of efficient, hardware-accelerated animations that enhance user experience without introducing technical debt.

## Trigger

Activate this skill when users request:

- Creating new CSS animations or transitions
- Optimizing existing animations for performance
- Implementing accessibility-compliant animations
- Adding mobile-specific animation features
- Reviewing or refactoring animation code

## Response Pattern

Follow this step-by-step approach when implementing CSS animations:

1. **Assess Requirements**: Analyze the animation purpose, target elements, and user interaction context
2. **Property Selection**: Ensure only hardware-accelerated properties (`transform`, `opacity`, `filter`) are animated
3. **Performance Optimization**: Apply `will-change` strategically and use GPU acceleration techniques
4. **Accessibility Implementation**: Add `prefers-reduced-motion` support and ARIA attributes as needed
5. **Mobile Considerations**: Optimize for touch inputs and reduce complexity on mobile devices
6. **Code Structure**: Use CSS variables, modular keyframes, and utility classes for maintainability
7. **Testing & Validation**: Test across devices, validate with performance tools, and ensure graceful degradation
8. **Documentation**: Add code comments explaining animation purpose, performance impact, and accessibility features

## Lessons Learned

Hard-won patterns from real implementations in this project:

### Multi-phase animations (carousel, slide-in/out)

- **Use inline styles, not CSS classes** for sequenced animation phases. Class-based approaches suffer from specificity conflicts and unreliable style flushing between phases.
- **Force synchronous reflow** with `void element.offsetHeight` between phases to guarantee the browser commits an intermediate position before re-enabling transitions. Double `requestAnimationFrame` is not reliable for this.
- **Filter `transitionend` by `e.propertyName`** (e.g., `=== "transform"`) to prevent double-firing when animating multiple properties (`transform` + `opacity`).
- **Guard against overlapping animations** with an `isAnimating` flag checked at entry and cleared on completion.
- **Always add a `setTimeout` fallback** after the animation duration (+50ms buffer) that runs the same completion logic as `transitionend`. The `transitionend` event will not fire if the element is destroyed mid-animation (e.g., by a re-render) or in test environments without CSS transition support. Without a fallback, `isAnimating` gets stuck `true` and the component deadlocks.
- **Allow re-toggle during animation** — instead of `if (isAnimating) return`, call a `finalizeAnimation()` helper that clears the fallback timer, removes inline styles, and resets the flag, then proceed with the new action. This prevents the component from becoming unresponsive to rapid user clicks.
- **Deduplicate completion logic** — extract a single `onComplete` closure shared by both the `transitionend` handler and the `setTimeout` fallback. Have it clear the timer, remove the event listener, clean up styles, and reset state, so the first to fire wins and the second is a no-op.
- **Clean up inline styles** after animation completes — remove `willChange`, `transition`, `transform`, and `opacity` to avoid stale state.

### Menu and dropdown animations

- **Prefer slide (motion) over fade for menu reveal/hide**. Slide-down (`translateY`) provides stronger spatial context than opacity transitions alone. Combine with a subtle opacity change for polish, but the motion must be the primary effect.
- **Use `translateY(-8px)` as the hidden position** for dropdown menus — small enough to feel natural, large enough to be perceptible.
- **Decelerate on open, accelerate on close** — use a decelerate easing (`cubic-bezier(0, 0, 0.2, 1)`) when revealing and an accelerate easing (`cubic-bezier(0.4, 0, 1, 1)`) when hiding, so elements feel like they arrive gently and leave quickly.

### Accessibility

- **Always provide a `prefersReducedMotion()` check** that skips animation entirely (instant state change) rather than just shortening duration.
- Query `window.matchMedia("(prefers-reduced-motion: reduce)")` at animation time, not at component init, so runtime preference changes are respected.

### innerHTML re-render destroys scroll context on mobile

- **Never call `requestUpdate()` on a parent component to enter/exit edit mode** when an animated child component handles its own card→editor transition. The parent's `renderTemplate()` replaces its entire shadow DOM via `innerHTML`, which destroys the child element (and its scroll position). On mobile single-column layouts the page height briefly collapses to near-zero, causing the browser to clamp `window.scrollY` to 0. By the time the child is recreated and populated, the user is staring at the top of the page.
- **Set properties directly on the existing child element** instead of re-rendering the parent. For example, set `list.editingEmployeeId = id` on the live `<employee-list>` rather than calling `this.requestUpdate()` on `<admin-employees-page>`. The child's `attributeChangedCallback` then runs `transitionCardToEditor()` with the DOM intact and scroll preserved.
- **The actual scroll container matters** — `.employee-grid` has `overflow-y: auto` and `flex: 1`, but its parent chain doesn't establish a fixed-height constraint, so `scrollHeight === clientHeight` (it's never scrollable). The real scroll container is `window`. Always use `window.scrollBy()` and `getBoundingClientRect()` for position correction, never `grid.scrollTop`.
- **Use `getBoundingClientRect().top` before and after re-render** to calculate drift. After the synchronous `requestUpdate()` (innerHTML replacement), read the editor's `getBoundingClientRect().top` — this forces a layout before the browser paints, making the `window.scrollBy(0, drift)` correction invisible to the user. Measured drift is <1px.
- **Cancel and form-cancel handlers need the same treatment** — when exiting inline edit mode, clear `editingEmployeeId` on the existing child component rather than re-rendering the parent. Distinguish between "was inline editing" vs "was showing add form" to decide whether a parent re-render is needed.

## Examples

Common user queries that should trigger this skill:

- "Add a fade-in animation to the PTO calendar"
- "Optimize the loading spinner animation for better performance"
- "Make the employee form slide in smoothly"
- "Ensure animations work with reduced motion preferences"
- "Create a swipe gesture animation for mobile"

## Additional Context

This skill integrates with the project's CSS Animation Policy and web components architecture. All animations must align with the atomic CSS design principles and use tokens from `tokens.css` for durations and easings. Reference the project's `css.ts` pattern for component-specific styles and ensure animations are tested in both Vitest (unit) and Playwright (E2E) environments.

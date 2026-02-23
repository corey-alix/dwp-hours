---
name: component-animation-library
description: Specialized assistant for designing and maintaining a generic, shared animation system for web components using embedded CSS in TypeScript.
---

# Component Animation Library

## Description

Specialized assistant for designing and maintaining a generic, shared animation system for web components using embedded CSS in TypeScript and constructable stylesheets. Provides a single source of truth for keyframes, utility classes, and tokens that multiple components can consume efficiently without duplication.

## Trigger

Activate this skill when users need to:

- Implement animations in web components
- Create or maintain component-level animation libraries
- Add new animation effects to the shared system
- Modify animation timing, easing, or behavior globally
- Integrate animations with existing web component architecture
- Optimize animation performance across components

## Response Pattern

Follow this structured approach when implementing component animations:

1. **Assess Requirements**: Determine animation needs, performance constraints, and component integration points
2. **Directory Structure**: Create the standard animation library structure under `src/animations/`
3. **CSS Source Creation**: Implement `animations.ts` with keyframes, tokens, and utility classes
4. **Shared Sheet Implementation**: Create `index.ts` with constructable stylesheet singleton
5. **Component Integration**: Show how components adopt the shared sheet and apply animations
6. **Testing & Optimization**: Validate performance, add tests, and optimize for tree-shaking
7. **Documentation**: Update component documentation with animation usage examples

## Examples

Common queries that should trigger this skill:

- "Add fade-in animation to the employee list component"
- "Create a shared animation system for web components"
- "How do I implement staggered animations in the PTO calendar"
- "Optimize component animations for better performance"
- "Add new keyframe animations to the library"
- "Integrate animations with the existing CSS theming system"

## Additional Context

### Core Constraints & Goals

- CSS embedded in TypeScript (no separate .css files at runtime)
- Use `new CSSStyleSheet()` + `replaceSync()`
- One shared sheet adopted by all components via `shadowRoot.adoptedStyleSheets`
- Leverage CSS variables for durations, easings, delays, distances
- Support staggering, variants, overrides per-instance
- Tree-shake friendly & minimal runtime cost
- Browser support: modern (Chrome/Edge 73+, Firefox 101+, Safari 16.4+)

### Directory & Package Structure

```
client/animations/
├── index.ts                # public API: shared sheet + JS animation helpers
├── animations.ts           # raw CSS string (keyframes & utility classes)
└── types.ts                # AnimationHandle interface
```

### Implementation Details

#### Design Principles

- **No `:root` redefinitions** — animation tokens (durations, easings, distances) are defined in `tokens.css`. The animation library references them via `var()`.
- **CSS for declarative animations** — keyframes and utility classes in `animations.ts`.
- **JS helpers for multi-phase animations** — `animateSlide()` and `animateCarousel()` in `index.ts` for complex sequenced transitions that CSS alone cannot express.
- **AnimationHandle pattern** — JS helpers return `{ promise, cancel }` so callers can await completion or cancel mid-flight.

#### tokens.css — Animation Tokens (source of truth)

These tokens are defined in `client/tokens.css` and inherited into shadow DOMs:

```css
/* Animation Tokens */
:root {
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --easing-accelerate: cubic-bezier(0.4, 0, 1, 1);
  --slide-distance: 100%;
  --slide-offset: 8px;
}
```

#### animations.ts — The CSS Source

Keyframes and utility classes reference tokens.css vars. No hardcoded durations, easings, or distances.

```typescript
export const animationCSS = `
  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes slide-in-right {
    from { transform: translateX(var(--slide-distance)); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }

  @keyframes slide-out-left {
    from { transform: translateX(0); opacity: 1; }
    to   { transform: translateX(calc(-1 * var(--slide-distance))); opacity: 0; }
  }

  @keyframes slide-down-in {
    from { transform: translateY(calc(-1 * var(--slide-offset))); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }

  /* Utility classes */
  .anim-slide-in-right {
    animation: slide-in-right var(--duration-normal) var(--easing-decelerate) backwards;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .anim-slide-in-right, .anim-slide-out-left /* ... */ {
      animation: none;
    }
  }
`;
```

#### index.ts — Shared Sheet + JS Helpers

```typescript
import { animationCSS } from "./animations.js";
import type { AnimationHandle } from "./types.js";

// Constructable stylesheet singleton
export function getAnimationSheet(): CSSStyleSheet {
  /* ... */
}
export function adoptAnimations(root: ShadowRoot | Document): void {
  /* ... */
}

// JS animation helpers (read tokens from :root at animation time)
export function animateSlide(
  element: HTMLElement,
  show: boolean,
): AnimationHandle;
export function animateCarousel(
  container: HTMLElement,
  direction: number,
  onUpdate: () => void,
): AnimationHandle;
```

#### types.ts — AnimationHandle

```typescript
export interface AnimationHandle {
  /** Resolves when the animation completes or is cancelled. */
  promise: Promise<void>;
  /** Cancel the animation immediately, cleaning up all inline styles. */
  cancel: () => void;
}
```

#### Usage in Web Components

```typescript
import {
  adoptAnimations,
  animateCarousel,
} from "../../css-extensions/index.js";
import type { AnimationHandle } from "../../css-extensions/index.js";

export class PtoEntryForm extends BaseComponent {
  private currentAnimation: AnimationHandle | null = null;

  connectedCallback() {
    super.connectedCallback();
    adoptAnimations(this.shadowRoot);
  }

  private navigateMonth(calendar: PtoCalendar, direction: number) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const container = this.shadowRoot.querySelector(
      "#calendar-container",
    ) as HTMLDivElement;
    this.currentAnimation = animateCarousel(container, direction, () => {
      this.updateCalendarMonth(calendar, direction);
    });
    this.currentAnimation.promise.then(() => {
      this.currentAnimation = null;
      this.isAnimating = false;
    });
  }
}
```

### Maintenance Guidelines

- **Add new CSS animation**: Append `@keyframes` + utility class in `animations.ts`
- **Add new JS animation helper**: Add function to `index.ts`, return `AnimationHandle`
- **Change timing/easing globally**: Edit tokens in `tokens.css` — never hardcode in the library
- **Per-component override**: Set CSS vars on `:host` or inline via `style` attribute
- **Per-instance control**: Inline styles for dynamic values (e.g., `--stagger-idx`)
- **Testing**: Snapshot CSS string, assert sheet rules, visual regression
- **Optimization**: Keep CSS under 2-3KB, use `adoptedStyleSheets` for zero-duplication

### Integration with Project

- All animation tokens defined in `tokens.css` (single source of truth)
- Follows web component patterns (BaseComponent, shadow DOM)
- `adoptAnimations()` integrates with `adoptedStyleSheets` — no style tag pollution
- JS helpers read tokens at runtime via `getComputedStyle(document.documentElement)`
- `AnimationHandle.cancel()` enables immediate cleanup when components toggle rapidly
- Supports `prefers-reduced-motion` in both CSS (utility classes) and JS (helpers)
- Compatible with both light and dark themes (no color definitions in the library)
- Bundled automatically by esbuild from `client/app.ts`

Last updated: February 22, 2026

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
src/animations/
├── index.ts                # public API + shared sheet
├── animations.ts           # raw CSS string (the single source of truth)
└── types.ts                # optional utility types
```

### Implementation Details

#### animations.ts — The CSS Source

Keep all keyframes, tokens, and utility classes in a single file. Use `:root` vars + calc() for flexibility.

```typescript
export const animationCSS = `
  :root {
    --anim-dur-short:   180ms;
    --anim-dur-med:     360ms;
    --anim-dur-long:    600ms;
    --anim-ease-in:     cubic-bezier(0.4, 0, 1, 1);
    --anim-ease-out:    cubic-bezier(0, 0, 0.2, 1);
    --anim-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
    --anim-stagger:     60ms;
    --slide-dist:       24px;
    --scale-peak:       1.08;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes slide-in-right {
    from { transform: translateX(var(--slide-dist)); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }

  @keyframes slide-in-down {
    from { transform: translateY(calc(-1 * var(--slide-dist))); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }

  @keyframes pop {
    0%   { transform: scale(0.92); opacity: 0; }
    60%  { transform: scale(var(--scale-peak)); }
    100% { transform: scale(1); opacity: 1; }
  }

  .anim-enter {
    animation:
      fade-in               var(--anim-dur-med) var(--anim-ease-out) backwards,
      slide-in-right        var(--anim-dur-med) var(--anim-ease-out) backwards;
    animation-delay: calc(var(--stagger-idx, 0) * var(--anim-stagger));
  }

  .anim-enter-down {
    animation:
      fade-in               var(--anim-dur-med) var(--anim-ease-out) backwards,
      slide-in-down         var(--anim-dur-med) var(--anim-ease-out) backwards;
    animation-delay: calc(var(--stagger-idx, 0) * var(--anim-stagger));
  }

  .anim-pop {
    animation: pop var(--anim-dur-short) var(--anim-ease-bounce) backwards;
  }

  /* Modifiers – stackable */
  .anim-fast  { --anim-dur-med: var(--anim-dur-short); }
  .anim-slow  { --anim-dur-med: var(--anim-dur-long); }
  .anim-no-delay { animation-delay: 0ms !important; }
`;
```

#### index.ts — Construct & Export Shared Sheet

```typescript
import { animationCSS } from "./animations";

let _sharedSheet: CSSStyleSheet | null = null;

export function getAnimationSheet(): CSSStyleSheet {
  if (!_sharedSheet) {
    _sharedSheet = new CSSStyleSheet();
    _sharedSheet.replaceSync(animationCSS);
  }
  return _sharedSheet;
}

/** Optional: one-liner adoption helper */
export function adoptAnimations(root: ShadowRoot | Document): void {
  const sheet = getAnimationSheet();
  // Preserve existing sheets (defensive)
  root.adoptedStyleSheets = [
    ...root.adoptedStyleSheets.filter((s) => s !== sheet),
    sheet,
  ];
}
```

#### Usage in Web Components

```typescript
import { getAnimationSheet } from "../animations/index";

export class MyListItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    // Adopt once — shared reference, no duplication
    this.shadowRoot!.adoptedStyleSheets = [
      ...this.shadowRoot!.adoptedStyleSheets,
      getAnimationSheet(),
    ];

    const idx = Number(this.getAttribute("data-stagger") || "0");

    this.shadowRoot!.innerHTML = `
      <div class="anim-enter" style="--stagger-idx: ${idx};">
        <slot></slot>
      </div>
    `;
  }
}
```

### Maintenance Guidelines

- **Add new animation**: Append new `@keyframes` + utility class in `animations.ts`
- **Change timing/easing globally**: Edit `:root` variables only
- **Per-component override**: Set CSS vars on `:host`
- **Per-instance control**: Inline styles for dynamic values
- **Testing**: Snapshot CSS string, assert sheet rules, visual regression
- **Optimization**: Keep under 2-3KB, use adoptedStyleSheets for performance

### Integration with Project

- Works with existing CSS theming system (tokens.css)
- Follows web component patterns in the project
- Compatible with Shadow DOM isolation
- Supports both light and dark themes
- Integrates with project's build and testing workflows

Last updated: February 22, 2026
